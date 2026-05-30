"""Print a designer-friendly CSV of the 24 Rev 4.0 winners.

Columns
=======
  constituency_id        GBA-1 .. GBA-24
  constituency_number    1 .. 24
  area_name              Gilgit-I, Skardu-II, ...
  candidate_name         Per the user's 30 May CSV verbatim
  party_short            PPP, PML-N, MWM, IPP, ITP, Independent
  party_full             Pakistan Peoples Party, ...
  party_flag_file        /flags/<id>.png as served by the dashboard
  party_flag_url         Absolute URL on gbelections.com
  party_color_hex        Lane / chart colour
  party_election_symbol  Arrow, Tiger, Tent, ...

Run via:
  uv run python -m gb_pipeline.export_winners_csv
"""
from __future__ import annotations

import csv
import io
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
WEB_DATA = ROOT / "web" / "public" / "data"
BASE_URL = "https://www.gbelections.com"

PARTY_META: dict[str, dict[str, str]] = {
    "PPP": {
        "full": "Pakistan Peoples Party",
        "color": "#b91c1c",
        "symbol": "Arrow",
    },
    "PML-N": {
        "full": "Pakistan Muslim League (N)",
        "color": "#15803d",
        "symbol": "Tiger",
    },
    "MWM": {
        "full": "Majlis Wahdat-e-Muslimeen",
        "color": "#1d4ed8",
        "symbol": "Tent",
    },
    "ITP": {
        "full": "Islami Tehreek Pakistan",
        "color": "#6d28d9",
        "symbol": "Two Swords",
    },
    "IPP": {
        "full": "Istehkam-e-Pakistan Party",
        "color": "#0369a1",
        "symbol": "Eagle",
    },
    "Independent": {
        "full": "Independent",
        "color": "#64748b",
        "symbol": "per candidate",
    },
}


def main() -> None:
    rows = json.loads((WEB_DATA / "predictions_2026_revised.json").read_text(encoding="utf-8"))
    winners = sorted(
        (r for r in rows if r["rank"] == 1),
        key=lambda r: int(r["constituency_id"].split("-")[1]),
    )

    buf = io.StringIO()
    writer = csv.writer(buf, lineterminator="\n", quoting=csv.QUOTE_MINIMAL)
    writer.writerow([
        "constituency_id",
        "constituency_number",
        "area_name",
        "candidate_name",
        "party_short",
        "party_full",
        "party_flag_file",
        "party_flag_url",
        "party_color_hex",
        "party_election_symbol",
    ])
    for r in winners:
        party_short = r["party_id"]
        meta = PARTY_META[party_short]
        # Flag asset on disk uses the lowercase party id; IDs with a
        # hyphen (PML-N) keep the hyphen as the dashboard does.
        flag_file = f"/flags/{party_short.lower()}.png"
        writer.writerow([
            r["constituency_id"],
            r["constituency_id"].split("-")[1],
            r["area_name"],
            r["candidate_name"],
            party_short,
            meta["full"],
            flag_file,
            f"{BASE_URL}{flag_file}",
            meta["color"],
            meta["symbol"],
        ])

    print(buf.getvalue(), end="")


if __name__ == "__main__":
    main()
