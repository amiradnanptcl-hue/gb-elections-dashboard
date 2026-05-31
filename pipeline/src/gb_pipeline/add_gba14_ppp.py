"""Add the PPP candidate for GBA-14 Astore-II to the roster.

User confirmed (31 May 2026) that the PPP ticket-holder for GBA-14
is Syed Abbas Mousavi. The ECGB Final Candidate List records the
same person under the shorter transliteration "Syed Muhammad Abbas"
(line 211 of GB_2026_Candidates_Final_List.csv). The roster carries
the user-canonical name with a note explaining the variant so future
audits don't re-add the second spelling.

Idempotent: skips the insert if a (GBA-14, PPP, Syed Abbas Mousavi)
triple is already present.

Run via:
    uv run python -m gb_pipeline.add_gba14_ppp
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
ROSTER_PATH = ROOT / "web" / "public" / "data" / "candidates_2026_known.json"
MIRROR_PATH = ROOT / "data" / "exports" / "candidates_2026_known.json"

ENTRY = {
    "constituency_id": "GBA-14",
    "candidate_name": "Syed Abbas Mousavi",
    "party": "PPP",
    "role_notes": (
        "PPP ticket-holder for GBA-14 Astore-II per the user-confirmed "
        "constituency table (31 May 2026). The ECGB Final Candidate "
        "List records the same person as 'Syed Muhammad Abbas'."
    ),
    "source": (
        "user-confirmed table (31 May 2026) + ECGB Final Candidate List 2026 "
        "(line 211)"
    ),
}


def main() -> None:
    roster = json.loads(ROSTER_PATH.read_text(encoding="utf-8"))

    # Idempotency check: same (constituency, party, name) triple
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
