/* Writes public/version.json so a deploy can be identified from the outside.
   CI polls this file after triggering a deploy to prove the build that is
   actually live is the commit it just pushed — see scripts/check-live-deploy.mjs.

   The SHA comes from Vercel's build env when building there, and from git
   otherwise, so a local build is identifiable too. */
import { execSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
/* Defaults to the old app's public/; the deployed site passes its own path. */
const out = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(root, "public/version.json");

function gitSha() {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function gitRef() {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf8",
    }).trim();
  } catch {
    return null;
  }
}

const version = {
  commit: process.env.VERCEL_GIT_COMMIT_SHA || gitSha() || "unknown",
  ref: process.env.VERCEL_GIT_COMMIT_REF || gitRef() || "unknown",
  builtAt: new Date().toISOString(),
};

await mkdir(dirname(out), { recursive: true });
await writeFile(out, `${JSON.stringify(version, null, 2)}\n`, "utf8");
console.log(
  `version.json — commit ${version.commit.slice(0, 8)} on ${version.ref}`
);
