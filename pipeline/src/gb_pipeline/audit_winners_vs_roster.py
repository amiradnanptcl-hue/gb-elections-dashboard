"""Check that every Rev 4.0 projected winner also appears in the
candidates_2026_known.json roster that the dashboard reads. Reports
any winner whose name is missing so we can patch the roster.

Run via: uv run python -m gb_pipeline.audit_winners_vs_roster
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
WEB_DATA = ROOT / "web" / "public" / "data"


def normalise(name: str) -> str:
    """Lowercase + collapse whitespace + strip punctuation for fuzzy match."""
    return "".join(c for c in name.lower() if c.isalnum())


def main() -> None:
    winners = json.loads((WEB_DATA / "predictions_2026_revised.json").read_text(encoding="utf-8"))
    roster = json.loads((WEB_DATA / "candidates_2026_known.json").read_text(encoding="utf-8"))

    # Build (constituency_id -> set of normalised names) from the roster
    by_seat: dict[str, set[str]] = {}
    by_seat_raw: dict[str, list[str]] = {}
    for r in roster:
        cz = r.get("constituency_id") or ""
        nm = r.get("name") or r.get("candidate_name") or ""
        by_seat.setdefault(cz, set()).add(normalise(nm))
        by_seat_raw.setdefault(cz, []).append(nm)

    missing: list[tuple[str, str, str, str]] = []
    for w in winners:
        if w["rank"] != 1:
            continue
        cz = w["constituency_id"]
        name = w["candidate_name"]
        norm = normalise(name)
        present = norm in by_seat.get(cz, set())
        if not present:
            # Try a softer match: substring on either side.
            soft_hit = any(norm in n or n in norm for n in by_seat.get(cz, set()) if n)
            if not soft_hit:
                missing.append((cz, w["area_name"], name, w["party_id"]))

    print(f"Roster has {len(roster)} candidate entries across {len(by_seat)} seats.")
    print(f"Predictions has {sum(1 for w in winners if w['rank'] == 1)} rank-1 winners.\n")

    if missing:
        print(f"{len(missing)} predicted winner(s) NOT in the roster:")
        for cz, area, name, party in missing:
            present_names = by_seat_raw.get(cz, [])
            print(f"  {cz} {area}: {name} ({party})")
            if present_names:
                print(f"      Roster has: {present_names}")
            else:
                print(f"      Roster has: <no candidates for this seat>")
    else:
        print("Every predicted winner is present in the roster.")


if __name__ == "__main__":
    main()
