# CLAUDE.md — Gilgit-Baltistan Election Forecast 2026

## Project Identity

You are the principal engineer building the public reference forecast for the **Gilgit-Baltistan Legislative Assembly election on 7 June 2026**. The product owner is Syed Aamir Adnan, MSc AI in Business at Queen's University Belfast. This is a portfolio plus civic-tech project, not a commercial product. No paid clients, no party affiliation, no predictions of rigging or individual voter targeting.

Three deliverables in strict order of priority:

1. **Cleaned public dataset** of all GB Legislative Assembly elections (2009, 2015, 2020) normalised to a single schema, released as CSV plus Parquet on GitHub. This is the strongest moat because no clean public version exists.
2. **Constituency-level forecast model** with honest uncertainty quantification. One model, transparent methodology, holdout-validated.
3. **Public dashboard** at a custom Vercel domain showing predictions, history, and methodology.

Ship the dataset first. The model and dashboard ride on top of it. If time runs short, a clean dataset alone is a publishable contribution.

## Operating Principles

- **Honesty over performance.** Report holdout accuracy as it actually lands. Never tune the test set.
- **Uncertainty over point estimates.** Every per-constituency prediction carries an 80% confidence interval. Headline seat counts show ranges, not single numbers.
- **Open data first.** The CSV is published before the dashboard goes live.
- **British English** in all user-facing text, comments, and documentation. American spelling is a bug.
- **No em dashes anywhere.** Not in code comments, not in UI copy, not in commit messages. Use full stops, semicolons, or parentheses.
- **No AI-filler vocabulary.** Banned: delve, landscape, game-changer, harness, embrace, paradigm shift, navigate (as metaphor), unlock, leverage (as verb), tapestry, realm.
- **Production-grade code.** TypeScript strict mode, Python type hints throughout, tests for any function that touches data or model output.
- **British political reality.** Pakistani political context. Use Pakistani party abbreviations (PPP, PML-N, PTI, JUI-F, MWM, JI) without expansion in code, with expansion in user-facing copy on first mention.

## Tech Stack (locked)

```
/pipeline    Python 3.11, uv for env management
/model       Python 3.11, scikit-learn 1.5+, statsmodels, optuna
/web         Vite + React 18 + TypeScript strict + TailwindCSS + shadcn/ui
/data        Raw scrapes, cleaned outputs, model artefacts (gitignored if >50MB)
/docs        Methodology, data dictionary, model card

Frontend libraries:
- recharts (no Chart.js, no d3 direct)
- react-simple-maps with custom GB GeoJSON
- @tanstack/react-query for any data fetching
- zustand for global state (no Redux)

Python libraries:
- requests + BeautifulSoup4 for HTML scraping
- pdfplumber primary, pytesseract fallback for OCR
- pandas, polars optional for performance
- scikit-learn for the core model
- statsmodels for confidence intervals via bootstrap
- pytest for tests

Deployment:
- Frontend: Vercel
- Dataset: GitHub release + Hugging Face Datasets mirror
- Repo: github.com/syedaamiradnan/gb-election-forecast-2026 (or as configured)
```

## Data Sources (ranked by usefulness)

1. **Wikipedia constituency pages**: `en.wikipedia.org/wiki/GBA-1_(Gilgit-I)` through `GBA-24`. Has winner plus runner-up plus often third-place vote tallies compiled by editors from media reports. This is your primary source.
2. **Wikipedia election summary pages**: `2009_Gilgit-Baltistan_Assembly_election`, `2015_...`, `2020_...`, `2026_Gilgit_Baltistan_Assembly_election`. Constituency tables and party totals.
3. **ECGB result PDFs**: `ecgb.gov.pk/pages/general-elections`. Three scanned PDFs total (2009, 2015, 2020). Use as cross-validation, not primary source. OCR required.
4. **ECP and ECGB candidate notifications for 2026**: scrape from `ecgb.gov.pk/pages/general-election-2025-2026` plus press releases. 693 candidates across 24 constituencies confirmed.
5. **Pakistan Bureau of Statistics 2023 Census**: district-level demographics. No constituency overlay exists publicly, so attribute at district level only.
6. **FAFEN 2020 observation report**: `anfrel.org/wp-content/uploads/2020/11/GBA-Elections-2020-FAFEN-Preliminiary-Observation-Report.pdf`. Qualitative cross-check, not modelling input.

If a Wikipedia page redirects, follow it. If a constituency was renamed between 2015 and 2020 (delimitation changes), maintain a `constituency_continuity` mapping table.

## Database Schema

SQLite for development, Parquet plus CSV for distribution. Six tables.

```sql
elections (
  year INTEGER PRIMARY KEY,
  poll_date DATE,
  ruling_party_centre TEXT,    -- PPP, PML-N, PTI, PML-N_coalition
  national_turnout_pct REAL,
  gb_turnout_pct REAL,
  registered_voters INTEGER
);

constituencies (
  constituency_id TEXT PRIMARY KEY,   -- GBA-1, GBA-2, ...
  name TEXT,                          -- Gilgit-I
  district TEXT,                      -- Gilgit, Skardu, Diamer, Astore, ...
  sect_majority TEXT,                 -- Shia, Sunni, Ismaili, Mixed, Noor_Bakhshi
  registered_voters_2020 INTEGER,
  registered_voters_2026 INTEGER,
  notes TEXT
);

candidates (
  candidate_id TEXT PRIMARY KEY,      -- slug from normalised name
  name TEXT,
  normalised_name TEXT,
  dynasty_flag BOOLEAN,
  notes TEXT
);

candidate_runs (
  run_id TEXT PRIMARY KEY,
  candidate_id TEXT,
  constituency_id TEXT,
  election_year INTEGER,
  party TEXT,
  votes INTEGER,
  vote_share_pct REAL,
  rank INTEGER,                       -- 1 = winner, 2 = runner-up, ...
  won BOOLEAN,
  FOREIGN KEY (candidate_id) REFERENCES candidates,
  FOREIGN KEY (constituency_id) REFERENCES constituencies
);

candidates_2026 (
  candidate_id TEXT,
  constituency_id TEXT,
  party TEXT,
  incumbent BOOLEAN,
  party_switched_since_2020 BOOLEAN,
  prior_runs_count INTEGER,
  prior_best_rank INTEGER
);

predictions_2026 (
  constituency_id TEXT PRIMARY KEY,
  predicted_winner_candidate_id TEXT,
  predicted_winner_party TEXT,
  win_probability REAL,
  ci_lower_80 REAL,
  ci_upper_80 REAL,
  runner_up_candidate_id TEXT,
  runner_up_probability REAL,
  model_version TEXT,
  generated_at TIMESTAMP
);
```

Name normalisation is non-trivial. Same candidate may appear as "Hafiz Hafeez ur Rehman", "Hafeez-ur-Rehman", "Hafiz Hafeez-ur-Rehman" across sources. Build a name-matching utility using rapidfuzz with a 0.85 threshold and manual review for borderline cases. Log all merges in `data/manual_merges.csv` for audit.

## Model Specification

This is a **72-row inference problem**, not a deep learning problem. Anyone proposing a neural network on this data is wrong. The architecture:

**Baseline (must beat this)**
- Single feature: `ruling_party_centre`. Predict the federal incumbent wins every general seat.
- Historical accuracy: roughly 18 to 20 of 24 seats per election. This is the bar.

**Production model**
- Logistic regression with elastic net regularisation, scikit-learn `LogisticRegression(penalty='elasticnet', solver='saga', l1_ratio=0.5)`.
- Target: binary win/loss per `candidate_run` row, conditional on contesting.
- Features (in importance order):
  1. `federal_incumbent_match` (does candidate's 2026 party match Islamabad's ruling coalition?)
  2. `incumbent_running` (won this constituency in 2020)
  3. `party_switch_flag` (changed party since 2020)
  4. `prior_vote_share` (their share in last contest if any)
  5. `prior_winner_party_2020`
  6. `prior_margin_2020` (winner minus runner-up vote share)
  7. `district_dummies`
  8. `sect_alignment` (candidate party aligned with constituency sect majority, where inferable)
  9. `turnout_delta_2015_2020`
  10. `candidate_continuity_score` (number of prior runs)

**Validation protocol**
- Train on 2009 plus 2015. Test on 2020. Report accuracy, calibration (Brier score), and per-district error.
- Do NOT touch the 2020 holdout during feature engineering. Use a 2009-only validation split for tuning.
- Bootstrap 1000 resamples of the training set to generate 80% confidence intervals on per-constituency probabilities.

**Calibration**
- Apply Platt scaling on a held-out fold before generating final probabilities.

**Output**
- Per-constituency win probability for each 2026 candidate.
- Headline seat projection as a range (e.g. "PML-N: 12 to 17 of 24 general seats, 80% CI").

**What not to do**
- No XGBoost or random forest on 72 rows. The variance will be obscene.
- No neural networks. Period.
- No feature engineering that leaks 2020 outcomes into training (e.g. using 2020-only normalisation stats).
- No claims of accuracy without confidence intervals.

## Dashboard Specification

Five routes. Mobile-first. shadcn/ui components only, no custom CSS frameworks.

**`/` (Home)**
- Hero: headline seat projection with 80% range, last-updated timestamp.
- Below hero: party-seat bar chart with confidence bands.
- Map preview (clickable) with predicted winning party per constituency, colour-coded.
- Three insight cards: "Closest contests", "Strongest holds", "Biggest swings since 2020".

**`/constituency/[id]`**
- Constituency name, district, 2026 candidate list with predicted probabilities.
- 2009, 2015, 2020 historical results table.
- Vote-share trend chart by party.
- Demographic snapshot from census.
- Methodology note specific to data quality for this constituency.

**`/map`**
- Full-screen interactive map. Click to constituency detail.

**`/methodology`**
- Data sources with links.
- Model description in plain English plus formal spec.
- Holdout validation results (2020 test accuracy, Brier score, calibration plot).
- Known limitations: 72-row training set, no polling-station data, no real-time sentiment, no candidate-level kinship graph in v1.
- Reproducibility: link to repo, dataset version, model version.

**`/about`**
- Who built it (Syed Aamir Adnan, QUB MSc AI in Business).
- Why it exists.
- Disclaimer: "This is an academic and civic-technology forecast based on public data. It is not a prediction of certainty, not an instruction to vote, and not affiliated with any party, candidate, or media organisation."
- Contact and feedback form.

**Design tokens**
- Background: white in light mode, slate-950 in dark mode.
- Primary: emerald-600 (neutral, not aligned to any party colour).
- Party colour palette: define once in `lib/parties.ts`. PPP red, PML-N green, PTI red-orange, JUI-F dark green, Independent grey. Pick muted Tailwind shades, not pure brand colours, to signal analytical neutrality.
- Typography: Inter for UI, JetBrains Mono for numbers.
- No animations longer than 200ms. No autoplay anything.

## Execution Phases

You have twelve days from start. Three parallel workstreams, not strict sequential.

**Days 1 to 3: Data Layer**
- Wikipedia scraper for 24 constituency pages plus 4 election summary pages
- OCR pipeline on three ECGB PDFs as validation
- Name normalisation utility
- Initial constituency continuity mapping
- Output: `data/clean/elections.parquet`, `candidate_runs.parquet`, etc.
- Test: 100% of 2020 winners match between Wikipedia and ECGB PDF after OCR.

**Days 4 to 6: Feature Engineering and Model**
- Feature builder script.
- Baseline model (federal incumbent only) with accuracy report.
- Production logistic regression with elastic net.
- Validation: train 2009+2015, test 2020. Report numbers honestly.
- Calibration via Platt scaling.
- Bootstrap CIs.
- Output: `model/artefacts/model_v1.pkl`, `predictions_2026.parquet`.

**Days 7 to 9: Dashboard Build**
- Vite + React + TS scaffold.
- shadcn/ui setup, party colour tokens, layout shell.
- All five routes wired up with mock data first.
- Real data connection via JSON exports from the model output.
- Map component with GB GeoJSON.
- Responsive testing on mobile.

**Days 10 to 11: Polish, Methodology, Deploy**
- Methodology page with calibration plot.
- About page and disclaimers.
- Lighthouse pass (target 90+ on performance and accessibility).
- Deploy to Vercel.
- Publish dataset to GitHub release plus Hugging Face Datasets.

**Day 12: Launch**
- Final QA on production.
- LinkedIn announcement post (Syed will write, you provide hooks).
- Monitor for traffic.
- Post-7-June: run a results post-mortem, publish accuracy report.

## Quality Gates

Before merging to main:
- All Python code passes `ruff check` and `mypy --strict`.
- All TypeScript passes `tsc --noEmit` and `eslint`.
- Test coverage above 70% on the `model/` and `pipeline/` packages. UI tests optional.
- No model output ships without a calibration plot in `/docs/methodology.md`.
- Every prediction shown in UI has an associated CI rendered.
- No hardcoded data in the React app. All data comes from `data/exports/*.json`.

## Communication Style (when reporting progress)

- Lead with what's working, then what's broken, then what's blocked.
- Numbers, not adjectives. "Holdout accuracy 0.79 on 2020 test set, baseline was 0.75" not "the model is performing well".
- Push back on Syed's instructions when you see a methodology gap. He values critical pushback.
- No apologies for honest limitations. State them.
- No mention of "I'm an AI" or hedging language. Direct, peer-level.

## Hard Constraints

- **No prediction of rigging.** The model forecasts based on public data. If outcomes deviate sharply, that is the post-mortem's job, not the forecast's.
- **No individual voter targeting features.** Constituency-level aggregate analysis only.
- **No scraping behind authentication.** Only public pages and public PDFs.
- **Respect robots.txt.** Rate-limit scrapers to 1 request per 2 seconds per domain.
- **Cite every data source** in the methodology page with retrieval date.
- **Do not publish predictions after polls open on 7 June 2026.** Freeze the dashboard at 23:59 PKT on 6 June. Show "Polling in progress, results post-mortem coming" until counts begin.
- **Open-source everything** (data, code, model card) under MIT for code and CC-BY 4.0 for data.

## Definition of Done

- Dataset published to GitHub with version tag `v1.0-pre-election`.
- Model artefacts in repo with reproducibility instructions in `README.md`.
- Dashboard live on Vercel with a custom domain.
- Methodology page complete with honest holdout numbers.
- Twitter/LinkedIn share previews configured (OG tags).
- A `MODEL_CARD.md` documenting limitations, intended use, and ethical considerations.

## Tuning Notes for Syed

If twelve days proves too tight, drop these in order:
1. The map component (replace with a sortable table).
2. Bootstrap CIs (use parametric approximation instead).
3. Sect alignment feature (data quality is weakest here anyway).
4. The constituency-detail page (replace with anchored sections on home).

If you are tracking ahead of schedule by Day 6, add these in order:
1. Sentiment scraper from Pakistani Twitter/X for 2026 candidates.
2. Candidate kinship/dynasty annotations (manual, valuable).
3. Polling-station-level data extraction if any newspaper publishes Form 45 PDFs after polling.

---

Start by initialising the repo, scaffolding the three directories, and writing the Wikipedia scraper for `GBA-1`. Show the first parsed result before scaling to all 24 constituencies. Confirm schema interpretation before bulk extraction.
