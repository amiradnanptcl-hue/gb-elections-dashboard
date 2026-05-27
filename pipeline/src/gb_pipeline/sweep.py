"""Sweep all 24 constituencies plus the 2020 election summary page.

Writes three CSVs into data/raw/:

  candidate_runs_constituency_pages.csv
      One row per (constituency, year, rank) from the per-constituency Wikipedia
      pages. Primary source for 2015 and 2020 detail. 2009 is winner-only here
      because the per-constituency pages do not have 2009 detail tables.

  candidate_runs_2020_summary.csv
      Winner and runner-up rows from the 2020 'By Constituency' table on the
      election summary page. Used for cross-validation against the constituency
      pages, and as the canonical source for party abbreviations.

  constituency_election_summary_2020.csv
      Per-constituency aggregates: district, registered voters, votes cast,
      turnout, winner-margin. Only 2020 for now. 2015 turnout will be backfilled
      from the constituency detail tables in a cleaning pass.

A scrape_manifest.csv records every fetch attempt with row counts and any
errors so reruns and audits can replay exactly what happened.
"""

from __future__ import annotations

import csv
import sys
import traceback
from dataclasses import asdict
from pathlib import Path

from gb_pipeline.scrape_wikipedia import (
    CONSTITUENCY_WIKI_SLUGS,
    CandidateRun,
    ConstituencyElectionSummary,
    build_url,
    scrape_2020_summary,
    scrape_constituency,
)


def _write_csv_rows(path: Path, rows: list[dict[str, object]], field_names: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=field_names)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def _write_candidate_runs(path: Path, runs: list[CandidateRun]) -> None:
    field_names = [
        "constituency_id", "election_year", "rank", "candidate_name", "party",
        "votes", "vote_share_pct", "won", "source_url", "fetched_at",
    ]
    _write_csv_rows(path, [asdict(r) for r in runs], field_names)


def _write_summaries(path: Path, rows: list[ConstituencyElectionSummary]) -> None:
    field_names = [
        "constituency_id", "election_year", "district", "registered_voters",
        "votes_cast", "turnout_pct", "margin", "source_url", "fetched_at",
    ]
    _write_csv_rows(path, [asdict(r) for r in rows], field_names)


def main() -> int:
    repo_root = Path(__file__).resolve().parents[3]
    raw_dir = repo_root / "data" / "raw"
    html_dir = raw_dir / "html"

    manifest: list[dict[str, object]] = []
    all_runs: list[CandidateRun] = []

    print(f"Sweeping {len(CONSTITUENCY_WIKI_SLUGS)} constituency pages...")
    for cid in CONSTITUENCY_WIKI_SLUGS:
        try:
            runs = scrape_constituency(cid, raw_html_dir=html_dir)
            all_runs.extend(runs)
            years = sorted({r.election_year for r in runs})
            print(f"  {cid:<8} -> {len(runs):>3} runs across years {years}")
            manifest.append({
                "source": "constituency_page",
                "key": cid,
                "url": build_url(cid),
                "rows_extracted": len(runs),
                "status": "ok",
                "error": "",
            })
        except Exception as e:
            print(f"  {cid:<8} -> ERROR: {e}", file=sys.stderr)
            traceback.print_exc()
            manifest.append({
                "source": "constituency_page",
                "key": cid,
                "url": build_url(cid),
                "rows_extracted": 0,
                "status": "error",
                "error": str(e),
            })

    print()
    print("Sweeping 2020 election summary page...")
    summary_runs: list[CandidateRun] = []
    summaries: list[ConstituencyElectionSummary] = []
    try:
        summary_runs, summaries = scrape_2020_summary(raw_html_dir=html_dir)
        print(f"  2020 summary -> {len(summary_runs)} winner/runner-up rows, "
              f"{len(summaries)} constituency summaries")
        manifest.append({
            "source": "summary_page",
            "key": "2020",
            "url": "https://en.wikipedia.org/wiki/2020_Gilgit-Baltistan_Assembly_election",
            "rows_extracted": len(summary_runs),
            "status": "ok",
            "error": "",
        })
    except Exception as e:
        print(f"  2020 summary -> ERROR: {e}", file=sys.stderr)
        traceback.print_exc()
        manifest.append({
            "source": "summary_page",
            "key": "2020",
            "url": "https://en.wikipedia.org/wiki/2020_Gilgit-Baltistan_Assembly_election",
            "rows_extracted": 0,
            "status": "error",
            "error": str(e),
        })

    _write_candidate_runs(raw_dir / "candidate_runs_constituency_pages.csv", all_runs)
    _write_candidate_runs(raw_dir / "candidate_runs_2020_summary.csv", summary_runs)
    _write_summaries(raw_dir / "constituency_election_summary_2020.csv", summaries)
    _write_csv_rows(
        raw_dir / "scrape_manifest.csv",
        manifest,
        ["source", "key", "url", "rows_extracted", "status", "error"],
    )

    print()
    print("=== Summary ===")
    by_year: dict[int, int] = {}
    for r in all_runs:
        by_year[r.election_year] = by_year.get(r.election_year, 0) + 1
    for year in sorted(by_year):
        print(f"  {year}: {by_year[year]:>3} candidate_runs from constituency pages")
    print(f"  2020 summary: {len(summary_runs)} winner+runner-up cross-validation rows")
    print(f"  2020 summary: {len(summaries)} per-constituency aggregates (turnout etc)")

    errors = [m for m in manifest if m["status"] == "error"]
    if errors:
        print(f"\n{len(errors)} fetch errors. See data/raw/scrape_manifest.csv.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
