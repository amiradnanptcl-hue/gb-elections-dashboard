"""Baseline forecast: the party in power at the federal centre wins every seat.

This is the threshold the production model has to beat. CLAUDE.md sets the
historical bar at roughly 18-20 of 24 seats per election; we verify that
against the cleaned data here and emit a JSON report.

Usage:
    uv run python -m gb_model.baseline
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd


def baseline_predictions(
    candidate_runs: pd.DataFrame, elections: pd.DataFrame, year: int
) -> pd.DataFrame:
    """For a given year, predict that the federal-ruling party wins every seat.

    Returns a DataFrame indexed by constituency with columns:
        predicted_party, actual_winner_party, correct (bool)
    """
    ruling = elections.loc[elections["year"] == year, "ruling_party_centre"].iloc[0]

    winners = (
        candidate_runs[(candidate_runs["election_year"] == year) & candidate_runs["won"]]
        .set_index("constituency_id")[["party", "candidate_name"]]
        .rename(columns={"party": "actual_winner_party", "candidate_name": "actual_winner"})
    )
    winners["predicted_party"] = ruling
    winners["correct"] = winners["actual_winner_party"] == ruling
    return winners[["predicted_party", "actual_winner_party", "actual_winner", "correct"]]


def evaluate(
    candidate_runs: pd.DataFrame,
    elections: pd.DataFrame,
    years: tuple[int, ...] = (2009, 2015, 2020),
) -> dict[str, object]:
    report: dict[str, object] = {"per_year": {}}
    for year in years:
        preds = baseline_predictions(candidate_runs, elections, year)
        n_total = len(preds)
        n_correct = int(preds["correct"].sum())
        ruling = elections.loc[elections["year"] == year, "ruling_party_centre"].iloc[0]
        report["per_year"][str(year)] = {
            "ruling_party_centre": ruling,
            "predicted_winners": n_total,
            "correct_predictions": n_correct,
            "accuracy": round(n_correct / n_total, 4) if n_total else None,
            "actual_winners_by_party": preds["actual_winner_party"]
            .value_counts()
            .to_dict(),
        }
    overall_correct = sum(
        v["correct_predictions"] for v in report["per_year"].values()
    )
    overall_total = sum(v["predicted_winners"] for v in report["per_year"].values())
    report["overall"] = {
        "correct": overall_correct,
        "total": overall_total,
        "accuracy": round(overall_correct / overall_total, 4) if overall_total else None,
    }
    return report


def main() -> int:
    repo_root = Path(__file__).resolve().parents[3]
    clean_dir = repo_root / "data" / "clean"

    candidate_runs = pd.read_parquet(clean_dir / "candidate_runs.parquet")
    elections = pd.read_parquet(clean_dir / "elections.parquet")

    report = evaluate(candidate_runs, elections)

    print("=== Baseline: federal-ruling party wins every seat ===\n")
    for year_str, year_report in report["per_year"].items():
        ypr = year_report  # type: ignore[assignment]
        if not isinstance(ypr, dict):
            continue
        ruling = ypr["ruling_party_centre"]
        acc = ypr["accuracy"]
        correct = ypr["correct_predictions"]
        total = ypr["predicted_winners"]
        winners_by_party = ypr["actual_winners_by_party"]
        print(f"{year_str}: predicted {ruling} wins every seat")
        print(f"  Correct: {correct}/{total}  (accuracy {acc})")
        print(f"  Actual winners by party: {winners_by_party}")
        print()

    overall = report["overall"]  # type: ignore[index]
    print(f"Overall: {overall['correct']}/{overall['total']}  (accuracy {overall['accuracy']})")

    artefacts_dir = repo_root / "model" / "artefacts"
    artefacts_dir.mkdir(parents=True, exist_ok=True)
    out_path = artefacts_dir / "baseline_report.json"
    out_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"\nWritten: {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
