"""Tests for the Wikipedia constituency + summary scrapers.

We feed cached HTML through the pure parsing functions and assert ground-truth
facts about the 2009/2015/2020 elections in specific constituencies. This
catches regressions in column detection, colspan expansion, malformed-row
filtering, and the summary-table fallback.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from gb_pipeline.scrape_wikipedia import (
    CONSTITUENCY_WIKI_SLUGS,
    parse_2020_summary,
    parse_constituency,
)

HTML_DIR = Path(__file__).resolve().parents[2] / "data" / "raw" / "html"


def _load(name: str) -> str:
    return (HTML_DIR / name).read_text(encoding="utf-8")


@pytest.mark.skipif(not HTML_DIR.exists(), reason="raw HTML cache absent")
class TestConstituencyParser:
    def test_gba_1_yields_three_elections(self) -> None:
        html = _load("GBA-1.html")
        runs = parse_constituency(html, "GBA-1", source_url="x", fetched_at="t")
        years = {r.election_year for r in runs}
        assert years == {2009, 2015, 2020}

    def test_gba_1_2020_winner(self) -> None:
        html = _load("GBA-1.html")
        runs = parse_constituency(html, "GBA-1", source_url="x", fetched_at="t")
        winners_2020 = [r for r in runs if r.election_year == 2020 and r.won]
        assert len(winners_2020) == 1
        assert winners_2020[0].candidate_name == "Amjad Hussain Azar"
        assert "Peoples Party" in winners_2020[0].party
        assert winners_2020[0].votes == 11178

    def test_gba_1_2015_full_detail(self) -> None:
        # The 2015 detail table on GBA-1 has colspan="2" on Party. If the
        # parser drops party labels, this test catches it.
        html = _load("GBA-1.html")
        runs = parse_constituency(html, "GBA-1", source_url="x", fetched_at="t")
        rows_2015 = sorted(
            (r for r in runs if r.election_year == 2015), key=lambda r: r.rank
        )
        assert len(rows_2015) >= 4
        assert rows_2015[0].candidate_name == "Jafarullah Khan"
        assert "Pakistan Muslim League (N)" in rows_2015[0].party
        # Vote share must be parsed (this asserts the % column was detected
        # past the corrupt swing column).
        assert rows_2015[0].vote_share_pct is not None
        assert 35.0 < rows_2015[0].vote_share_pct < 37.0

    def test_gba_19_no_phantom_vote_count_row(self) -> None:
        # GBA-19's Members of Assembly table has malformed 2015/2020 rows
        # where the Member column contains "5,229 votes" / "6,468 votes".
        # Those should be skipped, not captured as candidate names.
        html = _load("GBA-19.html")
        runs = parse_constituency(html, "GBA-19", source_url="x", fetched_at="t")
        names = {r.candidate_name for r in runs}
        for n in names:
            assert "votes" not in n.lower(), f"phantom vote-count row: {n!r}"

    def test_aggregate_others_row_dropped(self) -> None:
        # GBA-19's 2015 detail table has an "Independents & Others" aggregate.
        html = _load("GBA-19.html")
        runs = parse_constituency(html, "GBA-19", source_url="x", fetched_at="t")
        names = {r.candidate_name.lower() for r in runs}
        for n in names:
            assert not n.startswith("others"), f"aggregate row leaked: {n!r}"
            assert "& others" not in n, f"aggregate row leaked: {n!r}"


@pytest.mark.skipif(
    not (HTML_DIR / "2020_summary.html").exists(),
    reason="2020 summary HTML cache absent",
)
class TestSummaryParser:
    def test_2020_summary_covers_all_24_constituencies(self) -> None:
        html = _load("2020_summary.html")
        _, summaries = parse_2020_summary(
            html, source_url="x", fetched_at="t"
        )
        assert len(summaries) == 24
        assert {s.constituency_id for s in summaries} == set(CONSTITUENCY_WIKI_SLUGS)

    def test_2020_summary_winner_runner_up_pairs(self) -> None:
        html = _load("2020_summary.html")
        runs, _ = parse_2020_summary(html, source_url="x", fetched_at="t")
        # 24 constituencies x (winner + runner-up) = 48 rows.
        assert len(runs) == 48
        # Per constituency: rank=1 has higher votes than rank=2.
        from collections import defaultdict

        by_cz = defaultdict(list)
        for r in runs:
            by_cz[r.constituency_id].append(r)
        for cz, rows in by_cz.items():
            assert len(rows) == 2, f"{cz} should have winner+runner-up only"
            rows.sort(key=lambda r: r.rank)
            assert rows[0].rank == 1 and rows[0].won is True
            assert rows[1].rank == 2 and rows[1].won is False
            if rows[0].votes is not None and rows[1].votes is not None:
                assert rows[0].votes >= rows[1].votes
