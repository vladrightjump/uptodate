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

/* Node's fetch has no default timeout. Without this, an edge that accepts the
   connection and then hangs leaves the await pending forever: the polling loop
   never re-checks its deadline, TIMEOUT_MS is silently not honoured, and the
   job dies on the workflow timeout with no useful diagnostic. */
const PER_REQUEST_MS = 15_000;

/* Cache-busted so we read the edge's current answer, not a stale copy. */
async function fetchVersion() {
  const res = await fetch(`${site}/version.json?ci=${Date.now()}`, {
    cache: "no-store",
    headers: { "cache-control": "no-cache" },
    signal: AbortSignal.timeout(PER_REQUEST_MS),
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

/* This file ships with the app, so a deploy that quietly stopped producing it
   should fail the pipeline. The app is bundled, so rather than grep for an
   internal symbol the build stamps a count in a meta tag and we assert it. */
let guide;
try {
  guide = await fetch(`${site}/QA-Prep-standalone.html?ci=${Date.now()}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(PER_REQUEST_MS),
  });
} catch (err) {
  fail(`Could not fetch the standalone study guide: ${err.message}`);
}
if (!guide.ok) {
  fail(`Standalone study guide is missing from the deploy (HTTP ${guide.status}).`);
}

/* Reading the body is still covered by the same AbortSignal, so a deploy whose
   headers arrive just under the timeout and whose body then stalls rejects
   here. Outside a try that surfaced as a raw stack trace instead of the
   ::error:: annotation this script exists to produce. */
let body;
try {
  body = await guide.text();
} catch (err) {
  fail(`Could not read the standalone study guide: ${err.message}`);
}

const stamped = body.match(
  /<meta name="qa-prep:questions" content="(\d+)"/
);
if (!stamped) {
  fail("Standalone study guide is served but carries no question-count stamp.");
}
if (Number(stamped[1]) === 0) {
  fail("Standalone study guide is served but reports zero questions.");
}
if (!body.includes('<div id="root">')) {
  fail("Standalone study guide is served but has no mount point.");
}

console.log(
  `Standalone study guide is live (${stamped[1]} questions, ${(body.length / 1024).toFixed(0)} KB).`
);
console.log("Deploy verified.");
