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
      answer: `<p class="say">Say this: "The employment table has no last name — only person_id. So I join it to the people table."</p>
<p><strong>How it works</strong></p>
<ul class="clauses">
<li><code>SELECT</code> the columns you want back</li>
<li><code>FROM</code> the table you start from</li>
<li><code>JOIN</code> glues the second table on</li>
<li><code>ON</code> the column the two share</li>
<li><code>WHERE</code> throws away the rows you don't want</li>
</ul>
<ul>
<li><code>INNER JOIN</code> is right — someone with no job shouldn't appear.</li>
<li>Use a parameter, not <code>'Smith'</code> glued into the string. That's the SQL-injection hole.</li>
<li>One person can have several roles. Add <code>DISTINCT</code> if you want people, not rows.</li>
</ul>`,
      solution: [
        {
          lang: "sql",
          caption: "The join",
          src: `SELECT p.first_name, p.last_name    -- what to show
FROM   persons p                    -- start table
JOIN   employment e                 -- add company rows
       ON e.person_id = p.person_id -- how they match
WHERE  p.last_name    = 'Smith'     -- filter people
  AND  e.company_name = 'CompanyA'; -- filter company`,
        },
        {
          lang: "sql",
          caption: "One row per person, even with several roles",
          src: `SELECT DISTINCT p.person_id, p.first_name, p.last_name
FROM   persons p
JOIN   employment e ON e.person_id = p.person_id
WHERE  p.last_name = 'Smith' AND e.company_name = 'CompanyA';`,
        },
      ],
    },
    {
      id: "a2",
      q: "Get all rows where draw_date is after today, from the lottery_draws table.",
      diff: "easy",
      tags: ["sql", "dates"],
      answer: `<p class="say">Say this: "Everything where draw_date is greater than today's date."</p>
<p><strong>How it works</strong></p>
<ul class="clauses">
<li><code>SELECT *</code> every column</li>
<li><code>FROM</code> the table</li>
<li><code>WHERE</code> keep only future rows</li>
<li><code>&gt;</code> strictly after — today itself is out</li>
<li><code>ORDER BY</code> soonest draw first</li>
</ul>
<ul>
<li>Ask the column type. If <code>draw_date</code> is a <strong>DATE</strong>, this is exact.</li>
<li>If it's a <strong>DATETIME</strong>, <code>&gt; CURRENT_DATE</code> also returns draws later <em>today</em>, because that means midnight.</li>
<li>Never write <code>WHERE DATE(draw_date) &gt; ...</code> — wrapping the column in a function kills the index.</li>
</ul>`,
      solution: [
        {
          lang: "sql",
          caption: "Standard SQL / PostgreSQL",
          src: `SELECT *                        -- every column
FROM   lottery_draws            -- the table
WHERE  draw_date > CURRENT_DATE -- strictly after today
ORDER  BY draw_date;            -- soonest first`,
        },
        {
          lang: "sql",
          caption: "Same idea, other engines",
          src: `-- MySQL
WHERE draw_date > CURDATE()

-- SQL Server
WHERE draw_date > CAST(GETDATE() AS date)

-- Oracle
WHERE draw_date > TRUNC(SYSDATE)`,
        },
      ],
    },
    {
      id: "a3",
      q: "Write a SQL query to retrieve dob for first_name = 'John' (dob = date of birth). Main table is users.",
      diff: "easy",
      tags: ["sql"],
      answer: `<p class="say">Say this: "Select dob from users, filtered on first name."</p>
<p><strong>How it works</strong></p>
<ul class="clauses">
<li><code>SELECT</code> the column to return — <code>dob</code></li>
<li><code>FROM</code> the table — <code>users</code></li>
<li><code>WHERE</code> the filter — first name is John</li>
<li><code>=</code> exact match, not a partial one</li>
</ul>
<ul>
<li>This gives <strong>one row per John</strong>. Add a name or id column, or you get a list of dates you can't match to anyone.</li>
<li>In real code the value is a parameter, not text in the query.</li>
<li>Nice extra: date of birth is personal data, so in production access to it is restricted.</li>
</ul>`,
      solution: [
        {
          lang: "sql",
          caption: "As asked",
          src: `SELECT dob                    -- the column to return
FROM   users                  -- the table
WHERE  first_name = 'John';   -- the filter`,
        },
        {
          lang: "sql",
          caption: "What you'd actually run",
          src: `SELECT user_id, first_name, last_name, dob
FROM   users
WHERE  first_name = :first_name   -- parameter, not a literal
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
      answer: `<p class="say">Say this: "It opens Chrome, searches Google for 'Selenium WebDriver', waits for the title to change, prints it, and always closes the browser."</p>
<p><strong>How it works</strong></p>
<ul class="clauses">
<li><code>require</code> pulls in the four tools it needs</li>
<li><code>Builder</code> creates the driver and launches Chrome</li>
<li><code>By</code> holds the ways to find elements</li>
<li><code>Key</code> holds special keys like Enter</li>
<li><code>until</code> holds the conditions you can wait for</li>
<li><code>async</code>/<code>await</code> Selenium returns promises, so we wait for each step</li>
<li><code>get</code> goes to the URL</li>
<li><code>findElement</code> finds the search box by its name attribute</li>
<li><code>sendKeys</code> types the text, then presses Enter</li>
<li><code>wait</code> pauses until the title contains the text, max 5 seconds</li>
<li><code>getTitle</code> reads the title into a variable</li>
<li><code>finally</code> runs even if a step fails</li>
<li><code>quit</code> closes the browser and ends the session</li>
</ul>
<ul>
<li><strong>Spot this:</strong> it only logs the title. No assertion, so it can never fail. It's a script, not a test.</li>
<li><em>Why <code>quit()</code> not <code>close()</code>?</em> <code>close()</code> shuts one window; <code>quit()</code> ends the whole session and kills the driver process.</li>
<li><em>If the element isn't found?</em> <code>findElement</code> throws <code>NoSuchElementError</code>, the rest is skipped, and <code>finally</code> still closes the browser.</li>
</ul>`,
      solution: [
        {
          lang: "js",
          caption: "The same script, annotated",
          src: `// Builder = makes the driver, By = how to find things,
// Key = special keys, until = conditions you can wait for
const { Builder, By, Key, until } = require('selenium-webdriver');

(async function example() {          // async so we can await
  let driver = await new Builder()
    .forBrowser('chrome').build();   // launches Chrome
  try {
    await driver.get('https://www.google.com');        // open the page
    let searchBox = await driver
      .findElement(By.name('q'));                      // find input name="q"
    await searchBox
      .sendKeys('Selenium WebDriver', Key.RETURN);     // type, then Enter
    await driver.wait(
      until.titleContains('Selenium WebDriver'), 5000);// wait, max 5s
    let title = await driver.getTitle();               // read the title
    console.log('Page title is:', title);              // print (no assert!)
  } finally {
    await driver.quit();             // always closes, pass or fail
  }
})();`,
        },
      ],
    },
  ],
};
