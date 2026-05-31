"""Add the ITP candidate for GBA-1 Gilgit-I to the roster.

User confirmed (31 May 2026) that the ITP (Islami Tehreek Pakistan)
ticket-holder for GBA-1 Gilgit-I is Hussain Wali. He does not appear
on the ECGB Final Candidate List ingestion, so the role_notes flag
him as a late-confirmation entry sourced from the user-confirmed
constituency table.

Idempotent: skips if (GBA-1, ITP, Hussain Wali) is already present.

Run via:
    uv run python -m gb_pipeline.add_gba1_itp
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
ROSTER_PATH = ROOT / "web" / "public" / "data" / "candidates_2026_known.json"
MIRROR_PATH = ROOT / "data" / "exports" / "candidates_2026_known.json"

ENTRY = {
    "constituency_id": "GBA-1",
    "candidate_name": "Hussain Wali",
    "party": "ITP",
    "role_notes": (
        "ITP (Islami Tehreek Pakistan) ticket-holder for GBA-1 "
        "Gilgit-I per the user-confirmed constituency table "
        "(31 May 2026). Not present on the ECGB Final Candidate "
        "List ingestion; treat as a late-confirmation entry."
    ),
    "source": "user-confirmed table (31 May 2026)",
}


def main() -> None:
    roster = json.loads(ROSTER_PATH.read_text(encoding="utf-8"))

    already = any(
        r["constituency_id"] == ENTRY["constituency_id"]
        and r["party"] == ENTRY["party"]
        and r["candidate_name"] == ENTRY["candidate_name"]
        for r in roster
    )
    if already:
        print(f"Skipping — {ENTRY['candidate_name']} already present at "
              f"{ENTRY['constituency_id']}.")
        return

    roster.append(ENTRY)
    out_text = json.dumps(roster, ensure_ascii=False, separators=(",", ":"))
    ROSTER_PATH.write_text(out_text, encoding="utf-8")
    if MIRROR_PATH.parent.exists():
        MIRROR_PATH.write_text(out_text, encoding="utf-8")

    print(f"Roster size: {len(roster)} entries.")
    print(f"Added: {ENTRY['candidate_name']} ({ENTRY['party']}) at "
          f"{ENTRY['constituency_id']}.")


if __name__ == "__main__":
    main()
