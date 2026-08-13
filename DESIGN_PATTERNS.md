# Design Patterns for Test Automation — Reference Appendix

This file holds the **full ~40-pattern survey**. It is **not** in the study
app — the in-app design-patterns category covers only the 15 essentials.
The rest live here so breadth is preserved without bloating the study set.

Read this front-to-back **once** to map the landscape. Use the app's
15-Q design-patterns category for repeated drilling.

---

## Sources

The full landscape is drawn from four canonical texts plus QA-practice
patterns that emerged after them:

1. **GoF — *Design Patterns: Elements of Reusable Object-Oriented
   Software*** (Gamma/Helm/Johnson/Vlissides, 1994). 23 patterns,
   most-cited reference in OO design.
2. **xUnit Test Patterns** (Gerard Meszaros, 2007). The canonical
   reference for test-specific patterns: the four-phase test, the five
   test doubles, Object Mother, Test Data Builder, fixture strategies.
3. **Growing Object-Oriented Software, Guided by Tests** (Freeman/Pryce
   GOOS, 2009). London-school TDD, the "mock only what you own" rule,
   the walking skeleton.
4. **The Screenplay Pattern** (Marcano/Palmer/Molak, Serenity BDD).
   Actor / Task / Ability / Question — POM's successor for complex
   flows.

Plus QA-practice patterns: App Actions (Cypress team), Robot pattern
(Jake Wharton), Page Component (Martin Fowler), Test Pyramid / Trophy /
Diamond / Honeycomb shapes (Mike Cohn → Kent C. Dodds → Spotify).

---

## The full pattern landscape

The pattern families and their members. Each pattern lists: name,
what it solves, the senior trade-off. The **15 patterns marked with
★** are the ones authored as in-app Qs in Chunk 1. The rest are
reference-only.

### Family 1 — UI / Page Modelling

| Pattern | What it solves | ★ in-app? |
|---|---|---|
| **Page Object Model (POM)** | Encapsulate page selectors + actions behind a class. | ★ |
| **Fluent Page Object** | Chained actions: `login.enterEmail().submit()`. | |
| **Page Component (Component Object)** | Composition over inheritance: page = small reusable components. | ★ |
| **Screenplay** | Actor performs Tasks using Abilities, asks Questions. POM's successor for complex flows. | ★ |
| **App Actions** (Cypress) | Bypass UI for setup — hit API/state directly. | ★ |
| **Robot Pattern** (Wharton) | Thin English-like DSL above POM. | |
| **Hexagonal / Ports & Adapters in test code** | Same test runs against UI / API / contract via swappable adapters. | ★ |
| **POM anti-pattern catalogue** | Assertions in POM, hard waits, hand-rolled retries. | ★ |

### Family 2 — Test Data Patterns

| Pattern | What it solves | ★ in-app? |
|---|---|---|
| **Test Data Builder** | Fluent partial-override: `aUser().with(...).build()`. | ★ |
| **Object Mother** | Named canonical fixtures: `Mother.aVerifiedAdminUser()`. | ★ |
| **Faker / generator** | Auto-generates plausible names/emails/cards. | |
| **Factory Method** (GoF) | Subclass to vary. Often over-applied in test code. | |
| **Abstract Factory** (GoF) | Whole family of related fixtures. | |
| **Prototype** (GoF) | `structuredClone(baseFixture)` for variants. | |

### Family 3 — Test Doubles (Meszaros)

| Pattern | What it solves | ★ in-app? |
|---|---|---|
| **Dummy** | Stand-in passed but never used. | |
| **Stub** | Returns canned values. | |
| **Spy** | Stub + records calls. | |
| **Mock** | Pre-programmed expectations, strict verification. | |
| **Fake** | Working but simplified implementation (in-mem DB). | |
| **Five-doubles overview** | What each is, when to use, how interviews conflate them. | ★ |
| **Mock vs Stub** (Fowler) | State-based vs interaction-based verification. | ★ |
| **Mock-hell anti-pattern** (GOOS) | Tests verify implementation, not behaviour. | |

### Family 4 — GoF Structural

| Pattern | Test-code use case | ★ in-app? |
|---|---|---|
| **Adapter** | Wrap unstable third-party SDK behind stable interface. | ★ |
| **Facade** | `TestContext` — DB seed + API auth + UI nav behind one object. | ★ |
| **Decorator** | Retry/timing/logging wrappers preserving TS generics. | ★ |
| **Composite** | Scenario suites from atomic steps. | |
| **Proxy** | Network interception, lazy-loaded page objects. | |
| **Bridge** | Decouple test logic from driver (Selenium ↔ Playwright). | |

### Family 5 — GoF Behavioral

| Pattern | Test-code use case | ★ in-app? |
|---|---|---|
| **Strategy** | Auth strategy: fast-token vs UI-login vs storage-state. | ★ |
| **Observer** | Custom reporter listens to test events. | |
| **Template Method** | Base class with shared setup, hook overrides. | |
| **Chain of Responsibility** | Failure-handler chain: screenshot → trace → Slack. | |
| **State** | UI state-machine traversal (logged-out → logging-in → logged-in). | |
| **Command** | Record actions; replay across browsers. | |
| **Memento** | Snapshot/restore test state. | |

### Family 6 — Architectural + Principles + Anti-patterns

| Pattern | What it solves | ★ in-app? |
|---|---|---|
| **Singleton trap** | Shared driver/page singletons kill parallelism. Refactor via fixtures. | ★ |
| **Dependency Injection / IoC** | Playwright fixtures are DI in disguise. | ★ |
| **Repository pattern for test data** | Hide where fixtures live (DB/API/file) behind a port. | |
| **SOLID applied to tests** | Each principle has a test-specific failure mode. | ★ |
| **DRY vs DAMP / WET in tests** | Tests are read 100× more than refactored. | ★ |
| **Four-phase test** (Meszaros) | Setup → Exercise → Verify → Teardown. AAA + GWT framings. | ★ |
| **Test shape patterns** | Pyramid / Trophy / Diamond / Honeycomb — each solves a different cost curve. | ★ |
| **Anti-pattern catalogue** | Sleep abuse, fragile selectors, test interdependence, fixture mutation. | |

---

## The 15 in-app patterns, recap

These earn their place in the study set because they are the patterns
a senior interviewer probes most often and where most candidates'
answers are weakest:

1. Page Object Model — pure form vs scaled reality
2. Page Component — composition over inheritance
3. Screenplay — when it earns its overhead
4. App Actions — Cypress's POM alternative
5. Hexagonal / Ports & Adapters in tests
6. POM anti-pattern catalogue (assertions in POM, hard waits, etc.)
7. Test Data Builder
8. Object Mother
9. Five test doubles overview
10. Mock vs Stub — verification axis
11. Adapter — wrapping unstable SDKs
12. Facade — TestContext
13. Decorator — retry/timing wrappers
14. Strategy — auth strategies
15. Singleton trap + DI via fixtures (combined Q on architecture)

Plus: SOLID applied, DRY vs DAMP, four-phase test, test shape patterns
— these may also be in-app depending on how Chunk 1 authoring goes.
Final list is settled when the chunk lands.

---

## Why these 15 and not the others

The non-starred patterns are real and useful, but each fails at least
one of these filters:

- **"Senior interviews probe it"** — Composite / Bridge / Memento /
  Iterator rarely come up in QA interviews specifically.
- **"Most candidates get it wrong"** — Template Method is a stable
  pattern; most candidates name it correctly.
- **"Discriminates senior from mid"** — Faker / Factory Method / plain
  Prototype are mid-level skills.
- **"Has a test-code-specific failure mode worth teaching"** — many
  GoF patterns transfer to test code unchanged; only the ones with
  test-specific traps make the cut.

If a future interview surfaces a gap (you got asked about Command
pattern at a Stripe loop, say), promote the reference here into a new
in-app Q. Until then, keep the study set tight.
