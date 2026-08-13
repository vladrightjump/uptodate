# 001 — Fix `onConflict` mismatch in `useQuestionMeta`

Status: open. Author: vladfilip94. Date: 2026-05-27.

## 1. Current state

The auth hardening pass (see `git log` around the reverted Supabase work)
left a known carry-forward:

> `src/hooks/useQuestionMeta.ts` uses `onConflict: "question_id"` for
> upserts on `qa_flags` / `qa_reviewed` (and in the legacy-localStorage
> migration), but the `AUTH.md §3` SQL creates composite unique indexes
> on `(user_id, question_id)`.

The auth code was reverted in commit `43e3562`, so the bug is dormant in
`main` today. It will return the moment a backend is reintroduced and
that hook is wired back up. Until then, no test exercises this path —
the integrity suite stops at the corpus, and there is no API layer to
catch it.

## 2. Problem

A `(user_id, question_id)` composite unique index means the engine's
conflict target is the pair, not the question id alone. Asking the
client to upsert with `onConflict: "question_id"` is well-formed
syntax pointing at a constraint that does not exist for the column
alone. The two failure modes are:

- **PostgREST rejects the request** with a 400 because no unique
  constraint matches the conflict target. Reviewed/flag clicks silently
  fail to persist.
- **In a worse version**, if someone "fixes" the symptom by adding a
  single-column `UNIQUE(question_id)`, every user shares a global
  uniqueness namespace — two users cannot mark the same question
  reviewed.

This is the *exact* class of bug a stateful API+DB test would catch in
seconds (cf. `API_DB_TESTING.md` §2d). It survived through three
iterations because no test layer reached the API/DB seam. State-of-
testing report 2024 notes that 47% of escaped defects in surveyed teams
came from the integration layer — this is a textbook example.

## 3. Proposed change

When auth + Supabase return:

1. **Change** `onConflict: "question_id"` to `onConflict: "user_id,question_id"`
   in `src/hooks/useQuestionMeta.ts` and the legacy-localStorage
   migration path.
2. **Add** an integration test in `src/api/__tests__/qa_reviewed.test.ts`
   that signs in as two users, has each upsert the same `question_id`,
   and asserts both rows exist with the right `user_id`.
3. **Add** a SQL-side check in CI: `EXPLAIN` the upsert and assert it
   uses the composite index, not a sequential scan. This protects
   against future migrations that drop or rename the index.
4. **Document** the conflict-target → unique-index pairing in
   `AUTH.md §3` so the contract is visible at the migration site.

If auth does not return soon, the proposal is a no-op — but the test
scaffold from §2 should still be checked in as `it.skip` so the gap is
visible in the suite output.

## 4. Expected impact

- **Better.** A whole class of silent-fail bugs becomes loud. The fix
  itself is one line; the test scaffold around it is ~30 lines and
  reusable for every future upsert.
- **Worse.** CI runtime grows by however long the integration test
  takes — likely 1–3 seconds against a local Supabase stack, more
  against a remote test project. The composite-index `EXPLAIN` check
  adds maybe 200ms.
- **Order-of-magnitude.** One bug fixed, one class of regressions
  prevented, ~5 seconds added to CI. Net positive on any reasonable
  weighting.

## 5. How we'd measure it

- **Baseline (before change).** Zero tests reach the API/DB seam.
  Number of escapes from this layer in the last 90 days: not measured
  because nothing measures it.
- **Target (after change).** ≥ 1 integration test per upsert path, all
  on green for ≥ 14 consecutive days before declaring the proposal
  successful. Any new upsert that lands without a matching test gets a
  reviewer comment citing this proposal.
- **Leading indicator.** Coverage of `src/hooks/useQuestionMeta.ts`
  rises above 80% (today it's 0% in the integration sense — only the
  guest-mode branches are exercised by component tests).
- **Lagging indicator.** Zero `escape`-tagged issues in the API/DB
  layer over the following quarter. If one happens, the proposal
  failed and we revisit at the iteration retro.

## References

- The reverted auth/Supabase commits (SQL migration) — see `git log`
- `API_DB_TESTING.md §2d, §3`
- PractiTest *State of Testing Report 2024*, section on integration-
  layer escapes.
- ISTQB Foundation syllabus §2.3.2 on integration test levels.
