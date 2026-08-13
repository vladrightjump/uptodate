# QA Interview Prep — Senior Automation

A personal study app for senior QA Automation Engineer interviews. **~180 questions across 18 categories with full model answers** including TypeScript / Playwright / SQL code examples. Built as a Vite + React + TypeScript single-page app — runs in any modern browser, deploys anywhere static.

![Tech](https://img.shields.io/badge/React-19.2-61dafb?logo=react)
![Tech](https://img.shields.io/badge/TypeScript-5.6-3178c6?logo=typescript)
![Tech](https://img.shields.io/badge/Vite-5.4-646cff?logo=vite)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Table of contents

- [What it does](#what-it-does)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Testing](#testing)
- [Deployment](#deployment)
- [Adding or editing questions](#adding-or-editing-questions)
- [Features](#features)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Browser support](#browser-support)
- [Architecture decisions](#architecture-decisions)

---

## What it does

A browsable, searchable interview-prep reference. Pick a category, scan questions, expand to read the model answer, mark as reviewed. Progress persists in your browser. No accounts, no servers, no telemetry.

**8 core categories:**

| # | Category | Questions | Focus |
|---|---|---|---|
| 1 | Playwright + TS | 22 | Locators, fixtures, auto-waiting, sharding, real framework code, assertion pitfalls |
| 2 | REST API testing | 13 | HTTP semantics, idempotency, schema validation, security |
| 3 | SQL fundamentals | 12 | Joins, indexes, window functions, data-integrity queries |
| 4 | Framework & architecture | 8 | POM, fixture composition, scaling test code |
| 5 | CI/CD & flakiness | 10 | GitHub Actions, sharding, flake reduction, metrics |
| 6 | Testing theory | 12 | Verification vs validation, coverage, mutation testing, ISTQB principles |
| 7 | Real scenarios | 10 | P0 incidents, stakeholder pushback, escape rate |
| 8 | Behavioral | 9 | STAR-format answers with concrete patterns |

**Plus 10 specialty categories** — TypeScript programming, GraphQL & contracts, project structure, visual regression, feature flags, test management, testing strategy, automation frameworks survey, API & DB integration, driving improvements.

Every answer includes the *why* — trade-offs, anti-patterns, what interviewers are signaling for — not just the *what*.

---

## Tech stack

### Runtime
- **[React 19.2](https://react.dev/)** — UI library. Function components and hooks throughout, no class components.
- **[TypeScript 5.6](https://www.typescriptlang.org/)** — strict mode enabled. `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` all on.
- **HTML5 + CSS3** — no UI library. Pure CSS with custom properties for theming.

### Build & tooling
- **[Vite 5.4](https://vitejs.dev/)** — dev server with HMR (~50ms hot reload), production bundler.
- **[@vitejs/plugin-react 4.3](https://github.com/vitejs/vite-plugin-react)** — React fast refresh.
- **No bundler runtime overhead** — Vite uses native ES modules in dev, Rollup for production builds.

### Storage
- **localStorage** — progress persistence. Set-aware JSON serialization (custom replacer/reviver) for storing reviewed/open question IDs.

### What's intentionally NOT included
- No Tailwind, no styled-components, no CSS-in-JS — handwritten CSS with CSS variables. Smaller bundle, faster first paint, easier to theme.
- No state management library (Redux, Zustand, etc.) — React's built-in `useState` and a custom `useLocalStorage` hook handle everything.
- No router — single-page UI, category selection is local state. Adding `react-router` later is straightforward if needed.
- No backend — pure static site. No database, no API, no auth.
- No ESLint yet — TypeScript strict mode is the only static gate. See `TEST_STRATEGY.md`.

### Testing

Vitest + React Testing Library, running in jsdom. 44 tests across 7 files
cover the components, the `useLocalStorage` hook, and a data-integrity
suite that fails the build on a malformed question.

```bash
npm test              # one-shot run
npm run test:watch    # watch mode
npm run test:coverage # v8 coverage report
```

### Dependencies summary

```json
"dependencies": {
  "mermaid": "^11.14.0",
  "react": "^19.2.6",
  "react-dom": "^19.2.6"
}
```

Three runtime deps — `mermaid` renders the inline architecture diagrams;
everything else is dev-time (TypeScript, Vite, Vitest, Testing Library).

---

## Project structure

```
qa-app/
├── index.html              # Vite entry point
├── package.json            # 3 runtime deps; `build:site` builds what ships
├── vite.config.ts          # Vite configuration (base: "./" for portable deploys)
├── tsconfig.json           # Strict TypeScript settings
├── tsconfig.node.json      # Separate config for Vite's Node-side code
├── vercel.json             # Deploy config + CSP and security headers
├── .github/workflows/ci.yml # Checks → deploy → verify-on-live (see CI-CD.md)
├── scripts/
│   ├── write-version.mjs   # Stamps version.json into the deploy output
│   └── check-live-deploy.mjs # Polls prod until the new SHA is serving
├── src/
│   ├── main.tsx            # React 19 createRoot entry
│   ├── App.tsx             # App shell, state, keyboard shortcuts
│   ├── types/index.ts      # Shared types (Question, Category, Theme, …)
│   ├── components/
│   │   ├── TopBar.tsx      # Sticky header: progress, theme toggle, reset
│   │   ├── Sidebar.tsx     # Category nav with per-category progress
│   │   ├── QuestionCard.tsx # Expandable card with answer, tags, media
│   │   ├── HomeScreen.tsx  # Landing view
│   │   ├── FocusSession.tsx # Flash-card drill mode
│   │   ├── HelpModal.tsx   # Keyboard-shortcut reference
│   │   ├── Diagram.tsx     # Mermaid diagram renderer
│   │   ├── MediaBlock.tsx  # Images / figures inside answers
│   │   └── icons.tsx       # Inline SVG icon set
│   ├── data/
│   │   ├── questions.ts    # Assembles all categories, exports CATEGORIES
│   │   └── categories-*.ts # The question bank, split by topic group
│   ├── hooks/
│   │   ├── useLocalStorage.ts # Set-aware persisted state
│   │   ├── useQuestionMeta.ts # Reviewed / flagged question state
│   │   └── useReveal.ts    # Scroll-reveal animation
│   ├── test/setup.ts       # Vitest + jest-dom setup
│   └── styles/global.css   # CSS variables, layout, all component styles
└── qa-prep/                # The deployed app (own package.json)
    ├── src/
    │   ├── fonts/          # Nunito + JetBrains Mono, latin subsets (OFL)
    │   ├── data/round-*.ts # The four interview rounds
    │   └── styles/         # Warm-paper design tokens, light + dark
    └── scripts/
        └── build-standalone.mjs  # Bundles the React app into one HTML file
```

### The `qa-prep/` sub-project — this is what deploys

`qa-prep/` is a separate, smaller app covering four specific interview
rounds, and **it is what the domain actually serves**. `npm run build:site`
builds it, stamps the commit SHA into `version.json` so CI can verify the
deploy went live, and produces the standalone guide. Everything lands in
`qa-prep/dist/`. See `CI-CD.md`.

**The standalone guide is built from the same React source.** `npm run
standalone` bundles the app, React itself, the styles, the data and the two
self-hosted fonts into one HTML file that opens straight from disk with no
network access. There is exactly one implementation of the UI — the guide
ships what the site runs, so the two cannot drift.

### Saved progress and notes

Marking a question **known**, and the one free-text **note** each question
can carry, are written to `localStorage` first — so the UI never waits on a
network and works offline — and then mirrored to Supabase.

There is no login. The first run generates a random uuid, keeps it in
`localStorage` as the device id, and sends it with every call. Sync is
therefore per-browser: it survives a redeploy and a new laptop if you carry
the id, but clearing site data starts fresh.

Set up sync by copying `qa-prep/.env.example` to `qa-prep/.env.local` and
filling in both values (the same two go in Vercel's environment variables).
**Changing the project host means editing `vercel.json` as well** — its CSP
`connect-src` pins that one Supabase host, so a mismatched `VITE_SUPABASE_URL`
is blocked by the browser and shows up only as a stuck amber sync dot.
**Leave them unset and everything still works** — `dbConfigured` is false,
nothing is sent, and state stays local. That is exactly what the standalone
build does: `build-standalone.mjs` blanks both at bundle time, so the single
HTML file carries no key and never reaches the network.

The schema lives in `supabase/migrations/`. Both tables have RLS enabled and
**no policies**, so the anon key cannot read or write them directly; the five
`security definer` procedures are the only way in, and each one requires the
device id. See the header comment in the migration for the threat model.

The app at the repo root is the **legacy** one. It is no longer deployed,
but is still typechecked, tested, and built in CI so it cannot rot
unnoticed while it lives here.

---

## Getting started

### Prerequisites

- **Node.js 24** — what CI and the Vercel build runtime use. Node 20+ works locally.
- **npm** (comes with Node) or **pnpm** / **yarn** if preferred

### Install

```bash
cd qa-app
npm install
```

This creates `node_modules/` (~300 MB, mostly TypeScript, Vite, and the test tooling).

### Run in development

```bash
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173) with HMR — edit a question and it updates without page reload.

### Build for production

```bash
npm run build
```

Outputs to `dist/`. Production-ready static files: HTML, CSS, JS. Total size ~150 KB uncompressed, ~50 KB gzipped.

### Preview the production build

```bash
npm run preview
```

Serves `dist/` on a local port — final sanity check before deploying.

### Type-check

The build command runs `tsc -b && vite build`, so type errors will fail the build. To run TypeScript alone:

```bash
npx tsc --noEmit
```

---

## Deployment

Deployment is automated and **gated** — read `CI-CD.md` before changing it.

Every push to `main` runs the full check suite, and only if it passes does CI
trigger the Vercel deploy hook and then poll the live domain until
`/version.json` reports the pushed commit. Vercel's own git auto-deploy is
disabled for `main` (`vercel.json` -> `git.deploymentEnabled`), so a push
cannot bypass the checks.

```bash
npm run build:site   # exactly what Vercel runs -> qa-prep/dist/
npm run build        # the legacy root app; built in CI, not deployed
```

> **Do not run `vercel --prod` by hand.** It goes around the entire pipeline —
> no typecheck, no tests, no live verification. It is one of the two known
> bypasses documented in `CI-CD.md`; the other is a redeploy triggered from
> the Vercel dashboard.

### Hosting it somewhere else

The output is a plain static bundle, so any static host works: build with
`npm run build:site` and upload the contents of `qa-prep/dist/`. Nothing in
the app needs a server, a database, or environment variables.

---

## Adding or editing questions

All content lives in TypeScript files under `src/data/`. The shape is enforced at compile time:

```ts
interface Question {
  q: string;                              // The question text
  diff: "easy" | "mid" | "hard";          // Difficulty badge
  tags?: string[];                        // Tags shown next to the question
  answer: string;                         // HTML model answer (supports <p>, <ul>, <code>, <pre>)
}

interface Category {
  id: string;                             // Stable identifier (used for state keys)
  label: string;                          // Sidebar label
  desc: string;                           // Subtitle shown under the heading
  questions: Question[];
}
```

### To add a question to an existing category

Open the relevant `categories-N.ts` file, find the category const (e.g. `playwrightTS`), append to its `questions` array:

```ts
{
  q: "How do you handle a date/time picker in tests?",
  diff: "mid",
  tags: ["playwright", "time"],
  answer: `<p>Use Playwright's clock API:</p>
<pre class="code"><code>await page.clock.install({ time: '2026-05-06T10:00:00Z' });</code></pre>`,
},
```

### To add a new category

1. Define the category in `questions.ts` or one of the `categories-N.ts` files:

```ts
const security: Category = {
  id: "security",
  label: "Security testing",
  desc: "OWASP Top 10, auth flows, common vulnerabilities",
  questions: [/* ... */],
};
```

2. Add it to the `CATEGORIES` export at the bottom of `questions.ts`:

```ts
export const CATEGORIES: Category[] = [
  ...PART_1_CATEGORIES,
  ...PART_2_CATEGORIES,
  ...PART_3_CATEGORIES,
  scenarios,
  behavioral,
  security,  // ← new
];
```

3. The sidebar, search, filters, and progress tracking all pick it up automatically.

### Answer formatting

The `answer` field is HTML rendered via `dangerouslySetInnerHTML`. Supported elements:

- `<p>` — paragraphs
- `<ul>`, `<ol>`, `<li>` — lists
- `<strong>`, `<em>` — emphasis
- `<code>` — inline code (gets a subtle background)
- `<pre class="code"><code>...</code></pre>` — code blocks (dark theme, syntax-friendly)
- `<table>`, `<tr>`, `<td>`, `<th>` — tables (already styled)
- `<blockquote>` — quotes

For code snippets, escape angle brackets: `&lt;` and `&gt;`. The TypeScript file uses template literals with backticks, so backslashes inside code need to be escaped as `\\`.

---

## Features

- **~180 senior-level questions** across 18 categories (8 core + 10 specialty) — curated for actual study, anchored to interview-validated feedback (see `FEEDBACK_COVERAGE.md`)
- **Per-category search** — searches question text, tags, and answer content
- **Difficulty filter** — easy / mid / hard
- **Mark-as-reviewed** — checkbox on each question, persists in localStorage
- **Progress tracking** — top bar shows global progress, sidebar shows per-category
- **Light / dark / auto theme** — auto follows OS preference, override available
- **Mobile-responsive** — hamburger menu under 800px, full-feature on phone
- **Keyboard shortcuts** — see below
- **Print-friendly** — `Cmd/Ctrl+P` produces a clean PDF-style output
- **Reset button** — clears progress (with confirmation)
- **Offline-first** — once loaded, no network calls

---

## Keyboard shortcuts

| Key | Action |
|---|---|
| `/` | Focus search field |
| `1` – `8` | Jump to category by number |
| `j` / `k` | Move focus down / up through visible questions |
| `Space` | Toggle the focused question open/closed |
| `r` | Mark the focused question as reviewed |
| `Esc` | Unfocus search / close mobile menu |

Shortcuts ignore key presses while typing in the search field (except `Esc`, which unfocuses).

---

## Browser support

Tested on:
- Chrome / Edge (current version)
- Firefox (current version)
- Safari 16+
- Mobile Safari (iOS 16+)
- Chrome Android

Uses modern features: CSS custom properties, Set/Map, async/await, ES modules. Won't work in IE11 (and won't be made to).

---

## Architecture decisions

A few non-obvious choices and the reasoning:

### Why no Tailwind?

Pure CSS with custom properties gives faster first paint, smaller bundle, and clean theming via `[data-theme="dark"]` selector. The whole stylesheet is ~370 lines — small enough to read end-to-end. Tailwind would add a build step, more deps, and a longer learning curve for whoever inherits this.

### Why no state library?

The app has ~5 pieces of state: active category, reviewed IDs, open IDs, search, theme. React's `useState` + a localStorage hook handles it without ceremony. Adding Redux would be over-engineering.

### Why split data into `categories-1/2/3.ts`?

Each file is reviewable in one screen of code. Splitting also reduces any single file's TypeScript compilation time, which speeds up Vite's HMR when editing questions.

### Why use HTML strings for answers (`dangerouslySetInnerHTML`) instead of MDX or React components?

The answers are mostly static prose with code blocks. HTML strings are simpler than MDX (no extra build step, no JSX inside data), faster to author than React components, and the security risk is zero because all content is authored by the maintainer — no user input ever flows through.

### Why `base: "./"` in vite.config.ts?

Lets the built site work at any URL — root domain, subpath, file:// protocol. Trade-off: deeper routes don't work without a server config, but this app has no routes.

### Why Set instead of Array for reviewed/open IDs?

O(1) `has()` lookup. With ~155 questions × hundreds of expand/collapse toggles per session, array search would noticeably affect frame rate. Custom JSON serialization handles persistence.

---

## License

MIT — use, fork, modify, share. No attribution required.
