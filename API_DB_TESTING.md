# API + Database Testing Playbook

Patterns and copy-paste-ready scaffolds for API and DB testing on this
project. The codebase is currently backend-less (auth and Supabase were
reverted in commit `43e3562`), so this document does two things:

1. Captures the patterns to lift directly when a backend returns.
2. Treats the static question corpus (`src/data/questions.ts`) as a
   *data layer* and exercises it with schema validation and the kind of
   integrity checks SQL would enforce on a real table.

---

## 1. What "API testing" covers

Six classes of checks, in increasing depth:

| Class | What it asserts | Tooling |
|---|---|---|
| Reachability | Endpoint is up, returns expected status | Supertest / `fetch` |
| Schema | Response matches a declared shape | Zod / JSON Schema / AJV |
| Semantics | Values are correct, not just shaped right | Vitest assertions |
| Auth | Authenticated/unauthorised/forbidden paths | Supertest with token rotation |
| Negative | Bad input rejected with the right code and message | Vitest + table-driven cases |
| Stateful | API call → DB state matches expectation | Supertest + SQL query |

A complete suite hits all six. Stopping at "schema" is the most common
mistake — a response can match the schema and still be wrong.

---

## 2. Patterns — copy and adapt when backend returns

### 2a. Schema validation with Zod (recommended)

Zod gives you a single source of truth: the same schema validates at
runtime in production *and* in tests.

```ts
// src/api/schemas.ts
import { z } from "zod";

export const QuestionMeta = z.object({
  question_id: z.string(),
  user_id: z.string().uuid(),
  reviewed: z.boolean(),
  updated_at: z.string().datetime(),
});

export type QuestionMeta = z.infer<typeof QuestionMeta>;
```

```ts
// src/api/__tests__/questionMeta.test.ts
import { describe, it, expect } from "vitest";
import { QuestionMeta } from "../schemas";

describe("GET /question_meta", () => {
  it("returns rows matching the QuestionMeta schema", async () => {
    const res = await fetch(`${BASE}/question_meta`, { headers: authHeaders });
    const body = await res.json();
    const parsed = z.array(QuestionMeta).safeParse(body);
    expect(parsed.success, parsed.error?.message).toBe(true);
  });
});
```

### 2b. Auth flow — token rotation

```ts
import { describe, it, expect, beforeAll } from "vitest";
import { signIn, signUp, deleteUser } from "../api/auth";

const email = `test-${crypto.randomUUID()}@example.test`;
let token: string;

beforeAll(async () => {
  await signUp(email, "correct horse battery staple");
  ({ access_token: token } = await signIn(email, "correct horse battery staple"));
});

afterAll(() => deleteUser(email));

it("rejects requests without a token", async () => {
  const res = await fetch(`${BASE}/qa_reviewed`);
  expect(res.status).toBe(401);
});

it("returns only the caller's rows (RLS)", async () => {
  const res = await fetch(`${BASE}/qa_reviewed`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const rows = await res.json();
  expect(rows.every((r: any) => r.user_id === currentUserId(token))).toBe(true);
});
```

### 2c. Negative cases — table-driven

```ts
const badInputs = [
  { name: "missing question_id", body: { reviewed: true }, status: 400 },
  { name: "wrong type",          body: { question_id: 42 }, status: 400 },
  { name: "unknown column",      body: { question_id: "x", flagged: 1 }, status: 400 },
  { name: "another user's row",  body: { question_id: "x", user_id: other }, status: 403 },
];

it.each(badInputs)("rejects $name with $status", async ({ body, status }) => {
  const res = await fetch(`${BASE}/qa_reviewed`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(body),
  });
  expect(res.status).toBe(status);
});
```

### 2d. Stateful — API + DB round-trip

The point of an integration test is to verify that the *side effect*
landed, not just that the response looked right.

```ts
it("upsert into qa_reviewed persists for the calling user", async () => {
  // Act — call the API
  await fetch(`${BASE}/qa_reviewed`, {
    method: "POST",
    headers: { ...authHeaders, Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ question_id: "q-001", reviewed: true }),
  });

  // Assert — query the DB directly with the same JWT
  const rows = await sql<QuestionMeta>(
    "select * from qa_reviewed where question_id = $1",
    ["q-001"],
  );
  expect(rows).toHaveLength(1);
  expect(rows[0].reviewed).toBe(true);
  expect(rows[0].user_id).toBe(currentUserId(token));
});
```

---

## 3. SQL fluency — what to be sharp on

The list, with the kind of test you write for each:

| Concept | Practice case |
|---|---|
| Joins (inner / left / anti) | "Questions with no comments" via `LEFT JOIN ... WHERE c.id IS NULL" |
| Aggregations + `GROUP BY` | Per-user reviewed count, ordered desc |
| Window functions | Streaks: longest consecutive-day run of `reviewed = true` per user |
| Transactions + isolation | Two concurrent upserts on the same `(user_id, question_id)` must not duplicate |
| Indexes | Explain plan before/after — confirm `(user_id, question_id)` composite is used |
| Migrations | Backfill `user_id` on existing rows, then `ALTER COLUMN ... SET NOT NULL` |
| Constraints | RLS policies + `on delete cascade` from `auth.users` to per-user tables |

A migration is only as safe as the test that proves the backfill ran
without lock contention on a representative row count. Run it against a
copy of prod with `EXPLAIN (ANALYZE, BUFFERS)`.

### Known carry-forward issue

> `useQuestionMeta.ts` uses `onConflict: "question_id"` but the SQL
> migration creates a `(user_id, question_id)` composite unique index.

That mismatch is exactly the kind of bug a stateful API+DB test catches
in seconds (insert two rows for different users with the same
`question_id` — the buggy code returns 409, the correct code accepts
both). Until backend returns, this is a tracked carry-forward.

---

## 4. NoSQL — when and how

Not currently in scope, but the playbook is:

- **Document (MongoDB, Firestore).** Test for *schema drift* — when one
  collection has 50k documents written over 18 months, fields appear
  and disappear. Add a daily job that samples N docs and runs them
  through a Zod schema; alert on parse failures.
- **Key-value (Redis).** Test TTL behaviour and eviction policy under
  load with `k6` or `redis-benchmark`. Never assume a key is still
  there.
- **Wide-column (DynamoDB, Cassandra).** Test for *eventual
  consistency* — write, immediately read from a different node, assert
  the right "stale or fresh" behaviour for your use case. Strongly
  consistent reads are an opt-in and cost more.

The cross-cutting habit: NoSQL pushes correctness *into the test*
because the engine won't enforce it. SQL tests verify behaviour; NoSQL
tests verify the schema you wish you had.

---

## 5. What we *can* do today — content as a data layer

The static corpus in `src/data/questions.ts` is effectively a denormalised
table. The existing `integrity.test.ts` covers six basic invariants:

- ≥ 1 category
- non-empty id/label/questions
- unique question ids globally
- unique category ids
- required fields + valid `diff` enum
- well-formed media

The patterns below are concrete extensions to add depth at the "data
layer" level without inventing a backend. Each maps to a SQL concept.

### 5a. Schema-validate the corpus with Zod

Today the data integrity test hand-rolls every check. A Zod schema
declared once gives you the same guarantees plus better error messages,
and is the same schema you would use against an API response if the
corpus ever moved into Supabase.

```ts
// src/data/schema.ts
import { z } from "zod";

export const MediaItem = z.object({
  type: z.enum(["image", "video", "youtube"]),
  src: z.string().min(1),
});

export const Question = z.object({
  id: z.string().min(1),
  q: z.string().min(1),
  answer: z.string().min(1),
  diff: z.enum(["easy", "mid", "hard"]),
  media: z.array(MediaItem).optional(),
});

export const Category = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  questions: z.array(Question).min(1),
});

export const Categories = z.array(Category).min(1);
```

Then in the integrity test:

```ts
import { Categories } from "../schema";
import { CATEGORIES } from "../questions";

it("the entire corpus parses against the Zod schema", () => {
  const result = Categories.safeParse(CATEGORIES);
  expect(result.success, result.error?.toString()).toBe(true);
});
```

That single test subsumes most of the existing hand-rolled checks and
gives you typed access via `z.infer`.

### 5b. SQL-style invariants

Treat each category as a table and write the queries you *would* run if
this were a database:

```ts
import { CATEGORIES } from "../questions";

const allQuestions = CATEGORIES.flatMap((c) =>
  c.questions.map((q) => ({ ...q, category_id: c.id })),
);

it("no question id appears in more than one category (uniqueness)", () => {
  const counts = new Map<string, number>();
  for (const q of allQuestions) counts.set(q.id, (counts.get(q.id) ?? 0) + 1);
  const dupes = [...counts.entries()].filter(([, n]) => n > 1);
  expect(dupes).toEqual([]);
});

it("every difficulty level has at least one question (coverage)", () => {
  const byDiff = new Set(allQuestions.map((q) => q.diff));
  expect(byDiff).toEqual(new Set(["easy", "mid", "hard"]));
});

it("no category has fewer than 3 questions (minimum width)", () => {
  const thin = CATEGORIES.filter((c) => c.questions.length < 3);
  expect(thin.map((c) => c.id)).toEqual([]);
});
```

These are the same checks a SQL test would run as `SELECT COUNT(*) ...
GROUP BY ... HAVING ...`. The point is to internalise the *pattern* so
when a backend returns, the test you write is the same shape.

### 5c. YouTube/media URL well-formedness

`MediaBlock.test.tsx` already covers the parser at component level.
Adding a *data-layer* test against the corpus closes the loop — the
parser may be correct but a typo in the data slips past the component
test because no component test exercises every question.

```ts
import { CATEGORIES } from "../questions";
import { parseYouTubeId } from "../../components/MediaBlock"; // export the helper

it("every youtube media entry has a parseable 11-char id", () => {
  const bad: Array<{ qid: string; src: string }> = [];
  for (const c of CATEGORIES)
    for (const q of c.questions)
      for (const m of q.media ?? [])
        if (m.type === "youtube" && !parseYouTubeId(m.src))
          bad.push({ qid: q.id, src: m.src });
  expect(bad).toEqual([]);
});
```

If `parseYouTubeId` isn't currently exported, exposing it is a small
refactor that turns a private parser into a verifiable contract.

---

## 6. Concrete next steps

1. Add `src/data/schema.ts` (Zod) and replace the hand-rolled checks in
   `integrity.test.ts` with a single `Categories.safeParse(CATEGORIES)`
   plus the SQL-style invariants from §5b.
2. Export `parseYouTubeId` from `MediaBlock.tsx` and add the data-layer
   YouTube check from §5c.
3. When backend returns, lift §2a–§2d into `src/api/__tests__/`. The
   schemas in `src/data/schema.ts` already match the Supabase row shape
   from `AUTH.md §3`, so the Zod work is reused.
4. Fix the `onConflict` mismatch from §3 *while writing* the stateful
   test that catches it.
