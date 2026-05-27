# Model v1 — Results and Methodology Notes

Model version `v1`, trained 2026-05-26.

## Protocol

- Train: 2009 + 2015 candidate_runs (187 rows).
- Test: 2020 candidate_runs (78 rows).
- Hyperparameter selection: 5-fold stratified CV within the training set only. The 2020 holdout was never touched during feature engineering or hyperparameter selection.
- Estimator: scikit-learn `LogisticRegression(solver='saga', l1_ratio=0.5)` (elastic net), preceded by `StandardScaler`. Best `C=0.5`.
- Calibration: Platt scaling via `CalibratedClassifierCV(method='sigmoid', cv=5)` on the training set.
- Uncertainty: 1000 bootstrap resamples of the training set, producing 80% confidence intervals on per-candidate win probability for each 2020 holdout row.

## Features

Implemented in v1 (numbered per the project specification):

1. `federal_incumbent_match` — candidate's party equals the federal ruling party.
2. `incumbent_running` — candidate won this constituency in the most recent prior election.
3. `party_switch_flag` — candidate's party differs from their most recent prior run.
4. `prior_vote_share` — vote share in the candidate's most recent prior run, plus a missingness indicator.
5. `prior_winner_party_match` — candidate's party equals the constituency's most recent prior winner.
6. `prior_margin` — winner minus runner-up vote share in the prior election (with missingness indicator).
7. District one-hot dummies.
10. `candidate_continuity_score` — count of prior runs by the same candidate.

Deferred to v2 (data not yet ingested):

8. `sect_alignment` — candidate party aligned with the constituency sect majority.
9. `turnout_delta_2015_2020` — constituency-level turnout change. We currently have 2020 turnout but not 2015 turnout.

## Holdout Results

| Metric | Value |
|---|---|
| Best regularisation `C` | 0.5 |
| CV Brier (training folds) | 0.1344 |
| Train Brier (full set) | 0.1351 |
| Test Brier (2020 holdout) | 0.2127 |
| **Constituency winner accuracy (2020)** | **12 of 24 (50.0 percent)** |
| Baseline (federal incumbent wins every seat) | 11 of 24 (45.8 percent) |
| Delta vs. baseline | +1 seat |

Per-year baseline accuracy:

| Year | Federal ruling party | Baseline correct | Accuracy |
|---|---|---|---|
| 2009 | PPP | 13 of 23 | 56.5 percent |
| 2015 | PML-N | 15 of 24 | 62.5 percent |
| 2020 | PTI | 11 of 24 | 45.8 percent |

The 2020 election was unusually fragmented: PTI won 11 general seats, Independents 5, PPP 3, PML-N 2, plus four minor parties with one seat each. The model marginally improves on the baseline but does not crack the noise floor introduced by within-party tie-breaking and ticket-splitting.

## Calibration

The reliability diagram for the 2020 holdout (in `model/artefacts/calibration_plot.png`) shows:

- Low-probability bin (predicted ~0.15-0.16, n=37): observed win rate ~19 percent. Mildly under-confident.
- Mid-probability bin (predicted ~0.24, n=22): observed win rate 41 percent. Under-confident.
- High-probability bins around predicted 0.47-0.54 (n=14): observed win rate 36 percent. Over-confident, reflecting that many federal-incumbent candidates (PTI in 2020) did not actually win their seats.

Brier-score gap of 0.08 between training (0.135) and test (0.213) indicates moderate overfitting at this dataset scale (187 training rows).

## Honest Limitations

- **Training set size**: 187 rows is small for the number of features in play. Elastic net with l1_ratio=0.5 helps with feature selection, but variance remains high. Reported 80% CIs are wide.
- **2009 detail gap**: many 2009 constituencies have only winner data on Wikipedia. `prior_margin` is missing for 60 percent of 2015 rows because their 2009 anchors lack runner-up vote shares. Filling this gap requires OCR of the ECGB 2009 results PDF.
- **Within-party candidate selection**: when two same-party candidates contest the same constituency, the model has very weak signal to distinguish them. Example: GBA-13 in 2020 had two PTI candidates ("Khalid Khurshid" and "Muhammad Khalid Khurshid Khan") with similar profiles; the model picked the runner-up.
- **Party label drift**: Wikipedia editors sometimes update candidate party labels with post-election defections. We treat the labels as the source of truth as scraped; the 2020 PTI count (11) here likely includes 1-2 candidates who won as Independents and later joined PTI.
- **No sentiment, polling, or kinship features**: by design for v1.

## Reproducibility

```
cd model
uv sync --extra dev
uv run python -m gb_model.baseline
uv run python -m gb_model.candidate_ids
uv run python -m gb_model.features
uv run python -m gb_model.train
```

Outputs land in `model/artefacts/`:
- `baseline_report.json`
- `model_v1.joblib`
- `predictions_2020_holdout.csv`
- `calibration_plot.png`
- `training_report.json`
