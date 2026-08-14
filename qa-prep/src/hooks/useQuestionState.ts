import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { db, dbConfigured, type StoredStatus } from "../lib/db";
import { getDeviceId } from "../lib/deviceId";

/* Where each question sits in the study pass, and your note on it — held in
 * localStorage for an instant, offline-proof UI, and mirrored to Supabase so
 * the state survives this browser.
 *
 * localStorage is the render source. Every edit lands there first and the DB
 * is told afterwards; a failed write leaves the question id in a "pending"
 * list that is replayed on the next load. Only once that replay succeeds do we
 * adopt the server's copy — otherwise a load right after an offline edit would
 * quietly overwrite it.
 */

export type SyncStatus =
  /** No Supabase configured (standalone build, or a checkout with no .env). */
  | "off"
  /** First load in flight. */
  | "loading"
  /** Local and server agree. */
  | "synced"
  /** Reachable but something failed, or we're offline. Edits still stick locally. */
  | "offline";

/** Exactly one of these per question. "new" is the absence of a stored row. */
export type QuestionStatus = "new" | StoredStatus;

export interface Note {
  body: string;
  updated_at: string;
}

const STATUS_KEY = "qa-prep:status";
/* The old shape was a flat list of "reviewed" ids under this key. It predates
   the three-state model and is folded in once, on read. */
const LEGACY_KNOWN_KEY = "qa-prep:reviewed";
const NOTES_KEY = "qa-prep:notes";
/* v2: the pending buckets were {known, notes} before statuses existed. */
const PENDING_KEY = "qa-prep:pending-v2";
const SEEDED_KEY = "qa-prep:pending-seeded-v2";

interface Pending {
  status: string[];
  notes: string[];
}

const NO_PENDING: Pending = { status: [], notes: [] };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or private mode — state still works for this session */
  }
}

function isStored(v: unknown): v is StoredStatus {
  return v === "review" || v === "known";
}

/** Reads the status map, folding in the old flat "reviewed" list once. */
function readStatuses(): Map<string, StoredStatus> {
  const map = new Map<string, StoredStatus>();

  const raw = read<Record<string, unknown>>(STATUS_KEY, {});
  if (raw && typeof raw === "object") {
    for (const [id, value] of Object.entries(raw)) {
      if (isStored(value)) map.set(id, value);
    }
  }

  /* Anyone who used the app before "review" existed had every marked question
     stored as simply reviewed, which meant "known". Their newer three-state
     edits win, so this only fills gaps. */
  const legacy = read<string[]>(LEGACY_KNOWN_KEY, []);
  if (Array.isArray(legacy)) {
    for (const id of legacy) {
      if (typeof id === "string" && !map.has(id)) map.set(id, "known");
    }
  }

  return map;
}

function writeStatuses(map: Map<string, StoredStatus>): void {
  write(STATUS_KEY, Object.fromEntries(map));
  /* Kept in step so a browser that reads the legacy key — or a rollback to the
     previous build — cannot resurrect ids the user has since cleared. */
  write(
    LEGACY_KNOWN_KEY,
    [...map].filter(([, s]) => s === "known").map(([id]) => id)
  );
}

function readNotes(): Map<string, Note> {
  const raw = read<Record<string, Note>>(NOTES_KEY, {});
  const map = new Map<string, Note>();
  if (!raw || typeof raw !== "object") return map;
  for (const [id, note] of Object.entries(raw)) {
    if (note && typeof note.body === "string" && note.body) {
      map.set(id, { body: note.body, updated_at: note.updated_at ?? "" });
    }
  }
  return map;
}

function readPending(): Pending {
  const p = read<Pending>(PENDING_KEY, NO_PENDING);
  return {
    status: Array.isArray(p?.status) ? p.status : [],
    notes: Array.isArray(p?.notes) ? p.notes : [],
  };
}

function markPending(bucket: keyof Pending, id: string): void {
  const p = readPending();
  if (!p[bucket].includes(id)) {
    p[bucket] = [...p[bucket], id];
    write(PENDING_KEY, p);
  }
}

function clearPending(bucket: keyof Pending, id: string): void {
  const p = readPending();
  const next = p[bucket].filter((x) => x !== id);
  if (next.length !== p[bucket].length) {
    p[bucket] = next;
    write(PENDING_KEY, p);
  }
}

function nothingPending(): boolean {
  const p = readPending();
  return p.status.length === 0 && p.notes.length === 0;
}

/* First run against a database: everything already in this browser is
   unsynced by definition. Without this, the initial load would find an empty
   server and wipe progress made before the DB existed. */
function seedPendingOnce(
  statuses: Map<string, StoredStatus>,
  notes: Map<string, Note>
): void {
  if (read<string | null>(SEEDED_KEY, null)) return;
  write(PENDING_KEY, { status: [...statuses.keys()], notes: [...notes.keys()] });
  write(SEEDED_KEY, "1");
}

export interface QuestionState {
  /** Only non-"new" questions appear. Use `statusOf` for the full picture. */
  statuses: Map<string, StoredStatus>;
  statusOf: (questionId: string) => QuestionStatus;
  notes: Map<string, Note>;
  sync: SyncStatus;
  setStatus: (questionId: string, status: QuestionStatus) => void;
  clearAll: () => void;
  saveNote: (questionId: string, body: string) => void;
  deleteNote: (questionId: string) => void;
}

export function useQuestionState(): QuestionState {
  const [statuses, setStatuses] = useState<Map<string, StoredStatus>>(readStatuses);
  const [notes, setNotes] = useState<Map<string, Note>>(readNotes);
  const [sync, setSync] = useState<SyncStatus>(dbConfigured ? "loading" : "off");

  /* Callbacks need today's value without being rebuilt on every change, which
     would re-render every card in the list. */
  const statusesRef = useRef(statuses);
  const notesRef = useRef(notes);
  statusesRef.current = statuses;
  notesRef.current = notes;

  /* Questions edited since the initial load was issued. The server's answer
     was decided before those edits existed, so it must not speak for them. */
  const touched = useRef<{ status: Set<string>; notes: Set<string> }>({
    status: new Set(),
    notes: new Set(),
  });
  /* A reset mid-load invalidates the whole server snapshot, not single ids. */
  const skipAdopt = useRef(false);

  useEffect(() => writeStatuses(statuses), [statuses]);
  useEffect(() => write(NOTES_KEY, Object.fromEntries(notes)), [notes]);

  /* One promise chain per question, so a fast double-click issues its two
     RPCs in order. Fired in parallel they can land in either order on the
     server, leaving it disagreeing with the screen and nothing queued to
     notice. */
  const chains = useRef(new Map<string, Promise<unknown>>());

  /** Fire-and-forget push. Failure is not an error the user has to act on —
      the edit is already saved locally and the id stays queued for replay. */
  const push = useCallback(
    (bucket: keyof Pending, id: string, run: () => Promise<unknown>) => {
      if (!dbConfigured) return;
      touched.current[bucket].add(id);
      markPending(bucket, id);

      const key = `${bucket}:${id}`;
      /* Swallow the predecessor's rejection: it already reported itself, and
         one failure must not cancel every later edit to the same question. */
      const tail = (chains.current.get(key) ?? Promise.resolve())
        .catch(() => {})
        .then(run)
        .then(() => {
          clearPending(bucket, id);
          /* Only claim "synced" when nothing at all is still queued —
             otherwise one lucky write paints over work that never landed. */
          if (nothingPending()) setSync("synced");
        })
        .catch(() => setSync("offline"));

      chains.current.set(key, tail);
      void tail.finally(() => {
        if (chains.current.get(key) === tail) chains.current.delete(key);
      });
    },
    []
  );

  useEffect(() => {
    if (!dbConfigured) return;
    let cancelled = false;
    const device = getDeviceId();

    (async () => {
      seedPendingOnce(statusesRef.current, notesRef.current);
      touched.current = { status: new Set(), notes: new Set() };
      skipAdopt.current = false;

      /* Replay first: the server's copy is only trustworthy once our local
         edits are in it. If any replay fails we keep the local state and stay
         "offline" rather than adopting a stale server view. */
      const pending = readPending();
      try {
        for (const id of pending.status) {
          await db.setStatus(device, id, statusesRef.current.get(id) ?? null);
          clearPending("status", id);
        }
        for (const id of pending.notes) {
          const note = notesRef.current.get(id);
          if (note) await db.saveNote(device, id, note.body);
          else await db.deleteNote(device, id);
          clearPending("notes", id);
        }
      } catch {
        if (!cancelled) setSync("offline");
        return;
      }

      try {
        const remote = await db.load(device);
        if (cancelled) return;

        /* A reset landed while this was in flight, so the snapshot describes
           a world the user has already thrown away. Keep what's on screen. */
        if (skipAdopt.current) {
          setSync(nothingPending() ? "synced" : "offline");
          return;
        }

        const nextStatuses = new Map<string, StoredStatus>();
        for (const [id, value] of Object.entries(remote.statuses ?? {})) {
          if (isStored(value)) nextStatuses.set(id, value);
        }
        const nextNotes = new Map(
          (remote.notes ?? []).map(
            (n) =>
              [n.question_id, { body: n.body, updated_at: n.updated_at }] as const
          )
        );

        /* Overlay anything edited since this request went out. Supabase cold
           starts take seconds and marking a question is the first thing anyone
           does, so a plain assignment here would silently revert that click —
           and, once the write effect ran, wipe it from localStorage too,
           leaving the queued id to delete the note server-side on the next
           run. Merging keeps the newer local truth on top. */
        for (const id of touched.current.status) {
          const local = statusesRef.current.get(id);
          if (local) nextStatuses.set(id, local);
          else nextStatuses.delete(id);
        }
        for (const id of touched.current.notes) {
          const local = notesRef.current.get(id);
          if (local) nextNotes.set(id, local);
          else nextNotes.delete(id);
        }

        setStatuses(nextStatuses);
        setNotes(nextNotes);
        setSync(nothingPending() ? "synced" : "offline");
      } catch {
        if (!cancelled) setSync("offline");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const statusOf = useCallback(
    (questionId: string): QuestionStatus => statuses.get(questionId) ?? "new",
    [statuses]
  );

  const setStatus = useCallback(
    (questionId: string, next: QuestionStatus) => {
      setStatuses((prev) => {
        const map = new Map(prev);
        if (next === "new") map.delete(questionId);
        else map.set(questionId, next);
        return map;
      });
      push("status", questionId, () =>
        db.setStatus(getDeviceId(), questionId, next === "new" ? null : next)
      );
    },
    [push]
  );

  const clearAll = useCallback(() => {
    /* Captured before the state update: by the time the rejection below runs,
       statusesRef.current is the empty map we just installed, so reading it
       there would re-queue nothing and the next load would resurrect it all. */
    const wiped = [...statusesRef.current.keys()];

    setStatuses(new Map());
    if (!dbConfigured) return;

    skipAdopt.current = true;
    /* A wipe supersedes every queued status push. */
    write(PENDING_KEY, { ...readPending(), status: [] });

    db.clear(getDeviceId())
      .then(() => {
        if (nothingPending()) setSync("synced");
      })
      .catch(() => {
        setSync("offline");
        /* Re-queue so the replay pushes the cleared state for each id. */
        const p = readPending();
        write(PENDING_KEY, {
          ...p,
          status: [...new Set([...p.status, ...wiped])],
        });
      });
  }, []);

  const deleteNote = useCallback(
    (questionId: string) => {
      setNotes((prev) => {
        if (!prev.has(questionId)) return prev;
        const map = new Map(prev);
        map.delete(questionId);
        return map;
      });
      push("notes", questionId, () => db.deleteNote(getDeviceId(), questionId));
    },
    [push]
  );

  const saveNote = useCallback(
    (questionId: string, body: string) => {
      const trimmed = body.trim();
      /* Saving an empty box is how you get rid of a note. */
      if (!trimmed) {
        deleteNote(questionId);
        return;
      }
      const updated_at = new Date().toISOString();
      setNotes((prev) => {
        const map = new Map(prev);
        map.set(questionId, { body: trimmed, updated_at });
        return map;
      });
      push("notes", questionId, () =>
        db.saveNote(getDeviceId(), questionId, trimmed)
      );
    },
    [push, deleteNote]
  );

  return useMemo(
    () => ({
      statuses,
      statusOf,
      notes,
      sync,
      setStatus,
      clearAll,
      saveNote,
      deleteNote,
    }),
    [statuses, statusOf, notes, sync, setStatus, clearAll, saveNote, deleteNote]
  );
}
