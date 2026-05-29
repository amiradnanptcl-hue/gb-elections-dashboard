"""Debug helper. Parses the exact CSV the user pasted in the message of
30 May 2026 and reports the winner-party count row by row. No
heuristics, no OCR, no derived fields — just the literal text the user
sent."""
from __future__ import annotations

import csv
import io
from collections import Counter

CSV_BLOB = """Name of Winner,Winner Party,2nd Position,3rd Position
Amjad Hussain,PPP,IndP,IPP
Jameel Ahmed,PPP,PML (N),IPP
Dr. Muhammad Iqbal,PML (N),MWM,PPP
M. Ali Akhter,PPP,ITP,PML (N)
Riaz Akber,MWM,PPP,ITP
Col Imtiaz ul Haq,PPP,Ind,PTI
M. Akber Khan,PML (N),IPP,PPP
M. Kazim Masum,MWM,PPP,PML (N)
Fida M Nashad,PPP,MWM,Ind
Wazir Ejaz Hussain,ITP,MWM,PPP
Amjad Zadi,ITP,PPP,Ind
Imran Nadeem,PPP,ITP,PML (N)
Maj Fahad Haneef,PPP,PTI,PML (N)
Shamul Haq Lone,IPP,PPP,PML (N)
M. Dilpazir,IndP,IPP,PTI
Atiqullah,IPP,PPP,PML (N)
Muhammad Naseem,PPP,Ind,JUI
Gulbar Khan,IPP,PML (N),JUI
S. Jalal Ali Shah,PPP,Ind,PML (N)
Abdul Jahan,PML (N),PPP,IPP
Ayoub Shah,PPP,PML (N),PTI
Ashiq Hussain,PPP,PML (N),Ind
,IndP,PPP,
M. Ismail,PPP,IndP,
"""


def main() -> None:
    reader = csv.DictReader(io.StringIO(CSV_BLOB))
    rows = list(reader)
    print(f"Row count: {len(rows)}")
    counts: Counter[str] = Counter()
    ppp_rows: list[str] = []
    indp_rows: list[str] = []
    for i, row in enumerate(rows, start=1):
        winner = row["Winner Party"].strip()
        name = row["Name of Winner"].strip() or "(blank name)"
        counts[winner] += 1
        if winner == "PPP":
            ppp_rows.append(f"  Row {i:2d}: {name}")
        if winner == "IndP":
            indp_rows.append(f"  Row {i:2d}: {name}")

    print("\nWinner Party totals (by literal CSV value):")
    for party, n in sorted(counts.items(), key=lambda kv: -kv[1]):
        print(f"  {party:<12} {n}")
    print(f"  TOTAL        {sum(counts.values())}")

    print(f"\nPPP winners ({counts['PPP']} rows):")
    for r in ppp_rows:
        print(r)

    print(f"\nIndP winners ({counts['IndP']} rows):")
    for r in indp_rows:
        print(r)


if __name__ == "__main__":
    main()
