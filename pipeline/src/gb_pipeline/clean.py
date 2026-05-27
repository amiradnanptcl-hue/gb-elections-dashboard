"""Reconcile raw scrapes into canonical clean tables.

Reads:
  data/raw/candidate_runs_constituency_pages.csv
  data/raw/candidate_runs_2020_summary.csv
  data/raw/constituency_election_summary_2020.csv

Writes:
  data/clean/candidate_runs.csv  (+ .parquet)
  data/clean/constituencies.csv  (+ .parquet)
  data/clean/elections.csv       (+ .parquet)
  data/clean/constituency_election_summary.csv  (+ .parquet)
  data/clean/parties.csv         — canonical party id -> display name

Merge logic for 2020:
  - Take the union of constituency-page rows and summary-page rows.
  - Fuzzy-match candidates within (constituency, year) using rapidfuzz; merge
    matches above 0.85 similarity into the candidate with the larger vote
    count (the constituency-page tables are usually the more authoritative
    source for vote counts; the summary page uses rounded or abbreviated
    party labels but otherwise agrees).
  - Re-rank by votes descending within each (constituency, year). The 'won'
    flag is recomputed from rank == 1.

All merges that fired are logged to data/manual_review/merge_decisions.csv so
they can be audited. Names that fail to merge but are suspiciously close
(0.75 .. 0.85 similarity) land in data/manual_review/name_review.csv.

Vote_share_pct is filled where missing by computing votes / sum(votes in same
constituency-year) * 100, marked with `vote_share_pct_imputed=true`. This is
an approximation — the true denominator includes invalid ballots which we do
not have — and is flagged in the methodology page.
"""

from __future__ import annotations

import csv
import sys
from collections import defaultdict
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

import pandas as pd
from rapidfuzz import fuzz

from gb_pipeline.parties import PARTY_DISPLAY, canonicalise
from gb_pipeline.scrape_wikipedia import CONSTITUENCY_WIKI_SLUGS

CANDIDATE_MERGE_THRESHOLD = 85.0
CANDIDATE_REVIEW_THRESHOLD = 75.0

# Honorifics and titles that Wikipedia editors include or omit at random.
# We strip these before comparing names so "Maulana Sultan Rais" can match
# "Sultan Rais" without also incorrectly merging "Muhammad Ali Akhtar" with
# "Muhammad Ali" (which token_set_ratio would otherwise rate at 100%).
NAME_TITLES = frozenset({
    "maulana", "maulvi", "mufti", "pir", "sahibzada", "sardar", "hajji", "hajj",
    "haji", "doctor", "dr", "dr.", "engr", "engr.", "engineer", "syed", "hafiz",
    "mir", "raja", "agha", "md", "sahib", "alhaj", "alhajj",
})


def _strip_titles(name: str) -> str:
    tokens = [t for t in name.replace(".", "").lower().split() if t not in NAME_TITLES]
    return " ".join(tokens) if tokens else name.lower()

# District lookup keyed by constituency_id, from the 2020 delimitation.
CONSTITUENCY_DISTRICT: dict[str, str] = {
    "GBA-1": "Gilgit", "GBA-2": "Gilgit", "GBA-3": "Gilgit",
    "GBA-4": "Nagar", "GBA-5": "Nagar",
    "GBA-6": "Hunza",
    "GBA-7": "Skardu", "GBA-8": "Skardu", "GBA-9": "Skardu", "GBA-10": "Skardu",
    "GBA-11": "Kharmang", "GBA-12": "Shigar",
    "GBA-13": "Astore", "GBA-14": "Astore",
    "GBA-15": "Diamer", "GBA-16": "Diamer", "GBA-17": "Diamer", "GBA-18": "Diamer",
    "GBA-19": "Ghizer", "GBA-20": "Ghizer", "GBA-21": "Ghizer",
    "GBA-22": "Ghanche", "GBA-23": "Ghanche", "GBA-24": "Ghanche",
}

# Constituency name (without GBA-N prefix) used on the dashboard.
CONSTITUENCY_NAME: dict[str, str] = {
    cid: slug.split("_", 1)[1].replace("-", " ").replace("_", " ")
    for cid, slug in CONSTITUENCY_WIKI_SLUGS.items()
}


@dataclass
class CleanRun:
    constituency_id: str
    election_year: int
    rank: int
    candidate_name: str
    party: str
    votes: int | None
    vote_share_pct: float | None
    vote_share_pct_imputed: bool
    won: bool
    source: str
    source_url: str
    fetched_at: str


def _read_csv(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    with path.open(encoding="utf-8") as f:
        return list(csv.DictReader(f))


def _to_int(value: Any) -> int | None:
    if value in (None, "", "None"):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _to_float(value: Any) -> float | None:
    if value in (None, "", "None"):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _to_bool(value: Any) -> bool:
    return str(value).strip().lower() in {"true", "1", "yes"}


def _merge_two_rows(primary: dict[str, Any], secondary: dict[str, Any]) -> dict[str, Any]:
    """Fold secondary's non-empty fields into primary where primary is missing."""
    merged = dict(primary)
    for key, val in secondary.items():
        if key in {"source", "source_url"}:
            continue
        if merged.get(key) in (None, "", "None"):
            merged[key] = val
    # Tag merged source.
    merged["source"] = (
        f"{primary['source']}+{secondary['source']}"
        if primary["source"] != secondary["source"]
        else primary["source"]
    )
    return merged


def _dedup_within_constituency_year(
    rows: list[dict[str, Any]],
    *,
    merge_decisions: list[dict[str, Any]],
    name_review: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Fuzzy-match candidate names within a single (constituency, year)."""
    # Sort by votes desc so the highest-vote row wins as primary on merge.
    rows = sorted(rows, key=lambda r: _to_int(r["votes"]) or -1, reverse=True)
    kept: list[dict[str, Any]] = []
    for row in rows:
        name = row["candidate_name"]
        name_stripped = _strip_titles(name)
        best_idx = -1
        best_score = 0.0
        for i, k in enumerate(kept):
            # Use order-aware sort_ratio on title-stripped names. token_set_ratio
            # is too lenient: it treats subset names ("Muhammad Ali" inside
            # "Muhammad Ali Akhtar") as 100% identical, which falsely merges
            # different candidates who happen to share a personal-name prefix.
            score = fuzz.token_sort_ratio(
                name_stripped, _strip_titles(k["candidate_name"])
            )
            if score > best_score:
                best_score = score
                best_idx = i
        if best_idx >= 0 and best_score >= CANDIDATE_MERGE_THRESHOLD:
            merged = _merge_two_rows(kept[best_idx], row)
            merge_decisions.append({
                "constituency_id": row["constituency_id"],
                "election_year": row["election_year"],
                "kept_name": kept[best_idx]["candidate_name"],
                "merged_name": name,
                "score": round(best_score, 1),
                "kept_votes": kept[best_idx].get("votes"),
                "merged_votes": row.get("votes"),
            })
            kept[best_idx] = merged
        elif best_idx >= 0 and best_score >= CANDIDATE_REVIEW_THRESHOLD:
            name_review.append({
                "constituency_id": row["constituency_id"],
                "election_year": row["election_year"],
                "name_a": kept[best_idx]["candidate_name"],
                "name_b": name,
                "score": round(best_score, 1),
            })
            kept.append(row)
        else:
            kept.append(row)
    return kept


def _impute_vote_share(rows: list[dict[str, Any]]) -> None:
    """Fill missing vote_share_pct from votes/sum(votes) within (constituency, year)."""
    groups: dict[tuple[str, int], list[dict[str, Any]]] = defaultdict(list)
    for r in rows:
        key = (r["constituency_id"], int(r["election_year"]))
        groups[key].append(r)

    for group in groups.values():
        total_votes = sum((_to_int(r["votes"]) or 0) for r in group)
        if total_votes == 0:
            continue
        for r in group:
            if r.get("vote_share_pct") in (None, "", "None"):
                votes = _to_int(r["votes"]) or 0
                r["vote_share_pct"] = round(votes / total_votes * 100, 2)
                r["vote_share_pct_imputed"] = True
            else:
                r["vote_share_pct_imputed"] = False


def _rerank(rows: list[dict[str, Any]]) -> None:
    groups: dict[tuple[str, int], list[dict[str, Any]]] = defaultdict(list)
    for r in rows:
        key = (r["constituency_id"], int(r["election_year"]))
        groups[key].append(r)
    for group in groups.values():
        group.sort(key=lambda r: _to_int(r["votes"]) or -1, reverse=True)
        for i, r in enumerate(group, start=1):
            r["rank"] = i
            r["won"] = i == 1


def clean_candidate_runs(
    raw_dir: Path,
    clean_dir: Path,
    review_dir: Path,
) -> list[CleanRun]:
    constituency_rows = _read_csv(raw_dir / "candidate_runs_constituency_pages.csv")
    summary_rows = _read_csv(raw_dir / "candidate_runs_2020_summary.csv")

    rows: list[dict[str, Any]] = []
    for r in constituency_rows:
        r["source"] = "wikipedia_constituency_page"
        rows.append(r)
    for r in summary_rows:
        r["source"] = "wikipedia_2020_summary"
        rows.append(r)

    # Canonicalise parties.
    for r in rows:
        r["party"] = canonicalise(r["party"])

    # Group by (constituency, year) and dedup.
    groups: dict[tuple[str, int], list[dict[str, Any]]] = defaultdict(list)
    for r in rows:
        key = (r["constituency_id"], int(r["election_year"]))
        groups[key].append(r)

    merge_decisions: list[dict[str, Any]] = []
    name_review: list[dict[str, Any]] = []
    deduped: list[dict[str, Any]] = []
    for group in groups.values():
        deduped.extend(
            _dedup_within_constituency_year(
                group,
                merge_decisions=merge_decisions,
                name_review=name_review,
            )
        )

    _rerank(deduped)
    _impute_vote_share(deduped)

    review_dir.mkdir(parents=True, exist_ok=True)
    if merge_decisions:
        pd.DataFrame(merge_decisions).to_csv(
            review_dir / "merge_decisions.csv", index=False, encoding="utf-8"
        )
    if name_review:
        pd.DataFrame(name_review).to_csv(
            review_dir / "name_review.csv", index=False, encoding="utf-8"
        )

    clean_runs: list[CleanRun] = []
    for r in deduped:
        clean_runs.append(
            CleanRun(
                constituency_id=r["constituency_id"],
                election_year=int(r["election_year"]),
                rank=r["rank"],
                candidate_name=r["candidate_name"],
                party=r["party"],
                votes=_to_int(r["votes"]),
                vote_share_pct=_to_float(r["vote_share_pct"]),
                vote_share_pct_imputed=bool(r.get("vote_share_pct_imputed", False)),
                won=bool(r["won"]),
                source=r["source"],
                source_url=r["source_url"],
                fetched_at=r["fetched_at"],
            )
        )
    return clean_runs


def write_parquet_and_csv(df: pd.DataFrame, base_path: Path) -> None:
    base_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(base_path.with_suffix(".csv"), index=False, encoding="utf-8")
    df.to_parquet(base_path.with_suffix(".parquet"), index=False)


def main() -> int:
    repo_root = Path(__file__).resolve().parents[3]
    raw_dir = repo_root / "data" / "raw"
    clean_dir = repo_root / "data" / "clean"
    review_dir = repo_root / "data" / "manual_review"

    clean_runs = clean_candidate_runs(raw_dir, clean_dir, review_dir)
    runs_df = pd.DataFrame([asdict(r) for r in clean_runs])
    runs_df = runs_df.sort_values(
        ["constituency_id", "election_year", "rank"]
    ).reset_index(drop=True)
    write_parquet_and_csv(runs_df, clean_dir / "candidate_runs")

    # constituencies.csv
    constituencies_rows = []
    for cid in CONSTITUENCY_WIKI_SLUGS:
        constituencies_rows.append({
            "constituency_id": cid,
            "name": CONSTITUENCY_NAME[cid],
            "district": CONSTITUENCY_DISTRICT[cid],
        })
    constituencies_df = pd.DataFrame(constituencies_rows)
    write_parquet_and_csv(constituencies_df, clean_dir / "constituencies")

    # elections.csv: one row per year with the ruling party at the centre.
    # Sources: 2009 PPP-led, 2015 PML-N, 2020 PTI-led / PML-N coalition in GB
    # (PML-N won GB in 2020 federally PTI was in power).
    elections_rows = [
        {"year": 2009, "poll_date": "2009-11-12", "ruling_party_centre": "PPP"},
        {"year": 2015, "poll_date": "2015-06-08", "ruling_party_centre": "PML-N"},
        {"year": 2020, "poll_date": "2020-11-15", "ruling_party_centre": "PTI"},
        {"year": 2026, "poll_date": "2026-06-07", "ruling_party_centre": "PML-N"},
    ]
    elections_df = pd.DataFrame(elections_rows)
    write_parquet_and_csv(elections_df, clean_dir / "elections")

    # constituency_election_summary.csv: 2020 turnout/registered data.
    summary_rows = _read_csv(raw_dir / "constituency_election_summary_2020.csv")
    summary_df = pd.DataFrame(summary_rows)
    if not summary_df.empty:
        for col in ("registered_voters", "votes_cast", "margin"):
            summary_df[col] = pd.to_numeric(summary_df[col], errors="coerce").astype("Int64")
        summary_df["turnout_pct"] = pd.to_numeric(summary_df["turnout_pct"], errors="coerce")
    write_parquet_and_csv(summary_df, clean_dir / "constituency_election_summary")

    # parties.csv: canonical id + display name.
    parties_df = pd.DataFrame(
        [{"party_id": pid, "display_name": disp} for pid, disp in PARTY_DISPLAY.items()]
    )
    write_parquet_and_csv(parties_df, clean_dir / "parties")

    # Summary report.
    print(f"Clean candidate_runs: {len(runs_df)} rows")
    print(f"  By year: {dict(runs_df['election_year'].value_counts().sort_index())}")
    print(f"  Constituencies covered: {runs_df['constituency_id'].nunique()}/24")
    print(f"  Imputed vote_share_pct: {int(runs_df['vote_share_pct_imputed'].sum())} rows")
    unknown_parties = runs_df[runs_df["party"].str.endswith("?", na=False)]
    if len(unknown_parties):
        print(f"  Unknown parties (need a mapping): {len(unknown_parties)} rows")
        for p in unknown_parties["party"].unique():
            count = int((unknown_parties["party"] == p).sum())
            print(f"    {p!r}: {count} rows")
    else:
        print("  All party strings mapped to canonical ids.")

    merge_csv = review_dir / "merge_decisions.csv"
    if merge_csv.exists():
        print(f"\nMerge decisions logged: {merge_csv}")
    review_csv = review_dir / "name_review.csv"
    if review_csv.exists():
        print(f"Borderline name pairs for review: {review_csv}")

    print(f"\nWritten to: {clean_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
