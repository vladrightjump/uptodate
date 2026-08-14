# Test Strategy — QA Interview Prep

How testing effort is distributed across levels for this product, and
*why*. The plan (`TEST_PLAN.md`) covers process; this document covers the
shape of the coverage and the reasoning behind it.

---

## 1. Product context shapes the strategy

This is not a generic SaaS. The risk profile is unusual:

- **Static-content-heavy.** The corpus in `src/data/*` is the product
  value. A typo or broken media URL hurts more than a re-rendered
  component.
- **Local-first persistence.** `localStorage` is the render source for the
  three-state study status (unmarked / review / known) and per-question
  notes; `qa-prep` mirrors both to Supabase through five stored procedures,
  keyed by an anonymous per-browser device id. The blast radius of a
  persistence bug is one user, not a multi-tenant outage — but for that user
  it means lost progress, so the sync path is unit-tested against a mocked
  `lib/db` (`useQuestionState.test.ts`): replay-before-adopt ordering,
  edit-during-load merging, reset re-queueing, and per-question write
  serialisation, plus the one-way migration from the old flat "reviewed"
  list. The legacy root app remains local-only.
- **Heavy visual dependencies.** R3F (`@react-three/fiber`) and Mermaid
  cannot run under jsdom and are not cheap to start under a real
  browser. They distort any naive pyramid that assumes uniform cost.
- **Single-author velocity.** No QA team to staff a full pyramid. Effort
  belongs where it pays off per hour invested.

Strategy follows from these facts, not from a generic template.

---

## 2. Shape — closer to a trophy than a pyramid

```
                ▲
                │              E2E  (gap — see §3)
                │
              ─────────         Integration (gap — see §3)
              ───────────────
            ─────────────────── Component (RTL + Vitest) — most cases
              ─────────────
                ─────────       Unit (hooks, data integrity)
                ▼
              ─────────         Static (TypeScript) — runs first, fails fastest
```

Component tests are the widest band because:

1. Most user-visible bugs are interaction bugs, and RTL exercises them
   with realistic event firing through user-event.
2. Vitest + jsdom is fast enough (the full 43-test suite runs in ~1.3s)
   that broad component coverage doesn't slow the watch loop.
3. The component boundaries in `src/components/*` are small enough that
   one component test is genuinely close to one behaviour.

Unit tests cluster around two narrow but high-leverage targets:

- `useLocalStorage.test.ts` — persistence is the single piece of logic
  whose bugs cause data loss, so it gets disproportionate coverage
  (Set serialization, corrupt-JSON fallback, functional updates).
- `integrity.test.ts` — content is the product; a broken question is a
  visible bug for every user.

Static checking (`tsc --noEmit`, in strict mode) is the base of the
trophy. It runs first in CI and catches the cheapest class of bug.
ESLint is not wired up yet — a gap worth closing.

---

## 3. Visible gaps and why they exist

### 3a. No integration tests

Today every component test mounts one component. Real bugs often live
in the seams — Sidebar selection updating QuestionCard expand state,
TopBar's reviewed count staying consistent with the cards, comments
syncing across remounts. None of that is covered.

**Why it's a gap.** When auth was reverted (commit `43e3562`), several
multi-component flows changed and there was no integration suite to
catch regressions. The 43 unit/component tests all still passed.

**Next step.** Add `src/__tests__/flows/` that mounts `<App>` with seeded
localStorage and drives full flows (select category → expand question
→ mark reviewed → confirm counter increments). Vitest + RTL can do this
without new tooling.

### 3b. No E2E tests

There is no Playwright/Cypress harness. WebGL behaviour in the 3D
Knowledge Galaxy, real localStorage persistence across reloads, and
keyboard-only navigation are all currently unverified.

**Why it's a gap.** Until commit `43e3562`, auth flows were the main
E2E candidate; once auth was removed, E2E felt premature. But the
galaxy and the diagram rendering pipeline still warrant smoke coverage.

**Next step.** Playwright with a single smoke spec (open app → sidebar
visible → select a category → expand a card → mark reviewed → reload
→ state persisted). One test, run nightly + on release tags, not on
every PR.

### 3c. No visual regression

Mermaid diagrams and the 3D galaxy can render and still be wrong (wrong
labels, broken layout, dropped nodes). Snapshot testing in jsdom would
be a lie — neither library renders there.

**Why it's a gap.** Cost. Visual regression infrastructure (Chromatic,
Percy, or self-hosted with Playwright traces) is real money or real
setup for a single-author project.

**Next step.** Defer until a diagram bug actually escapes. The trigger
to invest is one `escape`-tagged issue (see `TEST_PLAN.md` §6) in this
area.

---

## 4. Risk-based justification for the current mix

A coverage mix is right when it matches the *cost of being wrong* at each
layer.

| Risk | Likely level | Why |
|---|---|---|
| Lost user progress (localStorage bug) | Unit | Single piece of logic; pure function; cheapest to exercise exhaustively. |
| Broken interaction (click does nothing / wrong handler) | Component | Closest to the user, fast feedback, RTL fires real events. |
| Wrong data shown (corrupt question, bad media URL) | Unit (data integrity) | Static check at the data layer is faster and more thorough than catching it in a render. |
| Cross-component desync (counter wrong after mark reviewed) | Integration *(gap)* | Cannot be caught at component level; today this is verified manually. |
| Persistence breaks across reload | E2E *(gap)* | jsdom resets between tests; only a real browser reload exercises it. |
| Mermaid/3D rendering wrong | Visual *(gap, accepted)* | Cost of tooling exceeds incident rate so far. |

The accepted gaps are deliberate, not oversights. They are revisited when
either (a) an escape happens in that area or (b) the product changes so
the cost calculus flips (e.g. multiple authors, paying users).

---

## 5. Cost guardrails

Strategy without a budget drifts. The thresholds below trigger a review:

- **Local test run exceeds 5 seconds.** Investigate before adding more.
  jsdom startup is the largest fixed cost; mocking heavy imports
  (Mermaid, R3F) at module boundary is the standard fix.
- **CI total exceeds 4 minutes for typecheck + test + build on one
  Node version.** Either parallelise or split the build matrix.
- **A test depends on `setTimeout` / real timers.** Replace with
  `vi.useFakeTimers()` or restructure. Flaky time-based tests have a
  way of becoming a culture.

---

## 6. Articulating the choice

When asked *why this mix is right*, the short answer is:

> Static-content app with local-only persistence, no backend, no team.
> Most user-visible bugs are interaction bugs or data typos, so the
> component band is wide and the data layer is exhaustively validated.
> Integration and E2E are deferred because no escape has yet justified
> their cost, but the triggers to invest are documented and tracked.

If the product gains a backend, multiple users, or visual content that
keeps regressing, the shape changes — and this document is the place to
record that decision.
