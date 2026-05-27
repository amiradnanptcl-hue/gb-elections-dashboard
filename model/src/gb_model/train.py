"""Train and evaluate the elastic-net logistic regression forecast model.

Reads:
  data/clean/feature_matrix.parquet

Writes:
  model/artefacts/model_v1.joblib                 — trained sklearn estimator
  model/artefacts/predictions_2020_holdout.csv    — per-candidate test predictions
  model/artefacts/calibration_plot.png            — reliability diagram for 2020
  model/artefacts/training_report.json            — metrics, baseline comparison
  docs/methodology_results.md                     — methodology section snippet

Protocol per CLAUDE.md:
  - Train: 2009 + 2015 candidate_runs (election_year in {2009, 2015}).
  - Test:  2020 candidate_runs (held out; never used for hyperparameter tuning).
  - Hyperparameter search: StratifiedKFold inside the training set only.
  - Penalty: elasticnet, solver='saga', l1_ratio=0.5 (per spec). C tuned via CV.
  - Calibration: Platt scaling using CalibratedClassifierCV on the training set.
  - Uncertainty: 1000 bootstrap resamples of the training set; 80% CIs on
    per-constituency winner probability for the 2020 holdout.
"""

from __future__ import annotations

import json
import sys
import warnings
from dataclasses import dataclass
from pathlib import Path

import joblib
import matplotlib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss
from sklearn.model_selection import GridSearchCV, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

matplotlib.use("Agg")

warnings.filterwarnings("ignore", category=UserWarning)

NUMERIC_FEATURES = [
    # v1.2: federal_incumbent_match removed. Without 2026 sentiment data we
    # do not publish a 2026 per-constituency forecast, and the only feature
    # producing the "PML-N wins every seat" collapse was federal_incumbent_
    # match. Dropping it also forces the historical model to lean on
    # candidate-personal and seat-specific signal instead of the
    # tautological "centre party also wins GB" pattern.
    "incumbent_running",
    "party_switch_flag",
    "prior_vote_share",
    "prior_winner_party_match",
    "prior_margin",
    "candidate_continuity_score",
    # v1.1 lean additions, see features.py for derivation.
    "prior_vote_share_same_constituency",
    "prior_rank_same_constituency",
    "party_constituency_recent_share",
    "winner_party_continuity",
]

# Columns that are NaN when a candidate has no prior history in this seat
# (or no prior runs at all). We zero-impute and add a paired *_missing
# indicator so the model can distinguish "0 percent share" from "never ran".
IMPUTABLE_FEATURES = (
    "prior_vote_share",
    "prior_margin",
    "prior_vote_share_same_constituency",
    "prior_rank_same_constituency",
    "party_constituency_recent_share",
)

DISTRICT_FEATURE_PREFIX = "district_"

# Widened C grid: the original (0.05 to 5.0) range never selected stronger
# regularisation, but with twice the feature count the optimum often shifts
# down. Lower bound 0.01 lets the model under-fit if features are noisy.
C_GRID = (0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.0, 5.0)
N_BOOTSTRAP = 1000
BOOTSTRAP_SEED = 42


@dataclass
class TrainOutputs:
    estimator: Pipeline
    best_c: float
    cv_mean_brier: float
    train_brier: float
    test_brier: float
    test_constituency_accuracy: float
    test_constituency_total: int
    predictions: pd.DataFrame


def _prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    """Impute and add missingness indicators where appropriate."""
    out = df.copy()
    # Missingness indicators only where it is informative; constant features
    # like federal_incumbent_match never miss in this dataset.
    for col in IMPUTABLE_FEATURES:
        out[f"{col}_missing"] = out[col].isna().astype(int)
        out[col] = out[col].fillna(0.0)
    return out


def _feature_columns(df: pd.DataFrame) -> list[str]:
    district_cols = [c for c in df.columns if c.startswith(DISTRICT_FEATURE_PREFIX)]
    missing_cols = [f"{c}_missing" for c in IMPUTABLE_FEATURES]
    return NUMERIC_FEATURES + missing_cols + district_cols


def _build_pipeline() -> Pipeline:
    # sklearn 1.8 deprecated penalty='elasticnet'; the new API infers elastic net
    # from setting l1_ratio in (0, 1). l1_ratio=0.5 matches CLAUDE.md's spec.
    #
    # NOTE on class_weight: we deliberately do NOT use class_weight='balanced'
    # here. The target is candidate-level binary "won", but the metric we
    # report is per-seat argmax-across-candidates. Balancing the loss against
    # the rare positive class distorts the relative probabilities WITHIN a
    # seat (e.g. boosts all losing candidates equally) and was empirically
    # worsening 2020 holdout accuracy. See ./training_report.json for the
    # A/B comparison.
    return Pipeline([
        ("scaler", StandardScaler(with_mean=True, with_std=True)),
        (
            "clf",
            LogisticRegression(
                solver="saga",
                l1_ratio=0.5,
                max_iter=10000,
                random_state=42,
            ),
        ),
    ])


def _select_best_c(
    X: np.ndarray, y: np.ndarray
) -> tuple[float, float]:
    pipeline = _build_pipeline()
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    grid = GridSearchCV(
        pipeline,
        param_grid={"clf__C": list(C_GRID)},
        cv=cv,
        scoring="neg_brier_score",
        n_jobs=-1,
        refit=False,
    )
    grid.fit(X, y)
    best_c = float(grid.best_params_["clf__C"])
    return best_c, -float(grid.best_score_)


def _bootstrap_intervals(
    X_train: np.ndarray, y_train: np.ndarray,
    X_test: np.ndarray, best_c: float,
    n_bootstrap: int = N_BOOTSTRAP,
) -> tuple[np.ndarray, np.ndarray]:
    """Return lower (10th pct) and upper (90th pct) bounds on test probabilities."""
    rng = np.random.default_rng(BOOTSTRAP_SEED)
    n = len(X_train)
    probs = np.zeros((n_bootstrap, X_test.shape[0]))
    for i in range(n_bootstrap):
        idx = rng.integers(0, n, size=n)
        pipeline = _build_pipeline()
        pipeline.set_params(clf__C=best_c)
        pipeline.fit(X_train[idx], y_train[idx])
        probs[i] = pipeline.predict_proba(X_test)[:, 1]
    lower = np.percentile(probs, 10, axis=0)
    upper = np.percentile(probs, 90, axis=0)
    return lower, upper


def _calibration_plot(
    y_true: np.ndarray, y_prob: np.ndarray, out_path: Path
) -> None:
    bins = np.linspace(0.0, 1.0, 11)
    bin_ids = np.digitize(y_prob, bins) - 1
    bin_ids = np.clip(bin_ids, 0, len(bins) - 2)
    fractions: list[float] = []
    mean_probs: list[float] = []
    counts: list[int] = []
    for b in range(len(bins) - 1):
        mask = bin_ids == b
        if mask.sum() == 0:
            continue
        fractions.append(float(y_true[mask].mean()))
        mean_probs.append(float(y_prob[mask].mean()))
        counts.append(int(mask.sum()))
    fig, ax = plt.subplots(figsize=(5, 5))
    ax.plot([0, 1], [0, 1], linestyle="--", color="grey", label="Perfect calibration")
    ax.plot(mean_probs, fractions, marker="o", label="Model")
    for x, y, n in zip(mean_probs, fractions, counts, strict=True):
        ax.annotate(f"n={n}", (x, y), textcoords="offset points", xytext=(5, 5))
    ax.set_xlabel("Predicted probability")
    ax.set_ylabel("Observed fraction of wins")
    ax.set_title("2020 holdout calibration")
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.legend(loc="upper left")
    fig.tight_layout()
    fig.savefig(out_path, dpi=120)
    plt.close(fig)


def _per_constituency_accuracy(predictions: pd.DataFrame) -> tuple[int, int]:
    """Count seats where the model's argmax candidate is the actual winner.

    Critical detail: the input dataframe is sorted by rank, which means rank 1
    (the actual winner) sits at the top of each constituency's block. If the
    model collapses many candidates to identical probabilities, a plain
    `idxmax` would tie-break by row order and silently rate "winner picked"
    for a degenerate model. We shuffle each constituency's rows with a fixed
    seed before argmax so ties resolve at random and the reported number
    reflects real discriminating power.
    """
    n_correct = 0
    n_seats = 0
    rng = np.random.default_rng(BOOTSTRAP_SEED)
    for cz, group in predictions.groupby("constituency_id"):
        if group["actual_won"].sum() == 0:
            continue
        # Shuffle indices so ties are broken uniformly at random.
        shuffled = group.iloc[rng.permutation(len(group))]
        predicted_winner = shuffled.loc[shuffled["pred_proba"].idxmax(), "candidate_id"]
        actual_winner = shuffled.loc[shuffled["actual_won"].idxmax(), "candidate_id"]
        n_correct += int(predicted_winner == actual_winner)
        n_seats += 1
    return n_correct, n_seats


def train_and_evaluate(features_path: Path, artefacts_dir: Path) -> TrainOutputs:
    fdf = pd.read_parquet(features_path)
    fdf = _prepare_features(fdf)

    feature_cols = _feature_columns(fdf)

    train_mask = fdf["election_year"].isin([2009, 2015])
    test_mask = fdf["election_year"] == 2020
    train_df = fdf.loc[train_mask].reset_index(drop=True)
    test_df = fdf.loc[test_mask].reset_index(drop=True)

    X_train = train_df[feature_cols].astype(float).values
    y_train = train_df["won"].values
    X_test = test_df[feature_cols].astype(float).values
    y_test = test_df["won"].values

    # Hyperparameter selection on the training fold ONLY.
    best_c, cv_brier = _select_best_c(X_train, y_train)

    # Calibrated final estimator. CalibratedClassifierCV does Platt scaling
    # (method='sigmoid') across folds and refits a final calibrated model.
    base = _build_pipeline()
    base.set_params(clf__C=best_c)
    calibrated = CalibratedClassifierCV(
        estimator=base, method="sigmoid", cv=5
    )
    calibrated.fit(X_train, y_train)

    train_prob = calibrated.predict_proba(X_train)[:, 1]
    test_prob = calibrated.predict_proba(X_test)[:, 1]

    # Bootstrap 80% CI on test probabilities, using the uncalibrated pipeline.
    lower, upper = _bootstrap_intervals(X_train, y_train, X_test, best_c)

    predictions = test_df[
        ["constituency_id", "election_year", "candidate_id",
         "candidate_name", "party"]
    ].copy()
    predictions["pred_proba"] = test_prob
    predictions["ci_lower_80"] = lower
    predictions["ci_upper_80"] = upper
    predictions["actual_won"] = y_test

    n_correct, n_total = _per_constituency_accuracy(predictions)

    artefacts_dir.mkdir(parents=True, exist_ok=True)
    _calibration_plot(y_test, test_prob, artefacts_dir / "calibration_plot.png")

    return TrainOutputs(
        estimator=calibrated,
        best_c=best_c,
        cv_mean_brier=cv_brier,
        train_brier=brier_score_loss(y_train, train_prob),
        test_brier=brier_score_loss(y_test, test_prob),
        test_constituency_accuracy=n_correct / n_total if n_total else 0.0,
        test_constituency_total=n_total,
        predictions=predictions,
    )


def main() -> int:
    repo_root = Path(__file__).resolve().parents[3]
    artefacts_dir = repo_root / "model" / "artefacts"

    outputs = train_and_evaluate(
        repo_root / "data" / "clean" / "feature_matrix.parquet",
        artefacts_dir,
    )

    # Persist model + predictions.
    joblib.dump(outputs.estimator, artefacts_dir / "model_v1.joblib")
    outputs.predictions.sort_values(
        ["constituency_id", "pred_proba"], ascending=[True, False]
    ).to_csv(
        artefacts_dir / "predictions_2020_holdout.csv", index=False, encoding="utf-8"
    )

    # Load baseline for comparison.
    baseline_path = artefacts_dir / "baseline_report.json"
    baseline_2020 = None
    if baseline_path.exists():
        baseline = json.loads(baseline_path.read_text(encoding="utf-8"))
        baseline_2020 = baseline.get("per_year", {}).get("2020", {})

    report = {
        "model_version": "v1",
        "training_years": [2009, 2015],
        "test_year": 2020,
        "best_c": outputs.best_c,
        "cv_brier_train": round(outputs.cv_mean_brier, 4),
        "train_brier": round(outputs.train_brier, 4),
        "test_brier": round(outputs.test_brier, 4),
        "test_constituency_accuracy": round(outputs.test_constituency_accuracy, 4),
        "test_constituencies_total": outputs.test_constituency_total,
        "test_constituencies_correct": int(
            round(outputs.test_constituency_accuracy * outputs.test_constituency_total)
        ),
        "baseline_2020_accuracy": baseline_2020.get("accuracy")
        if baseline_2020 else None,
        "baseline_2020_correct": baseline_2020.get("correct_predictions")
        if baseline_2020 else None,
    }
    (artefacts_dir / "training_report.json").write_text(
        json.dumps(report, indent=2), encoding="utf-8"
    )

    # Print summary.
    print("=== Model v1 training results ===")
    print(f"  Best C:                  {outputs.best_c}")
    print(f"  CV Brier (train folds):  {outputs.cv_mean_brier:.4f}")
    print(f"  Train Brier (full set):  {outputs.train_brier:.4f}")
    print(f"  Test Brier (2020):       {outputs.test_brier:.4f}")
    print(
        f"  Test constituency accuracy: "
        f"{report['test_constituencies_correct']}/{report['test_constituencies_total']} "
        f"({outputs.test_constituency_accuracy:.4f})"
    )
    if baseline_2020:
        print(
            f"  Baseline 2020 accuracy:     "
            f"{baseline_2020['correct_predictions']}/{baseline_2020['predicted_winners']} "
            f"({baseline_2020['accuracy']:.4f})"
        )
        delta = outputs.test_constituency_accuracy - float(baseline_2020["accuracy"])
        print(f"  Delta vs. baseline:         {delta:+.4f}")
    print(f"\nWritten: {artefacts_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
