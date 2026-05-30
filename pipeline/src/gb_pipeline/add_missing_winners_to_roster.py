"""Append the five Rev 4.0 projected winners that are not in
candidates_2026_known.json so the Map, Records, Candidates and party-
filter views show them as 2026 contestants.

Source-of-truth: GB_2026_Candidates_Final_List.csv (the ECGB Final
Candidate List the user pasted earlier). Each addition cites that
file in its `source` field plus the 30 May Independent Survey 2026
prediction so future audits can trace why it landed in the roster.

Idempotent: skips inserts whose (constituency_id, candidate_name)
pair is already present, so this script can be re-run safely.

Run via:
  uv run python -m gb_pipeline.add_missing_winners_to_roster
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
WEB_DATA = ROOT / "web" / "public" / "data"
DATA_EXPORTS = ROOT / "data" / "exports"

ROSTER_PATH = WEB_DATA / "candidates_2026_known.json"

# Five additions. Names + party + source line in GB_2026_Candidates_
# Final_List.csv all reconciled.
ADDITIONS = [
    {
        "constituency_id": "GBA-7",
        "candidate_name": "Muhammad Akbar Khan",
        "party": "PML-N",
        "role_notes": "PML-N candidate for GBA-7 Skardu-I per the ECGB Final Candidate List. Projected winner under the Rev 4.0 model (Independent Survey 2026); the survey table labels him as 'M. Akber Khan'.",
        "source": "ECGB Final Candidate List 2026 (line 130) + Independent Survey 2026 (30 May 2026)",
    },
    {
        "constituency_id": "GBA-10",
        "candidate_name": "Wazir Ejaz Hussain",
        "party": "ITP",
        "role_notes": "ITP (Islami Tehreek Pakistan) candidate for GBA-10 Skardu-IV. Projected winner under the Rev 4.0 model (Independent Survey 2026); flips Skardu-IV from PPP through the Shia religious network.",
        "source": "ECGB Final Candidate List 2026 (line 160) + Independent Survey 2026 (30 May 2026)",
    },
    {
        "constituency_id": "GBA-11",
        "candidate_name": "Syed Amjad Ali",
        "party": "ITP",
        "role_notes": "ITP candidate for GBA-11 Kharmang per the ECGB Final Candidate List. Projected winner under the Rev 4.0 model (Independent Survey 2026); the survey table labels him as 'Amjad Zadi'.",
        "source": "ECGB Final Candidate List 2026 (line 165) + Independent Survey 2026 (30 May 2026)",
    },
    {
        "constituency_id": "GBA-15",
        "candidate_name": "Muhammad Dilpazir",
        "party": "Independent",
        "role_notes": "Independent candidate for GBA-15 Diamer-I per the ECGB Final Candidate List. Projected winner under the Rev 4.0 model (Independent Survey 2026); the survey table labels him as 'M. Dilpazir'.",
        "source": "ECGB Final Candidate List 2026 (line 244) + Independent Survey 2026 (30 May 2026)",
    },
    {
        "constituency_id": "GBA-16",
        "candidate_name": "Atiq Ullah",
        "party": "IPP",
        "role_notes": "IPP candidate for GBA-16 Diamer-II per the ECGB Final Candidate List. Projected winner under the Rev 4.0 model (Independent Survey 2026); the survey table labels him as 'Atiqullah'.",
        "source": "ECGB Final Candidate List 2026 (line 258) + Independent Survey 2026 (30 May 2026)",
    },
]


def main() -> None:
    roster = json.loads(ROSTER_PATH.read_text(encoding="utf-8"))
    existing_keys = {(r["constituency_id"], r["candidate_name"]) for r in roster}

    added: list[str] = []
    skipped: list[str] = []
    for entry in ADDITIONS:
        key = (entry["constituency_id"], entry["candidate_name"])
        if key in existing_keys:
            skipped.append(f"{key[0]}/{key[1]}")
            continue
        roster.append(entry)
        existing_keys.add(key)
        added.append(f"{key[0]}/{key[1]} ({entry['party']})")

    # Write back both copies (web/public/data and data/exports if it exists).
    out_text = json.dumps(roster, ensure_ascii=False, separators=(",", ":"))
    ROSTER_PATH.write_text(out_text, encoding="utf-8")
    mirror = DATA_EXPORTS / "candidates_2026_known.json"
    if mirror.parent.exists():
        mirror.write_text(out_text, encoding="utf-8")

    print(f"Roster size: {len(roster)} entries across {len({r['constituency_id'] for r in roster})} seats.")
    if added:
        print(f"\nAdded {len(added)} new entr(ies):")
        for line in added:
            print(f"  + {line}")
    if skipped:
        print(f"\nSkipped {len(skipped)} (already present):")
        for line in skipped:
            print(f"  = {line}")


if __name__ == "__main__":
    main()
