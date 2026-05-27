# Data Dictionary

Reference for every public file in `data/clean/`. All datasets are released
as both CSV (UTF-8, comma-separated, header row) and Apache Parquet (snappy
compression). Column order in CSV matches the order documented here.

Generated 2026-05-27 from pipeline version 0.1.0 and model version v1.

## `constituencies`

One row per Gilgit-Baltistan general assembly constituency under the 2020
delimitation. 24 rows.

| Column | Type | Description |
|---|---|---|
| `constituency_id` | string | Stable id of the form `GBA-N` where N is 1-24. |
| `name` | string | Geographic name (e.g. `Gilgit I`, `Hunza`, `Skardu IV`). |
| `district` | string | One of the ten GB districts: Gilgit, Nagar, Hunza, Ghizer, Skardu, Shigar, Kharmang, Ghanche, Astore, Diamer. |

## `elections`

One row per general election covered by the dataset, plus the upcoming 2026
poll. Four rows.

| Column | Type | Description |
|---|---|---|
| `year` | integer | Calendar year of polling. |
| `poll_date` | date (`YYYY-MM-DD`) | Actual polling day. |
| `ruling_party_centre` | string | Canonical party id of the federal ruling party at the time of the election. Used as a model feature. |

## `parties`

Canonical mapping of party ids to display names. Source of truth for party
colours and labels in the dashboard.

| Column | Type | Description |
|---|---|---|
| `party_id` | string | Canonical id. See "Canonical party ids" below. |
| `display_name` | string | Full party name, used on first mention in user-facing copy. |

### Canonical party ids

These ids are used consistently in `candidate_runs`, `predictions_*`, and
elsewhere. Variant spellings observed on Wikipedia and ECGB documents are
mapped to these via `pipeline/src/gb_pipeline/parties.py`.

`PPP`, `PML-N`, `PTI`, `MWM`, `ITP`, `JUI-F`, `JI`, `BNF-N`, `PML-Q`, `PML`,
`MQM`, `APML`, `PAT`, `PSP`, `AWP`, `TLP`, `ANP`, `Independent`.

`Independent` aggregates all non-party candidates. `PML` is reserved for
historical rows where Wikipedia editors omitted the faction suffix; treat as
a faction-unspecified residual category.

## `candidate_runs`

One row per (candidate, constituency, election year). The primary table.

| Column | Type | Description |
|---|---|---|
| `constituency_id` | string | Foreign key into `constituencies`. |
| `election_year` | integer | One of 2009, 2015, 2020. |
| `rank` | integer | Position in the constituency that year, 1 = winner, 2 = runner-up, ... |
| `candidate_name` | string | Most common name as it appears in source documents. Honorifics retained. |
| `party` | string | Canonical party id. |
| `votes` | integer or null | Recorded vote count. Null when the source did not list a count (notably some 2009 winner-only rows). |
| `vote_share_pct` | float or null | Percentage of valid votes. Null when not available. |
| `vote_share_pct_imputed` | boolean | True when `vote_share_pct` was computed as `votes / sum(votes in same constituency-year) * 100` rather than read from source. Approximate because the denominator excludes invalid ballots which we do not have. |
| `won` | boolean | True iff `rank == 1`. Maintained for clarity. |
| `source` | string | One of `wikipedia_constituency_page`, `wikipedia_2020_summary`, or a `+`-joined combination when the row was merged from both. |
| `source_url` | string | URL of the Wikipedia page the row came from. |
| `fetched_at` | string | ISO 8601 timestamp of when the source HTML was last fetched. Provenance for the dataset. |

Coverage notes:

- 2009: 51 rows. Many constituencies have only the winner because the
  per-constituency Wikipedia pages list 2009 only in their summary tables.
  Per-constituency 2009 detail (runner-up plus vote shares) is currently
  absent; backfilling requires OCR of the ECGB 2009 results PDF.
- 2015: 136 rows. Roughly 5-6 candidates per constituency.
- 2020: 77 rows. Most constituencies have winner plus runner-up from the
  election summary page; some also have 3rd / 4th place from the
  per-constituency pages.
- GBA-24 has no 2009 row because the constituency boundary did not exist
  under that id in 2009.

## `candidate_runs_with_id`

Same as `candidate_runs` plus a `candidate_id` column resolved by
cross-year and cross-constituency clustering. Used by the model.

| Column | Type | Description |
|---|---|---|
| ... | ... | All columns of `candidate_runs`. |
| `candidate_id` | string | Stable slug from the most common name form in the candidate's cluster (e.g. `khalid-khurshid`, `amjad-hussain-azar`). |

Clustering uses rapidfuzz with surname-last-token gating, see
`model/src/gb_model/candidate_ids.py` and the audit in
`data/manual_review/candidate_id_merges.csv`.

## `candidates`

One row per resolved candidate identity. 195 rows.

| Column | Type | Description |
|---|---|---|
| `candidate_id` | string | Slug. |
| `name` | string | Most common name variant in the cluster. |
| `normalised_name` | string | Lowercased, title-stripped form used internally. |
| `n_runs` | integer | Count of candidate_runs rows attached to this id. |
| `parties` | string | Comma-separated list of distinct canonical party ids the candidate has run under. |
| `constituencies` | string | Comma-separated list of distinct constituency_ids the candidate has contested. |
| `dynasty_flag` | boolean | Reserved for manual annotation in v1; currently always false. |
| `notes` | string | Free-text notes from manual review, if any. |

## `constituency_election_summary`

Per-constituency, per-year aggregates. Currently only 2020 has rows (24).

| Column | Type | Description |
|---|---|---|
| `constituency_id` | string | Foreign key. |
| `election_year` | integer | Year. |
| `district` | string | District name as listed on the 2020 summary table. |
| `registered_voters` | integer or null | Electoral roll size for that constituency that year. |
| `votes_cast` | integer or null | Total valid + invalid ballots counted. |
| `turnout_pct` | float or null | Voter turnout as a percentage. |
| `margin` | integer or null | Winner's vote count minus runner-up's vote count. |
| `source_url` | string | Provenance. |
| `fetched_at` | string | Provenance. |

## `feature_matrix`

One row per `candidate_runs_with_id` row, with engineered features ready for
ingestion by `gb_model.train`.

| Column | Type | Description |
|---|---|---|
| `candidate_id`, `constituency_id`, `election_year`, `district`, `party`, `candidate_name` | various | Pass-through identifiers. |
| `federal_incumbent_match` | int 0/1 | Candidate's party equals the federal ruling party of that year. |
| `incumbent_running` | int 0/1 | Candidate won this constituency in the most recent prior election. |
| `party_switch_flag` | int 0/1 | Candidate's party differs from their most recent prior run. |
| `prior_vote_share` | float or null | Vote share in their most recent prior run. Null = no prior. |
| `prior_winner_party_match` | int 0/1 | Candidate's party equals the constituency's most recent prior winner's party. |
| `prior_margin` | float or null | Margin in the constituency's most recent prior election. |
| `candidate_continuity_score` | integer | Count of strictly-prior runs by this candidate id. |
| `prior_winner_party` | string or null | Bookkeeping. The actual party label, before being collapsed to the boolean match flag. |
| `vote_share_pct_imputed` | boolean | Passed through from `candidate_runs`. |
| `won` | int 0/1 | Target variable. |
| `district_<NAME>` | int 0/1 | One-hot district dummies (10 columns: Gilgit, Nagar, Hunza, Ghizer, Skardu, Shigar, Kharmang, Ghanche, Astore, Diamer). |

Temporal-leakage invariant: all `prior_*` features and
`candidate_continuity_score` look back strictly to elections with
`election_year < this_row.election_year`. Verified by
`model/tests/test_features.py`.

## `predictions_2026`

Party-level forecast for each constituency. 216 rows = 24 constituencies × 9
parties.

| Column | Type | Description |
|---|---|---|
| `constituency_id` | string | Foreign key. |
| `election_year` | integer | 2026. |
| `party` | string | Canonical party id being scored. |
| `pred_proba` | float `[0, 1]` | Calibrated point estimate of P(this party wins this constituency in 2026). |
| `ci_lower_80` | float `[0, 1]` | 10th percentile across 1000 bootstrap re-trains. |
| `ci_upper_80` | float `[0, 1]` | 90th percentile across 1000 bootstrap re-trains. |
| `bootstrap_median` | float `[0, 1]` | 50th percentile across bootstrap re-trains. |

The point estimate comes from the calibrated full-data model; the CI bounds
come from uncalibrated bootstrap pipelines, matching the protocol used for
the 2020 holdout. See `model/artefacts/forecast_summary_2026.json` for the
seat-projection summary and `honest_finding` note.

## `predictions_2020_holdout` (in `model/artefacts/`)

Per-candidate predictions on the 2020 holdout. 77 rows.

| Column | Type | Description |
|---|---|---|
| `constituency_id`, `election_year`, `candidate_id`, `candidate_name`, `party` | various | Identifiers. |
| `pred_proba` | float `[0, 1]` | Calibrated win probability. |
| `ci_lower_80`, `ci_upper_80` | float | Bootstrap 80% CI. |
| `actual_won` | int 0/1 | Ground truth from `candidate_runs`. |

## Audit and review files

These are not part of the released dataset but ship in the repo for
reproducibility.

| File | Purpose |
|---|---|
| `data/raw/scrape_manifest.csv` | Every URL fetched during the sweep, with status and row counts. |
| `data/manual_review/merge_decisions.csv` | Within-race candidate-name merges that fired during cleaning. |
| `data/manual_review/name_review.csv` | Borderline within-race name pairs (similarity 0.75 to 0.85). |
| `data/manual_review/candidate_id_merges.csv` | Cross-year / cross-constituency clusters; flagged when a single candidate id spans more than two parties or more than two constituencies. |
