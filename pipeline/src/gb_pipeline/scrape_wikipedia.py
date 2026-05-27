"""Wikipedia constituency-page scraper for the Gilgit-Baltistan Legislative Assembly.

Each constituency has a Wikipedia page (e.g. GBA-1 (Gilgit-I)) with one results
table per election (2009, 2015, 2020). This module fetches a page, parses every
wikitable that follows a heading naming an election year, and emits one
candidate_run row per ranked candidate.

Output schema matches the candidate_runs table in CLAUDE.md.
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
from collections.abc import Iterator
from dataclasses import asdict, dataclass
from pathlib import Path

from bs4 import BeautifulSoup, NavigableString, Tag

from gb_pipeline.http import fetch

# Wikipedia slugs for each constituency, verified by extracting hrefs from
# the 2020 GB election summary 'By Constituency' table. The constituency-to-
# district numbering reflects the 2020 delimitation.
CONSTITUENCY_WIKI_SLUGS: dict[str, str] = {
    "GBA-1": "GBA-1_Gilgit-I",
    "GBA-2": "GBA-2_Gilgit-II",
    "GBA-3": "GBA-3_Gilgit-III",
    "GBA-4": "GBA-4_Nagar-I",
    "GBA-5": "GBA-5_Nagar-II",
    "GBA-6": "GBA-6_Hunza",
    "GBA-7": "GBA-7_Skardu-I",
    "GBA-8": "GBA-8_Skardu-II",
    "GBA-9": "GBA-9_Skardu-III",
    "GBA-10": "GBA-10_Skardu-IV",
    "GBA-11": "GBA-11_Kharmang",
    "GBA-12": "GBA-12_Shigar",
    "GBA-13": "GBA-13_Astore-I",
    "GBA-14": "GBA-14_Astore-II",
    "GBA-15": "GBA-15_Diamer-I",
    "GBA-16": "GBA-16_Diamer-II",
    "GBA-17": "GBA-17_Diamer-III",
    "GBA-18": "GBA-18_Diamer-IV",
    "GBA-19": "GBA-19_Ghizer-I",
    "GBA-20": "GBA-20_Ghizer-II",
    "GBA-21": "GBA-21_Ghizer-III",
    "GBA-22": "GBA-22_Ghanche-I",
    "GBA-23": "GBA-23_Ghanche-II",
    "GBA-24": "GBA-24_Ghanche-III",
}

ELECTION_YEARS = (2009, 2015, 2020)

# Lines we should drop from results tables: totals, turnout, majority, holds.
SKIP_ROW_PATTERNS = (
    re.compile(r"\btotal\b", re.IGNORECASE),
    re.compile(r"\bturnout\b", re.IGNORECASE),
    re.compile(r"\bmajority\b", re.IGNORECASE),
    re.compile(r"\bregistered\b", re.IGNORECASE),
    re.compile(r"\brejected\b", re.IGNORECASE),
    re.compile(r"\bhold\b", re.IGNORECASE),
    re.compile(r"\bgain\b", re.IGNORECASE),
    re.compile(r"\bswing\b", re.IGNORECASE),
)

# Candidate-name strings that mark an aggregate row, not an individual.
AGGREGATE_CANDIDATE_PATTERNS = (
    re.compile(r"^others?\b", re.IGNORECASE),
    re.compile(r"^other candidates", re.IGNORECASE),
)


@dataclass
class CandidateRun:
    constituency_id: str
    election_year: int
    rank: int
    candidate_name: str
    party: str
    votes: int | None
    vote_share_pct: float | None
    won: bool
    source_url: str
    fetched_at: str


@dataclass
class ConstituencyElectionSummary:
    """Per-constituency, per-year aggregates: registered voters, turnout, etc."""

    constituency_id: str
    election_year: int
    district: str | None
    registered_voters: int | None
    votes_cast: int | None
    turnout_pct: float | None
    margin: int | None
    source_url: str
    fetched_at: str


def build_url(constituency_id: str) -> str:
    slug = CONSTITUENCY_WIKI_SLUGS.get(constituency_id)
    if slug is None:
        raise KeyError(f"No Wikipedia slug mapped for {constituency_id}")
    return f"https://en.wikipedia.org/wiki/{slug}"


def _text(node: Tag | NavigableString | None) -> str:
    if node is None:
        return ""
    return re.sub(r"\s+", " ", node.get_text(" ", strip=True)).strip()


def _detect_year(heading_text: str) -> int | None:
    for year in ELECTION_YEARS:
        if str(year) in heading_text:
            return year
    return None


def _nearest_heading_year(table: Tag) -> int | None:
    """Walk backward through siblings and ancestors looking for an h2/h3/h4 with a year."""
    node: Tag | NavigableString | None = table
    while node is not None:
        prev = node.previous_element if isinstance(node, Tag) else None
        # Walk all previous elements until a heading is found.
        cursor = prev
        while cursor is not None:
            if isinstance(cursor, Tag) and cursor.name in {"h2", "h3", "h4"}:
                year = _detect_year(_text(cursor))
                if year is not None:
                    return year
                break
            cursor = cursor.previous_element
        # If we didn't find a year-bearing heading, climb to the table's parent and try again.
        if isinstance(node, Tag):
            node = node.parent
        else:
            return None
    return None


def _clean_party(text: str) -> str:
    # Wikipedia party cells often look like "PPP" or "Pakistan Peoples Party (PPP)".
    # Strip wiki annotations like "[a]" or trailing footnote markers.
    text = re.sub(r"\[[^\]]+\]", "", text).strip()
    return text


def _clean_candidate(text: str) -> str:
    text = re.sub(r"\[[^\]]+\]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _parse_votes(text: str) -> int | None:
    digits = re.sub(r"[^\d]", "", text)
    return int(digits) if digits else None


def _parse_pct(text: str) -> float | None:
    match = re.search(r"(\d+(?:\.\d+)?)", text)
    return float(match.group(1)) if match else None


def _should_skip(row_text: str) -> bool:
    return any(p.search(row_text) for p in SKIP_ROW_PATTERNS)


def _expand_colspans(cells: list[Tag]) -> list[str]:
    """Return lowercased text values, repeating cells with colspan > 1.

    Wikipedia election tables often render the party column as a swatch + label
    with the header marked colspan=2. Data rows then have an extra leading cell
    that the header would otherwise hide. Expanding colspans makes header and
    data widths line up.
    """
    expanded: list[str] = []
    for c in cells:
        try:
            span = int(c.get("colspan") or 1)
        except (TypeError, ValueError):
            span = 1
        text = _text(c).lower()
        expanded.extend([text] * span)
    return expanded


def _table_columns(table: Tag) -> list[str]:
    """Return lowercased header strings with colspans expanded."""
    head_row = table.find("tr")
    if head_row is None:
        return []
    return _expand_colspans(head_row.find_all(["th", "td"]))


def _iter_data_rows(table: Tag) -> Iterator[list[Tag]]:
    rows = table.find_all("tr")
    for row in rows[1:]:
        cells = row.find_all(["td", "th"])
        if cells:
            yield cells


def _index_of(headers: list[str], *needles: str) -> int | None:
    """Return the first column whose header contains any needle. Substring match."""
    for i, h in enumerate(headers):
        for n in needles:
            if n in h:
                return i
    return None


def _col(
    headers: list[str],
    *needles: str,
    prefer_last: bool = False,
    exact: bool = False,
) -> int | None:
    """Locate a column by header text.

    `prefer_last=True` returns the rightmost match, which is the right behaviour
    for headers that may have been colspan-expanded (e.g. a Party header that
    spans the swatch cell and the label cell — we want the label slot, which
    is the rightmost duplicate).

    `exact=True` requires header equality rather than substring containment.
    """
    matches: list[int] = []
    for i, h in enumerate(headers):
        for n in needles:
            if (exact and h == n) or (not exact and n in h):
                matches.append(i)
                break
    if not matches:
        return None
    return matches[-1] if prefer_last else matches[0]


def _parse_summary_table(
    table: Tag, constituency_id: str, *, source_url: str, fetched_at: str
) -> list[CandidateRun]:
    """Parse a 'Members of Assembly' summary table.

    Yields one rank=1 winner row per election year listed. Used as a fallback
    for years without a dedicated detail table (typically 2009 on most pages,
    since editors rarely back-fill detail tables for the older election).
    """
    headers = _table_columns(table)
    if not headers:
        return []
    election_idx = _col(headers, "election", prefer_last=True)
    member_idx = _col(headers, "member", "name")
    party_idx = _col(headers, "party", prefer_last=True)
    votes_idx = _col(headers, "votes")
    if election_idx is None or member_idx is None:
        return []

    out: list[CandidateRun] = []
    for cells in _iter_data_rows(table):
        if (
            election_idx >= len(cells)
            or member_idx >= len(cells)
        ):
            continue
        year_text = _text(cells[election_idx])
        year = _detect_year(year_text)
        if year is None:
            continue
        candidate = _clean_candidate(_text(cells[member_idx]))
        if not candidate:
            continue
        # Skip malformed rows where the Member cell actually contains a vote
        # count (e.g. GBA-19's 2015/2020 rows on Wikipedia have just '5,229
        # votes' with the Member name omitted). A real candidate name will not
        # match this pattern.
        if re.fullmatch(r"[\d,]+\s*votes?", candidate, flags=re.IGNORECASE):
            continue
        party = (
            _clean_party(_text(cells[party_idx]))
            if party_idx is not None and party_idx < len(cells)
            else ""
        )
        votes = (
            _parse_votes(_text(cells[votes_idx]))
            if votes_idx is not None and votes_idx < len(cells)
            else None
        )
        out.append(
            CandidateRun(
                constituency_id=constituency_id,
                election_year=year,
                rank=1,
                candidate_name=candidate,
                party=party,
                votes=votes,
                vote_share_pct=None,
                won=True,
                source_url=source_url,
                fetched_at=fetched_at,
            )
        )
    return out


def _is_summary_table(table: Tag) -> bool:
    """A 'Members of Assembly' table has Election + Member columns."""
    headers = _table_columns(table)
    return _col(headers, "election") is not None and (
        _col(headers, "member", "name") is not None
    )


def parse_constituency(
    html: str, constituency_id: str, *, source_url: str, fetched_at: str
) -> list[CandidateRun]:
    soup = BeautifulSoup(html, "lxml")
    runs: list[CandidateRun] = []
    summary_winners: list[CandidateRun] = []

    for table in soup.find_all("table", class_=lambda c: bool(c) and "wikitable" in c):
        if _is_summary_table(table):
            summary_winners.extend(
                _parse_summary_table(
                    table, constituency_id, source_url=source_url, fetched_at=fetched_at
                )
            )
            continue

        year = _nearest_heading_year(table)
        if year is None:
            continue

        headers = _table_columns(table)
        if not headers:
            continue

        party_idx = _col(headers, "party", prefer_last=True)
        candidate_idx = _col(headers, "candidate")
        votes_idx = _col(headers, "votes")
        # Exact "%" first to avoid catching a swing column like "±%" or "�%".
        pct_idx = _col(headers, "%", exact=True)
        if pct_idx is None:
            pct_idx = _col(headers, "percent")

        # Wikipedia election infobox tables sometimes use unlabelled party
        # colour cells; the second column tends to be candidate. If we can't
        # find a "Candidate" header but we do find Votes, fall back to the
        # column to the left of votes.
        if candidate_idx is None and votes_idx is not None and votes_idx >= 1:
            candidate_idx = votes_idx - 1
        if candidate_idx is None or votes_idx is None:
            continue

        ranked: list[tuple[int, str, str, float | None]] = []
        for cells in _iter_data_rows(table):
            row_text = " | ".join(_text(c) for c in cells)
            if _should_skip(row_text):
                continue

            if candidate_idx >= len(cells) or votes_idx >= len(cells):
                continue

            candidate = _clean_candidate(_text(cells[candidate_idx]))
            if not candidate or candidate.lower() in {"candidate", "name"}:
                continue
            if any(p.match(candidate) for p in AGGREGATE_CANDIDATE_PATTERNS):
                continue

            votes = _parse_votes(_text(cells[votes_idx]))
            if votes is None:
                continue

            party = (
                _clean_party(_text(cells[party_idx]))
                if party_idx is not None and party_idx < len(cells)
                else ""
            )
            pct = (
                _parse_pct(_text(cells[pct_idx]))
                if pct_idx is not None and pct_idx < len(cells)
                else None
            )
            ranked.append((votes, candidate, party, pct))

        if not ranked:
            continue

        ranked.sort(key=lambda r: r[0], reverse=True)
        for rank_idx, (votes, candidate, party, pct) in enumerate(ranked, start=1):
            runs.append(
                CandidateRun(
                    constituency_id=constituency_id,
                    election_year=year,
                    rank=rank_idx,
                    candidate_name=candidate,
                    party=party,
                    votes=votes,
                    vote_share_pct=pct,
                    won=(rank_idx == 1),
                    source_url=source_url,
                    fetched_at=fetched_at,
                )
            )

    # Fill years that had no detail table with summary-table winner-only rows.
    years_with_detail = {r.election_year for r in runs}
    for winner in summary_winners:
        if winner.election_year in years_with_detail:
            continue
        runs.append(winner)

    runs.sort(key=lambda r: (r.election_year, r.rank))
    return runs


def scrape_constituency(
    constituency_id: str, *, raw_html_dir: Path | None = None
) -> list[CandidateRun]:
    url = build_url(constituency_id)
    result = fetch(url)

    if raw_html_dir is not None:
        raw_html_dir.mkdir(parents=True, exist_ok=True)
        (raw_html_dir / f"{constituency_id}.html").write_text(result.html, encoding="utf-8")

    return parse_constituency(
        result.html,
        constituency_id,
        source_url=result.url,
        fetched_at=result.fetched_at,
    )


# ---------------------------------------------------------------------------
# 2020 GB election summary page — "By Constituency" table.
# Captures registered_voters / votes_cast / turnout that constituency pages
# generally omit, plus cross-validation for winner and runner-up.
# ---------------------------------------------------------------------------

CONSTITUENCY_ID_RE = re.compile(r"^GBA-\d+$")
SUMMARY_2020_URL = (
    "https://en.wikipedia.org/wiki/2020_Gilgit-Baltistan_Assembly_election"
)


def _by_constituency_table(soup: BeautifulSoup) -> Tag | None:
    """The summary page's per-constituency table is identified by columns Winner + Runner-up."""
    for table in soup.find_all("table", class_=lambda c: bool(c) and "wikitable" in c):
        headers_row = table.find("tr")
        if headers_row is None:
            continue
        text = _text(headers_row).lower()
        if "winner" in text and "runner" in text:
            return table
    return None


def parse_2020_summary(
    html: str, *, source_url: str, fetched_at: str
) -> tuple[list[CandidateRun], list[ConstituencyElectionSummary]]:
    """Parse the 2020 'By Constituency' table.

    Returns (winner+runner-up CandidateRun rows, ConstituencyElectionSummary rows).
    The CandidateRun rows are intended for cross-validation against the
    constituency-page extractions, not as the primary source for 2020 detail.
    """
    soup = BeautifulSoup(html, "lxml")
    table = _by_constituency_table(soup)
    if table is None:
        return [], []

    runs: list[CandidateRun] = []
    summaries: list[ConstituencyElectionSummary] = []
    current_district: str | None = None

    rows = table.find_all("tr")
    # First two rows are nested headers (Winner/Runner-up groups + sub-columns).
    for row in rows[2:]:
        cells = row.find_all(["td", "th"])
        if not cells:
            continue
        texts = [_text(c) for c in cells]

        # When district is the same as the previous row, Wikipedia omits the
        # district cell (rowspan). Detect this by checking if the first cell
        # already looks like a constituency id.
        if CONSTITUENCY_ID_RE.match(texts[0]):
            district = current_district
            offset = 0
        else:
            district = texts[0]
            current_district = district
            offset = 1

        # Need at least: constituency_id + 4 winner cells + 4 runner cells = 9.
        if len(texts) < offset + 9:
            continue

        constituency_id = texts[offset]
        if not CONSTITUENCY_ID_RE.match(constituency_id):
            continue

        winner_name = _clean_candidate(texts[offset + 1])
        winner_party = _clean_party(texts[offset + 2])
        winner_votes = _parse_votes(texts[offset + 3])
        winner_pct = _parse_pct(texts[offset + 4])
        runner_name = _clean_candidate(texts[offset + 5])
        runner_party = _clean_party(texts[offset + 6])
        runner_votes = _parse_votes(texts[offset + 7])
        runner_pct = _parse_pct(texts[offset + 8])

        margin = _parse_votes(texts[offset + 9]) if offset + 9 < len(texts) else None
        registered = _parse_votes(texts[offset + 10]) if offset + 10 < len(texts) else None
        cast = _parse_votes(texts[offset + 11]) if offset + 11 < len(texts) else None
        turnout = _parse_pct(texts[offset + 12]) if offset + 12 < len(texts) else None

        if winner_name and winner_votes is not None:
            runs.append(
                CandidateRun(
                    constituency_id=constituency_id,
                    election_year=2020,
                    rank=1,
                    candidate_name=winner_name,
                    party=winner_party,
                    votes=winner_votes,
                    vote_share_pct=winner_pct,
                    won=True,
                    source_url=source_url,
                    fetched_at=fetched_at,
                )
            )
        if runner_name and runner_votes is not None:
            runs.append(
                CandidateRun(
                    constituency_id=constituency_id,
                    election_year=2020,
                    rank=2,
                    candidate_name=runner_name,
                    party=runner_party,
                    votes=runner_votes,
                    vote_share_pct=runner_pct,
                    won=False,
                    source_url=source_url,
                    fetched_at=fetched_at,
                )
            )

        summaries.append(
            ConstituencyElectionSummary(
                constituency_id=constituency_id,
                election_year=2020,
                district=district,
                registered_voters=registered,
                votes_cast=cast,
                turnout_pct=turnout,
                margin=margin,
                source_url=source_url,
                fetched_at=fetched_at,
            )
        )

    return runs, summaries


def scrape_2020_summary(
    *, raw_html_dir: Path | None = None
) -> tuple[list[CandidateRun], list[ConstituencyElectionSummary]]:
    result = fetch(SUMMARY_2020_URL)
    if raw_html_dir is not None:
        raw_html_dir.mkdir(parents=True, exist_ok=True)
        (raw_html_dir / "2020_summary.html").write_text(result.html, encoding="utf-8")
    return parse_2020_summary(
        result.html, source_url=result.url, fetched_at=result.fetched_at
    )


def write_csv(rows: list[CandidateRun], out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    field_names = list(asdict(rows[0]).keys()) if rows else [
        "constituency_id",
        "election_year",
        "rank",
        "candidate_name",
        "party",
        "votes",
        "vote_share_pct",
        "won",
        "source_url",
        "fetched_at",
    ]
    with out_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=field_names)
        writer.writeheader()
        for row in rows:
            writer.writerow(asdict(row))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--constituency",
        default="GBA-1",
        help="Constituency ID, e.g. GBA-1",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="CSV path. Defaults to data/raw/<id>_sample.csv relative to repo root.",
    )
    parser.add_argument(
        "--raw-html-dir",
        type=Path,
        default=None,
        help="If set, raw HTML is mirrored here. Defaults to data/raw/html/.",
    )
    args = parser.parse_args(argv)

    repo_root = Path(__file__).resolve().parents[3]
    output = args.output or (
        repo_root / "data" / "raw" / f"{args.constituency.lower().replace('-', '_')}_sample.csv"
    )
    raw_html_dir = args.raw_html_dir or (repo_root / "data" / "raw" / "html")

    rows = scrape_constituency(args.constituency, raw_html_dir=raw_html_dir)
    write_csv(rows, output)

    print(f"Scraped {len(rows)} candidate_runs from {args.constituency}.")
    print(f"Wrote: {output}")
    print()
    if rows:
        # Print a compact preview grouped by year.
        for year in ELECTION_YEARS:
            year_rows = [r for r in rows if r.election_year == year]
            if not year_rows:
                continue
            print(f"--- {year} ---")
            for r in year_rows:
                votes = f"{r.votes:,}" if r.votes is not None else "?"
                pct = f"{r.vote_share_pct:.2f}%" if r.vote_share_pct is not None else "?"
                tag = "*" if r.won else " "
                print(
                    f"  {tag} #{r.rank} {r.candidate_name:<32} "
                    f"{r.party:<28} {votes:>10}  {pct:>7}"
                )
            print()
    else:
        print("No candidate runs parsed. Check raw HTML at:", raw_html_dir)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
