"""Collapse the GBA-7 PML-N duplicate.

Two entries for GBA-7 carried the same PML-N candidate under two
naming variants:
  - "Haji Akbar Taban"      (user-confirmed table, 27 May 2026)
  - "Muhammad Akbar Khan"   (ECGB Final Candidate List + survey,
                             30 May 2026)

User confirmed these are the same person. Real name: Haji Akbar
Taban. The Muhammad Akbar Khan entry is dropped and Haji Akbar
Taban's role_notes / source are extended to absorb the survey-
prediction provenance so nothing is lost.

Run via:
    uv run python -m gb_pipeline.fix_gba7_duplicate

Idempotent: if the duplicate has already been removed the script
just normalises the canonical entry's note + source.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
ROSTER_PATH = ROOT / "web" / "public" / "data" / "candidates_2026_known.json"

CANONICAL_NAME = "Haji Akbar Taban"
DUPLICATE_NAME = "Muhammad Akbar Khan"
CONSTITUENCY = "GBA-7"

CANONICAL_NOTE = (
    "PML-N ticket-holder for GBA-7 Skardu-I per the user-confirmed "
    "constituency table. Same person referred to as 'Muhammad Akbar "
    "Khan' on the ECGB Final Candidate List and 'M. Akber Khan' on "
    "the Independent Survey 2026 prediction sheet. Projected winner "
    "under the Rev 4.0 model."
)
CANONICAL_SOURCE = (
    "user-confirmed table (27 May 2026) + ECGB Final Candidate List 2026 "
    "+ Independent Survey 2026 (30 May 2026)"
)


def main() -> None:
    roster = json.loads(ROSTER_PATH.read_text(encoding="utf-8"))
    dropped = 0
    canonical_touched = False
    new_roster = []
    for r in roster:
        if r["constituency_id"] == CONSTITUENCY and r["candidate_name"] == DUPLICATE_NAME:
            dropped += 1
            continue
        if r["constituency_id"] == CONSTITUENCY and r["candidate_name"] == CANONICAL_NAME:
            r = dict(r)
            r["role_notes"] = CANONICAL_NOTE
            r["source"] = CANONICAL_SOURCE
            canonical_touched = True
        new_roster.append(r)

    ROSTER_PATH.write_text(
        json.dumps(new_roster, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"Roster size: {len(new_roster)} entries.")
    print(f"Dropped {dropped} duplicate(s) named '{DUPLICATE_NAME}' at {CONSTITUENCY}.")
    if canonical_touched:
        print(f"Updated canonical entry '{CANONICAL_NAME}' role_notes + source.")


if __name__ == "__main__":
    main()
