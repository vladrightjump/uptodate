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

type PendingBucket = "status" | "notes";

interface Pending {
  status: string[];
  notes: string[];
  /* A reset that has not reached the server yet. Persisted rather than held in
     memory: without it, a reset whose request never settles (tab closed, phone
     asleep) leaves local empty, the queue empty, and every row still on the
     server — and the next load quietly undoes the whole thing. It supersedes
     `status`, so the two are never both populated. */
  clearAll: boolean;
}

const NO_PENDING: Pending = { status: [], notes: [], clearAll: false };

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
    clearAll: p?.clearAll === true,
  };
}

function markPending(bucket: PendingBucket, id: string): void {
  const p = readPending();
  if (!p[bucket].includes(id)) {
    p[bucket] = [...p[bucket], id];
    write(PENDING_KEY, p);
  }
}

function clearPending(bucket: PendingBucket, id: string): void {
  const p = readPending();
  const next = p[bucket].filter((x) => x !== id);
  if (next.length !== p[bucket].length) {
    p[bucket] = next;
    write(PENDING_KEY, p);
  }
}

function markPendingClear(): void {
  /* The reset supersedes every queued per-question status push, so they go. */
  write(PENDING_KEY, { ...readPending(), status: [], clearAll: true });
}

function clearPendingClear(): void {
  write(PENDING_KEY, { ...readPending(), clearAll: false });
}

function nothingPending(): boolean {
  const p = readPending();
  return p.status.length === 0 && p.notes.length === 0 && !p.clearAll;
}

/* First run against a database: everything already in this browser is
   unsynced by definition. Without this, the initial load would find an empty
   server and wipe progress made before the DB existed. */
function seedPendingOnce(
  statuses: Map<string, StoredStatus>,
  notes: Map<string, Note>
): void {
  if (read<string | null>(SEEDED_KEY, null)) return;
  write(PENDING_KEY, {
    status: [...statuses.keys()],
    notes: [...notes.keys()],
    clearAll: false,
  });
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

  /* True once the initial load has been reconciled. Until then a successful
     write says nothing about whether the two sides agree, so it must not turn
     the dot green. */
  const loaded = useRef(false);

  /* Every RPC goes through one FIFO queue, replay and reset included. Ordering
     them per-question was not enough: "reset" and an in-flight per-question
     write raced, and whichever landed second won, so the server could keep a
     row the screen said was gone. One queue makes the server see the same
     order the user clicked in. Writes here are rare and tiny, so serialising
     them globally costs nothing worth measuring. */
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  const enqueue = useCallback(<T,>(run: () => Promise<T>): Promise<T> => {
    /* Swallow the predecessor's rejection: it already reported itself, and one
       failure must not cancel everything queued behind it. */
    const next = queue.current.catch(() => {}).then(run);
    queue.current = next.catch(() => {});
    return next;
  }, []);

  /** Green only when the load has happened and the queue is genuinely empty. */
  const settle = useCallback(() => {
    if (loaded.current && nothingPending()) setSync("synced");
  }, []);

  /** Fire-and-forget push. Failure is not an error the user has to act on —
      the edit is already saved locally and the id stays queued for replay.
      `current` re-reads what the write was meant to persist, so a value the
      user changed mid-flight stays queued instead of being marked done. */
  const push = useCallback(
    (
      bucket: PendingBucket,
      id: string,
      run: () => Promise<unknown>,
      stillCurrent: () => boolean
    ) => {
      if (!dbConfigured) return;
      touched.current[bucket].add(id);
      markPending(bucket, id);

      enqueue(run)
        .then(() => {
          if (stillCurrent()) clearPending(bucket, id);
          settle();
        })
        .catch(() => setSync("offline"));
    },
    [enqueue, settle]
  );

  /** Pushes everything still queued. Resolves false if anything failed. */
  const flush = useCallback(async (): Promise<boolean> => {
    const device = getDeviceId();
    try {
      await enqueue(async () => {
        /* A pending reset goes first and drops the rows the per-question
           entries below would otherwise be re-pushing on top of. */
        if (readPending().clearAll) {
          await db.clear(device);
          clearPendingClear();
        }
        /* Re-read between steps: the queue guarantees ordering against other
           RPCs, but the user can still click during an await. */
        for (const id of readPending().status) {
          const value = statusesRef.current.get(id) ?? null;
          await db.setStatus(device, id, value);
          /* Only mark done if this is still what the question says. Clearing
             unconditionally dropped an edit made during the await, and the
             next load then restored the value the user had just changed. */
          if ((statusesRef.current.get(id) ?? null) === value) {
            clearPending("status", id);
          }
        }
        for (const id of readPending().notes) {
          const note = notesRef.current.get(id);
          if (note) await db.saveNote(device, id, note.body);
          else await db.deleteNote(device, id);
          if (notesRef.current.get(id)?.body === note?.body) {
            clearPending("notes", id);
          }
        }
      });
      return true;
    } catch {
      setSync("offline");
      return false;
    }
  }, [enqueue]);

  /* "will sync later" has to mean something within the session, so a
     reconnect replays the queue instead of waiting for a reload. */
  useEffect(() => {
    if (!dbConfigured) return;
    const onOnline = () => {
      if (nothingPending()) return;
      setSync("loading");
      void flush().then((ok) => {
        if (ok) settle();
      });
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [flush, settle]);

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
      if (!(await flush())) return;

      try {
        const remote = await enqueue(() => db.load(device));
        if (cancelled) return;
        loaded.current = true;

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
  }, [enqueue, flush]);

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
      const value = next === "new" ? null : next;
      push(
        "status",
        questionId,
        () => db.setStatus(getDeviceId(), questionId, value),
        () => (statusesRef.current.get(questionId) ?? null) === value
      );
    },
    [push]
  );

  const clearAll = useCallback(() => {
    setStatuses(new Map());
    if (!dbConfigured) return;

    skipAdopt.current = true;
    /* Recorded before the request goes out, and only lifted once the server
       confirms. If this never settles, the flag survives the reload and the
       reset is replayed instead of being silently undone by the next load. */
    markPendingClear();

    enqueue(() => db.clear(getDeviceId()))
      .then(() => {
        clearPendingClear();
        settle();
      })
      .catch(() => setSync("offline"));
  }, [enqueue, settle]);

  const deleteNote = useCallback(
    (questionId: string) => {
      setNotes((prev) => {
        if (!prev.has(questionId)) return prev;
        const map = new Map(prev);
        map.delete(questionId);
        return map;
      });
      push(
        "notes",
        questionId,
        () => db.deleteNote(getDeviceId(), questionId),
        () => !notesRef.current.has(questionId)
      );
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
      push(
        "notes",
        questionId,
        () => db.saveNote(getDeviceId(), questionId, trimmed),
        () => notesRef.current.get(questionId)?.body === trimmed
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
