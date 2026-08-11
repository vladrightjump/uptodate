/* Builds a single self-contained HTML file from the question data.
   No network, no external assets — open the result straight from disk.

   Usage: node scripts/build-standalone.mjs [outputPath]
*/
import { build } from "esbuild";
import { readFile, writeFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
/* Defaults next to package.json; pass a path to write it elsewhere. */
const out = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(root, "QA-Prep-standalone.html");

/* 1 — compile the TypeScript question bank so we can import it here */
const tmp = resolve(root, "node_modules/.tmp/rounds.mjs");
await build({
  entryPoints: [resolve(root, "src/data/rounds.ts")],
  outfile: tmp,
  bundle: true,
  format: "esm",
  platform: "neutral",
});
const { ROUNDS } = await import(`${tmp}?t=${Date.now()}`);
await rm(tmp, { force: true });

const total = ROUNDS.reduce((n, r) => n + r.questions.length, 0);

/* 2 — read the hand-written css / js */
const css = await readFile(resolve(here, "standalone.css"), "utf8");
const js = await readFile(resolve(here, "standalone.app.js"), "utf8");

/* `</script>` inside the data or the answers would close the tag early */
const data = JSON.stringify(ROUNDS)
  .replace(/</g, "\\u003c")
  .replace(/\u2028/g, "\\u2028")
  .replace(/\u2029/g, "\\u2029");

const built = new Date().toLocaleDateString("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const html = `<!doctype html>
<html lang="en" data-night="off">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>QA Interview Prep</title>
<meta name="description" content="${total} QA interview questions in four rounds, with model answers.">
<style>
${css}
</style>
</head>
<body>

<header class="masthead">
  <div class="masthead-inner">
    <div class="logo">
      <h1>QA Interview Prep</h1>
      <p>${total} questions &middot; four rounds &middot; model answers</p>
    </div>
    <div class="masthead-tools">
      <div class="field">
        <input id="search" type="search" placeholder="Search every question and answer" aria-label="Search questions and answers">
      </div>
      <div class="tool-group">
        <span class="kicker">Level</span>
        <button class="tool" data-diff="all" aria-pressed="true">all</button>
        <button class="tool" data-diff="easy" aria-pressed="false">easy</button>
        <button class="tool" data-diff="mid" aria-pressed="false">medium</button>
        <button class="tool" data-diff="hard" aria-pressed="false">hard</button>
      </div>
      <div class="tool-group">
        <button class="tool" id="hide-known">hide known</button>
        <button class="tool" id="expand">expand all</button>
        <button class="tool" id="night">night</button>
      </div>
    </div>
  </div>
</header>

<div class="wrap">
  <nav class="contents" aria-label="Contents">
    <span class="kicker">Contents</span>
    <ol id="toc"></ol>
    <p class="contents-foot" id="tally"></p>
    <div class="keys">
      <kbd>/</kbd> search &nbsp; <kbd>1</kbd>–<kbd>4</kbd> round<br>
      <kbd>e</kbd> expand all &nbsp; <kbd>n</kbd> night
    </div>
  </nav>

  <main>
    <div class="round-head" id="round-head"></div>
    <ol class="entries" id="entries"></ol>
  </main>
</div>

<footer class="colophon">
  <hr>
  Compiled ${built} &middot; answers are prompts for rehearsal, not scripts to recite &middot;
  progress is stored in this browser only.
</footer>

<script>window.__ROUNDS__ = ${data};</script>
<script>
${js}
</script>
</body>
</html>
`;

await writeFile(out, html, "utf8");
console.log(
  `wrote ${out} — ${total} questions, ${(html.length / 1024).toFixed(0)} KB`
);
