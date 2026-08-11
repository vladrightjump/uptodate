/* Polls the live site until it serves the commit CI just deployed.

   Triggering a deploy hook only proves the request was accepted — it says
   nothing about whether the build succeeded or reached the domain. This waits
   for proof: /version.json must report EXPECTED_SHA. A build that fails on
   Vercel never swaps the alias, so this times out and fails the pipeline
   instead of leaving a green tick over a broken deploy.

   Env:
     EXPECTED_SHA       required — the commit that must be live
     SITE_URL           required — production origin, no trailing slash
     TIMEOUT_MS         optional — give up after this long (default 300000)
     POLL_INTERVAL_MS   optional — wait between attempts (default 10000)
*/

const expected = (process.env.EXPECTED_SHA || "").trim();
const site = (process.env.SITE_URL || "").trim().replace(/\/+$/, "");
const timeoutMs = Number(process.env.TIMEOUT_MS || 300000);
const intervalMs = Number(process.env.POLL_INTERVAL_MS || 10000);

if (!expected) fail("EXPECTED_SHA is empty.");
if (!site) fail("SITE_URL is empty.");

function fail(message) {
  console.error(`::error::${message}`);
  process.exit(1);
}

const short = (sha) => sha.slice(0, 8);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Cache-busted so we read the edge's current answer, not a stale copy. */
async function fetchVersion() {
  const res = await fetch(`${site}/version.json?ci=${Date.now()}`, {
    cache: "no-store",
    headers: { "cache-control": "no-cache" },
  });
  if (!res.ok) return { error: `HTTP ${res.status}` };
  const text = await res.text();
  try {
    return { version: JSON.parse(text) };
  } catch {
    return { error: "response was not JSON (deploy may be mid-swap)" };
  }
}

console.log(`Waiting for ${short(expected)} on ${site}`);
console.log(
  `Polling /version.json every ${intervalMs / 1000}s, giving up after ${
    timeoutMs / 1000
  }s.`
);

const deadline = Date.now() + timeoutMs;
let attempt = 0;
let live = null;

while (Date.now() < deadline) {
  attempt += 1;
  let result;
  try {
    result = await fetchVersion();
  } catch (err) {
    result = { error: err.message };
  }

  if (result.version?.commit === expected) {
    live = result.version;
    break;
  }

  const seen = result.version?.commit
    ? `live commit is ${short(result.version.commit)}`
    : `no version yet (${result.error})`;
  const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
  console.log(`  attempt ${attempt}: ${seen} — ${left}s left`);

  await sleep(intervalMs);
}

if (!live) {
  fail(
    `Timed out after ${
      timeoutMs / 1000
    }s waiting for ${short(expected)} on ${site}. ` +
      `The Vercel build probably failed — check the deployment logs.`
  );
}

console.log(`Live: commit ${short(live.commit)}, built ${live.builtAt}.`);

/* The whole point of the prebuild hook is that this file ships with the app,
   so a deploy that quietly stopped producing it should fail the pipeline. */
const guide = await fetch(`${site}/QA-Prep-standalone.html?ci=${Date.now()}`, {
  cache: "no-store",
});
if (!guide.ok) {
  fail(`Standalone study guide is missing from the deploy (HTTP ${guide.status}).`);
}

const body = await guide.text();
if (!body.includes("window.__ROUNDS__")) {
  fail("Standalone study guide is served but has no question data in it.");
}

console.log(
  `Standalone study guide is live (${(body.length / 1024).toFixed(0)} KB).`
);
console.log("Deploy verified.");
