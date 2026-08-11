import type { Round } from "../types";

export const ROUND_A: Round = {
  id: "round-a",
  label: "Round A — SQL & Code Reading",
  desc: "Three SQL tasks and a line-by-line walkthrough of a Selenium script",
  questions: [
    {
      id: "a1",
      q: "Retrieve all people with a specific last name who work at company \"CompanyA\".",
      diff: "mid",
      tags: ["sql", "join"],
      table: {
        caption: "employment — links people to companies",
        columns: ["employment_id", "person_id", "company_name", "role"],
        rows: [
          ["1", "1", "CompanyA", "Manager"],
          ["2", "2", "OtherCo", "Analyst"],
          ["3", "3", "CompanyA", "Engineer"],
        ],
      },
      answer: `<p>The <code>employment</code> table has no last name — it only has <code>person_id</code>. So this needs a <strong>join</strong> back to the people table (call it <code>persons</code> / <code>people</code> / <code>users</code> — say the name out loud and ask if you're unsure; interviewers like that you noticed the table wasn't given).</p>
<p><strong>Say this first:</strong> "I need two tables — employment gives me the company, the persons table gives me the last name. I'll join them on <code>person_id</code>."</p>
<p>Notes worth mentioning:</p>
<ul>
<li><code>INNER JOIN</code> is correct here — a person with no employment row shouldn't appear.</li>
<li>Filter values belong in <strong>parameters</strong> (<code>:last_name</code>), not string-concatenated — that's the SQL-injection point on a login/search form.</li>
<li>If names may differ in case or have trailing spaces: <code>WHERE LOWER(TRIM(p.last_name)) = LOWER(:last_name)</code>.</li>
<li>One person can have several employment rows — add <code>DISTINCT</code> if you only want the people, not the roles.</li>
</ul>`,
      solution: [
        {
          lang: "sql",
          caption: "The join",
          src: `SELECT p.person_id,
       p.first_name,
       p.last_name,
       e.company_name,
       e.role
FROM   persons p
JOIN   employment e ON e.person_id = p.person_id
WHERE  p.last_name  = 'Smith'
  AND  e.company_name = 'CompanyA';`,
        },
        {
          lang: "sql",
          caption: "Distinct people only (person may hold several roles)",
          src: `SELECT DISTINCT p.person_id, p.first_name, p.last_name
FROM   persons p
JOIN   employment e ON e.person_id = p.person_id
WHERE  p.last_name  = 'Smith'
  AND  e.company_name = 'CompanyA';`,
        },
      ],
    },
    {
      id: "a2",
      q: "Get all rows where draw_date is after today, from the lottery_draws table.",
      diff: "easy",
      tags: ["sql", "dates"],
      answer: `<p>"After today" means strictly greater than today's date. The trap is the <strong>data type</strong>:</p>
<ul>
<li>If <code>draw_date</code> is a <strong>DATE</strong>, <code>&gt; CURRENT_DATE</code> is exactly right.</li>
<li>If it is a <strong>DATETIME / TIMESTAMP</strong>, <code>&gt; CURRENT_DATE</code> would also return draws later <em>today</em> (e.g. 20:00 tonight), because <code>CURRENT_DATE</code> is midnight. Decide which you want and say so.</li>
<li>Beware time zones — the DB server's "today" may not be the user's "today". <code>CURRENT_DATE</code> is evaluated on the server.</li>
</ul>
<p>Also mention: <strong>don't wrap the column in a function</strong> (<code>WHERE DATE(draw_date) &gt; ...</code>) — that kills the index on <code>draw_date</code> and forces a full scan.</p>`,
      solution: [
        {
          lang: "sql",
          caption: "ANSI SQL / PostgreSQL",
          src: `SELECT *
FROM   lottery_draws
WHERE  draw_date > CURRENT_DATE
ORDER  BY draw_date ASC;`,
        },
        {
          lang: "sql",
          caption: "Dialect variants",
          src: `-- MySQL
SELECT * FROM lottery_draws WHERE draw_date > CURDATE();

-- SQL Server
SELECT * FROM lottery_draws WHERE draw_date > CAST(GETDATE() AS date);

-- Oracle
SELECT * FROM lottery_draws WHERE draw_date > TRUNC(SYSDATE);

-- Datetime column, want strictly tomorrow onward (Postgres)
SELECT * FROM lottery_draws
WHERE  draw_date >= CURRENT_DATE + INTERVAL '1 day';`,
        },
      ],
    },
    {
      id: "a3",
      q: "Write a SQL query to retrieve dob for first_name = 'John' (dob = date of birth). Main table is users.",
      diff: "easy",
      tags: ["sql"],
      answer: `<p>The simplest question in the set — the point is whether you write it cleanly and say something intelligent around it.</p>
<p>Things to add after you write it:</p>
<ul>
<li>This returns <strong>one row per John</strong>, not one row. Select an identifying column too, otherwise the result is a list of dates you can't attribute to anyone.</li>
<li>Comparison is case-sensitive in some engines (Postgres) and not in others (MySQL with a <code>ci</code> collation). Use <code>UPPER()</code>/<code>ILIKE</code> if that matters.</li>
<li>In real code it would be a bound parameter, not a literal.</li>
<li>DOB is personal data — mention that in a real system access to it is restricted / masked (nice signal on a QA interview).</li>
</ul>`,
      solution: [
        {
          lang: "sql",
          caption: "As asked",
          src: `SELECT dob
FROM   users
WHERE  first_name = 'John';`,
        },
        {
          lang: "sql",
          caption: "What you'd actually run",
          src: `SELECT user_id, first_name, last_name, dob
FROM   users
WHERE  first_name = 'John'
ORDER  BY last_name;`,
        },
      ],
    },
    {
      id: "a4",
      q: "Explain every line of this Selenium WebDriver script — what is each line doing?",
      diff: "mid",
      tags: ["selenium", "code-reading"],
      prompt: {
        lang: "js",
        src: `const { Builder, By, Key, until } = require('selenium-webdriver');

(async function example() {
  let driver = await new Builder().forBrowser('chrome').build();
  try {
    await driver.get('https://www.google.com');
    let searchBox = await driver.findElement(By.name('q'));
    await searchBox.sendKeys('Selenium WebDriver', Key.RETURN);
    await driver.wait(until.titleContains('Selenium WebDriver'), 5000);
    let title = await driver.getTitle();
    console.log('Page title is:', title);
  } finally {
    await driver.quit();
  }
})();`,
      },
      answer: `<p><strong>What the script does overall:</strong> opens Chrome, goes to Google, types "Selenium WebDriver" into the search box, presses Enter, waits up to 5 seconds for the page title to contain that text, prints the title, and closes the browser — whatever happened.</p>
<p><strong>Line by line:</strong></p>
<ol>
<li><code>const { Builder, By, Key, until } = require('selenium-webdriver');</code> — imports four things from the Selenium package by destructuring: <code>Builder</code> creates the driver, <code>By</code> holds the locator strategies (<code>By.id</code>, <code>By.css</code>, <code>By.name</code>…), <code>Key</code> holds special keyboard keys (Enter, Tab, Escape), <code>until</code> holds the ready-made expected conditions used with explicit waits.</li>
<li><code>(async function example() { … })();</code> — an <strong>IIFE</strong> (immediately-invoked function expression) declared <code>async</code>. Selenium's JS API is promise-based, so we need an async context to use <code>await</code>; the trailing <code>()</code> runs it straight away.</li>
<li><code>let driver = await new Builder().forBrowser('chrome').build();</code> — builds the WebDriver session: <code>forBrowser('chrome')</code> picks the browser, <code>build()</code> starts ChromeDriver and launches a fresh Chrome instance. <code>driver</code> is the handle used for everything afterwards.</li>
<li><code>try { … } finally { … }</code> — everything that can fail goes in <code>try</code>; the <code>finally</code> block runs whether the test passes or throws. This is the pattern that guarantees the browser is closed.</li>
<li><code>await driver.get('https://www.google.com');</code> — navigates to the URL and waits for the document load event.</li>
<li><code>let searchBox = await driver.findElement(By.name('q'));</code> — finds the first element whose <code>name</code> attribute is <code>q</code> (Google's search input) and returns a <strong>WebElement</strong> reference. If nothing matches, it throws <code>NoSuchElementError</code>.</li>
<li><code>await searchBox.sendKeys('Selenium WebDriver', Key.RETURN);</code> — types the text into that input and then sends the Enter key, which submits the search. Two arguments = two things typed in sequence.</li>
<li><code>await driver.wait(until.titleContains('Selenium WebDriver'), 5000);</code> — an <strong>explicit wait</strong>: poll until the page title contains the string, giving up after 5000 ms with a <code>TimeoutError</code>. This is the synchronisation point — without it the next line could read the old title.</li>
<li><code>let title = await driver.getTitle();</code> — reads the current page title into a variable.</li>
<li><code>console.log('Page title is:', title);</code> — prints it. Note this is only logging — <strong>there is no assertion in this script</strong>, so strictly it's a script, not a test. Good thing to point out.</li>
<li><code>await driver.quit();</code> — closes every window of the session and kills the ChromeDriver process, releasing the port and profile. Being in <code>finally</code> means no orphaned browsers even when a step fails.</li>
</ol>
<p><strong>Follow-ups they usually ask:</strong></p>
<ul>
<li><em>Why <code>quit()</code> and not <code>close()</code>?</em> — <code>close()</code> closes only the current window and leaves the session (and process) alive; <code>quit()</code> ends the whole session.</li>
<li><em>How would you improve it?</em> — add a real assertion instead of <code>console.log</code>, move the locator into a Page Object, avoid a hard-coded site, and don't mix implicit and explicit waits.</li>
<li><em>What if the element isn't found?</em> — <code>findElement</code> throws <code>NoSuchElementError</code> immediately, the <code>try</code> block aborts, <code>finally</code> still quits the driver, and the process exits with the unhandled rejection.</li>
</ul>`,
    },
  ],
};
