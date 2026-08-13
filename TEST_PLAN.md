# Test Plan — QA Interview Prep

Living document describing how testing is planned, designed, executed, and
reported on this codebase. Scoped to what actually exists in the repo today
(43 unit/component tests across 7 files) and what should follow as the
project grows.

---

## 1. Scope and objectives

**In scope**

- React UI components (`src/components/*`)
- Data integrity for the question corpus (`src/data/*`)
- Storage hooks (`src/hooks/useLocalStorage.ts`)
- Build + typecheck gates in CI

**Out of scope (today, with rationale)**

- E2E flows — no Playwright harness yet; see `TEST_STRATEGY.md` for the
  plan to add one.
- API / DB tests — the app is local-only after commit `43e3562`
  reverted Supabase auth. When a backend is reintroduced, this section
  expands (tracked as Iteration 4d).
- Visual regression — deferred; the 3D Knowledge Galaxy uses WebGL which
  jsdom cannot render.

**Primary objective.** Catch regressions in interaction logic, data
integrity, and persistence before they reach `main`. Tests must run in
under 5 seconds locally so the watch loop stays usable.

---

## 2. Test levels and what belongs at each

| Level | Tooling | Lives in | What goes here |
|---|---|---|---|
| Unit | Vitest | `src/hooks/__tests__`, `src/data/__tests__` | Pure functions, hooks, data shape invariants |
| Component | Vitest + RTL | `src/components/__tests__` | One component in isolation; heavy deps (R3F, Mermaid) mocked at module boundary |
| Integration | — (gap) | — | Multi-component flows; should land when sidebar↔card↔topbar wiring grows |
| E2E | — (gap) | — | Golden-path user journeys; planned in `TEST_STRATEGY.md` |

A test that needs WebGL, network, or a real DOM layout engine does **not**
belong at unit/component level. Move it up or mock the boundary.

---

## 3. Test case design conventions

Every test follows **Arrange / Act / Assert**, expressed as three visual
blocks separated by a blank line. Test names describe behaviour from the
user's perspective:

- ✅ `fires onToggleReviewed without bubbling up to toggle open`
- ❌ `test reviewed handler` (no behaviour, no expectation)

**Atomicity.** One behaviour per `it()`. If a test needs the word "and",
it should be two tests. (`QuestionCard.test.tsx` is the reference example
— each interaction has its own case.)

**Determinism.** No real timers, no real network, no real localStorage
bleed. The `src/test/setup.ts` file enforces cleanup between tests
(`cleanup()`, `localStorage.clear()`) — do not work around it.

**Mocking policy.** Mock at the *module boundary*, not internals:

- `ProgressOrb` (R3F) stubbed in `TopBar.test.tsx` — jsdom has no WebGL.
- `mermaid` stubbed in `QuestionCard.test.tsx` — heavy ESM, no value at
  unit level.

Mocking application code (e.g. `useLocalStorage` inside a component test)
is a smell — the hook has its own tests; component tests should exercise
real behaviour through it.

---

## 4. Traceability — requirements to tests

Each row maps a product requirement to the test cases that verify it.
When a requirement changes, this table is the index to update.

| ID | Requirement | Verified by |
|---|---|---|
| R-01 | Reviewed state persists across reloads | `useLocalStorage.test.ts` — persistence, Set serialization, functional updates |
| R-02 | Corrupt localStorage falls back to initial value | `useLocalStorage.test.ts` — corrupt-JSON fallback |
| R-03 | Every question has a unique ID, valid difficulty, and well-formed media | `integrity.test.ts` — all 6 cases |
| R-04 | Categories render in the sidebar with per-category progress counts | `Sidebar.test.tsx` — renders categories, progress counts |
| R-05 | TopBar shows overall % including divide-by-zero safety | `TopBar.test.tsx` — counter rendering, % calculation |
| R-06 | Question card expands/collapses on row click | `QuestionCard.test.tsx` — fires onToggleOpen |
| R-07 | Reviewed/flag clicks do not bubble to expand the card | `QuestionCard.test.tsx` — bubbling isolation cases |
| R-08 | Comments require non-empty, non-whitespace input | `QuestionCard.test.tsx` — disables submit for empty/whitespace |
| R-09 | Media block renders image, video, YouTube (full URL, short, raw 11-char ID) | `MediaBlock.test.tsx` — all 7 cases |
| R-10 | Help modal closes on backdrop, Escape, and CTA but not on body click | `HelpModal.test.tsx` — all 4 close paths |

**Gaps visible from this table.** No requirement currently covers the 3D
galaxy, the diagram rendering quality, the investigation flow end-to-end,
or the question-search/filter UX. Each is a candidate for an integration
or E2E test (Iteration 4d / 4b).

---

## 5. Test execution

| Command | Purpose |
|---|---|
| `npm test` | Single-shot run, used in CI and pre-push |
| `npm run test:watch` | TDD loop |
| `npm run test:coverage` | v8 coverage report — artefact in CI |
| `npm run typecheck` | Hard gate; tests cannot mask type errors |
| `npm run build` | Production build gate |

CI (`.github/workflows/ci.yml`) runs typecheck → test → coverage → build
on Node 24, matching the Vercel build runtime. There is no lint step yet;
adding ESLint is a proposal candidate.

**Local pre-push.** `npm run typecheck && npm test` should pass before
opening a PR. There is no enforced pre-push hook yet; adding one is a
candidate for a process proposal (Iteration 4e).

---

## 6. Defect lifecycle

1. **Discovered.** Filed as a GitHub issue with: reproduction steps, the
   commit SHA where it was observed, expected vs actual, and the test
   level it should have been caught at (helps decide where to add
   coverage).
2. **Triaged.** Severity assigned: *blocker* (data loss or app unusable) /
   *major* (feature broken, workaround exists) / *minor* (cosmetic or
   edge case).
3. **Reproduced as a failing test.** Before fixing, write the test that
   captures the bug. If the bug can only be reproduced at a level not
   yet present (e.g. E2E), note it in the issue and add an `xit` with a
   TODO so the gap is visible.
4. **Fixed.** PR title references the issue (`fix #N — …`). Diff
   includes the new test plus the production fix.
5. **Verified.** Reviewer confirms the test fails on `main` and passes
   on the branch (`git stash` the fix, rerun, unstash).
6. **Closed.** Issue closed automatically by the merge commit.

Bugs that escape this loop (caught in prod) are tagged `escape` and
reviewed in the next iteration retro — see Iteration 4e.

---

## 7. Reporting

- **Per-run.** Vitest's verbose reporter is the source of truth for CI.
  Failed tests are surfaced in the PR check summary.
- **Coverage.** v8 report uploaded as a CI artefact on Node 20. There is
  no minimum threshold gate yet; one should be added once the coverage
  baseline stabilises (proposal candidate).
- **Trend.** Not yet tracked. When a defect-escape happens, the
  iteration retro should record: test count delta, coverage delta, and
  any new `escape`-tagged issues. Until that habit forms, the CI run
  summary for the iteration's merge commit is the lightweight substitute.

---

## 8. Worked example — R-08 end to end

To make the traceability concrete, here is one requirement followed
through every artefact:

**Requirement R-08.** *Comments require non-empty, non-whitespace input.*

**Design.** The submit button must be disabled when the textarea is empty
or contains only whitespace. Trim is applied before submit.

**Test case** — `QuestionCard.test.tsx`:

```
it("disables the submit button for empty / whitespace drafts", () => {
  // Arrange — render the card with comments open
  // Act     — type only spaces, then clear
  // Assert  — submit stays disabled in both states
});
```

**Evidence.** The Vitest run output line:

```
✓ QuestionCard > disables the submit button for empty / whitespace drafts
```

is captured in every CI run's logs. The coverage report shows the trim
branch of `handleSubmit` as covered.

**If R-08 changes** (e.g. minimum length 3): update this row, update the
test, run `npm test`, attach the updated CI log to the PR.

---

## 9. Maintenance

This plan is reviewed at the end of every iteration. When a section
becomes inaccurate (e.g. auth coming back, Playwright landing), update it
in the same PR that lands the change — do not let the plan drift.
