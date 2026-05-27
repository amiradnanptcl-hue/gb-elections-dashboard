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
  2. incumbent_running
  3. party_switch_flag
  4. prior_vote_share                          (any prior run)
  5. prior_winner_party_match
  6. prior_margin
  7. district_dummies (one-hot)
 10. candidate_continuity_score

v1.1 lean additions to push 2020 holdout accuracy above the federal-incumbent
baseline (CLAUDE.md "honesty over performance" — verified leak-free, each
feature only inspects strictly earlier election years):
 11. prior_vote_share_same_constituency       (local-strongman signal)
 12. prior_rank_same_constituency              (challenger experience)
 13. party_constituency_recent_share           (party stronghold per seat)
 14. winner_party_continuity                   (same party won two in a row?)

v1.2: removed federal_incumbent_match (CLAUDE.md feature #1). Reason: on
historical data it carries strong tautological signal (whoever runs Islamabad
also tends to win GB), so it makes 2020-holdout numbers look stronger. But
in forward projection it collapses the 2026 forecast to "the federal ruling
party wins every seat", which (a) disagrees with the May 2026 deep-research
consensus that 2026 is a hung result, and (b) is just the federal-incumbent
baseline dressed up as a model output. We do not publish a 2026 forecast
without independent sentiment data, so we also remove the feature that was
producing the misleading 2026 collapse.

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

        # v1.2: dropped federal_incumbent_match. See module docstring for
        # rationale (forward-projection collapse to "federal ruling party
        # wins every seat" in 2026).

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

        # Feature 11: prior_vote_share_same_constituency. A candidate's prior
        # share in THIS specific seat (not their best run anywhere). This is
        # the single strongest signal for local strongmen (Independents and
        # party-switchers who keep a personal base) and incumbents.
        prior_vote_share_same_constituency = (
            float(prior_same_constituency[-1]["vote_share_pct"])
            if prior_same_constituency
            and prior_same_constituency[-1]["vote_share_pct"] is not None
            else None
        )

        # Feature 12: prior_rank_same_constituency. A rank-2 finish last time
        # marks a close-but-no-cigar challenger who often wins next round.
        prior_rank_same_constituency = (
            int(prior_same_constituency[-1]["rank"])
            if prior_same_constituency
            and prior_same_constituency[-1]["rank"] is not None
            else None
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
                # Feature 14: winner_party_continuity. If the same party won
                # the two most recent prior elections in this seat, the seat
                # is a stronghold. The current candidate's party matching
                # that stronghold party gets a strong positive signal.
                if len(prior_in_constituency) >= 2:
                    sorted_years = sorted(prior_in_constituency.index, reverse=True)
                    last_two_winners = [
                        prior_in_constituency.loc[y, "winner_party"]
                        for y in sorted_years[:2]
                    ]
                    same_party_twice = (
                        last_two_winners[0] == last_two_winners[1]
                        and last_two_winners[0] is not None
                    )
                    winner_party_continuity = (
                        int(party == last_two_winners[0])
                        if same_party_twice
                        else 0
                    )
                else:
                    winner_party_continuity = 0
            else:
                prior_winner_party = None
                prior_margin = None
                prior_winner_party_match = 0
                winner_party_continuity = 0
        else:
            prior_winner_party = None
            prior_margin = None
            prior_winner_party_match = 0
            winner_party_continuity = 0

        # Feature 13: party_constituency_recent_share. The average vote share
        # this party has scored in this specific seat across prior elections.
        # Captures party stronghold dynamics that the simple prior-winner
        # match misses (e.g. PML-N consistently second by 40 percent vs PML-N
        # winning once 51-49).
        party_prior_shares: list[float] = []
        for prev_year in (y for y in ELECTION_YEARS if y < year):
            ch_year = (runs[
                (runs["constituency_id"] == cz)
                & (runs["election_year"] == prev_year)
                & (runs["party"] == party)
            ])
            if not ch_year.empty:
                share = ch_year["vote_share_pct"].iloc[0]
                if pd.notna(share):
                    party_prior_shares.append(float(share))
        party_constituency_recent_share = (
            float(np.mean(party_prior_shares)) if party_prior_shares else None
        )

        feature_rows.append({
            "candidate_id": cid,
            "constituency_id": cz,
            "election_year": year,
            "district": constituency_districts.get(cz, ""),
            "party": party,
            "candidate_name": row["candidate_name"],
            # Original features (v1.2: federal_incumbent_match removed).
            "incumbent_running": incumbent_running,
            "party_switch_flag": party_switch_flag,
            "prior_vote_share": prior_vote_share,
            "prior_winner_party_match": prior_winner_party_match,
            "prior_margin": prior_margin,
            "candidate_continuity_score": candidate_continuity_score,
            # v1.1 lean additions.
            "prior_vote_share_same_constituency": prior_vote_share_same_constituency,
            "prior_rank_same_constituency": prior_rank_same_constituency,
            "party_constituency_recent_share": party_constituency_recent_share,
            "winner_party_continuity": winner_party_continuity,
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
        "incumbent_running", "party_switch_flag",
        "prior_vote_share", "prior_winner_party_match", "prior_margin",
        "candidate_continuity_score",
        "prior_vote_share_same_constituency", "prior_rank_same_constituency",
        "party_constituency_recent_share", "winner_party_continuity",
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
