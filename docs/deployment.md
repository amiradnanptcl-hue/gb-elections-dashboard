# Deployment

This document covers deploying the dashboard at `/web` to Vercel, publishing the dataset to GitHub Releases plus the Hugging Face Datasets Hub, and the freeze procedure for polling day.

## Dashboard (Vercel)

The dashboard is a static Vite + React build. No serverless functions; no backend.

### One-time setup

1. From `/web`, log in once: `vercel login`. Use the email associated with the GitHub account hosting the repo.
2. Link the directory to a Vercel project: `vercel link`. Choose to create a new project; set the project name to `gb-forecast-2026`.
3. Configure the project root: in the Vercel dashboard, set Root Directory to `web` (since this is a monorepo with `/pipeline`, `/model`, and `/web`).
4. Verify the framework preset detects as Vite. The build command (`pnpm build`) and output directory (`dist`) come from `web/vercel.json`.

### Preview deploys

From `/web`:

```
vercel deploy
```

This builds the current working directory and returns a unique preview URL. Each git branch also auto-deploys to its own preview URL once the repo is connected to Vercel.

### Production deploy

```
vercel deploy --prod
```

Or merge to the `main` branch if the repo-to-Vercel git integration is in place.

### Custom domain

After the first prod deploy, add the domain in the Vercel dashboard. CLAUDE.md anticipates a custom domain such as `gbforecast.org` or similar; configure DNS to point to Vercel per their instructions.

### Cache behaviour

`web/vercel.json` sets:

- `/assets/*` (Vite hashed bundles): `Cache-Control: public, max-age=31536000, immutable`.
- `/data/*` (JSON exports): `Cache-Control: public, max-age=300, s-maxage=600`. Short enough that re-running `gb_pipeline.export_json` propagates within ten minutes after a new prod deploy.

### SPA rewrites

All client-side routes route to `index.html` so deep links (e.g. `/constituency/GBA-13`) work on hard refresh. The rewrite pattern excludes asset and data paths.

## Dataset (GitHub Release + Hugging Face)

The cleaned dataset lives in `/data/clean/`. Distribution copies live in `/data/exports/` (JSON) and will also be released as Parquet + CSV.

### GitHub Release

1. Bundle the dataset:

```
cd data
zip -r gb-election-data-v1.0-pre-election.zip clean/
```

2. Create a GitHub Release tagged `v1.0-pre-election` against the `main` branch.
3. Attach the zip plus the contents of `docs/methodology_results.md` as release notes.

### Hugging Face Datasets

1. Install: `pip install huggingface_hub datasets`.
2. Log in: `huggingface-cli login`.
3. Push:

```
cd data/clean
huggingface-cli upload syedaamiradnan/gilgit-baltistan-elections candidate_runs.parquet candidate_runs.parquet
huggingface-cli upload syedaamiradnan/gilgit-baltistan-elections constituencies.parquet constituencies.parquet
huggingface-cli upload syedaamiradnan/gilgit-baltistan-elections elections.parquet elections.parquet
huggingface-cli upload syedaamiradnan/gilgit-baltistan-elections constituency_election_summary.parquet constituency_election_summary.parquet
huggingface-cli upload syedaamiradnan/gilgit-baltistan-elections parties.parquet parties.parquet
```

## Polling-day freeze

CLAUDE.md mandates freezing the dashboard at 23:59 PKT on 6 June 2026. Two options:

1. Manual: redirect the home page to a static "Polling in progress" placeholder.
2. Scheduled: set an env var `VITE_FREEZE_AT="2026-06-06T18:59:00Z"` (23:59 PKT in UTC) and have the home page check the current time client-side and render the placeholder past that timestamp.

Option 1 is preferred for v1 because it avoids any client-side time-zone subtleties.

## Post-mortem

After the 7 June 2026 election results are published:

1. Re-run `pipeline/sweep.py` to pick up the 2026 winners from the Wikipedia 2026 summary page.
2. Re-run `model/predict_2026.py` to score the published candidate slate (now that names + parties are known).
3. Compute accuracy of model v1's predictions against actual winners.
4. Publish the post-mortem report in `docs/post_mortem_2026.md` and as a `v1.1-post-election` GitHub Release.
