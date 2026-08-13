# CI + Deploy

Every push to `main` runs the full check suite, and **only if it passes** does a
deploy get triggered. The pipeline then waits for proof that the new build is
actually serving on the production domain before it goes green.

Workflow: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

## How it fits together

```
push to main
  ├─ test      typecheck · unit tests · coverage · build · build:site
  ├─ qa-prep   typecheck · build · standalone guide
  └─ deploy    (needs both)
       ├─ POST the Vercel deploy hook
       └─ poll https://<site>/version.json until it reports this commit
```

On a **pull request** the two check jobs run and the deploy job is skipped, so a
broken pipeline is caught before the merge rather than after.

## Why the deploy hook instead of Vercel's git integration

Vercel's git auto-deploy is **disabled for `main`** in `vercel.json`:

```json
"git": { "deploymentEnabled": { "main": false } }
```

Without that, a push to `main` would deploy immediately and in parallel with CI
— so a red pipeline would still ship. With it, `main` deploys only through the
hook, which the `deploy` job fires after the checks pass.

Preview deployments for other branches and PRs are **unaffected** and still
happen automatically.

Two things still bypass this pipeline, by design of the platform rather than
choice: a manual `vercel --prod` from a laptop, and a redeploy triggered from
the Vercel dashboard.

## What gets deployed

The domain serves the **qa-prep** app, not the legacy app at the repo root:

```json
"buildCommand": "npm run build:site",
"outputDirectory": "qa-prep/dist"
```

`build:site` installs qa-prep, builds it, then drops the standalone guide and
the version stamp into the same `dist/`. So:

| Path | Serves |
|---|---|
| `/` | the qa-prep app |
| `/QA-Prep-standalone.html` | the single-file editorial study guide |
| `/version.json` | the commit stamp CI verifies against |

The legacy app still lives at the repo root and is still built and tested in
CI, so it cannot rot unnoticed — it is simply no longer deployed.

## Proving the deploy is live

`POST`ing the hook only proves the request was accepted — the build can still
fail afterwards, and the domain would keep serving the old bundle behind a green
tick. So:

- `scripts/write-version.mjs` runs at the end of `build:site` and writes
  `version.json` into the deploy output with the commit SHA
  (`VERCEL_GIT_COMMIT_SHA` on Vercel, `git rev-parse` locally).
- `scripts/check-live-deploy.mjs` polls `https://<site>/version.json` every 10s
  for up to 5 minutes and fails if the SHA never becomes the one CI pushed.
- It then checks `/QA-Prep-standalone.html` is served, carries a non-zero
  `qa-prep:questions` count in its meta tags, and still has its mount point.
  The guide is generated during the same build, so a build that silently
  stopped producing it fails here rather than reaching users.

A failed Vercel build never swaps the domain alias, so it surfaces here as a
timeout with a pointer to the deployment logs.

## Required configuration

| Name | Kind | Required | Purpose |
|---|---|---|---|
| `VERCEL_DEPLOY_HOOK_URL` | repository **secret** | yes | The URL CI posts to in order to deploy. Without it the `deploy` job fails with a clear error. |
| `SITE_URL` | repository **variable** | no | Production origin to verify. Defaults to `https://qa-app-topaz-nine.vercel.app`. Set it if a custom domain is added. |

### Creating the deploy hook

1. Vercel → project **qa-app** → **Settings** → **Git** → **Deploy Hooks**.
2. Create one named e.g. `ci-main`, branch `main`. Copy the URL.
3. GitHub → repo **Settings** → **Secrets and variables** → **Actions** →
   **New repository secret**, name `VERCEL_DEPLOY_HOOK_URL`, paste the URL.

The hook URL is a credential: anyone holding it can trigger a production
deploy. Keep it in the secret store, never in the repo.

> **Order matters.** Once `git.deploymentEnabled.main = false` is on `main`,
> nothing deploys until that secret exists. Create the hook and add the secret
> **before** merging, or production will simply stop updating.

## Running the pieces locally

```sh
npm run build:site                  # exactly what Vercel runs
npm run build                       # the legacy app, not deployed

EXPECTED_SHA=$(git rev-parse HEAD) \
SITE_URL=https://qa-app-topaz-nine.vercel.app \
TIMEOUT_MS=60000 \
node scripts/check-live-deploy.mjs  # same check CI runs
```

## Node version

CI pins Node **24** to match the project's Vercel build runtime, so CI cannot
pass on something that would fail to build in production.
