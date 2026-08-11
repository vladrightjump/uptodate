# QA Interview Questions — Source Content

Raw question bank for the redesigned app. Grouped by interview round.

---

## Round A — SQL + Code Reading

### SQL Task 1 — Join people to companies

Table: `employment` (links people to companies)

| employment_id | person_id | company_name | role     |
|---------------|-----------|--------------|----------|
| 1             | 1         | CompanyA     | Manager  |
| 2             | 2         | OtherCo      | Analyst  |
| 3             | 3         | CompanyA     | Engineer |

**Goal:** Retrieve all people with a specific last name who work at company `CompanyA`.

### SQL Task 2 — Future draws

Get all rows where `draw_date` is after today, from the `lottery_draws` table.

### SQL Task 3 — Date of birth lookup

Write a SQL query to retrieve `dob` for `first_name = 'John'` (`dob` = date of birth). Main table is `users`.

### Code Explanation — Selenium WebDriver

Explain every line of code — what it is doing:

```js
const { Builder, By, Key, until } = require('selenium-webdriver');

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
})();
```

---

## Round B — Full Interview (27 questions)

1. Introduce yourself — how many years have you worked as a QA, and on what projects?
2. What is your current project and your role in it?
3. What is the structure of your team?
4. What kind of testing do you do — manual, automated?
5. Have you done accessibility testing?
6. Do you do functional and non-functional testing?
7. How would you open a bug for a broken link on the login page of a mobile application?
8. If you test a functionality for 7 days in its web version, how long would it take you in its mobile version — less, more?
9. If application A is in production and application B is in pre-production, but there is no documentation for it — yet it has the same functionality as application A — how would you test application B?
10. Describe the difference between unit, integration, and end-to-end testing.
11. What CI/CD tools have you used?
12. What is BDD?
13. If the developer says that something is not a bug, what would you do?
14. For a sample login page with fields for email, password, buttons, and a checkbox — describe what tests you would write.
15. For a sample web page with a game for money from CompanyA, what tests would you write? (They show the page on screen and navigate through it.)
16. To select the date of birth for a specific person's name from a given table in a database, what query would you write?
17. To select a name from one table and a salary from another table, what query would you write? (A join is made between the two tables.)
18. With which type of request to the server is data updated?
19. What is the difference between GET, PUT, and POST requests?
20. On a login page, describe a condition under which you would get a server error, and one where you would get a front-end error.
21. What does this piece of code do? (Automated test with browser initialization, one button interaction, and browser close.)
22. Why do we use `driver.quit()` at the end of an automated test?
23. What is the difference between locators and assertions?
24. Which tests are automated?
25. How do you organize your work as a QA?
26. Which are better — manual or automated tests?
27. You must have had a lot of challenges in your work — how do you solve them?

---

## Round C — SQL, Code Review, Test Design

1. **SQL task:** Get all birth dates from users with the same first name from a table, i.e.
   ```sql
   SELECT DOB FROM Users WHERE first_name = 'John';
   ```
2. **Code to review and explain:** It opens a page, searches for an element, and asserts whether the element is present.
   *Follow-up:* What does the shown query/request do, and what would happen if the element cannot be located?
3. **Login task:** For which fields can you do a check on the front end, and for which on the back end? Which checks would you verify twice (FE and BE)?
4. **Payment task:** If you are allowed to do only one test, which one would it be?
5. **Generic:** In what direction would you choose to develop yourself further — manual, automation, or hybrid?

---

## Round D — Mobile Testing Focus

1. What tests would you perform on mobile applications?
2. You have a web application and a mobile application with the same core functionalities. What additional tests would you do on the mobile app?
3. What tests would you write for a form on a page with:
   - First name field
   - Last name field
   - Gender (radio buttons) — optional
   - Date of birth (hardcoded)
   - Address
   - Buttons: Save, Cancel
4. What tests for this form should be performed if you open it on a mobile app?
5. What are the types of compatibility tests?
