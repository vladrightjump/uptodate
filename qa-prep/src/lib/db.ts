/* Talks to Supabase through five stored procedures and nothing else.
 *
 * Deliberately hand-rolled instead of pulling in @supabase/supabase-js: the
 * whole surface is one POST shape, and the standalone build inlines every byte
 * it bundles into a single HTML file. A client library would be the largest
 * thing in it and buy nothing.
 *
 * Every table is behind RLS with no policies, so these RPCs are the only way
 * in. See supabase/migrations for the schema.
 */

/** One question's note. The app allows exactly one per question. */
export interface RemoteNote {
  question_id: string;
  body: string;
  updated_at: string;
}

export interface RemoteState {
  known: string[];
  notes: RemoteNote[];
}

const API_URL = (import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/+$/, "");
const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

/** False in the standalone HTML build and in any checkout without a .env. */
export const dbConfigured = Boolean(API_URL && API_KEY);

/* A study app must never sit on a spinner because a request hung. */
const TIMEOUT_MS = 8000;

function timeoutSignal(ms: number): AbortSignal | undefined {
  if (typeof AbortSignal === "undefined") return undefined;
  if (typeof AbortSignal.timeout === "function") return AbortSignal.timeout(ms);
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), ms);
  return ctrl.signal;
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  if (!dbConfigured) throw new Error("Supabase is not configured");

  const res = await fetch(`${API_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: API_KEY,
      authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(args),
    signal: timeoutSignal(TIMEOUT_MS),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${fn} failed: ${res.status} ${detail}`.trim());
  }

  /* The void-returning procedures answer 204 with an empty body. */
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

export const db = {
  load: (deviceId: string) =>
    rpc<RemoteState>("qa_state_load", { p_device: deviceId }),

  setKnown: (deviceId: string, questionId: string, known: boolean) =>
    rpc<void>("qa_state_set_known", {
      p_device: deviceId,
      p_question: questionId,
      p_known: known,
    }),

  clearKnown: (deviceId: string) =>
    rpc<void>("qa_state_clear_known", { p_device: deviceId }),

  saveNote: (deviceId: string, questionId: string, body: string) =>
    rpc<void>("qa_note_save", {
      p_device: deviceId,
      p_question: questionId,
      p_body: body,
    }),

  deleteNote: (deviceId: string, questionId: string) =>
    rpc<void>("qa_note_delete", {
      p_device: deviceId,
      p_question: questionId,
    }),
};
