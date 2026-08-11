import type { Round } from "../types";

export const ROUND_B: Round = {
  id: "round-b",
  label: "Round B — Full Interview",
  desc: "The long round: background, testing theory, test design, SQL, HTTP, automation",
  questions: [
    {
      id: "b1",
      q: "Introduce yourself — how many years have you worked as a QA, and on what projects?",
      diff: "easy",
      tags: ["intro"],
      answer: `<p>Keep it to <strong>60–90 seconds</strong>, in this shape:</p>
<ol>
<li><strong>Headline</strong> — "I'm a QA engineer with X years, mostly in [domain: retail / fintech / e-commerce]."</li>
<li><strong>Two or three projects</strong>, each in one sentence: what the product did, what you owned, one concrete result. "Checkout UI for a retail POS — I owned the regression suite, took the release smoke from 4 hours manual to 25 minutes in CI."</li>
<li><strong>Current mix</strong> — manual vs automation, tooling you use daily.</li>
<li><strong>Hand back</strong> — "Happy to go deeper on any of those."</li>
</ol>
<p>Don't recite your CV chronologically and don't list tools with no context. Numbers beat adjectives: releases per month, size of suite, size of team, bugs caught before release.</p>`,
    },
    {
      id: "b2",
      q: "What is your current project and your role in it?",
      diff: "easy",
      tags: ["intro"],
      answer: `<p>Cover four things, briefly:</p>
<ul>
<li><strong>The product</strong> — what it does and for whom, in plain language. One sentence, no internal jargon.</li>
<li><strong>Scale / stack</strong> — web + mobile? how many users? React/Java/etc.? which environments?</li>
<li><strong>Your role</strong> — be precise about what is <em>yours</em>: test design, release sign-off, automation framework, bug triage, working with the PO on acceptance criteria.</li>
<li><strong>Process</strong> — Scrum/Kanban, sprint length, where you sit in the flow (refinement → test cases → testing → sign-off).</li>
</ul>
<p>Interviewers are checking scope of ownership. "I execute test cases someone else wrote" and "I own the test strategy for a payment flow" are very different answers — give the honest one, but state the part you drove.</p>`,
    },
    {
      id: "b3",
      q: "What is the structure of your team?",
      diff: "easy",
      tags: ["intro", "process"],
      answer: `<p>Give the shape of the team and where quality sits in it:</p>
<ul>
<li>Size and roles — e.g. "cross-functional squad: 1 PO, 1 designer, 4 devs (2 FE, 2 BE), 2 QA, shared architect."</li>
<li>Who you report to (QA lead? engineering manager?) and whether QA is embedded in the squad or a separate department. Embedded is generally the healthier answer, and you can say why: earlier involvement, shorter feedback loop.</li>
<li>Ceremonies you take part in: refinement, planning, daily, review, retro. Mention that you join refinement — that's where testability gets decided.</li>
<li>How work reaches you: ticket flow, definition of ready/done, who signs off a release.</li>
</ul>`,
    },
    {
      id: "b4",
      q: "What kind of testing do you do — manual, automated?",
      diff: "easy",
      tags: ["intro", "strategy"],
      answer: `<p>Give a ratio and a reason, not just a label. For example: "Roughly 60/40 manual to automated. New features are tested manually and exploratively first — that's where the interesting bugs are — then the stable, repeatable paths get automated into the regression pack that runs in CI on every merge."</p>
<p>Then say what you automate and what you deliberately don't:</p>
<ul>
<li><strong>Automate:</strong> regression, smoke, critical user journeys, data-driven checks, API-level validation, anything run on every release.</li>
<li><strong>Keep manual:</strong> exploratory, usability, first pass on a new feature, one-off checks, anything visual/subjective, anything changing weekly.</li>
</ul>
<p>Name your tools concretely (Playwright/Selenium/Cypress, Postman, JMeter, Jira/Xray, Jenkins/GitHub Actions).</p>`,
    },
    {
      id: "b5",
      q: "Have you done accessibility testing?",
      diff: "mid",
      tags: ["accessibility"],
      answer: `<p>Answer honestly about depth, then show you know what it involves.</p>
<p><strong>The standard:</strong> WCAG 2.1/2.2, levels A / AA / AAA — AA is the usual legal and contractual target (EU EN 301 549, EAA).</p>
<p><strong>What you actually check:</strong></p>
<ul>
<li><strong>Keyboard only</strong> — every control reachable with Tab, visible focus ring, logical order, no keyboard traps, Esc closes modals, focus returns where it came from.</li>
<li><strong>Screen reader</strong> — NVDA (Windows), VoiceOver (macOS/iOS), TalkBack (Android). Do buttons announce a name and role? Are images given meaningful alt text — and decorative ones an empty alt?</li>
<li><strong>Semantics / ARIA</strong> — real <code>&lt;button&gt;</code> over a clickable <code>&lt;div&gt;</code>; labels tied to inputs; errors linked with <code>aria-describedby</code>; live regions for async messages.</li>
<li><strong>Colour contrast</strong> — 4.5:1 for body text, 3:1 for large text and UI components. Information never conveyed by colour alone.</li>
<li><strong>Zoom / reflow</strong> — 200% zoom, 320 px width, no horizontal scrolling or clipped content.</li>
<li><strong>Motion & timing</strong> — respects reduced-motion, time limits extendable.</li>
</ul>
<p><strong>Tools:</strong> axe DevTools, Lighthouse, WAVE, contrast checkers — plus <code>@axe-core/playwright</code> to fail the build on violations. Say clearly that automation catches maybe 30–40% of issues; keyboard and screen-reader passes are manual.</p>`,
    },
    {
      id: "b6",
      q: "Do you do functional and non-functional testing?",
      diff: "easy",
      tags: ["theory"],
      answer: `<p><strong>Functional</strong> — does it do what it's supposed to do? Requirements-driven: smoke, sanity, regression, integration, UAT, boundary and negative cases.</p>
<p><strong>Non-functional</strong> — <em>how well</em> does it do it? The quality attributes:</p>
<ul>
<li><strong>Performance</strong> — load, stress, spike, soak, scalability. Tools: JMeter, k6, Gatling.</li>
<li><strong>Security</strong> — authn/authz, injection, session handling, OWASP Top 10.</li>
<li><strong>Usability</strong> and <strong>accessibility</strong>.</li>
<li><strong>Compatibility</strong> — browsers, OS versions, devices, screen sizes.</li>
<li><strong>Reliability / recovery</strong> — behaviour on network loss, failover, backup-restore.</li>
<li><strong>Maintainability, portability, localisation</strong>.</li>
</ul>
<p>Give one real example of each from your work — e.g. "functionally I verify the discount is applied; non-functionally I check the basket still responds under 200 concurrent users, and that the page is usable on a 5-year-old Android."</p>`,
    },
    {
      id: "b7",
      q: "How would you open a bug for a broken link on the login page of a mobile application?",
      diff: "mid",
      tags: ["bug-reporting"],
      answer: `<p>They want the anatomy of a bug report. Walk through the fields:</p>
<ul>
<li><strong>Title</strong> — specific and searchable: "Login screen: 'Forgot password' link opens 404 page (Android 14, app 3.2.1)".</li>
<li><strong>Environment</strong> — app version + build number, OS version, device model, network (WiFi/4G), environment (staging/prod), user account/role.</li>
<li><strong>Preconditions</strong> — e.g. app freshly installed, user logged out.</li>
<li><strong>Steps to reproduce</strong> — numbered, minimal, reproducible by a stranger.</li>
<li><strong>Expected vs actual</strong> — "Expected: password-reset screen opens. Actual: in-app browser shows 404 / blank screen."</li>
<li><strong>Evidence</strong> — screenshot or screen recording, the actual URL the link points to, logcat/console output, the network response code (this is the bit that saves the developer an hour).</li>
<li><strong>Severity vs priority</strong> — severity Major (a documented recovery path is dead), priority High: it's on the <em>login</em> screen, so it blocks users who can't get in. Explain that severity is technical impact and priority is business urgency, and that you propose them but the team agrees them.</li>
<li><strong>Reproducibility</strong> — always / intermittent (X out of Y attempts), and whether iOS is affected too.</li>
</ul>
<p>Add the cross-checks you'd do <em>before</em> filing: is it only that link or all links? only that OS version? does the same URL work in a desktop browser (→ backend/content issue rather than app issue)?</p>`,
    },
    {
      id: "b8",
      q: "If you test a functionality for 7 days in its web version, how long would it take you in its mobile version — less, more?",
      diff: "mid",
      tags: ["mobile", "estimation"],
      answer: `<p>There's no single right number — they're testing your reasoning. Best answer: <strong>less than 7 days for the business logic, but not trivially less, because mobile adds a whole layer the web version didn't have.</strong></p>
<p><strong>Why less:</strong> the functionality is already understood — the flows, rules, edge cases and test data have been designed once. That analysis is the expensive part and it transfers.</p>
<p><strong>Why not much less — what's genuinely new on mobile:</strong></p>
<ul>
<li>Device and OS fragmentation, screen sizes and densities.</li>
<li>Interruptions: incoming call, notification, alarm, low battery, app backgrounded and killed by the OS.</li>
<li>Network: offline, flaky 3G, switching WiFi↔mobile data mid-flow.</li>
<li>Permissions: camera, location, notifications — granted, denied, revoked later.</li>
<li>Gestures, orientation, keyboard overlapping fields, safe areas/notch.</li>
<li>Install/upgrade paths, app store builds, deep links, push notifications.</li>
<li>Battery and memory consumption; slower test cycles because of builds and device setup.</li>
</ul>
<p>So say something like: <em>"Around 3–5 days for the same functional coverage, plus extra time for the mobile-specific dimensions. And if the two apps hit the same backend, some of that risk is already covered — I'd focus mobile effort on the client-side layer."</em> Then add that the honest answer depends on whether it's native, hybrid or a responsive web view, and on how many devices are in scope.</p>`,
    },
    {
      id: "b9",
      q: "Application A is in production; application B is in pre-production with no documentation but the same functionality. How would you test B?",
      diff: "hard",
      tags: ["strategy", "exploratory"],
      answer: `<p>The key insight: <strong>application A becomes the specification.</strong> This is testing by comparison — an oracle problem.</p>
<ol>
<li><strong>Use A as the oracle.</strong> Run the same flows side by side, same test data, and compare output. Any difference is either a bug or an intentional change — take the list to the PO/dev and get each one classified. That conversation also produces the missing documentation.</li>
<li><strong>Reverse-engineer a spec.</strong> Explore A and write down the user journeys, business rules, validations and error messages. Now you have a baseline test suite that didn't exist before.</li>
<li><strong>Mine other sources of truth</strong> — old tickets and bug history for A (past bugs are the best regression candidates), API contracts/Swagger, DB schema, analytics on which flows users actually use, support tickets, release notes, the code itself if you can read it.</li>
<li><strong>Risk-based prioritisation.</strong> No documentation means no time to test everything evenly. Rank by business impact × usage: money flows, login/auth, data integrity first; cosmetic pages last.</li>
<li><strong>Exploratory testing in timeboxed sessions</strong> with a charter per session ("explore checkout with invalid payment data to discover error-handling gaps"), taking notes as you go. Session-based test management gives you traceability without a spec.</li>
<li><strong>Ask humans.</strong> Devs, PO, support, and the people who used A. Fastest documentation there is.</li>
<li><strong>Data & migration checks</strong> if B replaces A: is existing data still readable, are the accounts, history and permissions intact?</li>
<li><strong>Write it down as you go</strong> so the next person isn't in the same position — the output of this work is both a tested app and a spec.</li>
</ol>
<p>Also flag the risk explicitly: without documentation you can verify B <em>behaves like A</em>, but you cannot verify A was correct in the first place. Say that out loud — it shows you understand the limits of the oracle.</p>`,
    },
    {
      id: "b10",
      q: "Describe the difference between unit, integration, and end-to-end testing.",
      diff: "easy",
      tags: ["theory"],
      answer: `<p>Frame it as the <strong>test pyramid</strong>: many fast cheap tests at the bottom, few slow expensive ones at the top.</p>
<ul>
<li><strong>Unit</strong> — one function/class/component in isolation, dependencies mocked. Milliseconds. Written by devs, run on every save/commit. Answers: "is this piece of logic correct?" Example: a <code>calculateDiscount()</code> function returns 10% off for orders over 100.</li>
<li><strong>Integration</strong> — two or more components talking to each other: service ↔ database, service ↔ API, frontend ↔ backend contract. Seconds. Answers: "do the pieces fit together?" Example: the order service really writes the row and the repository really reads it back.</li>
<li><strong>End-to-end</strong> — a full user journey through the deployed system, real browser/device, real (or realistic) backend. Minutes. Answers: "can a user actually do the thing?" Example: log in → add to basket → pay → see the order in history.</li>
</ul>
<p>The trade-off to state explicitly: as you go up, tests get <em>more realistic</em> but <em>slower, more expensive and flakier</em>, and failures point less precisely at a cause. So push each check as low as it can go, and reserve E2E for the handful of journeys that must never break.</p>`,
    },
    {
      id: "b11",
      q: "What CI/CD tools have you used?",
      diff: "easy",
      tags: ["ci-cd"],
      answer: `<p>Name what you've really used — Jenkins, GitHub Actions, GitLab CI, Azure DevOps, Bitbucket Pipelines, CircleCI, TeamCity — then show you understand the <em>pipeline</em>, which is what they're really asking:</p>
<ul>
<li><strong>Trigger</strong> — push, PR, merge to main, nightly schedule, manual.</li>
<li><strong>Stages</strong> — build → static analysis/lint → unit tests → deploy to test env → API tests → E2E smoke → (gate) → deploy to staging → full regression nightly.</li>
<li><strong>Gates</strong> — which failures block a merge. Smoke blocks; the long regression runs nightly and raises tickets instead.</li>
<li><strong>Reporting</strong> — JUnit XML/Allure reports, screenshots and traces on failure, Slack notification to the team channel, results pushed into Jira/Xray.</li>
<li><strong>Practical concerns</strong> — parallelisation and sharding to keep the run under ~10 minutes, test data setup/teardown, secrets handling, Docker/containers for a repeatable environment, retry policy and flake quarantine.</li>
</ul>
<p>A concrete sentence beats a tool list: "In GitHub Actions I set up a workflow that runs the Playwright smoke pack on every PR against a preview deployment, uploads traces as artifacts, and blocks the merge on failure."</p>`,
    },
    {
      id: "b12",
      q: "What is BDD?",
      diff: "mid",
      tags: ["theory", "process"],
      answer: `<p><strong>Behaviour-Driven Development</strong> — an approach where the team defines the expected behaviour of a feature in business language <em>before</em> it's built, and those examples become the tests.</p>
<p>The real point is <strong>collaboration</strong>, not the syntax: the "three amigos" (PO/BA, developer, tester) discuss a story together and agree concrete examples. That conversation removes ambiguity before a line of code is written — which is where most defects actually come from.</p>
<p>The examples are written in <strong>Gherkin</strong>:</p>
<pre><code>Feature: Login
  Scenario: Successful login with valid credentials
    Given I am on the login page
    When I enter a valid email and password
    And I click "Sign in"
    Then I should be taken to my dashboard</code></pre>
<p><code>Given</code> = precondition, <code>When</code> = action, <code>Then</code> = expected outcome; <code>And</code>/<code>But</code> extend a step; <code>Scenario Outline</code> + <code>Examples</code> gives data-driven variants; <code>Background</code> holds shared setup.</p>
<p>Each step is bound to code (step definitions) using Cucumber, SpecFlow, Behave, JBehave, or pytest-bdd. Living documentation: the feature files stay readable by non-technical stakeholders and are executable at the same time.</p>
<p><strong>Honest downside</strong> worth mentioning: BDD without the conversation is just a slower way to write tests — the Gherkin layer adds maintenance for no benefit if the PO never reads it. Compare with <strong>TDD</strong> (test first, developer-level, unit) and <strong>ATDD</strong> (acceptance criteria first) if asked.</p>`,
    },
    {
      id: "b13",
      q: "If the developer says that something is not a bug, what would you do?",
      diff: "mid",
      tags: ["soft-skills", "bug-reporting"],
      answer: `<p>Stay factual, never make it personal, and escalate only when needed.</p>
<ol>
<li><strong>Re-verify first.</strong> Reproduce on a clean environment, correct build, correct data. Sometimes the developer is right and you tested a stale build.</li>
<li><strong>Strengthen the evidence.</strong> Video, network trace, logs, the exact request/response, the specific requirement or acceptance criterion it violates. An argument about opinions becomes a discussion about facts.</li>
<li><strong>Talk, don't ping-pong the ticket.</strong> Five minutes at their desk / on a call beats six comment rounds. Ask why they think it's expected — often it's a genuine spec ambiguity, or it works as designed but the design is wrong.</li>
<li><strong>Argue impact, not correctness.</strong> "Whether or not it's a defect in the code, a user who taps this loses their basket" — impact is the language everyone agrees on.</li>
<li><strong>If you still disagree, escalate to the decider</strong> — the PO/BA owns "is this the intended behaviour?". Bring both positions neutrally.</li>
<li><strong>Accept the decision and record it.</strong> If it's closed as "works as designed", the ticket keeps the rationale, and if it's a real ambiguity, get the spec/AC updated so it doesn't come back next sprint.</li>
</ol>
<p>The signal they're looking for: you're not precious about being right, you're persistent about the user's experience, and you know who decides.</p>`,
    },
    {
      id: "b14",
      q: "For a login page with email, password, buttons and a checkbox — describe what tests you would write.",
      diff: "mid",
      tags: ["test-design"],
      answer: `<p>Answer in <strong>categories</strong>, not a random list — that's what separates a senior answer.</p>
<p><strong>1. Positive / happy path</strong></p>
<ul>
<li>Valid email + valid password → user is logged in and lands on the right page.</li>
<li>"Remember me" checked → session persists after closing and reopening the browser; unchecked → it doesn't.</li>
</ul>
<p><strong>2. Negative</strong></p>
<ul>
<li>Valid email + wrong password; unregistered email; both fields empty; only one field filled.</li>
<li>Error message is generic ("Invalid email or password") — it must not reveal whether the account exists (user enumeration).</li>
<li>Deactivated / locked / unverified account.</li>
</ul>
<p><strong>3. Field validation</strong></p>
<ul>
<li>Email format: missing @, missing domain, spaces, leading/trailing whitespace trimming, uppercase handling, plus-addressing (<code>a+b@x.com</code>), very long addresses, unicode/IDN domains.</li>
<li>Password: min/max length (boundary values: min-1, min, min+1, max, max+1), special characters, spaces, case sensitivity (it <em>must</em> be case-sensitive).</li>
<li>Field-level vs form-level error display, when validation triggers (on blur / on submit), errors clear when corrected.</li>
</ul>
<p><strong>4. Security</strong></p>
<ul>
<li>Password field is masked, has a working show/hide toggle, and is excluded from autocomplete history where required.</li>
<li>Credentials sent over HTTPS, in the body — never in the URL/query string.</li>
<li>SQL injection (<code>' OR '1'='1</code>) and XSS (<code>&lt;script&gt;alert(1)&lt;/script&gt;</code>) payloads in both fields.</li>
<li>Brute-force protection: account lockout / rate limiting / CAPTCHA after N failures, and what the message says.</li>
<li>Session: new session ID on login, token expiry, logout invalidates it, back button after logout doesn't restore the session, no credentials in logs.</li>
</ul>
<p><strong>5. UI / UX</strong></p>
<ul>
<li>Tab order email → password → checkbox → submit; Enter submits the form.</li>
<li>Button disabled/loading state during submit; double-click doesn't fire two requests.</li>
<li>Labels, placeholders, spelling; responsive layout; password managers can fill it.</li>
<li>Links work: forgot password, register, terms.</li>
</ul>
<p><strong>6. Accessibility</strong> — keyboard only, visible focus, inputs labelled, errors announced to screen readers, contrast.</p>
<p><strong>7. Compatibility</strong> — main browsers, mobile viewport, iOS/Android.</p>
<p><strong>8. Non-functional</strong> — response time under load, behaviour when the auth service is down (graceful error, not a hang), behaviour with no network.</p>
<p>Close by saying which of these you'd <strong>automate</strong> (happy path + main negatives + validation, data-driven) and which stay manual (usability, exploratory security).</p>`,
    },
    {
      id: "b15",
      q: "For a web page with a game for money (gambling), what tests would you write? — they show the page on screen and navigate through it.",
      diff: "hard",
      tags: ["test-design", "domain"],
      answer: `<p>This is really a <strong>risk</strong> question: real money is involved, so money and compliance come before UI polish. Structure it as follows.</p>
<p><strong>1. Money & transactions — highest risk</strong></p>
<ul>
<li>Balance is correct before/after every stake and every win; arithmetic to the correct number of decimals, correct rounding, correct currency.</li>
<li>Cannot bet more than the balance; cannot bet negative, zero, or a non-numeric amount; min/max stake boundaries.</li>
<li>Deposit and withdrawal flows, including declined cards and cancelled payments.</li>
<li><strong>Idempotency</strong> — double-click "Bet", refresh mid-spin, browser back, submit the same request twice: the user must be charged exactly once.</li>
<li><strong>Interrupted round</strong> — connection dropped after the stake was taken but before the result: on reconnect the round resolves correctly and no money vanishes. This is the classic gambling defect.</li>
<li>Concurrency: same account in two tabs/devices betting simultaneously.</li>
<li>Transaction history / statement matches the actual balance movements; backend records match what the UI showed.</li>
</ul>
<p><strong>2. Game logic</strong></p>
<ul>
<li>Payout table matches the rules exactly for every winning combination; edge combinations; jackpots.</li>
<li>RNG behaviour — results vary, no exploitable pattern, results come from the server and cannot be manipulated client-side.</li>
<li>Game state can't be tampered with from the browser (dev tools, altered requests, replayed responses).</li>
</ul>
<p><strong>3. Regulatory / responsible gambling</strong> — the part most candidates forget, and the one that scores:</p>
<ul>
<li>Age verification / KYC before playing for money.</li>
<li>Geo-restrictions — blocked jurisdictions, VPN handling.</li>
<li>Deposit, loss and session limits; self-exclusion and cool-off actually block play.</li>
<li>Mandatory information visible: RTP, licence, terms, reality-check/session-time reminders.</li>
<li>Audit trail: every bet logged and traceable.</li>
</ul>
<p><strong>4. Session & security</strong> — session timeout mid-game, login required, authorisation on every bet request, no sensitive data in the client, HTTPS.</p>
<p><strong>5. Functional UI</strong> — every button and control, disabled states while a round is in progress, animations complete, sound toggle, rules/help, navigation away and back.</p>
<p><strong>6. Non-functional</strong> — performance under concurrent players, latency effects on a timed game, load spikes, browser and mobile compatibility, orientation change, accessibility.</p>
<p>If they're navigating the page live, narrate as you go: point at each element and say what you'd verify, and ask questions ("what's the minimum stake?", "what happens if I refresh here?"). Asking good questions is part of the answer.</p>`,
    },
    {
      id: "b16",
      q: "To select the date of birth for a specific person's name from a table in a database, what query would you write?",
      diff: "easy",
      tags: ["sql"],
      answer: `<p>Write it, then add the caveats — the caveats are the interesting part.</p>
<ul>
<li>Match on first and last name if you have both; a first name alone returns many rows.</li>
<li>Use a parameter in real code, not a literal — otherwise it's an injection point.</li>
<li>Trim and normalise case if the data is user-entered.</li>
<li>DOB is personal data: in production this would be access-controlled and probably masked in test environments.</li>
</ul>`,
      solution: [
        {
          lang: "sql",
          src: `-- simple form
SELECT dob
FROM   users
WHERE  first_name = 'John';

-- what you'd actually write
SELECT user_id, first_name, last_name, dob
FROM   users
WHERE  first_name = :first_name
  AND  last_name  = :last_name;

-- tolerant of case / stray spaces
SELECT dob
FROM   users
WHERE  LOWER(TRIM(first_name)) = LOWER(:first_name);`,
        },
      ],
    },
    {
      id: "b17",
      q: "To select a name from one table and a salary from another table, what query would you write? (A join between the two tables.)",
      diff: "mid",
      tags: ["sql", "join"],
      answer: `<p>Straight <code>INNER JOIN</code> on the foreign key. What earns the points is explaining the join types:</p>
<ul>
<li><strong>INNER JOIN</strong> — only rows matching in both tables. Employees without a salary row disappear.</li>
<li><strong>LEFT JOIN</strong> — all employees, salary <code>NULL</code> where none exists. Use this when you want to <em>find</em> the employees missing a salary: <code>... WHERE s.salary IS NULL</code>. That's a great data-integrity test.</li>
<li><strong>RIGHT JOIN</strong> — the mirror image; rarely used in practice.</li>
<li><strong>FULL OUTER JOIN</strong> — everything from both sides, useful for reconciliation.</li>
<li><strong>CROSS JOIN</strong> — the accidental one: forget the <code>ON</code> clause and you get every combination.</li>
</ul>
<p>Also worth saying as a tester: check the row count. If the join returns more rows than there are employees, the salary table holds multiple rows per employee (history) and you need the latest one, not all of them.</p>`,
      solution: [
        {
          lang: "sql",
          caption: "Basic join",
          src: `SELECT e.first_name,
       e.last_name,
       s.salary
FROM   employees e
JOIN   salaries s ON s.employee_id = e.employee_id;`,
        },
        {
          lang: "sql",
          caption: "Useful variants",
          src: `-- everyone, including those with no salary record
SELECT e.first_name, e.last_name, s.salary
FROM   employees e
LEFT JOIN salaries s ON s.employee_id = e.employee_id;

-- data-integrity check: employees missing a salary row
SELECT e.employee_id, e.last_name
FROM   employees e
LEFT JOIN salaries s ON s.employee_id = e.employee_id
WHERE  s.employee_id IS NULL;

-- salary history: take only the current record
SELECT e.last_name, s.salary
FROM   employees e
JOIN   salaries s ON s.employee_id = e.employee_id
WHERE  s.end_date IS NULL;`,
        },
      ],
    },
    {
      id: "b18",
      q: "With which type of request to the server is data updated?",
      diff: "easy",
      tags: ["api", "http"],
      answer: `<p><strong>PUT</strong> and <strong>PATCH</strong>.</p>
<ul>
<li><strong>PUT</strong> — full replacement of the resource. You send the whole object; fields you omit are wiped.</li>
<li><strong>PATCH</strong> — partial update. You send only the fields that change.</li>
</ul>
<p>For contrast: <strong>POST</strong> creates, <strong>GET</strong> reads, <strong>DELETE</strong> removes. In practice many APIs use POST for updates too — say that you check the actual API contract rather than assuming, because that's a common source of bugs.</p>`,
    },
    {
      id: "b19",
      q: "What is the difference between GET, PUT, and POST requests?",
      diff: "mid",
      tags: ["api", "http"],
      answer: `<table class="cmp">
<thead><tr><th></th><th>GET</th><th>POST</th><th>PUT</th></tr></thead>
<tbody>
<tr><th>Purpose</th><td>Read a resource</td><td>Create a resource / submit data</td><td>Replace a resource entirely</td></tr>
<tr><th>Body</th><td>No body</td><td>Body</td><td>Body</td></tr>
<tr><th>Parameters</th><td>In the URL / query string</td><td>In the request body</td><td>In the body, id usually in the URL</td></tr>
<tr><th>Safe</th><td>Yes — no server state changes</td><td>No</td><td>No</td></tr>
<tr><th>Idempotent</th><td>Yes</td><td><strong>No</strong> — twice creates two resources</td><td><strong>Yes</strong> — same result however many times</td></tr>
<tr><th>Cacheable</th><td>Yes</td><td>Generally no</td><td>No</td></tr>
<tr><th>Typical success</th><td>200</td><td>201 Created (+ Location header)</td><td>200 or 204 No Content</td></tr>
</tbody></table>
<p><strong>Idempotency is the point of the question.</strong> Sending PUT five times leaves the resource in the same state; sending POST five times creates five orders. That's exactly why a double-clicked "Pay" button is a real defect and why you test refresh/retry behaviour on POST endpoints.</p>
<p>Also mention <strong>PATCH</strong> (partial update, not necessarily idempotent) and that GET must never change state — a "delete" implemented as a GET link is a genuine bug: crawlers and prefetchers will trigger it.</p>
<p>What you check as a QA on any of them: status code, response body and schema, headers, response time, authorisation (does it work without a token? with another user's token?), validation of bad input, and the actual effect in the database.</p>`,
    },
    {
      id: "b20",
      q: "On a login page, describe a condition that produces a server error and one that produces a front-end error.",
      diff: "mid",
      tags: ["api", "test-design"],
      answer: `<p><strong>Front-end error (client-side, 4xx or no request at all):</strong></p>
<ul>
<li>Email in the wrong format, or a required field left empty — the form validates and shows an inline message <em>without</em> ever calling the server. Nothing appears in the network tab; that's how you tell.</li>
<li>Wrong credentials → the server answers <strong>401 Unauthorized</strong>; the front end turns that into "Invalid email or password". The request happened, the error is expected and handled.</li>
<li>Other client-side conditions: password shorter than the minimum, unchecked mandatory terms box, malformed input rejected before submit.</li>
</ul>
<p><strong>Server error (5xx):</strong></p>
<ul>
<li>Database or auth service down → <strong>500 / 503</strong> on submitting valid credentials.</li>
<li>Unhandled exception from unexpected input — e.g. an extremely long string or special characters that break a query, an emoji in a non-unicode column, a null the code doesn't expect.</li>
<li>Timeout under load, or a dependency (SSO/identity provider) not responding → 504.</li>
</ul>
<p>The distinction that matters: <strong>4xx = the client sent something wrong; 5xx = the server failed to handle a legitimate request.</strong> A 500 is <em>always</em> a bug, even if triggered by strange input — the server should validate and return 400, not crash.</p>
<p>What you test around it: that the UI shows a friendly message instead of a raw stack trace (leaking a stack trace is a security finding), that the user can retry, that the page doesn't hang forever with a spinner, and that the failure is logged server-side. Simulate it by blocking the request or stubbing the response in dev tools — no need to take the backend down.</p>`,
    },
    {
      id: "b21",
      q: "What does this piece of code do? (Automated test with browser initialisation, one button interaction and browser close.)",
      diff: "mid",
      tags: ["selenium", "code-reading"],
      prompt: {
        lang: "js",
        caption: "The shape of what they usually show",
        src: `let driver = await new Builder().forBrowser('chrome').build();
try {
  await driver.get('https://example.com/login');
  await driver.findElement(By.id('submit')).click();
  let msg = await driver.findElement(By.css('.message')).getText();
  console.log(msg);
} finally {
  await driver.quit();
}`,
      },
      answer: `<p>Read it out loud in four beats — <strong>setup → action → verification → teardown</strong>:</p>
<ol>
<li><strong>Setup:</strong> a WebDriver instance is created and Chrome is launched; the driver navigates to the page under test.</li>
<li><strong>Action:</strong> an element is located with a locator strategy (id / css / xpath / name) and clicked.</li>
<li><strong>Check:</strong> text or state is read back from the page. Point out whether it's an <em>assertion</em> or just a <code>console.log</code> — if it only logs, the test can never fail, which is the most useful observation you can make about a script like this.</li>
<li><strong>Teardown:</strong> <code>driver.quit()</code> in a <code>finally</code> block closes the browser and ends the session regardless of what happened above.</li>
</ol>
<p>Then add what you'd improve, which is what the question is really probing:</p>
<ul>
<li>Add a real assertion (<code>expect</code>/<code>assert</code>) — logging isn't verification.</li>
<li>Replace any <code>sleep</code>/<code>Thread.sleep</code> with an explicit wait on a condition.</li>
<li>Move locators out of the test into a <strong>Page Object</strong>; the test should read as business steps.</li>
<li>Prefer stable locators — <code>data-testid</code> or id over brittle absolute XPath.</li>
<li>No hard-coded URLs, credentials or test data; keep tests independent so they can run in parallel and in any order.</li>
</ul>`,
    },
    {
      id: "b22",
      q: "Why do we use driver.quit() at the end of an automated test?",
      diff: "easy",
      tags: ["selenium"],
      answer: `<p><code>driver.quit()</code> ends the entire WebDriver <strong>session</strong>: it closes all browser windows opened by the driver and shuts down the driver process itself.</p>
<p><strong>Why it matters:</strong></p>
<ul>
<li><strong>Frees resources</strong> — every abandoned browser keeps RAM, CPU and a temporary profile directory. On a CI agent running hundreds of tests, leaked instances exhaust the machine.</li>
<li><strong>Kills the driver process</strong> — chromedriver/geckodriver keeps running and holding its port otherwise; orphaned processes accumulate until the agent needs a restart.</li>
<li><strong>Clean state between tests</strong> — cookies, local storage and session data don't leak into the next test, so tests stay independent.</li>
<li><strong>The build finishes</strong> — an open session can leave the process hanging.</li>
</ul>
<p><strong>quit() vs close():</strong> <code>close()</code> closes only the current window; if it's the last one the browser closes but the session may linger. <code>quit()</code> terminates everything. Rule of thumb: <code>close()</code> for getting rid of one popup window, <code>quit()</code> at the end of the test.</p>
<p><strong>Where to put it:</strong> never as the last statement of the happy path — put it in a <code>finally</code> block, or in the framework's teardown hook (<code>@AfterEach</code>, <code>afterAll</code>, a fixture), so it runs even when the test fails or throws.</p>`,
    },
    {
      id: "b23",
      q: "What is the difference between locators and assertions?",
      diff: "easy",
      tags: ["automation", "theory"],
      answer: `<p>They do completely different jobs in a test:</p>
<ul>
<li><strong>Locator — how you find an element.</strong> A locator is the address of something on the page: <code>By.id("submit")</code>, <code>By.css(".error-message")</code>, <code>By.xpath("//button[text()='Save']")</code>, <code>getByRole('button', { name: 'Save' })</code>. It's the <em>interaction</em> half of the test: find it, click it, type into it. If a locator fails you get <code>NoSuchElementError</code> — an <strong>error</strong>, not a test failure.</li>
<li><strong>Assertion — how you verify the result.</strong> An assertion compares actual against expected and decides pass or fail: <code>expect(message).toBe("Welcome")</code>, <code>assertTrue(button.isEnabled())</code>. It's the <em>verification</em> half. If an assertion doesn't hold, the test <strong>fails</strong> — which is the test doing its job.</li>
</ul>
<p>Put simply: <em>locators find, assertions judge.</em> A test with locators but no assertions isn't a test — it's a script that proves the page didn't crash. And a locator failure usually means the UI changed or the test didn't wait; an assertion failure usually means a real defect. That distinction matters when you triage a red pipeline.</p>
<p>Good practice to mention: stable locators (<code>data-testid</code>, role-based) over deep XPath; assert on user-visible outcomes rather than implementation details; one clear logical assertion per test where possible.</p>`,
    },
    {
      id: "b24",
      q: "Which tests are automated?",
      diff: "mid",
      tags: ["strategy", "automation"],
      answer: `<p><strong>Good candidates:</strong></p>
<ul>
<li><strong>Regression</strong> — run every release, never changes, boring for a human. The number one candidate.</li>
<li><strong>Smoke / sanity</strong> — the short "is the build worth testing?" pack, run on every deployment.</li>
<li><strong>Critical user journeys</strong> — login, checkout, payment: high business risk, must never break.</li>
<li><strong>Data-driven cases</strong> — same flow, 40 combinations of input. Cheap in code, painful by hand.</li>
<li><strong>API / integration tests</strong> — fast, stable, no UI flakiness; the best return on effort.</li>
<li><strong>Cross-browser / cross-device</strong> repetition, and performance/load tests, which can't be done manually at all.</li>
<li>Anything needing precise setup or verification you can do in code (DB state, mocked services).</li>
</ul>
<p><strong>Poor candidates:</strong></p>
<ul>
<li><strong>Exploratory</strong> testing — by definition unscripted.</li>
<li><strong>Usability</strong> and visual/aesthetic judgement — a human decides "this looks wrong".</li>
<li>Features still <strong>changing every sprint</strong> — you'd rewrite the test more often than you run it.</li>
<li>Tests that run <strong>once</strong> (a one-off migration check) — automating costs more than doing it.</li>
<li>Flows with unautomatable dependencies: CAPTCHA, OTP by SMS, external third-party sandboxes, hardware (card readers, printers).</li>
<li>Anything with an unstable or constantly changing UI, unless you fix the locators first.</li>
</ul>
<p><strong>The decision rule:</strong> automate when <em>frequency of execution × cost of running it manually × risk</em> outweighs the cost of writing and maintaining the test. Maintenance is the part people forget — a test suite is code, and it has an ongoing cost.</p>`,
    },
    {
      id: "b25",
      q: "How do you organise your work as a QA?",
      diff: "easy",
      tags: ["process", "soft-skills"],
      answer: `<p>Describe a real routine, not a philosophy.</p>
<ul>
<li><strong>Early involvement</strong> — I join refinement and review acceptance criteria before development starts; most defects are cheapest to fix as questions in a refinement session.</li>
<li><strong>Plan per story</strong> — test cases/checklist written while dev work is ongoing, linked to the ticket in Jira/Xray/TestRail, reviewed by the dev so we agree what "done" means.</li>
<li><strong>Prioritise by risk</strong> — business impact × likelihood. Payment and login before the footer. When time is short I make the trade-off explicit rather than silently cutting scope.</li>
<li><strong>Daily rhythm</strong> — morning: check the nightly run and triage failures; then test what's ready on the board; keep the last part of the day for retesting fixes so nothing sits blocked overnight.</li>
<li><strong>Track everything in one place</strong> — the board is the source of truth; bugs linked to stories, test runs recorded, so status is visible without anyone asking me.</li>
<li><strong>Communicate</strong> — blockers raised in the daily, release-readiness summarised before sign-off, no surprises for the PO.</li>
<li><strong>Reserve time for the suite</strong> — a slot each sprint for automation maintenance and flake fixing; otherwise the suite rots.</li>
<li><strong>Retro feedback</strong> — escaped bugs get a short "how did this get through?" and one concrete change.</li>
</ul>`,
    },
    {
      id: "b26",
      q: "Which are better — manual or automated tests?",
      diff: "easy",
      tags: ["theory", "strategy"],
      answer: `<p>Neither — they answer different questions, and a suite of only one of them is a broken strategy. Say that clearly, then justify it.</p>
<p><strong>Automation is better at:</strong> repetition, speed, regression, running on every commit, large data sets, cross-browser coverage, load and performance, precision and reproducibility, and freeing people from drudgery.</p>
<p><strong>Humans are better at:</strong> noticing what nobody specified, usability and "this feels wrong", exploratory testing, first pass on a new feature, ad-hoc investigation, judging visual design, and testing things that change every week.</p>
<p>The line I'd use: <em>"Automation tells me the things I already know to check still work. Manual and exploratory testing find the things nobody thought to check."</em> Automation confirms; humans discover.</p>
<p>Also worth adding: automation has a real cost — writing, maintaining, debugging flakes, CI infrastructure. It pays back only when the test is run many times. So the practical answer is a layered strategy: automate the repeatable regression, keep humans on the new and the uncertain.</p>`,
    },
    {
      id: "b27",
      q: "You must have had a lot of challenges in your work — how do you solve them?",
      diff: "mid",
      tags: ["soft-skills", "star"],
      answer: `<p>Give a method plus <strong>one concrete story</strong> in STAR form. The story is what they remember.</p>
<p><strong>Method:</strong></p>
<ol>
<li>Understand the problem before reacting — reproduce, gather data, read the logs.</li>
<li>Separate symptom from root cause; group related failures rather than chasing each one.</li>
<li>Decide who owns the decision — I bring options and impact, the PO/lead decides on scope and risk.</li>
<li>Fix, then prevent: add a regression test or change the process so it can't recur.</li>
<li>Communicate early and in writing; surprises are the real problem, not bugs.</li>
</ol>
<p><strong>Example story shape:</strong> "Our nightly suite was ~30% flaky, so the team stopped trusting it (S). I was asked to make it reliable again (T). I grouped failures by stack trace and found three root causes — hard-coded sleeps, shared test data across parallel workers, and one genuinely broken endpoint. I replaced sleeps with explicit waits, gave each worker its own seeded data, and raised a ticket for the endpoint. I quarantined the remaining flakes instead of deleting them (A). Flake rate went from 30% to under 3% in two sprints and the team started blocking merges on the suite again (R)."</p>
<p>Have two or three of these ready: a technical one, a people/conflict one, and a deadline/pressure one.</p>`,
    },
  ],
};
