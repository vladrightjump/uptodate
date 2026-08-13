import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { db, dbConfigured } from "../lib/db";
import { getDeviceId } from "../lib/deviceId";

/* Which questions you've marked known, and your note on each — held in
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

export interface Note {
  body: string;
  updated_at: string;
}

/* Same key the old useIdSet used, so anyone mid-way through the question bank
   keeps their progress and gets it pushed up on the first sync. */
const KNOWN_KEY = "qa-prep:reviewed";
const NOTES_KEY = "qa-prep:notes";
const PENDING_KEY = "qa-prep:pending";
const SEEDED_KEY = "qa-prep:pending-seeded";

interface Pending {
  known: string[];
  notes: string[];
}

const NO_PENDING: Pending = { known: [], notes: [] };

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

function readKnown(): Set<string> {
  const ids = read<string[]>(KNOWN_KEY, []);
  return new Set(Array.isArray(ids) ? ids.filter((v) => typeof v === "string") : []);
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
    known: Array.isArray(p?.known) ? p.known : [],
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
  return p.known.length === 0 && p.notes.length === 0;
}

/* First run against a database: everything already in this browser is
   unsynced by definition. Without this, the initial load would find an empty
   server and wipe progress made before the DB existed. */
function seedPendingOnce(known: Set<string>, notes: Map<string, Note>): void {
  if (read<string | null>(SEEDED_KEY, null)) return;
  write(PENDING_KEY, { known: [...known], notes: [...notes.keys()] });
  write(SEEDED_KEY, "1");
}

export interface QuestionState {
  known: Set<string>;
  notes: Map<string, Note>;
  status: SyncStatus;
  toggleKnown: (questionId: string) => void;
  clearKnown: () => void;
  saveNote: (questionId: string, body: string) => void;
  deleteNote: (questionId: string) => void;
}

export function useQuestionState(): QuestionState {
  const [known, setKnown] = useState<Set<string>>(readKnown);
  const [notes, setNotes] = useState<Map<string, Note>>(readNotes);
  const [status, setStatus] = useState<SyncStatus>(
    dbConfigured ? "loading" : "off"
  );

  /* Callbacks need today's value without being rebuilt on every change, which
     would re-render every card in the list. */
  const knownRef = useRef(known);
  const notesRef = useRef(notes);
  knownRef.current = known;
  notesRef.current = notes;

  /* Questions edited since the initial load was issued. The server's answer
     was decided before those edits existed, so it must not speak for them. */
  const touched = useRef<{ known: Set<string>; notes: Set<string> }>({
    known: new Set(),
    notes: new Set(),
  });
  /* A reset mid-load invalidates the whole server snapshot, not single ids. */
  const skipAdopt = useRef(false);

  useEffect(() => write(KNOWN_KEY, [...known]), [known]);
  useEffect(
    () => write(NOTES_KEY, Object.fromEntries(notes)),
    [notes]
  );

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
          if (nothingPending()) setStatus("synced");
        })
        .catch(() => setStatus("offline"));

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
      seedPendingOnce(knownRef.current, notesRef.current);
      touched.current = { known: new Set(), notes: new Set() };
      skipAdopt.current = false;

      /* Replay first: the server's copy is only trustworthy once our local
         edits are in it. If any replay fails we keep the local state and stay
         "offline" rather than adopting a stale server view. */
      const pending = readPending();
      try {
        for (const id of pending.known) {
          await db.setKnown(device, id, knownRef.current.has(id));
          clearPending("known", id);
        }
        for (const id of pending.notes) {
          const note = notesRef.current.get(id);
          if (note) await db.saveNote(device, id, note.body);
          else await db.deleteNote(device, id);
          clearPending("notes", id);
        }
      } catch {
        if (!cancelled) setStatus("offline");
        return;
      }

      try {
        const remote = await db.load(device);
        if (cancelled) return;

        /* A reset landed while this was in flight, so the snapshot describes
           a world the user has already thrown away. Keep what's on screen. */
        if (skipAdopt.current) {
          setStatus(nothingPending() ? "synced" : "offline");
          return;
        }

        const nextKnown = new Set(remote.known ?? []);
        const nextNotes = new Map(
          (remote.notes ?? []).map(
            (n) =>
              [n.question_id, { body: n.body, updated_at: n.updated_at }] as const
          )
        );

        /* Overlay anything edited since this request went out. Supabase cold
           starts take seconds and marking a question known is the first thing
           anyone does, so a plain assignment here would silently revert that
           click — and, once the write effect ran, wipe it from localStorage
           too, leaving the queued id to delete the note server-side on the
           next run. Merging keeps the newer local truth on top. */
        for (const id of touched.current.known) {
          if (knownRef.current.has(id)) nextKnown.add(id);
          else nextKnown.delete(id);
        }
        for (const id of touched.current.notes) {
          const local = notesRef.current.get(id);
          if (local) nextNotes.set(id, local);
          else nextNotes.delete(id);
        }

        setKnown(nextKnown);
        setNotes(nextNotes);
        setStatus(nothingPending() ? "synced" : "offline");
      } catch {
        if (!cancelled) setStatus("offline");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleKnown = useCallback(
    (questionId: string) => {
      const next = !knownRef.current.has(questionId);
      setKnown((prev) => {
        const set = new Set(prev);
        if (next) set.add(questionId);
        else set.delete(questionId);
        return set;
      });
      push("known", questionId, () =>
        db.setKnown(getDeviceId(), questionId, next)
      );
    },
    [push]
  );

  const clearKnown = useCallback(() => {
    /* Captured before the state update: by the time the rejection below runs,
       knownRef.current is the empty set we just installed, so reading it there
       would re-queue nothing and the next load would resurrect every tick. */
    const wiped = [...knownRef.current];

    setKnown(new Set());
    if (!dbConfigured) return;

    skipAdopt.current = true;
    /* A wipe supersedes every queued known-push. */
    write(PENDING_KEY, { ...readPending(), known: [] });

    db.clearKnown(getDeviceId())
      .then(() => {
        if (nothingPending()) setStatus("synced");
      })
      .catch(() => {
        setStatus("offline");
        /* Re-queue so the replay pushes known=false for each id. */
        const p = readPending();
        write(PENDING_KEY, {
          ...p,
          known: [...new Set([...p.known, ...wiped])],
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
      known,
      notes,
      status,
      toggleKnown,
      clearKnown,
      saveNote,
      deleteNote,
    }),
    [known, notes, status, toggleKnown, clearKnown, saveNote, deleteNote]
  );
}
