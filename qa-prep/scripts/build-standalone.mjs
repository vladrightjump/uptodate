/* Builds a single self-contained HTML file from the React app.

   The app, React itself, the styles and the question data are all bundled
   and inlined, so the result opens straight from disk with no network and
   no external assets. There is only one implementation of the UI — this
   file ships exactly what the deployed site runs.

   Usage: node scripts/build-standalone.mjs [outputPath]
*/
import { build } from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
/* Defaults next to package.json; pass a path to write it elsewhere. */
const out = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(root, "QA-Prep-standalone.html");

/* 1 — count the questions so the page (and CI) can assert the data shipped */
const probe = await build({
  entryPoints: [resolve(root, "src/data/rounds.ts")],
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
});
const dataUrl =
  "data:text/javascript;base64," +
  Buffer.from(probe.outputFiles[0].text).toString("base64");
const { ROUNDS, TOTAL_QUESTIONS } = await import(dataUrl);

/* 2 — bundle the real app: React, components, styles and data in one go */
const bundle = await build({
  entryPoints: [resolve(root, "src/main.tsx")],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  minify: true,
  jsx: "automatic",
  /* Fonts become data: URIs so the file carries its own typography and needs
     no network — which is also all the standalone's CSP allows. */
  loader: { ".css": "css", ".woff2": "dataurl" },
  define: { "process.env.NODE_ENV": '"production"' },
  write: false,
  outdir: resolve(root, "node_modules/.tmp/standalone"),
});

const js = bundle.outputFiles.find((f) => f.path.endsWith(".js"))?.text ?? "";
const css = bundle.outputFiles.find((f) => f.path.endsWith(".css"))?.text ?? "";
if (!js) throw new Error("esbuild produced no JS for the standalone build");

/* A literal `</script` inside a string would close the tag early. Escaping the
   slash is inert in JS ("<\/script" === "</script"), so the bundle still runs. */
const safeJs = js.replace(/<\/script/gi, "<\\/script");

const built = new Date().toLocaleDateString("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#fbf6ef">
<title>QA Interview Prep</title>
<meta name="description" content="${TOTAL_QUESTIONS} QA interview questions in ${ROUNDS.length} rounds, with model answers.">
<!-- CI asserts this is present and non-zero, i.e. the build really shipped data. -->
<meta name="qa-prep:questions" content="${TOTAL_QUESTIONS}">
<meta name="qa-prep:built" content="${built}">
<style>
${css}
</style>
</head>
<body>
<div id="root"></div>
<script>
${safeJs}
</script>
</body>
</html>
`;

/* The target directory may not exist — git does not track empty ones. */
await mkdir(dirname(out), { recursive: true });
await writeFile(out, html, "utf8");
console.log(
  `wrote ${out} — ${TOTAL_QUESTIONS} questions, ${(html.length / 1024).toFixed(0)} KB`
);
