# Contributing to GB Elections Dashboard

Thank you for considering a contribution. This project is a public-records
dashboard, so the most valuable contributions are usually corrections to the
underlying data or improvements to the data-cleaning pipeline. Code and
documentation contributions are equally welcome.

This document covers:

* how to file an issue
* how to propose a data correction (the most common contribution)
* how to propose a code change
* what the review bar looks like

If your contribution does not fit one of these patterns, open an issue first
and we will work out the right shape together.

## Code of Conduct

This project follows the [Contributor Covenant 2.1](./CODE_OF_CONDUCT.md).
Be kind, be specific, assume good faith.

## How to file an issue

We have three issue templates under `.github/ISSUE_TEMPLATE/`:

* **Bug report** — something on the dashboard is broken or wrong.
* **Data correction** — a specific number, candidate name, party
  attribution, voter count, or polling-station figure is incorrect.
  Attach the source that contradicts what the site shows.
* **Feature request** — a new view, table, or data integration.

For data corrections especially, we want to see the source URL or screenshot
(ECGB, Wikipedia, Pamir Times, official portal) so the change can be made
traceable in `data/raw/scrape_manifest.csv`.

## Proposing a data correction

The dataset is the most public-facing part of this project. Corrections
should follow the audit trail conventions below.

1. **Identify the file to change.** Almost always under
   `data/raw/research/` (for hand-curated lists like
   `candidates_2026_known.csv`) or one of the scrape outputs under
   `data/raw/`.
2. **Cite the source.** Add the source URL and retrieval date to the row's
   `source` column. We do not accept changes without a citation.
3. **Re-run the pipeline.**
   ```bash
   cd pipeline
   uv run python -m gb_pipeline.clean
   uv run python -m gb_pipeline.export_json
   ```
4. **Verify the dashboard renders correctly.**
   ```bash
   cd web
   pnpm install
   pnpm dev
   ```
5. **Open a pull request** using the PR template. The template asks you to
   confirm the source and to note any manual-review entries you added.

## Proposing a code change

Code lives in three workspaces:

* `pipeline/` — Python 3.11 scrapers and the cleaning pass. Use `uv`.
* `model/` — historical model artefacts (kept for transparency; not
  consumed by the dashboard since v1.3).
* `web/` — Vite + React + TypeScript dashboard.

The bar for code changes:

* TypeScript must pass `tsc -b` with no errors.
* Python must pass `ruff check` with no warnings.
* Tests must pass: `pytest` for `pipeline` and `model`.
* The production build must succeed: `cd web && pnpm build`.
* New UI text must be in British English with no em dashes (see CLAUDE.md
  for the full style guide).

CI runs all of the above on every pull request. PRs cannot merge until CI
is green.

## What the review bar looks like

We follow the principles in `CLAUDE.md`:

* **Honesty over performance.** No predictions or claims the data does not
  support. The site stopped publishing a forecast in v1.3 because we did
  not have strong enough evidence — we will not reintroduce one without it.
* **Open data first.** Every cell on the dashboard must trace to a source.
* **British English** in user-facing text, comments, and documentation.
* **No AI-filler vocabulary.** Banned: delve, landscape, game-changer,
  harness, embrace, paradigm shift, navigate (as metaphor), unlock,
  leverage (as verb), tapestry, realm.
* **No em dashes.** Use full stops, semicolons, or parentheses.

## Manual-review trail

Some data changes need a human in the loop. These are logged so future
contributors can see why a choice was made:

* `data/manual_review/merge_decisions.csv` — candidate-name reconciliations
  performed by the cleaning pipeline.
* `data/manual_review/name_review.csv` — borderline name pairs that the
  cleaner flagged but did not merge.
* `data/manual_review/candidate_id_merges.csv` — output of the cross-year
  candidate-ID resolver.

If you override one of these decisions, leave a note in the PR description
explaining why.

## Licence

By submitting a contribution you agree that your code is licensed under
[MIT](./LICENSE) and your data contributions under [CC BY 4.0](./LICENSE-DATA).
