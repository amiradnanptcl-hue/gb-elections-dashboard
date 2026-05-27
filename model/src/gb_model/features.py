"""Feature engineering for the constituency forecast model.

Reads:
  data/clean/candidate_runs_with_id.parquet
  data/clean/constituencies.parquet
  data/clean/elections.parquet
  data/clean/constituency_election_summary.parquet

Writes:
  data/clean/feature_matrix.parquet  (+ .csv)

Each row of feature_matrix corresponds to one candidate_run (a single candidate
contesting a specific constituency in a specific election year). The target
variable `won` is preserved. Features are computed STRICTLY from data prior to
that row's election_year so there is no temporal leakage into training.

Implemented features (CLAUDE.md numbering):
  1. federal_incumbent_match
  2. incumbent_running
  3. party_switch_flag
  4. prior_vote_share
  5. prior_winner_party_match
  6. prior_margin
  7. district_dummies (one-hot)
 10. candidate_continuity_score

Deferred to v2 (data not yet ingested):
  8. sect_alignment            (needs constituency sect data)
  9. turnout_delta_2015_2020   (needs 2015 turnout; we only have 2020)
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd


ELECTION_YEARS = (2009, 2015, 2020)


def _most_recent_prior(
    series_by_year: pd.Series, current_year: int
) -> tuple[int | None, object]:
    """Return (year, value) for the highest year < current_year, or (None, None)."""
    prior = series_by_year[series_by_year.index < current_year]
    if prior.empty:
        return None, None
    last_year = prior.index.max()
    return last_year, prior.loc[last_year]


def _build_candidate_history(runs: pd.DataFrame) -> dict[str, list[dict]]:
    """For each candidate_id, return a list of run-records sorted by year."""
    history: dict[str, list[dict]] = {}
    for cid, group in runs.groupby("candidate_id"):
        sorted_group = group.sort_values("election_year")
        history[cid] = sorted_group[
            ["election_year", "constituency_id", "party", "vote_share_pct", "won", "rank"]
        ].to_dict("records")
    return history


def _build_constituency_history(runs: pd.DataFrame) -> dict[str, pd.DataFrame]:
    """For each constituency, return a DataFrame of historical winners + margins."""
    history: dict[str, pd.DataFrame] = {}
    for cid, group in runs.groupby("constituency_id"):
        # For each year, find winner and runner-up vote shares.
        records: list[dict[str, object]] = []
        for year, year_group in group.groupby("election_year"):
            ranked = year_group.sort_values("rank")
            winner_row = ranked.iloc[0]
            runner = ranked.iloc[1] if len(ranked) > 1 else None
            margin = (
                float(winner_row["vote_share_pct"]) - float(runner["vote_share_pct"])
                if runner is not None
                and pd.notna(winner_row["vote_share_pct"])
                and pd.notna(runner["vote_share_pct"])
                else None
            )
            records.append({
                "election_year": int(year),
                "winner_candidate_id": winner_row["candidate_id"],
                "winner_party": winner_row["party"],
                "winner_vote_share_pct": float(winner_row["vote_share_pct"])
                if pd.notna(winner_row["vote_share_pct"]) else None,
                "margin": margin,
            })
        history[cid] = pd.DataFrame(records).set_index("election_year")
    return history


def build_feature_matrix(
    runs: pd.DataFrame,
    elections: pd.DataFrame,
    constituencies: pd.DataFrame,
) -> pd.DataFrame:
    candidate_history = _build_candidate_history(runs)
    constituency_history = _build_constituency_history(runs)
    elections_indexed = elections.set_index("year")

    constituency_districts = (
        constituencies.set_index("constituency_id")["district"].to_dict()
    )

    feature_rows: list[dict[str, object]] = []

    for _, row in runs.iterrows():
        cid = row["candidate_id"]
        cz = row["constituency_id"]
        year = int(row["election_year"])
        party = row["party"]

        # Feature 1: federal_incumbent_match
        ruling = (
            elections_indexed.loc[year, "ruling_party_centre"]
            if year in elections_indexed.index
            else None
        )
        federal_incumbent_match = int(party == ruling) if ruling else 0

        # Build prior runs for this candidate (strictly < year).
        prior_runs = [
            r for r in candidate_history.get(cid, [])
            if r["election_year"] < year
        ]
        # Feature 10: candidate_continuity_score
        candidate_continuity_score = len(prior_runs)

        # Feature 4: prior_vote_share — from the most recent prior run, regardless
        # of constituency, since a candidate may move seats and still bring a
        # personal vote with them.
        prior_vote_share = (
            float(prior_runs[-1]["vote_share_pct"])
            if prior_runs and prior_runs[-1]["vote_share_pct"] is not None
            else None
        )

        # Feature 3: party_switch_flag — current party differs from the party
        # in the most recent prior run.
        party_switch_flag = (
            int(prior_runs[-1]["party"] != party)
            if prior_runs
            else 0
        )

        # Feature 2: incumbent_running — did this candidate win this constituency
        # in the most recent prior election (any year)?
        prior_same_constituency = [
            r for r in prior_runs if r["constituency_id"] == cz
        ]
        incumbent_running = (
            int(prior_same_constituency[-1]["won"])
            if prior_same_constituency
            else 0
        )

        # Constituency-level prior features.
        ch = constituency_history.get(cz)
        if ch is not None and not ch.empty:
            prior_in_constituency = ch[ch.index < year]
            if not prior_in_constituency.empty:
                last_year = prior_in_constituency.index.max()
                prior_winner_party = prior_in_constituency.loc[last_year, "winner_party"]
                prior_margin = prior_in_constituency.loc[last_year, "margin"]
                prior_winner_party_match = int(party == prior_winner_party)
            else:
                prior_winner_party = None
                prior_margin = None
                prior_winner_party_match = 0
        else:
            prior_winner_party = None
            prior_margin = None
            prior_winner_party_match = 0

        feature_rows.append({
            "candidate_id": cid,
            "constituency_id": cz,
            "election_year": year,
            "district": constituency_districts.get(cz, ""),
            "party": party,
            "candidate_name": row["candidate_name"],
            # Features.
            "federal_incumbent_match": federal_incumbent_match,
            "incumbent_running": incumbent_running,
            "party_switch_flag": party_switch_flag,
            "prior_vote_share": prior_vote_share,
            "prior_winner_party_match": prior_winner_party_match,
            "prior_margin": prior_margin,
            "candidate_continuity_score": candidate_continuity_score,
            # Provenance.
            "prior_winner_party": prior_winner_party,
            "vote_share_pct_imputed": bool(row.get("vote_share_pct_imputed", False)),
            # Target.
            "won": int(bool(row["won"])),
        })

    fdf = pd.DataFrame(feature_rows)

    # District one-hot (Feature 7).
    district_dummies = pd.get_dummies(fdf["district"], prefix="district", dtype=int)
    fdf = pd.concat([fdf, district_dummies], axis=1)

    return fdf


def main() -> int:
    repo_root = Path(__file__).resolve().parents[3]
    clean_dir = repo_root / "data" / "clean"

    runs = pd.read_parquet(clean_dir / "candidate_runs_with_id.parquet")
    elections = pd.read_parquet(clean_dir / "elections.parquet")
    constituencies = pd.read_parquet(clean_dir / "constituencies.parquet")

    fdf = build_feature_matrix(runs, elections, constituencies)

    out = clean_dir / "feature_matrix"
    fdf.to_csv(out.with_suffix(".csv"), index=False, encoding="utf-8")
    fdf.to_parquet(out.with_suffix(".parquet"), index=False)

    print(f"Feature matrix: {len(fdf)} rows, {len(fdf.columns)} columns")
    print(f"By year: {dict(fdf['election_year'].value_counts().sort_index())}")
    print(f"Target balance (won=1): {fdf['won'].sum()} of {len(fdf)} ({fdf['won'].mean():.3f})")
    print()
    print("=== Per-year feature coverage ===")
    feature_cols = [
        "federal_incumbent_match", "incumbent_running", "party_switch_flag",
        "prior_vote_share", "prior_winner_party_match", "prior_margin",
        "candidate_continuity_score",
    ]
    print(
        fdf.groupby("election_year")[feature_cols]
        .apply(lambda g: g.notna().mean().round(2))
        .to_string()
    )
    print(f"\nWritten: {out}.csv / .parquet")
    return 0


if __name__ == "__main__":
    sys.exit(main())
