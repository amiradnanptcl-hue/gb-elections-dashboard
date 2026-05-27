"""Party-level 2026 forecast.

Without the 2026 candidate slate, we cannot produce per-candidate predictions.
We can still produce a meaningful per-party forecast by scoring each
(constituency, party) pairing with the candidate-level features we DO know:

  * federal_incumbent_match  (against PML-N at the federal centre in 2026)
  * prior_winner_party_match (vs. 2020 winner)
  * prior_margin             (constituency-level, from 2020)
  * district_dummies         (constituency geography)

Candidate-personal features (incumbent_running, party_switch_flag,
prior_vote_share, candidate_continuity_score) are set to zero with their
missingness flags raised so the model treats them as "no information".

Outputs:
  data/clean/predictions_2026.csv  (+ .parquet)
  model/artefacts/forecast_summary_2026.json

Per-constituency: P(this party wins this seat). The headline projection is
the sum of those probabilities per party (point estimate), with 80% bounds
from a 1000-iteration bootstrap re-train of the elastic-net classifier.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

# Parties to score in 2026. Any party that has won a seat in our dataset.
# 'Independent' captures the aggregate probability that ANY non-party candidate
# wins; given the prevalence of independents in GB, this is a meaningful slot.
PARTIES_2026 = [
    "PPP",
    "PML-N",
    "PTI",
    "JUI-F",
    "MWM",
    "ITP",
    "BNF-N",
    "PML-Q",
    "Independent",
]

FEDERAL_INCUMBENT_2026 = "PML-N"

NUMERIC_FEATURES = [
    "federal_incumbent_match",
    "incumbent_running",
    "party_switch_flag",
    "prior_vote_share",
    "prior_winner_party_match",
    "prior_margin",
    "candidate_continuity_score",
]

N_BOOTSTRAP = 1000
BOOTSTRAP_SEED = 42


def _build_pipeline() -> Pipeline:
    return Pipeline([
        ("scaler", StandardScaler(with_mean=True, with_std=True)),
        (
            "clf",
            LogisticRegression(
                solver="saga",
                l1_ratio=0.5,
                max_iter=5000,
                random_state=42,
            ),
        ),
    ])


def _feature_columns(df: pd.DataFrame) -> list[str]:
    district_cols = sorted(c for c in df.columns if c.startswith("district_"))
    return NUMERIC_FEATURES + [
        "prior_vote_share_missing", "prior_margin_missing",
    ] + district_cols


def build_2026_features(
    constituencies: pd.DataFrame,
    feature_matrix: pd.DataFrame,
    parties: list[str] = PARTIES_2026,
) -> pd.DataFrame:
    """Build a (constituency x party) feature matrix for 2026."""
    # Per-constituency look-up: winning party and margin in 2020.
    fm_2020 = feature_matrix[feature_matrix["election_year"] == 2020].copy()
    winners_2020 = fm_2020[fm_2020["won"] == 1].set_index("constituency_id")
    winner_party = winners_2020["party"].to_dict()
    # Use the constituency-level margin (already present per-row, identical
    # across that constituency's 2020 rows because it is constituency-level).
    margin_lookup = (
        fm_2020.dropna(subset=["prior_margin"])
        .groupby("constituency_id")["prior_margin"]
        .first()
        .to_dict()
    )

    # Use the same district one-hot column set as training so the model sees
    # exactly the columns it was fit with.
    district_cols = sorted(c for c in feature_matrix.columns if c.startswith("district_"))

    rows: list[dict[str, object]] = []
    for cid in constituencies["constituency_id"]:
        district = constituencies.loc[
            constituencies["constituency_id"] == cid, "district"
        ].iloc[0]
        prior_winner_party = winner_party.get(cid)
        prior_margin = margin_lookup.get(cid)

        for party in parties:
            row: dict[str, object] = {
                "constituency_id": cid,
                "election_year": 2026,
                "party": party,
                "candidate_name": f"{party} candidate",
                "federal_incumbent_match": int(party == FEDERAL_INCUMBENT_2026),
                "incumbent_running": 0,
                "party_switch_flag": 0,
                "prior_vote_share": 0.0,
                "prior_vote_share_missing": 1,
                "prior_winner_party_match": int(
                    prior_winner_party is not None and prior_winner_party == party
                ),
                "prior_margin": float(prior_margin) if prior_margin is not None else 0.0,
                "prior_margin_missing": int(prior_margin is None),
                "candidate_continuity_score": 0,
            }
            for col in district_cols:
                row[col] = 1 if col == f"district_{district}" else 0
            rows.append(row)

    return pd.DataFrame(rows)


def bootstrap_probabilities(
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_2026: np.ndarray,
    best_c: float,
    n_bootstrap: int = N_BOOTSTRAP,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    rng = np.random.default_rng(BOOTSTRAP_SEED)
    n = len(X_train)
    all_probs = np.zeros((n_bootstrap, X_2026.shape[0]))
    for i in range(n_bootstrap):
        idx = rng.integers(0, n, size=n)
        pipeline = _build_pipeline()
        pipeline.set_params(clf__C=best_c)
        pipeline.fit(X_train[idx], y_train[idx])
        all_probs[i] = pipeline.predict_proba(X_2026)[:, 1]
    lower = np.percentile(all_probs, 10, axis=0)
    upper = np.percentile(all_probs, 90, axis=0)
    median = np.percentile(all_probs, 50, axis=0)
    return median, lower, upper, all_probs  # type: ignore[return-value]


def _prepare_training_data(feature_matrix: pd.DataFrame) -> tuple[np.ndarray, np.ndarray, list[str]]:
    train_mask = feature_matrix["election_year"].isin([2009, 2015])
    train_df = feature_matrix.loc[train_mask].reset_index(drop=True)
    # Apply the same missingness imputation as features.py used.
    train_df = train_df.copy()
    for col in ("prior_vote_share", "prior_margin"):
        train_df[f"{col}_missing"] = train_df[col].isna().astype(int)
        train_df[col] = train_df[col].fillna(0.0)
    cols = _feature_columns(train_df)
    X = train_df[cols].astype(float).values
    y = train_df["won"].values
    return X, y, cols


def main() -> int:
    repo_root = Path(__file__).resolve().parents[3]
    clean_dir = repo_root / "data" / "clean"
    artefacts_dir = repo_root / "model" / "artefacts"

    feature_matrix = pd.read_parquet(clean_dir / "feature_matrix.parquet")
    constituencies = pd.read_parquet(clean_dir / "constituencies.parquet")
    report = json.loads(
        (artefacts_dir / "training_report.json").read_text(encoding="utf-8")
    )
    best_c = float(report["best_c"])

    # 1. Train calibrated model on full 2009+2015 training set (point estimate).
    X_train, y_train, train_cols = _prepare_training_data(feature_matrix)

    base = _build_pipeline()
    base.set_params(clf__C=best_c)
    calibrated = CalibratedClassifierCV(estimator=base, method="sigmoid", cv=5)
    calibrated.fit(X_train, y_train)

    # 2. Build 2026 feature matrix.
    features_2026 = build_2026_features(constituencies, feature_matrix)
    X_2026 = features_2026[train_cols].astype(float).values

    # 3. Point-estimate probabilities from the calibrated full-data model.
    p_point = calibrated.predict_proba(X_2026)[:, 1]

    # 4. Bootstrap for 80% CIs (uses uncalibrated bootstrap pipelines, matching
    #    the protocol used for the 2020 holdout intervals).
    median_boot, lower_boot, upper_boot, all_probs = bootstrap_probabilities(
        X_train, y_train, X_2026, best_c
    )

    out = features_2026[["constituency_id", "election_year", "party"]].copy()
    out["pred_proba"] = p_point
    out["ci_lower_80"] = lower_boot
    out["ci_upper_80"] = upper_boot
    out["bootstrap_median"] = median_boot

    out_csv = clean_dir / "predictions_2026.csv"
    out_parquet = clean_dir / "predictions_2026.parquet"
    out.sort_values(["constituency_id", "pred_proba"], ascending=[True, False]).to_csv(
        out_csv, index=False, encoding="utf-8"
    )
    out.to_parquet(out_parquet, index=False)

    # 5. Per-party seat projection. For each bootstrap iteration b:
    #      seat_count[party] = sum over constituencies of (party == argmax_party_prob)
    # We aggregate across iterations to get a range.
    party_seats_distribution: dict[str, list[int]] = {p: [] for p in PARTIES_2026}
    parties_arr = features_2026["party"].values
    constituency_arr = features_2026["constituency_id"].values
    constituencies_unique = list(dict.fromkeys(constituency_arr.tolist()))

    for b in range(all_probs.shape[0]):
        probs = all_probs[b]
        seat_count: dict[str, int] = dict.fromkeys(PARTIES_2026, 0)
        for cz in constituencies_unique:
            mask = constituency_arr == cz
            best_idx = np.argmax(probs[mask])
            best_party = parties_arr[mask][best_idx]
            seat_count[best_party] = seat_count.get(best_party, 0) + 1
        for p in PARTIES_2026:
            party_seats_distribution[p].append(seat_count.get(p, 0))

    party_summary: dict[str, dict[str, float]] = {}
    for p in PARTIES_2026:
        vals = np.array(party_seats_distribution[p])
        party_summary[p] = {
            "median": float(np.median(vals)),
            "p10": float(np.percentile(vals, 10)),
            "p90": float(np.percentile(vals, 90)),
            "mean": float(np.mean(vals)),
        }

    # Point-estimate seat counts from the calibrated model.
    point_seats: dict[str, int] = dict.fromkeys(PARTIES_2026, 0)
    for cz in constituencies_unique:
        mask = constituency_arr == cz
        best_idx = np.argmax(p_point[mask])
        best_party = parties_arr[mask][best_idx]
        point_seats[best_party] = point_seats.get(best_party, 0) + 1

    # Diagnose how informative the per-constituency probabilities are. If every
    # bootstrap iteration agrees the same party wins everywhere, the forecast
    # has collapsed to the federal-incumbent baseline.
    n_collapsed = sum(1 for cz in constituencies_unique
                      if max(point_seats.values()) >= len(constituencies_unique))
    forecast_is_informative = max(point_seats.values()) < len(constituencies_unique)

    summary = {
        "model_version": "v1-party-slate",
        "election_date": "2026-06-07",
        "federal_incumbent": FEDERAL_INCUMBENT_2026,
        "total_general_seats": len(constituencies_unique),
        "parties_scored": PARTIES_2026,
        "point_estimate_seats": point_seats,
        "bootstrap_80_ci_seats": party_summary,
        "n_bootstrap": int(all_probs.shape[0]),
        "forecast_is_informative": forecast_is_informative,
        "honest_finding": (
            "Without candidate-level features, the model collapses to the "
            "federal-incumbent baseline. It predicts the federal ruling party "
            "(PML-N for 2026) wins every constituency, which is essentially "
            "the same prediction the 11-of-24 baseline gave us on the 2020 "
            "holdout. This is NOT a useful constituency-level forecast. We "
            "are publishing the numbers transparently rather than pretending "
            "they have predictive power they do not have."
        )
        if not forecast_is_informative
        else None,
        "caveats": [
            "Per-candidate features set to neutral (no information) because the "
            "2026 candidate slate is not yet published in a machine-readable form.",
            "Probabilities represent 'if this party fields a competitive "
            "candidate here, our estimate of their win probability', NOT a "
            "calibrated forecast for the actual 2026 election.",
            "Once the candidate list is available, individual-candidate features "
            "(incumbent_running, party_switch_flag, prior_vote_share) will "
            "refine these predictions.",
            "2020 holdout accuracy of model v1 was 12 of 24 (50 percent), only "
            "marginally above the federal-incumbent baseline.",
        ],
    }
    (artefacts_dir / "forecast_summary_2026.json").write_text(
        json.dumps(summary, indent=2), encoding="utf-8"
    )

    print("=== 2026 party-slate forecast (point estimates) ===")
    for p in sorted(PARTIES_2026, key=lambda x: -point_seats.get(x, 0)):
        s = point_seats.get(p, 0)
        ci = party_summary[p]
        print(
            f"  {p:<14} {s:>3} seats   "
            f"80% CI: {int(ci['p10']):>2} - {int(ci['p90']):>2}   "
            f"(median {int(ci['median'])})"
        )
    print()
    print(f"Wrote: {out_csv}")
    print(f"Wrote: {artefacts_dir / 'forecast_summary_2026.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
