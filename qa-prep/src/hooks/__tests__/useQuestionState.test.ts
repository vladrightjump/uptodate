import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/* vi.hoisted, because vi.mock is lifted above the imports and its factory may
   not reach ordinary top-level consts. */
const { cfg, db } = vi.hoisted(() => ({
  /* `dbConfigured` is read through the module namespace, so a getter lets a
     test flip between "no backend" and "backend" without reloading modules. */
  cfg: { on: true },
  db: {
    load: vi.fn(),
    setKnown: vi.fn(),
    clearKnown: vi.fn(),
    saveNote: vi.fn(),
    deleteNote: vi.fn(),
  },
}));

vi.mock("../../lib/db", () => ({
  db,
  get dbConfigured() {
    return cfg.on;
  },
}));

import { useQuestionState } from "../useQuestionState";

const KNOWN_KEY = "qa-prep:reviewed";
const NOTES_KEY = "qa-prep:notes";
const PENDING_KEY = "qa-prep:pending";

const stored = <T,>(key: string): T | null => {
  const raw = window.localStorage.getItem(key);
  return raw === null ? null : (JSON.parse(raw) as T);
};

const pending = () =>
  stored<{ known: string[]; notes: string[] }>(PENDING_KEY) ?? {
    known: [],
    notes: [],
  };

beforeEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
  cfg.on = true;
  db.load.mockResolvedValue({ known: [], notes: [] });
  db.setKnown.mockResolvedValue(undefined);
  db.clearKnown.mockResolvedValue(undefined);
  db.saveNote.mockResolvedValue(undefined);
  db.deleteNote.mockResolvedValue(undefined);
});

describe("without a database", () => {
  beforeEach(() => {
    cfg.on = false;
  });

  it("reports itself off and never calls out", async () => {
    const { result } = renderHook(() => useQuestionState());
    act(() => result.current.toggleKnown("a1"));

    expect(result.current.status).toBe("off");
    expect(result.current.known.has("a1")).toBe(true);
    expect(db.load).not.toHaveBeenCalled();
    expect(db.setKnown).not.toHaveBeenCalled();
  });

  it("still persists locally", () => {
    const { result } = renderHook(() => useQuestionState());
    act(() => result.current.saveNote("a1", "  watch the join order  "));

    expect(stored<Record<string, { body: string }>>(NOTES_KEY)!.a1.body).toBe(
      "watch the join order"
    );
  });
});

describe("with a database", () => {
  it("adopts the server's state on load", async () => {
    db.load.mockResolvedValue({
      known: ["a2"],
      notes: [
        { question_id: "a3", body: "from the server", updated_at: "2026-08-01" },
      ],
    });

    const { result } = renderHook(() => useQuestionState());

    await waitFor(() => expect(result.current.status).toBe("synced"));
    expect([...result.current.known]).toEqual(["a2"]);
    expect(result.current.notes.get("a3")?.body).toBe("from the server");
  });

  /* The regression that motivated the pending list: someone who used the app
     before it had a backend must not have their progress erased by the first
     load finding an empty server. */
  it("pushes pre-existing local progress before trusting the server", async () => {
    window.localStorage.setItem(KNOWN_KEY, JSON.stringify(["a1", "a2"]));
    window.localStorage.setItem(
      NOTES_KEY,
      JSON.stringify({ a1: { body: "mine", updated_at: "2026-01-01" } })
    );

    const { result } = renderHook(() => useQuestionState());

    await waitFor(() => expect(result.current.status).toBe("synced"));
    expect(db.setKnown).toHaveBeenCalledWith(expect.any(String), "a1", true);
    expect(db.setKnown).toHaveBeenCalledWith(expect.any(String), "a2", true);
    expect(db.saveNote).toHaveBeenCalledWith(expect.any(String), "a1", "mine");
    /* Every push landed, so nothing is left queued. */
    expect(pending()).toEqual({ known: [], notes: [] });
  });

  it("keeps local state when the replay fails, rather than overwriting it", async () => {
    window.localStorage.setItem(KNOWN_KEY, JSON.stringify(["a1"]));
    db.setKnown.mockRejectedValue(new Error("offline"));

    const { result } = renderHook(() => useQuestionState());

    await waitFor(() => expect(result.current.status).toBe("offline"));
    expect(result.current.known.has("a1")).toBe(true);
    expect(db.load).not.toHaveBeenCalled();
    expect(pending().known).toEqual(["a1"]);
  });

  it("queues an edit that fails to reach the server", async () => {
    const { result } = renderHook(() => useQuestionState());
    await waitFor(() => expect(result.current.status).toBe("synced"));

    db.setKnown.mockRejectedValue(new Error("offline"));
    act(() => result.current.toggleKnown("a5"));

    await waitFor(() => expect(result.current.status).toBe("offline"));
    /* The click stuck locally even though the write did not. */
    expect(result.current.known.has("a5")).toBe(true);
    expect(pending().known).toEqual(["a5"]);
  });

  it("clears the queue entry once a write lands", async () => {
    const { result } = renderHook(() => useQuestionState());
    await waitFor(() => expect(result.current.status).toBe("synced"));

    act(() => result.current.saveNote("a5", "isolation levels"));

    await waitFor(() =>
      expect(db.saveNote).toHaveBeenCalledWith(
        expect.any(String),
        "a5",
        "isolation levels"
      )
    );
    await waitFor(() => expect(pending().notes).toEqual([]));
  });

  it("treats saving a blank note as deleting it", async () => {
    const { result } = renderHook(() => useQuestionState());
    await waitFor(() => expect(result.current.status).toBe("synced"));

    act(() => result.current.saveNote("a5", "something"));
    act(() => result.current.saveNote("a5", "   "));

    expect(result.current.notes.has("a5")).toBe(false);
    await waitFor(() =>
      expect(db.deleteNote).toHaveBeenCalledWith(expect.any(String), "a5")
    );
  });

  it("sends one uuid device id for every call", async () => {
    const { result } = renderHook(() => useQuestionState());
    await waitFor(() => expect(result.current.status).toBe("synced"));

    act(() => result.current.toggleKnown("a5"));
    await waitFor(() => expect(db.setKnown).toHaveBeenCalled());

    const device = db.load.mock.calls[0][0];
    expect(device).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
    expect(db.setKnown.mock.calls[0][0]).toBe(device);
  });

  /* The server decided its answer before these edits existed, so it must not
     speak for them. Adopting it wholesale reverted the click AND flushed the
     server's copy over localStorage, so the note was lost on both sides. */
  describe("an edit made while the first load is in flight", () => {
    /** Holds `db.load` open so a test can act during the gap. */
    function heldLoad(value: { known: string[]; notes: unknown[] }) {
      let release!: () => void;
      db.load.mockReturnValue(
        new Promise((resolve) => {
          release = () => resolve(value);
        })
      );
      return () => release();
    }

    it("survives the server's snapshot landing afterwards", async () => {
      const release = heldLoad({ known: [], notes: [] });
      const { result } = renderHook(() => useQuestionState());

      act(() => result.current.toggleKnown("a1"));
      act(() => result.current.saveNote("a1", "mine, written during load"));
      await act(async () => {
        release();
      });

      expect(result.current.known.has("a1")).toBe(true);
      expect(result.current.notes.get("a1")?.body).toBe(
        "mine, written during load"
      );
      /* And it survived in storage too, not just in memory. */
      expect(stored<string[]>(KNOWN_KEY)).toContain("a1");
      expect(
        stored<Record<string, { body: string }>>(NOTES_KEY)!.a1.body
      ).toBe("mine, written during load");
    });

    it("still takes the server's word on questions it did not touch", async () => {
      const release = heldLoad({
        known: ["a9"],
        notes: [{ question_id: "a9", body: "server side", updated_at: "" }],
      });
      const { result } = renderHook(() => useQuestionState());

      act(() => result.current.toggleKnown("a1"));
      await act(async () => {
        release();
      });

      expect(result.current.known.has("a1")).toBe(true);
      expect(result.current.known.has("a9")).toBe(true);
      expect(result.current.notes.get("a9")?.body).toBe("server side");
    });

    it("does not let the snapshot resurrect a reset", async () => {
      window.localStorage.setItem(KNOWN_KEY, JSON.stringify(["a1", "a2"]));
      const release = heldLoad({ known: ["a1", "a2"], notes: [] });
      const { result } = renderHook(() => useQuestionState());

      act(() => result.current.clearKnown());
      await act(async () => {
        release();
      });

      expect(result.current.known.size).toBe(0);
    });
  });

  it("re-queues a reset that never reached the server", async () => {
    db.load.mockResolvedValue({ known: ["a1", "a2"], notes: [] });
    const { result } = renderHook(() => useQuestionState());
    await waitFor(() => expect(result.current.status).toBe("synced"));

    db.clearKnown.mockRejectedValue(new Error("offline"));
    act(() => result.current.clearKnown());

    await waitFor(() => expect(result.current.status).toBe("offline"));
    /* Without these queued, the next load would tick every box again. */
    expect(pending().known.sort()).toEqual(["a1", "a2"]);
  });

  it("does not call itself synced while an edit is still queued", async () => {
    const { result } = renderHook(() => useQuestionState());
    await waitFor(() => expect(result.current.status).toBe("synced"));

    db.setKnown.mockRejectedValueOnce(new Error("offline"));
    act(() => result.current.toggleKnown("a1"));
    await waitFor(() => expect(result.current.status).toBe("offline"));

    /* A later write succeeding says nothing about the one still stuck. */
    act(() => result.current.toggleKnown("a2"));
    await waitFor(() => expect(db.setKnown).toHaveBeenCalledTimes(2));

    expect(pending().known).toEqual(["a1"]);
    expect(result.current.status).toBe("offline");
  });

  it("serialises rapid toggles of the same question", async () => {
    const { result } = renderHook(() => useQuestionState());
    await waitFor(() => expect(result.current.status).toBe("synced"));

    const order: boolean[] = [];
    db.setKnown.mockImplementation(
      (_d: string, _q: string, value: boolean) =>
        new Promise((resolve) =>
          /* The first call is the slow one: fired in parallel it would land
             last and leave the server disagreeing with the screen. */
          setTimeout(() => {
            order.push(value);
            resolve(undefined);
          }, value ? 20 : 0)
        )
    );

    act(() => result.current.toggleKnown("a1"));
    act(() => result.current.toggleKnown("a1"));

    await waitFor(() => expect(order).toHaveLength(2));
    expect(order).toEqual([true, false]);
    expect(result.current.known.has("a1")).toBe(false);
  });

  it("wipes progress on the server too", async () => {
    db.load.mockResolvedValue({ known: ["a1", "a2"], notes: [] });
    const { result } = renderHook(() => useQuestionState());
    await waitFor(() => expect(result.current.status).toBe("synced"));

    act(() => result.current.clearKnown());

    expect(result.current.known.size).toBe(0);
    await waitFor(() => expect(db.clearKnown).toHaveBeenCalled());
    expect(stored<string[]>(KNOWN_KEY)).toEqual([]);
  });
});
