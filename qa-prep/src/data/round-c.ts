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
      answer: `<p class="say">Say this: "Select the birth date, filtered on first name."</p>
<p><strong>How it works</strong></p>
<ul class="clauses">
<li><code>SELECT</code> the column to return</li>
<li><code>FROM</code> the table</li>
<li><code>WHERE</code> the filter</li>
<li><code>ORDER BY</code> so the result is always in the same order</li>
</ul>
<ul>
<li>Add an id or last name too, or you get dates you can't match to anyone.</li>
<li>Notice the wording. If they mean "find first names <em>shared</em> by several users", that's <code>GROUP BY … HAVING COUNT(*) &gt; 1</code>. Offering both shows you spotted the ambiguity.</li>
</ul>`,
      solution: [
        {
          lang: "sql",
          caption: "As asked, then the grouped version",
          src: `SELECT DOB                        -- the column
FROM   Users                      -- the table
WHERE  first_name = 'John';       -- the filter

-- with identity and a stable order
SELECT user_id, first_name, last_name, DOB
FROM   Users
WHERE  first_name = :first_name
ORDER  BY DOB;

-- first names that more than one user shares
SELECT first_name, COUNT(*) AS people  -- name + how many
FROM   Users
GROUP  BY first_name                   -- one row per name
HAVING COUNT(*) > 1;                   -- keep only duplicates`,
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
      answer: `<p class="say">Say this: "It opens the page, finds one element, and asserts it's visible."</p>
<p><strong>How it works</strong></p>
<ul class="clauses">
<li><code>get</code> opens the page</li>
<li><code>findElement</code> finds the first match for the locator</li>
<li><code>By.css</code> the locator — here, an id</li>
<li><code>isDisplayed</code> checks it's actually visible, not just present</li>
<li><code>assert.ok</code> passes or fails the test</li>
</ul>
<p><strong>Spot the difference:</strong> <code>findElement</code> only proves the element is in the page. <code>isDisplayed()</code> proves a user can see it. Something can exist but be hidden or covered — a common false pass.</p>
<p><strong>If it can't be found</strong> — the follow-up they're really asking:</p>
<ul>
<li><code>findElement</code> throws <code>NoSuchElementError</code> straight away. The assertion never runs.</li>
<li>It's reported as an <strong>error</strong>, not a clean failure: "Unable to locate element" instead of "expected banner to be visible". Less useful for whoever triages it.</li>
<li><strong>Why it might be missing:</strong> it really isn't there (a bug), the page hasn't rendered yet (most common), the locator broke, it's inside an iframe, or you're on a different page than you think.</li>
</ul>
<p><strong>How you'd fix the script:</strong> wait for the element instead of assuming; to assert <em>absence</em> use <code>findElements</code> (plural) which returns an empty list instead of throwing; screenshot on failure.</p>`,
      solution: [
        {
          lang: "js",
          caption: "The same check, made reliable",
          src: `// wait up to 5s instead of failing on a slow render
await driver.wait(
  until.elementLocated(By.css('#promo-banner')), 5000);

let banner = await driver.findElement(By.css('#promo-banner'));
assert.ok(await banner.isDisplayed(), 'Promo banner should be visible');

// to assert something is ABSENT, use findElements — it returns
// an empty array instead of throwing
const found = await driver.findElements(By.css('#promo-banner'));
assert.equal(found.length, 0, 'Banner should not be shown');`,
        },
      ],
    },
    {
      id: "c3",
      q: "Login task: which fields can be checked on the front end, which on the back end, and which would you verify twice (FE and BE)?",
      diff: "hard",
      tags: ["test-design", "security"],
      answer: `<p class="say">Say this: "The front end is for speed and comfort. The back end is for safety. Anything checked only in the browser isn't really checked."</p>
<ul>
<li><strong>Front end only</strong> — "this field is required", email format hints as you type, password strength meter, trimming spaces, disabling the button. Pure comfort, zero security value.</li>
<li><strong>Back end only</strong> — is the password right, does the account exist, is it locked, what is this user allowed to see, rate limiting after failed attempts, issuing and expiring the session. The browser can't be trusted with any of it.</li>
<li><strong>Both</strong> — required fields, email format, min and max length, and dangerous characters. The browser for instant feedback, the server because a request can skip the browser entirely.</li>
<li><strong>Why both:</strong> anyone can send the request straight from Postman and never see your form.</li>
<li><strong>How you test it:</strong> do the normal UI pass, then bypass the UI — send the request with empty, over-long, or injection values and check the server answers 400 or 401. If it accepts what the form forbids, that's a finding.</li>
<li><strong>One more:</strong> the two layers must agree. A form that allows 8 characters while the server demands 10 gives an error nobody can understand.</li>
</ul>`,
    },
    {
      id: "c4",
      q: "Payment task: if you were allowed only one test, which one would it be?",
      diff: "hard",
      tags: ["test-design", "risk"],
      answer: `<p class="say">Say this: "One real payment, end to end, verified all the way to the money."</p>
<ul>
<li>Valid card → order placed → payment authorised → confirmation on screen <em>and</em> the right amount recorded in the database.</li>
<li><strong>Why:</strong> it's the path every paying customer takes, it earns the revenue, and it touches the most parts — UI, backend, payment provider, database, email.</li>
<li>A broken edge case costs some users. A broken happy path costs all of them.</li>
<li><strong>Name what you're giving up</strong> — that's what they're checking: declined cards, double charging, 3-D Secure, refunds, currency rounding, timeouts.</li>
<li><strong>Defensible alternative:</strong> if the happy path is already proven by live traffic, pick "the customer is charged exactly once" — a double charge costs money, trust and possibly a regulator.</li>
<li><strong>Name the assertion, not just the flow:</strong> not "the confirmation page appeared", but "the amount charged equals the order total, there is exactly one transaction, and the order says Paid".</li>
</ul>`,
    },
    {
      id: "c5",
      q: "In what direction would you choose to develop yourself further — manual, automation, or hybrid?",
      diff: "easy",
      tags: ["soft-skills", "career"],
      answer: `<p class="say">Say this: "Hybrid" — but only if you explain why, or it sounds like dodging.</p>
<ul>
<li>Automation without testing skill builds a big suite that checks the wrong things.</li>
<li>Testing skill without automation doesn't scale past a few releases.</li>
<li>The valuable engineer decides <em>what</em> is worth testing, then automates the part that pays back. Two halves of one job.</li>
<li><strong>Get specific:</strong> what you're learning now, what you're keeping sharp on the manual side, and where you want to be in two years.</li>
<li>If the role is clearly one or the other, align honestly — but keep the reasoning: "mainly automation, while staying hands-on with exploratory testing, because that's what tells me which tests are worth writing."</li>
</ul>`,
    },
  ],
};
