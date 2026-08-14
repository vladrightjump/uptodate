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
    setStatus: vi.fn(),
    clear: vi.fn(),
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

const STATUS_KEY = "qa-prep:status";
/** The pre-three-state shape: a flat list of "reviewed" ids. */
const LEGACY_KEY = "qa-prep:reviewed";
const NOTES_KEY = "qa-prep:notes";
const PENDING_KEY = "qa-prep:pending-v2";

const stored = <T,>(key: string): T | null => {
  const raw = window.localStorage.getItem(key);
  return raw === null ? null : (JSON.parse(raw) as T);
};

const pending = () =>
  stored<{ status: string[]; notes: string[]; clearAll?: boolean }>(
    PENDING_KEY
  ) ?? { status: [], notes: [], clearAll: false };

const anyDevice = expect.any(String);

beforeEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
  cfg.on = true;
  db.load.mockResolvedValue({ statuses: {}, notes: [] });
  db.setStatus.mockResolvedValue(undefined);
  db.clear.mockResolvedValue(undefined);
  db.saveNote.mockResolvedValue(undefined);
  db.deleteNote.mockResolvedValue(undefined);
});

describe("the three states", () => {
  beforeEach(() => {
    cfg.on = false;
  });

  it("starts every question unmarked", () => {
    const { result } = renderHook(() => useQuestionState());
    expect(result.current.statusOf("a1")).toBe("new");
    expect(result.current.statuses.size).toBe(0);
  });

  it("moves a question between review and known", () => {
    const { result } = renderHook(() => useQuestionState());

    act(() => result.current.setStatus("a1", "review"));
    expect(result.current.statusOf("a1")).toBe("review");

    act(() => result.current.setStatus("a1", "known"));
    expect(result.current.statusOf("a1")).toBe("known");
    /* One bucket at a time — the states are exclusive. */
    expect(result.current.statuses.get("a1")).toBe("known");
  });

  it("drops the entry entirely when set back to unmarked", () => {
    const { result } = renderHook(() => useQuestionState());

    act(() => result.current.setStatus("a1", "known"));
    act(() => result.current.setStatus("a1", "new"));

    expect(result.current.statusOf("a1")).toBe("new");
    expect(result.current.statuses.has("a1")).toBe(false);
    expect(stored<Record<string, string>>(STATUS_KEY)).toEqual({});
  });

  /* Everyone who used the app before "review" existed has a flat list of ids
     under the old key, and every one of them meant "known". */
  it("reads the old flat reviewed list as known", () => {
    window.localStorage.setItem(LEGACY_KEY, JSON.stringify(["a1", "a2"]));
    const { result } = renderHook(() => useQuestionState());

    expect(result.current.statusOf("a1")).toBe("known");
    expect(result.current.statusOf("a2")).toBe("known");
  });

  it("lets a newer three-state entry win over the legacy list", () => {
    window.localStorage.setItem(LEGACY_KEY, JSON.stringify(["a1"]));
    window.localStorage.setItem(STATUS_KEY, JSON.stringify({ a1: "review" }));

    const { result } = renderHook(() => useQuestionState());
    expect(result.current.statusOf("a1")).toBe("review");
  });

  /* Otherwise the legacy key would re-seed the id on the next boot. */
  it("keeps the legacy key in step when a question is cleared", () => {
    window.localStorage.setItem(LEGACY_KEY, JSON.stringify(["a1", "a2"]));
    const { result } = renderHook(() => useQuestionState());

    act(() => result.current.setStatus("a1", "new"));

    expect(stored<string[]>(LEGACY_KEY)).toEqual(["a2"]);
  });

  it("ignores junk in storage", () => {
    window.localStorage.setItem(
      STATUS_KEY,
      JSON.stringify({ a1: "bogus", a2: "known", a3: 7 })
    );
    const { result } = renderHook(() => useQuestionState());

    expect(result.current.statusOf("a1")).toBe("new");
    expect(result.current.statusOf("a2")).toBe("known");
    expect(result.current.statusOf("a3")).toBe("new");
  });
});

describe("without a database", () => {
  beforeEach(() => {
    cfg.on = false;
  });

  it("reports itself off and never calls out", () => {
    const { result } = renderHook(() => useQuestionState());
    act(() => result.current.setStatus("a1", "known"));

    expect(result.current.sync).toBe("off");
    expect(result.current.statusOf("a1")).toBe("known");
    expect(db.load).not.toHaveBeenCalled();
    expect(db.setStatus).not.toHaveBeenCalled();
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
      statuses: { a2: "known", a4: "review" },
      notes: [
        { question_id: "a3", body: "from the server", updated_at: "2026-08-01" },
      ],
    });

    const { result } = renderHook(() => useQuestionState());

    await waitFor(() => expect(result.current.sync).toBe("synced"));
    expect(result.current.statusOf("a2")).toBe("known");
    expect(result.current.statusOf("a4")).toBe("review");
    expect(result.current.notes.get("a3")?.body).toBe("from the server");
  });

  it("sends null to clear a question, not a status string", async () => {
    const { result } = renderHook(() => useQuestionState());
    await waitFor(() => expect(result.current.sync).toBe("synced"));

    act(() => result.current.setStatus("a1", "review"));
    act(() => result.current.setStatus("a1", "new"));

    await waitFor(() => expect(db.setStatus).toHaveBeenCalledTimes(2));
    expect(db.setStatus).toHaveBeenNthCalledWith(1, anyDevice, "a1", "review");
    expect(db.setStatus).toHaveBeenNthCalledWith(2, anyDevice, "a1", null);
  });

  /* The regression that motivated the pending list: someone who used the app
     before it had a backend must not have their progress erased by the first
     load finding an empty server. */
  it("pushes pre-existing local progress before trusting the server", async () => {
    window.localStorage.setItem(
      STATUS_KEY,
      JSON.stringify({ a1: "known", a2: "review" })
    );
    window.localStorage.setItem(
      NOTES_KEY,
      JSON.stringify({ a1: { body: "mine", updated_at: "2026-01-01" } })
    );

    const { result } = renderHook(() => useQuestionState());

    await waitFor(() => expect(result.current.sync).toBe("synced"));
    expect(db.setStatus).toHaveBeenCalledWith(anyDevice, "a1", "known");
    expect(db.setStatus).toHaveBeenCalledWith(anyDevice, "a2", "review");
    expect(db.saveNote).toHaveBeenCalledWith(anyDevice, "a1", "mine");
    /* Every push landed, so nothing is left queued. */
    expect(pending()).toEqual({ status: [], notes: [], clearAll: false });
  });

  it("keeps local state when the replay fails, rather than overwriting it", async () => {
    window.localStorage.setItem(STATUS_KEY, JSON.stringify({ a1: "known" }));
    db.setStatus.mockRejectedValue(new Error("offline"));

    const { result } = renderHook(() => useQuestionState());

    await waitFor(() => expect(result.current.sync).toBe("offline"));
    expect(result.current.statusOf("a1")).toBe("known");
    expect(db.load).not.toHaveBeenCalled();
    expect(pending().status).toEqual(["a1"]);
  });

  it("queues an edit that fails to reach the server", async () => {
    const { result } = renderHook(() => useQuestionState());
    await waitFor(() => expect(result.current.sync).toBe("synced"));

    db.setStatus.mockRejectedValue(new Error("offline"));
    act(() => result.current.setStatus("a5", "review"));

    await waitFor(() => expect(result.current.sync).toBe("offline"));
    /* The click stuck locally even though the write did not. */
    expect(result.current.statusOf("a5")).toBe("review");
    expect(pending().status).toEqual(["a5"]);
  });

  it("clears the queue entry once a write lands", async () => {
    const { result } = renderHook(() => useQuestionState());
    await waitFor(() => expect(result.current.sync).toBe("synced"));

    act(() => result.current.saveNote("a5", "isolation levels"));

    await waitFor(() =>
      expect(db.saveNote).toHaveBeenCalledWith(
        anyDevice,
        "a5",
        "isolation levels"
      )
    );
    await waitFor(() => expect(pending().notes).toEqual([]));
  });

  it("treats saving a blank note as deleting it", async () => {
    const { result } = renderHook(() => useQuestionState());
    await waitFor(() => expect(result.current.sync).toBe("synced"));

    act(() => result.current.saveNote("a5", "something"));
    act(() => result.current.saveNote("a5", "   "));

    expect(result.current.notes.has("a5")).toBe(false);
    await waitFor(() =>
      expect(db.deleteNote).toHaveBeenCalledWith(anyDevice, "a5")
    );
  });

  it("sends one uuid device id for every call", async () => {
    const { result } = renderHook(() => useQuestionState());
    await waitFor(() => expect(result.current.sync).toBe("synced"));

    act(() => result.current.setStatus("a5", "known"));
    await waitFor(() => expect(db.setStatus).toHaveBeenCalled());

    const device = db.load.mock.calls[0][0];
    expect(device).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
    expect(db.setStatus.mock.calls[0][0]).toBe(device);
  });

  /* The server decided its answer before these edits existed, so it must not
     speak for them. Adopting it wholesale reverted the click AND flushed the
     server's copy over localStorage, so the note was lost on both sides. */
  describe("an edit made while the first load is in flight", () => {
    /** Holds `db.load` open so a test can act during the gap. */
    function heldLoad(value: {
      statuses: Record<string, string>;
      notes: unknown[];
    }) {
      let release!: () => void;
      db.load.mockReturnValue(
        new Promise((resolve) => {
          release = () => resolve(value);
        })
      );
      return () => release();
    }

    it("survives the server's snapshot landing afterwards", async () => {
      const release = heldLoad({ statuses: {}, notes: [] });
      const { result } = renderHook(() => useQuestionState());

      act(() => result.current.setStatus("a1", "review"));
      act(() => result.current.saveNote("a1", "mine, written during load"));
      await act(async () => {
        release();
      });

      expect(result.current.statusOf("a1")).toBe("review");
      expect(result.current.notes.get("a1")?.body).toBe(
        "mine, written during load"
      );
      /* And it survived in storage too, not just in memory. */
      expect(stored<Record<string, string>>(STATUS_KEY)!.a1).toBe("review");
      expect(
        stored<Record<string, { body: string }>>(NOTES_KEY)!.a1.body
      ).toBe("mine, written during load");
    });

    it("still takes the server's word on questions it did not touch", async () => {
      const release = heldLoad({
        statuses: { a9: "known" },
        notes: [{ question_id: "a9", body: "server side", updated_at: "" }],
      });
      const { result } = renderHook(() => useQuestionState());

      act(() => result.current.setStatus("a1", "review"));
      await act(async () => {
        release();
      });

      expect(result.current.statusOf("a1")).toBe("review");
      expect(result.current.statusOf("a9")).toBe("known");
      expect(result.current.notes.get("a9")?.body).toBe("server side");
    });

    /* Clearing a question is an edit too, and it is the one the snapshot is
       most likely to undo — the server still has the row. */
    it("does not let the snapshot restore a question cleared during load", async () => {
      window.localStorage.setItem(STATUS_KEY, JSON.stringify({ a1: "known" }));
      const release = heldLoad({ statuses: { a1: "known" }, notes: [] });
      const { result } = renderHook(() => useQuestionState());

      act(() => result.current.setStatus("a1", "new"));
      await act(async () => {
        release();
      });

      expect(result.current.statusOf("a1")).toBe("new");
    });

    it("does not let the snapshot resurrect a reset", async () => {
      window.localStorage.setItem(
        STATUS_KEY,
        JSON.stringify({ a1: "known", a2: "review" })
      );
      const release = heldLoad({
        statuses: { a1: "known", a2: "review" },
        notes: [],
      });
      const { result } = renderHook(() => useQuestionState());

      act(() => result.current.clearAll());
      await act(async () => {
        release();
      });

      expect(result.current.statuses.size).toBe(0);
    });
  });

  /* The reset is queued as one flag rather than as a re-push per question.
     Recording the intent is what matters: a reset whose request never settles
     at all (tab closed, phone asleep) leaves nothing to replay otherwise, and
     the next load restores every row. */
  it("queues a reset that never reached the server", async () => {
    db.load.mockResolvedValue({
      statuses: { a1: "known", a2: "review" },
      notes: [],
    });
    const { result } = renderHook(() => useQuestionState());
    await waitFor(() => expect(result.current.sync).toBe("synced"));

    db.clear.mockRejectedValue(new Error("offline"));
    act(() => result.current.clearAll());

    await waitFor(() => expect(result.current.sync).toBe("offline"));
    expect(pending().clearAll).toBe(true);
    expect(pending().status).toEqual([]);
  });

  it("marks the reset pending before the request, not after it fails", () => {
    window.localStorage.setItem(STATUS_KEY, JSON.stringify({ a1: "known" }));
    /* Never settles — the tab-closed / phone-asleep case. */
    db.clear.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useQuestionState());
    act(() => result.current.clearAll());

    expect(pending().clearAll).toBe(true);
  });

  it("replays a queued reset on the next load, before anything else", async () => {
    window.localStorage.setItem(
      PENDING_KEY,
      JSON.stringify({ status: [], notes: [], clearAll: true })
    );
    window.localStorage.setItem("qa-prep:pending-seeded-v2", JSON.stringify("1"));
    db.load.mockResolvedValue({ statuses: {}, notes: [] });

    const { result } = renderHook(() => useQuestionState());

    await waitFor(() => expect(result.current.sync).toBe("synced"));
    expect(db.clear).toHaveBeenCalled();
    expect(pending().clearAll).toBe(false);
    /* The clear has to precede the load, or the load adopts rows it deletes. */
    expect(db.clear.mock.invocationCallOrder[0]).toBeLessThan(
      db.load.mock.invocationCallOrder[0]!
    );
  });

  it("does not call itself synced while an edit is still queued", async () => {
    const { result } = renderHook(() => useQuestionState());
    await waitFor(() => expect(result.current.sync).toBe("synced"));

    db.setStatus.mockRejectedValueOnce(new Error("offline"));
    act(() => result.current.setStatus("a1", "known"));
    await waitFor(() => expect(result.current.sync).toBe("offline"));

    /* A later write succeeding says nothing about the one still stuck. */
    act(() => result.current.setStatus("a2", "review"));
    await waitFor(() => expect(db.setStatus).toHaveBeenCalledTimes(2));

    expect(pending().status).toEqual(["a1"]);
    expect(result.current.sync).toBe("offline");
  });

  it("serialises rapid changes to the same question", async () => {
    const { result } = renderHook(() => useQuestionState());
    await waitFor(() => expect(result.current.sync).toBe("synced"));

    const order: (string | null)[] = [];
    db.setStatus.mockImplementation(
      (_d: string, _q: string, value: string | null) =>
        new Promise((resolve) =>
          /* The first call is the slow one: fired in parallel it would land
             last and leave the server disagreeing with the screen. */
          setTimeout(
            () => {
              order.push(value);
              resolve(undefined);
            },
            value === "review" ? 20 : 0
          )
        )
    );

    act(() => result.current.setStatus("a1", "review"));
    act(() => result.current.setStatus("a1", "known"));

    await waitFor(() => expect(order).toHaveLength(2));
    expect(order).toEqual(["review", "known"]);
    expect(result.current.statusOf("a1")).toBe("known");
  });

  /* Everything shares one FIFO queue, so the server sees the order the user
     clicked in. Raced, a reset and an in-flight per-question write could land
     either way round, and the server kept a row the screen said was gone. */
  it("orders a reset after a write that is already in flight", async () => {
    const calls: string[] = [];
    let releaseWrite!: () => void;
    db.setStatus.mockReturnValue(
      new Promise((resolve) => {
        releaseWrite = () => {
          calls.push("setStatus");
          resolve(undefined);
        };
      })
    );
    db.clear.mockImplementation(async () => {
      calls.push("clear");
    });

    const { result } = renderHook(() => useQuestionState());
    await waitFor(() => expect(result.current.sync).toBe("synced"));

    act(() => result.current.setStatus("a1", "known"));
    act(() => result.current.clearAll());

    /* The reset must not reach the server before the write it follows. */
    expect(calls).toEqual([]);
    await act(async () => {
      releaseWrite();
    });
    await waitFor(() => expect(calls).toEqual(["setStatus", "clear"]));
    expect(result.current.statuses.size).toBe(0);
  });

  /* The replay is sequential and slow on a cold start; the user can click
     during one of its awaits. Clearing the queue entry unconditionally threw
     that click away and the next load restored the old value. */
  it("keeps an id queued when it changes during its own replay", async () => {
    window.localStorage.setItem(STATUS_KEY, JSON.stringify({ a1: "known" }));

    let releaseReplay!: () => void;
    db.setStatus
      /* The replay's push for a1, held open after it has read "known". */
      .mockReturnValueOnce(
        new Promise((resolve) => {
          releaseReplay = () => resolve(undefined);
        })
      )
      /* The user's edit, which does not reach the server. */
      .mockRejectedValueOnce(new Error("offline"));

    const { result } = renderHook(() => useQuestionState());

    /* Wait until the replay has issued its write with the pre-click value —
       clicking before this point would have it push the new value instead,
       and there would be nothing stale to get wrong. */
    await waitFor(() =>
      expect(db.setStatus).toHaveBeenCalledWith(anyDevice, "a1", "known")
    );

    /* Mid-await, the user unmarks the very question being replayed. */
    act(() => result.current.setStatus("a1", "new"));
    await act(async () => {
      releaseReplay();
    });
    await act(async () => {});

    expect(result.current.statusOf("a1")).toBe("new");
    /* The stale replay must not mark a1 done: the user's own write failed, so
       clearing here drops the change and the next load restores "known". */
    expect(pending().status).toEqual(["a1"]);
  });

  it("does not go green before the first load has been reconciled", async () => {
    let releaseLoad!: () => void;
    db.load.mockReturnValue(
      new Promise((resolve) => {
        releaseLoad = () => resolve({ statuses: {}, notes: [] });
      })
    );

    const { result } = renderHook(() => useQuestionState());
    act(() => result.current.setStatus("a1", "known"));

    /* The write lands first on a cold start. It says nothing about whether
       the two sides agree, so the dot must stay on "loading". */
    await waitFor(() => expect(db.setStatus).toHaveBeenCalled());
    expect(result.current.sync).toBe("loading");

    await act(async () => {
      releaseLoad();
    });
    expect(result.current.sync).toBe("synced");
  });

  /* "Offline — saved here, will sync later" has to mean something inside the
     session, not only after a reload. */
  it("flushes the queue when the browser comes back online", async () => {
    const { result } = renderHook(() => useQuestionState());
    await waitFor(() => expect(result.current.sync).toBe("synced"));

    db.setStatus.mockRejectedValueOnce(new Error("offline"));
    act(() => result.current.setStatus("a1", "review"));
    await waitFor(() => expect(result.current.sync).toBe("offline"));
    expect(pending().status).toEqual(["a1"]);

    db.setStatus.mockResolvedValue(undefined);
    await act(async () => {
      window.dispatchEvent(new Event("online"));
    });

    await waitFor(() => expect(result.current.sync).toBe("synced"));
    expect(pending().status).toEqual([]);
    expect(db.setStatus).toHaveBeenLastCalledWith(anyDevice, "a1", "review");
  });

  it("wipes progress on the server too", async () => {
    db.load.mockResolvedValue({
      statuses: { a1: "known", a2: "review" },
      notes: [],
    });
    const { result } = renderHook(() => useQuestionState());
    await waitFor(() => expect(result.current.sync).toBe("synced"));

    act(() => result.current.clearAll());

    expect(result.current.statuses.size).toBe(0);
    await waitFor(() => expect(db.clear).toHaveBeenCalled());
    expect(stored<Record<string, string>>(STATUS_KEY)).toEqual({});
  });
});
