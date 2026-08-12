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
      answer: `<p class="say">Say this: "QA engineer, X years, mostly in [your domain]." Then two projects and hand back. 60–90 seconds.</p>
<ul>
<li>One sentence per project: what it did, what you owned, one result.</li>
<li>Use a number. "Took the release smoke from 4 hours manual to 25 minutes in CI."</li>
<li>Say your current mix — how much manual, how much automation, which tools.</li>
<li>Finish with "happy to go deeper on any of those."</li>
<li>Don't walk through your CV date by date, and don't list tools with no story.</li>
</ul>`,
    },
    {
      id: "b2",
      q: "What is your current project and your role in it?",
      diff: "easy",
      tags: ["intro"],
      answer: `<p class="say">Say this: what the product does, then exactly what is yours.</p>
<ul>
<li><strong>Product</strong> — one plain sentence, no internal jargon.</li>
<li><strong>Stack and scale</strong> — web, mobile, how many users, which environments.</li>
<li><strong>Your part</strong> — be precise: test design, release sign-off, the automation framework, bug triage.</li>
<li><strong>Process</strong> — Scrum or Kanban, and where you sit: refinement → test cases → testing → sign-off.</li>
<li>They're measuring ownership. "I run cases someone else wrote" and "I own testing for payments" are very different — give the true one, but name the part you drove.</li>
</ul>`,
    },
    {
      id: "b3",
      q: "What is the structure of your team?",
      diff: "easy",
      tags: ["intro", "process"],
      answer: `<p class="say">Say this: the shape of the team, and where quality sits in it.</p>
<ul>
<li>Size and roles — "1 PO, 1 designer, 4 devs, 2 QA."</li>
<li>Are you inside the team or in a separate QA department? Inside is healthier — you get involved earlier.</li>
<li>Who you report to.</li>
<li>Which ceremonies you join. Mention refinement — that's where testability gets decided.</li>
<li>How work reaches you, and who signs off a release.</li>
</ul>`,
    },
    {
      id: "b4",
      q: "What kind of testing do you do — manual, automated?",
      diff: "easy",
      tags: ["intro", "strategy"],
      answer: `<p class="say">Say this: "Roughly 60/40 manual to automated" — then give the reason, not just the number.</p>
<ul>
<li>New features get tested by hand first. That's where the interesting bugs are.</li>
<li>Once a flow is stable, it goes into the regression pack and runs in CI on every merge.</li>
<li><strong>Automate:</strong> regression, smoke, critical journeys, API checks, anything run every release.</li>
<li><strong>Keep manual:</strong> exploratory, usability, first pass on new work, anything that changes weekly.</li>
<li>Name your actual tools — Playwright, Postman, Jira, Jenkins.</li>
</ul>`,
    },
    {
      id: "b5",
      q: "Have you done accessibility testing?",
      diff: "mid",
      tags: ["accessibility"],
      answer: `<p class="say">Say this: "Yes — against WCAG 2.1 level AA, which is the usual legal target."</p>
<ul>
<li><strong>Keyboard only</strong> — can you reach and use everything with Tab? Visible focus ring, Esc closes dialogs, no traps.</li>
<li><strong>Screen reader</strong> — NVDA, VoiceOver, TalkBack. Do buttons announce a name? Do images have useful alt text?</li>
<li><strong>Real HTML</strong> — a <code>&lt;button&gt;</code>, not a clickable <code>&lt;div&gt;</code>. Labels tied to inputs.</li>
<li><strong>Contrast</strong> — 4.5:1 for normal text. Never use colour alone to carry meaning.</li>
<li><strong>Zoom</strong> — 200% and nothing is cut off or scrolls sideways.</li>
<li><strong>Tools</strong> — axe, Lighthouse, WAVE. Say the honest part: tools catch about a third. Keyboard and screen reader are manual.</li>
</ul>`,
    },
    {
      id: "b6",
      q: "Do you do functional and non-functional testing?",
      diff: "easy",
      tags: ["theory"],
      answer: `<p class="say">Say this: "Functional is <em>does it work</em>. Non-functional is <em>how well</em>."</p>
<ul>
<li><strong>Functional</strong> — smoke, regression, integration, negative cases, boundaries.</li>
<li><strong>Performance</strong> — load, stress, soak. JMeter, k6.</li>
<li><strong>Security</strong> — login, permissions, injection.</li>
<li><strong>Usability and accessibility</strong>.</li>
<li><strong>Compatibility</strong> — browsers, OS versions, devices, screen sizes.</li>
<li><strong>Reliability</strong> — what happens when the network drops or a service is down.</li>
</ul>
<p>Give one example of each from your own work: "functionally I check the discount is applied; non-functionally, that the basket still responds with 200 users on it."</p>`,
    },
    {
      id: "b7",
      q: "How would you open a bug for a broken link on the login page of a mobile application?",
      diff: "mid",
      tags: ["bug-reporting"],
      answer: `<p class="say">Say this: a title anyone can search, then steps anyone can repeat.</p>
<ul>
<li><strong>Title</strong> — "Login screen: 'Forgot password' link opens 404 (Android 14, app 3.2.1)".</li>
<li><strong>Environment</strong> — app version and build, OS version, device, network, test or production.</li>
<li><strong>Steps</strong> — numbered, minimal, reproducible by a stranger.</li>
<li><strong>Expected vs actual</strong> — "Expected: reset screen. Actual: 404."</li>
<li><strong>Evidence</strong> — screen recording, the URL the link points to, the response code. This saves the developer an hour.</li>
<li><strong>Severity vs priority</strong> — severity is technical impact, priority is business urgency. Here: Major severity, High priority, because it's on the login screen.</li>
</ul>
<p>Check before filing: only that link or all of them? Only that OS? Does the URL work in a desktop browser — if yes it's the app, if no it's the backend.</p>`,
    },
    {
      id: "b8",
      q: "If you test a functionality for 7 days in its web version, how long would it take you in its mobile version — less, more?",
      diff: "mid",
      tags: ["mobile", "estimation"],
      answer: `<p class="say">Say this: "Less for the logic — maybe 3–5 days — plus extra for what only mobile has."</p>
<ul>
<li><strong>Why less:</strong> the thinking is done. The flows, rules and test data all carry over. That was the expensive part.</li>
<li><strong>Why not much less:</strong> mobile adds a whole layer the web never had.</li>
<li>Interruptions — calls, notifications, the OS killing the app.</li>
<li>Network — offline, slow 3G, switching WiFi to mobile data mid-flow.</li>
<li>Devices, screen sizes, permissions, gestures, rotation, install and upgrade.</li>
<li>Add the caveat: it depends on native vs hybrid, and how many devices are in scope. If both apps hit the same backend, that risk is already covered.</li>
</ul>`,
    },
    {
      id: "b9",
      q: "Application A is in production; application B is in pre-production with no documentation but the same functionality. How would you test B?",
      diff: "hard",
      tags: ["strategy", "exploratory"],
      answer: `<p class="say">Say this: "Application A becomes my specification."</p>
<ul>
<li><strong>Compare side by side.</strong> Same flows, same data, in both. Every difference is either a bug or an intended change — take the list to the PO and get each one labelled.</li>
<li><strong>Write the spec as you explore A.</strong> Journeys, rules, error messages. Now you have test cases that didn't exist.</li>
<li><strong>Mine other sources</strong> — old bug tickets (past bugs are the best test ideas), API docs, the database, support tickets.</li>
<li><strong>Prioritise by risk.</strong> No docs means no time for everything. Money, login and data first.</li>
<li><strong>Exploratory sessions</strong> with a written charter and notes, so you still have traceability.</li>
<li><strong>Ask people</strong> — devs, PO, support. Fastest documentation there is.</li>
</ul>
<p>Say the limit out loud: this proves B behaves like A. It does not prove A was ever right.</p>`,
    },
    {
      id: "b10",
      q: "Describe the difference between unit, integration, and end-to-end testing.",
      diff: "easy",
      tags: ["theory"],
      answer: `<p class="say">Say this: "It's the test pyramid — many fast cheap tests at the bottom, few slow ones at the top."</p>
<ul>
<li><strong>Unit</strong> — one function on its own, everything else mocked. Milliseconds. "Does this bit of logic work?" e.g. <code>calculateDiscount()</code> gives 10% off over 100.</li>
<li><strong>Integration</strong> — two parts talking: service and database, frontend and API. Seconds. "Do the pieces fit?"</li>
<li><strong>End-to-end</strong> — a whole user journey in a real browser. Minutes. "Can a user actually do it?" Login → basket → pay → see the order.</li>
<li><strong>The trade-off:</strong> going up, tests get more realistic but slower, more expensive and flakier, and tell you less about where the bug is.</li>
<li>So push every check as low as it will go, and keep E2E for the few journeys that must never break.</li>
</ul>`,
    },
    {
      id: "b11",
      q: "What CI/CD tools have you used?",
      diff: "easy",
      tags: ["ci-cd"],
      answer: `<p class="say">Say this: name the tool, then describe the pipeline — that's what they're really asking.</p>
<ul>
<li><strong>Tools</strong> — Jenkins, GitHub Actions, GitLab CI, Azure DevOps. Whatever you've actually used.</li>
<li><strong>Trigger</strong> — on push, on pull request, or nightly.</li>
<li><strong>Stages</strong> — build → lint → unit tests → deploy to test → API tests → smoke → deploy.</li>
<li><strong>Gates</strong> — smoke blocks the merge; the long regression runs at night and raises tickets instead.</li>
<li><strong>Reports</strong> — screenshots and traces on failure, results in Slack or Jira.</li>
<li>One concrete sentence beats a list: "I set up a workflow that runs the Playwright smoke pack on every PR and blocks the merge if it fails."</li>
</ul>`,
    },
    {
      id: "b12",
      q: "What is BDD?",
      diff: "mid",
      tags: ["theory", "process"],
      answer: `<p class="say">Say this: "The team agrees examples of how a feature should behave, in plain language, before it's built — and those examples become the tests."</p>
<ul>
<li>The real value is the <strong>conversation</strong>: PO, developer and tester agree examples first. That's where ambiguity dies.</li>
<li>Written in <strong>Gherkin</strong>: <code>Given</code> the starting point, <code>When</code> the action, <code>Then</code> the expected result.</li>
<li>Steps are wired to code with Cucumber, SpecFlow or pytest-bdd.</li>
<li>It stays readable by non-technical people and runnable at the same time.</li>
<li><strong>Honest downside:</strong> without the conversation it's just a slower way to write tests.</li>
</ul>
<pre><code>Scenario: Successful login
  Given I am on the login page
  When I enter a valid email and password
  Then I should land on my dashboard</code></pre>`,
    },
    {
      id: "b13",
      q: "If the developer says that something is not a bug, what would you do?",
      diff: "mid",
      tags: ["soft-skills", "bug-reporting"],
      answer: `<p class="say">Say this: "Check myself first, then talk to them — with evidence, not opinions."</p>
<ul>
<li><strong>Re-test</strong> on a clean environment and the right build. Sometimes they're right.</li>
<li><strong>Add proof</strong> — video, logs, the request and response, the requirement it breaks.</li>
<li><strong>Talk, don't comment.</strong> Five minutes in person beats six rounds in the ticket.</li>
<li><strong>Argue impact, not who's right</strong> — "whether or not it's a code defect, the user loses their basket."</li>
<li><strong>Still stuck?</strong> The PO decides what the intended behaviour is. Bring both sides fairly.</li>
<li><strong>Accept and record it.</strong> If it's closed as by-design, get the reason written down so it doesn't come back next sprint.</li>
</ul>`,
    },
    {
      id: "b14",
      q: "For a login page with email, password, buttons and a checkbox — describe what tests you would write.",
      diff: "mid",
      tags: ["test-design"],
      answer: `<p class="say">Say this: give <em>categories</em>, not a random list. That's what sounds senior.</p>
<ul>
<li><strong>Happy path</strong> — right email and password logs in. "Remember me" ticked keeps you logged in after closing the browser; unticked doesn't.</li>
<li><strong>Negative</strong> — wrong password, unknown email, empty fields, locked account. The error must stay vague: "Invalid email or password", never "no such user".</li>
<li><strong>Validation</strong> — bad email formats, spaces, very long values, min and max password length, and one over and under each limit. Password must be case-sensitive.</li>
<li><strong>Security</strong> — password masked, sent over HTTPS in the body not the URL, injection and script payloads in both fields, lockout after N failed attempts, logout really ends the session.</li>
<li><strong>UI</strong> — Tab order, Enter submits, button disabled while loading, double-click doesn't send two requests, links work.</li>
<li><strong>Accessibility and compatibility</strong> — keyboard only, labels, contrast, main browsers, mobile.</li>
<li><strong>When it breaks</strong> — auth service down, no network: a clear message, not a spinner forever.</li>
</ul>
<p>Finish by splitting them: automate the happy path, main negatives and validation. Keep usability and exploratory manual.</p>`,
    },
    {
      id: "b15",
      q: "For a web page with a game for money (gambling), what tests would you write? — they show the page on screen and navigate through it.",
      diff: "hard",
      tags: ["test-design", "domain"],
      answer: `<p class="say">Say this: "Real money is involved, so I start with the money — not the buttons."</p>
<ul>
<li><strong>Money</strong> — balance correct before and after every bet and win, right rounding and currency. Can't bet more than you have, or a negative or zero amount.</li>
<li><strong>Charged exactly once</strong> — double-click Bet, refresh mid-spin, press back, send the same request twice. This is the classic defect.</li>
<li><strong>Interrupted round</strong> — connection dies after the stake is taken but before the result. On reconnect the round must resolve and no money disappears.</li>
<li><strong>Game rules</strong> — every winning combination pays what the table says. Results come from the server, so they can't be faked in the browser.</li>
<li><strong>Regulation</strong> — age check, blocked countries, deposit and loss limits, self-exclusion actually blocks play, RTP and licence shown. Most candidates forget this; it scores.</li>
<li><strong>Session and security</strong> — timeout mid-game, every bet request checked server-side, nothing sensitive in the browser.</li>
<li><strong>The rest</strong> — buttons disabled while a round runs, history matches the balance, performance with many players, mobile.</li>
</ul>
<p>If they're clicking through it live, narrate: point at each control, say what you'd check, and ask questions — "what's the minimum stake?", "what if I refresh here?" Asking well is part of the answer.</p>`,
    },
    {
      id: "b16",
      q: "To select the date of birth for a specific person's name from a table in a database, what query would you write?",
      diff: "easy",
      tags: ["sql"],
      answer: `<p class="say">Say this: "Select the dob column, filtered on the name."</p>
<p><strong>How it works</strong></p>
<ul class="clauses">
<li><code>SELECT</code> the column you want — <code>dob</code></li>
<li><code>FROM</code> the table — <code>users</code></li>
<li><code>WHERE</code> the filter — the person's name</li>
<li><code>AND</code> add the last name so you get one person</li>
</ul>
<ul>
<li>First name alone returns every John. Match on both names.</li>
<li>Use a parameter, not text pasted into the query.</li>
<li>If the data is typed by users, allow for case and stray spaces.</li>
</ul>`,
      solution: [
        {
          lang: "sql",
          caption: "Simple, then real",
          src: `SELECT dob                          -- the column
FROM   users                        -- the table
WHERE  first_name = 'John';         -- the filter

-- what you'd actually write
SELECT first_name, last_name, dob
FROM   users
WHERE  first_name = :first_name     -- parameters, not literals
  AND  last_name  = :last_name;

-- tolerant of case and stray spaces
WHERE LOWER(TRIM(first_name)) = LOWER(:first_name)`,
        },
      ],
    },
    {
      id: "b17",
      q: "To select a name from one table and a salary from another table, what query would you write? (A join between the two tables.)",
      diff: "mid",
      tags: ["sql", "join"],
      answer: `<p class="say">Say this: "A join on the shared column — employee_id."</p>
<p><strong>How it works</strong></p>
<ul class="clauses">
<li><code>SELECT</code> name from one table, salary from the other</li>
<li><code>FROM</code> the first table, given a short alias</li>
<li><code>JOIN</code> the second table</li>
<li><code>ON</code> the id they both share</li>
</ul>
<p><strong>Which join</strong></p>
<ul class="clauses">
<li><code>INNER JOIN</code> only people who have a salary row</li>
<li><code>LEFT JOIN</code> everyone, salary empty if missing</li>
<li><code>FULL OUTER</code> everything from both sides</li>
<li><code>CROSS JOIN</code> what you get if you forget <code>ON</code> — every combination</li>
</ul>
<p>Tester's instinct: check the row count. More rows than employees means the salary table holds history, and you need the current one.</p>`,
      solution: [
        {
          lang: "sql",
          caption: "The join, and two useful variants",
          src: `SELECT e.first_name, e.last_name,   -- from employees
       s.salary                     -- from salaries
FROM   employees e                  -- first table
JOIN   salaries  s                  -- second table
       ON s.employee_id = e.employee_id;  -- the shared id

-- find employees with no salary row (a data-integrity check)
SELECT e.employee_id, e.last_name
FROM   employees e
LEFT JOIN salaries s ON s.employee_id = e.employee_id
WHERE  s.employee_id IS NULL;

-- salary history: take only the current record
WHERE s.end_date IS NULL`,
        },
      ],
    },
    {
      id: "b18",
      q: "With which type of request to the server is data updated?",
      diff: "easy",
      tags: ["api", "http"],
      answer: `<p class="say">Say this: "PUT and PATCH."</p>
<ul>
<li><strong>PUT</strong> replaces the whole thing. Fields you leave out get wiped.</li>
<li><strong>PATCH</strong> changes only the fields you send.</li>
<li>For contrast: POST creates, GET reads, DELETE removes.</li>
<li>Add the practical note: plenty of APIs use POST for updates too, so check the actual contract instead of assuming. That mismatch causes real bugs.</li>
</ul>`,
    },
    {
      id: "b19",
      q: "What is the difference between GET, PUT, and POST requests?",
      diff: "mid",
      tags: ["api", "http"],
      answer: `<p class="say">Say this: "GET reads, POST creates, PUT replaces — and the important difference is what happens if you send it twice."</p>
<table class="cmp">
<thead><tr><th></th><th>GET</th><th>POST</th><th>PUT</th></tr></thead>
<tbody>
<tr><th>Does</th><td>Reads</td><td>Creates</td><td>Replaces</td></tr>
<tr><th>Body</th><td>None</td><td>Yes</td><td>Yes</td></tr>
<tr><th>Data goes</th><td>In the URL</td><td>In the body</td><td>In the body</td></tr>
<tr><th>Send twice</th><td>Same result</td><td><strong>Two records</strong></td><td>Same result</td></tr>
<tr><th>Success</th><td>200</td><td>201</td><td>200 or 204</td></tr>
</tbody></table>
<ul>
<li><strong>That "send twice" row is the point.</strong> PUT five times leaves one record. POST five times creates five orders — which is why a double-clicked Pay button is a real bug.</li>
<li>GET must never change anything. A delete link done as a GET is a genuine defect: crawlers will trigger it.</li>
<li>What you check on any of them: status code, response body, response time, and whether it works without a token or with someone else's.</li>
</ul>`,
    },
    {
      id: "b20",
      q: "On a login page, describe a condition that produces a server error and one that produces a front-end error.",
      diff: "mid",
      tags: ["api", "test-design"],
      answer: `<p class="say">Say this: "4xx means the client sent something wrong. 5xx means the server failed to handle a fair request."</p>
<ul>
<li><strong>Front-end error</strong> — email in the wrong format, or an empty field. The page shows a message and <em>never calls the server</em>. You can tell: nothing appears in the network tab.</li>
<li><strong>Also client-side</strong> — wrong password gives <strong>401</strong> from the server, and the page turns it into "Invalid email or password". Expected and handled.</li>
<li><strong>Server error</strong> — the database or login service is down: <strong>500</strong> or <strong>503</strong> on valid credentials.</li>
<li><strong>Also 5xx</strong> — an unexpected input the code doesn't handle, like a huge string or an emoji, or a timeout under load.</li>
<li><strong>A 500 is always a bug</strong>, even from strange input. The server should validate and answer 400, not fall over.</li>
<li><strong>What you test around it:</strong> a friendly message instead of a stack trace (leaking one is a security finding), a retry, and no endless spinner. Simulate it by blocking the request in dev tools.</li>
</ul>`,
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
      answer: `<p class="say">Say this: "Four beats — set up, act, check, clean up."</p>
<p><strong>How it works</strong></p>
<ul class="clauses">
<li><code>Builder</code> starts the browser</li>
<li><code>get</code> opens the page under test</li>
<li><code>findElement</code> locates the button</li>
<li><code>click</code> the action being tested</li>
<li><code>getText</code> reads the result back</li>
<li><code>finally</code> runs pass or fail</li>
<li><code>quit</code> closes the browser and ends the session</li>
</ul>
<ul>
<li><strong>Say the sharp thing:</strong> it only logs the message. No assertion means it can never fail.</li>
<li><strong>How you'd improve it:</strong> add a real assertion; wait for a condition instead of sleeping; move locators into a Page Object; use <code>data-testid</code> instead of fragile XPath; no hard-coded URLs or passwords.</li>
</ul>`,
    },
    {
      id: "b22",
      q: "Why do we use driver.quit() at the end of an automated test?",
      diff: "easy",
      tags: ["selenium"],
      answer: `<p class="say">Say this: "It ends the whole session — closes every window and kills the driver process."</p>
<ul>
<li><strong>Frees the machine</strong> — every left-open browser holds memory. On a CI agent running hundreds of tests, that kills it.</li>
<li><strong>Kills chromedriver</strong> — otherwise the process keeps running and holding its port.</li>
<li><strong>Clean state</strong> — cookies and storage don't leak into the next test.</li>
<li><strong>quit() vs close():</strong> <code>close()</code> shuts one window; <code>quit()</code> ends everything. Use <code>close()</code> for a popup, <code>quit()</code> at the end.</li>
<li><strong>Where it goes:</strong> in <code>finally</code> or the teardown hook — never as the last line of the happy path, or a failed test leaves the browser open.</li>
</ul>`,
    },
    {
      id: "b23",
      q: "What is the difference between locators and assertions?",
      diff: "easy",
      tags: ["automation", "theory"],
      answer: `<p class="say">Say this: "Locators find. Assertions judge."</p>
<ul>
<li><strong>Locator</strong> = the address of something on the page. <code>By.id("submit")</code>, <code>getByRole('button')</code>. It's how you interact: find it, click it, type in it.</li>
<li><strong>Assertion</strong> = comparing what you got with what you expected. <code>expect(msg).toBe("Welcome")</code>. It's what makes it pass or fail.</li>
<li>A test with locators and no assertions isn't a test — it just proves the page didn't crash.</li>
<li><strong>Useful when triaging:</strong> a locator failure usually means the UI changed or you didn't wait. An assertion failure usually means a real bug.</li>
<li>Good practice: stable locators like <code>data-testid</code>, and assert on what the user sees, not on internals.</li>
</ul>`,
    },
    {
      id: "b24",
      q: "Which tests are automated?",
      diff: "mid",
      tags: ["strategy", "automation"],
      answer: `<p class="say">Say this: "Anything you'd run again and again the same way."</p>
<ul>
<li><strong>Automate</strong> — regression, smoke, critical journeys like login and checkout, the same flow with 40 sets of data, and API tests (fastest payback, no UI flakiness).</li>
<li><strong>Also</strong> — cross-browser repetition, and performance tests you simply can't do by hand.</li>
<li><strong>Don't automate</strong> — exploratory testing, anything you judge by eye, and features still changing every sprint.</li>
<li><strong>Also don't</strong> — one-off checks, and things you can't drive: CAPTCHA, SMS codes, card readers.</li>
<li><strong>The rule:</strong> automate when how often you run it × how painful it is by hand × the risk beats the cost of writing and <em>maintaining</em> it.</li>
<li>Mention maintenance. People forget a test suite is code with an ongoing cost.</li>
</ul>`,
    },
    {
      id: "b25",
      q: "How do you organise your work as a QA?",
      diff: "easy",
      tags: ["process", "soft-skills"],
      answer: `<p class="say">Say this: describe a real routine, not a philosophy.</p>
<ul>
<li><strong>Start early</strong> — join refinement and read the acceptance criteria. The cheapest bug is a question asked before coding.</li>
<li><strong>Plan per story</strong> — a checklist written while the dev works, linked to the ticket, so you both agree what "done" means.</li>
<li><strong>Order by risk</strong> — payment and login before the footer. If time runs out, say what you cut instead of cutting quietly.</li>
<li><strong>Daily rhythm</strong> — morning: check the nightly run. Then test what's ready. Keep the end of the day for retesting fixes so nothing sits blocked overnight.</li>
<li><strong>Everything on the board</strong> — so anyone can see status without asking you.</li>
<li><strong>Reserve time</strong> each sprint for fixing flaky tests, or the suite rots.</li>
</ul>`,
    },
    {
      id: "b26",
      q: "Which are better — manual or automated tests?",
      diff: "easy",
      tags: ["theory", "strategy"],
      answer: `<p class="say">Say this: "Neither — they answer different questions."</p>
<ul>
<li>Automation is fast and repeats forever. Best for regression, and for running on every commit.</li>
<li>People spot what nobody wrote down. Best for new features and anything you judge by eye.</li>
<li><strong>The line to use:</strong> automation confirms what you already know to check. People discover what nobody thought of.</li>
<li>Automation costs time to write, fix and keep green. It only pays off if you run it often.</li>
<li>So the real answer is a mix: automate the repeatable regression, keep people on the new and uncertain.</li>
</ul>`,
    },
    {
      id: "b27",
      q: "You must have had a lot of challenges in your work — how do you solve them?",
      diff: "mid",
      tags: ["soft-skills", "star"],
      answer: `<p class="say">Say this: a short method, then one real story. The story is what they remember.</p>
<ul>
<li>Understand before reacting — reproduce it, read the logs.</li>
<li>Find the root cause, don't chase every symptom separately.</li>
<li>Bring options and impact; let the PO decide on scope and risk.</li>
<li>Fix it, then prevent it — a regression test or a process change.</li>
<li>Tell people early and in writing. Surprises are the real problem, not bugs.</li>
</ul>
<p><strong>Story shape (STAR):</strong> "Our nightly suite was 30% flaky so the team stopped trusting it. I grouped the failures by error and found three causes: hard-coded sleeps, shared test data, and one genuinely broken endpoint. I fixed the first two and raised a ticket for the third. Flakiness went from 30% to under 3%, and we started blocking merges on the suite again."</p>
<p>Have three ready: a technical one, a people one, and a deadline one.</p>`,
    },
  ],
};
