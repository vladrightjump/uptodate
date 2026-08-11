import type { Round } from "../types";

export const ROUND_C: Round = {
  id: "round-c",
  label: "Round C — SQL, Code Review, Test Design",
  desc: "A query, a script to critique, and two design questions about where checks belong",
  questions: [
    {
      id: "c1",
      q: "Get all birth dates from users with the same first name from a table.",
      diff: "easy",
      tags: ["sql"],
      answer: `<p>The literal answer is the query below — but notice the wording: "<em>all</em> birth dates from users with the <em>same</em> first name". That's a list of rows, so say what you'd add:</p>
<ul>
<li>Select an identifying column as well — a bare list of dates can't be attributed to anyone.</li>
<li><code>ORDER BY</code> so results are deterministic; without it the engine may return rows in any order, which matters if you're comparing outputs between environments.</li>
<li>If they mean "find first names shared by more than one user", that's a <code>GROUP BY … HAVING COUNT(*) &gt; 1</code> — worth offering, it shows you thought about the ambiguity.</li>
</ul>`,
      solution: [
        {
          lang: "sql",
          caption: "As asked",
          src: `SELECT DOB
FROM   Users
WHERE  first_name = 'John';`,
        },
        {
          lang: "sql",
          caption: "More useful forms",
          src: `-- with identity and stable ordering
SELECT user_id, first_name, last_name, DOB
FROM   Users
WHERE  first_name = :first_name
ORDER  BY DOB;

-- first names shared by more than one user
SELECT first_name, COUNT(*) AS people
FROM   Users
GROUP  BY first_name
HAVING COUNT(*) > 1
ORDER  BY people DESC;

-- everyone whose first name is shared with someone else
SELECT u.first_name, u.last_name, u.DOB
FROM   Users u
JOIN  (SELECT first_name
       FROM   Users
       GROUP  BY first_name
       HAVING COUNT(*) > 1) d ON d.first_name = u.first_name
ORDER  BY u.first_name;`,
        },
      ],
    },
    {
      id: "c2",
      q: "Review and explain a script that opens a page, searches for an element, and asserts whether the element is present. Follow-up: what does the shown request do, and what happens if the element can't be located?",
      diff: "mid",
      tags: ["code-reading", "automation"],
      prompt: {
        lang: "js",
        caption: "Typical shape of what's shown",
        src: `await driver.get('https://example.com/products');

let banner = await driver.findElement(By.css('#promo-banner'));
assert.ok(await banner.isDisplayed(), 'Promo banner should be visible');`,
      },
      answer: `<p><strong>What it does:</strong> navigates to the page, looks for a single element matching the locator, and asserts that it is displayed. Setup → locate → assert. Note the difference between <em>present in the DOM</em> and <em>visible to the user</em>: <code>findElement</code> only proves the first; <code>isDisplayed()</code> is what proves the second. Elements can exist with <code>display:none</code>, zero size, or behind an overlay — a very common source of false passes.</p>

<p><strong>What happens if the element can't be located</strong> — the important follow-up:</p>
<ul>
<li><code>findElement</code> throws <strong><code>NoSuchElementException</code> / <code>NoSuchElementError</code></strong> immediately (or after the implicit-wait timeout, if one is set). The assertion line never runs.</li>
<li>The test is reported as an <strong>error</strong>, not a clean assertion failure — the message is "no such element: Unable to locate element" rather than "expected banner to be visible". Less informative for whoever triages it.</li>
<li>Everything after it in the test is skipped; teardown still runs if <code>quit()</code> is in a <code>finally</code>/hook.</li>
</ul>

<p><strong>Why it might not be found</strong> — the triage list: the element genuinely isn't there (real bug); the page hasn't finished rendering yet (timing — the most common cause); the locator broke because the markup changed; the element is inside an <code>&lt;iframe&gt;</code> and you haven't switched to it; it's inside a shadow DOM; a different environment/feature flag/user role doesn't show it; or the app is on a different page than you assumed (redirect to login).</p>

<p><strong>How I'd improve the script:</strong></p>
<ul>
<li>Use an <strong>explicit wait</strong> — <code>await driver.wait(until.elementLocated(By.css('#promo-banner')), 5000)</code> — so a slow render doesn't fail the test. Never mix implicit and explicit waits, and never use <code>sleep</code>.</li>
<li>To assert <strong>absence</strong>, don't use <code>findElement</code> inside a try/catch — use <code>findElements</code> (plural), which returns an empty array instead of throwing: <code>assert.equal((await driver.findElements(By.css('#promo-banner'))).length, 0)</code>.</li>
<li>Add a meaningful assertion message so a failure is self-explanatory in the CI log.</li>
<li>Move the locator into a Page Object; prefer <code>data-testid</code> over structural CSS/XPath.</li>
<li>Capture a screenshot on failure — makes triage a five-second job.</li>
</ul>

<p>If the "request" they show is an HTTP call rather than a locator, describe it in the same way: method + endpoint + payload, the expected status code and response body, and what you'd verify (status, schema, values, authorisation, response time, and the resulting state in the database).</p>`,
    },
    {
      id: "c3",
      q: "Login task: which fields can be checked on the front end, which on the back end, and which would you verify twice (FE and BE)?",
      diff: "hard",
      tags: ["test-design", "security"],
      answer: `<p>The principle first: <strong>front-end validation exists for user experience; back-end validation exists for security and data integrity.</strong> Anything checked only on the client is not really checked — a user can bypass the UI entirely with curl or dev tools.</p>

<p><strong>Front end only (UX, no security value):</strong></p>
<ul>
<li>Required-field prompts and inline "please fill this in" messages.</li>
<li>Email <em>format</em> hints as you type, password strength meter, character counter.</li>
<li>Trimming whitespace, disabling the submit button until the form is complete, show/hide password toggle.</li>
<li>Purpose: instant feedback, fewer pointless round trips.</li>
</ul>

<p><strong>Back end only (the client cannot possibly do these):</strong></p>
<ul>
<li><strong>Credential verification</strong> — does this password match the stored hash?</li>
<li>Account state: exists, active, locked, email verified, not deleted.</li>
<li>Authorisation and roles; what this user is allowed to see next.</li>
<li>Rate limiting / brute-force lockout; CAPTCHA verification.</li>
<li>Session and token issuance, expiry, invalidation on logout.</li>
<li>Duplicate-account checks against the database; audit logging.</li>
<li>Anything involving secrets or other users' data — never expose it to the client.</li>
</ul>

<p><strong>Verified twice (defence in depth) — the real answer to the question:</strong></p>
<ul>
<li><strong>Required fields</strong> — client for speed, server because a crafted request can omit them.</li>
<li><strong>Email format</strong> — client for feedback, server because a malformed address must never reach the database.</li>
<li><strong>Length limits (min/max)</strong> — client to stop typing, server to prevent oversized payloads and buffer/DoS issues.</li>
<li><strong>Character set / injection payloads</strong> — client filtering is a convenience; the server must sanitise and use parameterised queries. This is the classic one.</li>
<li><strong>Any business rule</strong> (allowed domains, terms accepted) — both sides, and the two must agree.</li>
</ul>

<p><strong>How I'd test it:</strong> do the normal UI pass, then bypass the UI — send the request directly from Postman with the fields empty, over-long, or containing <code>' OR '1'='1</code> and <code>&lt;script&gt;</code>, and confirm the server rejects it with a proper 400/401 rather than a 500 or, worse, a success. If the server accepts what the UI forbids, that's a finding regardless of how good the front end looks.</p>
<p>One more point worth making: the two layers must not <em>contradict</em> each other — a front end that allows 8 characters while the server requires 10 produces an error the user can't understand.</p>`,
    },
    {
      id: "c4",
      q: "Payment task: if you were allowed only one test, which one would it be?",
      diff: "hard",
      tags: ["test-design", "risk"],
      answer: `<p>Pick the <strong>end-to-end happy path of a real payment, verified all the way to the money</strong>: a valid card, a real order, payment authorised, order confirmed in the UI <em>and</em> recorded correctly in the database/payment provider, with the correct amount and currency.</p>
<p><strong>Justify it by risk:</strong> if only one test can run, it has to cover the path that (a) every paying customer takes, (b) generates the revenue, and (c) touches the most components — UI, backend, payment gateway, database, confirmation email. It's the single test whose failure means "stop the release". A broken edge case costs some users; a broken happy path costs all of them.</p>
<p><strong>Say what you're consciously giving up</strong> — that's what they're checking:</p>
<ul>
<li>Declined cards, expired cards, insufficient funds.</li>
<li>Double-charging on double-click or refresh (the defect that hurts most, but it's second because it affects fewer users than a completely broken checkout).</li>
<li>3-D Secure / SCA challenge flows.</li>
<li>Refunds, partial payments, currency and rounding edge cases.</li>
<li>Timeout mid-transaction and reconciliation afterwards.</li>
</ul>
<p><strong>A defensible alternative</strong>, and worth offering: if the happy path is already proven by production traffic, the one test becomes <em>"the customer is charged exactly once"</em> — because a duplicate charge is the failure that costs money, trust and possibly a regulator's attention, and it's the one no user will forgive.</p>
<p>Finish by naming the assertion, not just the flow: not "the confirmation page appeared", but "the amount charged equals the order total, exactly one transaction exists, and the order status is Paid".</p>`,
    },
    {
      id: "c5",
      q: "In what direction would you choose to develop yourself further — manual, automation, or hybrid?",
      diff: "easy",
      tags: ["soft-skills", "career"],
      answer: `<p><strong>Hybrid</strong> is the honest and the strongest answer — but only if you explain why rather than hedging.</p>
<p>The reasoning: automation without testing skill produces a large suite that checks the wrong things; manual skill without automation doesn't scale past a few releases. The valuable engineer decides <em>what</em> is worth testing (risk analysis, test design, exploratory instinct) and then <em>automates</em> the part that pays back. Those are two halves of one job.</p>
<p>Then get specific, because "hybrid" alone sounds like avoiding the question:</p>
<ul>
<li>Where you're investing right now — e.g. "deepening Playwright + TypeScript, and moving more coverage down from UI to API level."</li>
<li>What you're deliberately keeping sharp on the manual side — exploratory technique, risk-based test design, accessibility.</li>
<li>Where you want to be in 2–3 years — e.g. owning test strategy for a product, or QA lead, or SDET.</li>
</ul>
<p>If the role is clearly one or the other, align with it honestly rather than giving a diplomatic non-answer — but keep the reasoning: "primarily automation, while staying hands-on with exploratory testing, because that's what tells me which tests are worth automating."</p>`,
    },
  ],
};
