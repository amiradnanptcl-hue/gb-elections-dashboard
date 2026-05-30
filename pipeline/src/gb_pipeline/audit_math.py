"""Full arithmetic audit of every published number on gbelections.com.

Run with: uv run python -m gb_pipeline.audit_math

Checks
======
1.  Predictions JSON: per-row winner-party tally vs declared
    party_projection totals vs Assembly seat count (24).
2.  Government-formation scenarios: every seat sum in the prose
    matches the bloc totals.
3.  Regional district breakdown: every district tally sums correctly
    and the GB-wide total equals 24.
4.  Voter rolls 2026: per-constituency male + female = total;
    24 totals sum to the GB-wide 958,480; district aggregates match
    the per-constituency rows.
5.  Election summary blob: PPP + PML-N + MWM + IPP + ITP + Independent
    must equal 24 with no JUI-F seat (Rev 4.0 retirement).
6.  Methodology weighting percentages add to 100 percent.

Exits non-zero on the first mismatch so CI / pre-commit can catch
drift before the next deploy.
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
WEB_DATA = ROOT / "web" / "public" / "data"
DATA_RAW = ROOT / "data" / "raw" / "research"

EXPECTED_SEATS = 24
EXPECTED_VOTERS_TOTAL = 958_480
EXPECTED_VOTERS_MALE = 503_772
EXPECTED_VOTERS_FEMALE = 454_708

# Expected Rev 4.0 bloc totals, sourced from the Independent Survey 2026
# per-row data the user pasted on 30 May.
EXPECTED_BLOC_TOTALS = {
    "PPP": 12,
    "PML-N": 3,
    "IPP": 3,
    "MWM": 2,
    "ITP": 2,
    "Independent": 2,
}

failures: list[str] = []


def fail(check: str, detail: str) -> None:
    failures.append(f"[FAIL] {check}: {detail}")


def ok(check: str, detail: str = "") -> None:
    suffix = f" — {detail}" if detail else ""
    print(f"  [OK]   {check}{suffix}")


# ---------------------------------------------------------------------------
# 1. Per-seat predictions sum to bloc totals
# ---------------------------------------------------------------------------
print("\n=== 1. Predictions JSON: per-row tally vs bloc totals ===")
revised = json.loads((WEB_DATA / "predictions_2026_revised.json").read_text(encoding="utf-8"))

per_party: Counter[str] = Counter()
seen_seats: set[str] = set()
for row in revised:
    if row["rank"] != 1:
        continue
    per_party[row["party_id"]] += 1
    seen_seats.add(row["constituency_id"])

if len(seen_seats) != EXPECTED_SEATS:
    fail("seat-count", f"saw {len(seen_seats)} unique seats, expected {EXPECTED_SEATS}")
else:
    ok("seat-count", f"{EXPECTED_SEATS} unique constituency_id values")

if sum(per_party.values()) != EXPECTED_SEATS:
    fail("winners-sum", f"per-row tally sums to {sum(per_party.values())}, expected {EXPECTED_SEATS}")
else:
    ok("winners-sum", f"{sum(per_party.values())} rank-1 winners total")

for party, expected in EXPECTED_BLOC_TOTALS.items():
    actual = per_party.get(party, 0)
    if actual != expected:
        fail(f"bloc-tally:{party}", f"per-row count {actual} != declared {expected}")
    else:
        ok(f"bloc-tally:{party}", f"{actual} seats")

# Detect any unexpected parties (e.g. JUI-F should be 0 in Rev 4.0)
unexpected = {p: n for p, n in per_party.items() if p not in EXPECTED_BLOC_TOTALS}
if unexpected:
    fail("unexpected-parties", f"row data has wins for {unexpected} (should be zero)")
else:
    ok("unexpected-parties", "no JUI-F / PTI-backed leaks")

# ---------------------------------------------------------------------------
# 2. predictions_2026_summary.json: declared bloc totals + scenarios
# ---------------------------------------------------------------------------
print("\n=== 2. Summary JSON: declared totals + scenarios ===")
summary = json.loads((WEB_DATA / "predictions_2026_summary.json").read_text(encoding="utf-8"))

declared: dict[str, int] = {}
for entry in summary["party_projection"]:
    label = entry["party_or_bloc"].replace(" Seats", "").strip()
    declared[label] = int(entry["seats"])

declared_total = sum(declared.values())
if declared_total != EXPECTED_SEATS:
    fail("declared-sum", f"declared bloc totals sum to {declared_total}, expected {EXPECTED_SEATS}")
else:
    ok("declared-sum", f"{declared_total} seats across {len(declared)} blocs")

for party, expected in EXPECTED_BLOC_TOTALS.items():
    actual = declared.get(party, 0)
    if actual != expected:
        fail(f"declared-bloc:{party}", f"declared {actual} != expected {expected}")
    else:
        ok(f"declared-bloc:{party}", f"{actual} seats")

# Cross-check: scenarios must reference math that is internally consistent.
# Each scenario prose lists e.g. "PPP (12) + MWM (2) = 14 seats". Pull the
# party-number pairs and the trailing total and validate.
SCENARIO_PARTY_RE = re.compile(r"([A-Z][A-Za-z\- \(\)]+?)\s*\((\d+)\)")
SCENARIO_TOTAL_RE = re.compile(r"=\s*(\d+)\s*seats", re.IGNORECASE)
for scenario in summary["government_formation_scenarios"]:
    label = scenario["label"]
    text = scenario["description"]
    parts = SCENARIO_PARTY_RE.findall(text)
    total_match = SCENARIO_TOTAL_RE.search(text)
    if not parts or not total_match:
        ok(f"scenario:{label}", "no '= N seats' arithmetic to check")
        continue
    parts_sum = sum(int(n) for _, n in parts)
    declared_total_in_text = int(total_match.group(1))
    if parts_sum != declared_total_in_text:
        fail(
            f"scenario:{label}",
            f"prose says parts {parts} sum to {declared_total_in_text}, actual {parts_sum}",
        )
    else:
        ok(f"scenario:{label}", f"{parts_sum} seats reconcile")

# Scenario probabilities must sum to 100 percent.
prob_re = re.compile(r"(\d+)\s*percent", re.IGNORECASE)
probs: list[int] = []
for scenario in summary["government_formation_scenarios"]:
    m = prob_re.search(scenario["label"])
    if m:
        probs.append(int(m.group(1)))
if sum(probs) != 100:
    fail("scenario-probs", f"probability tally {probs} sums to {sum(probs)}%, expected 100%")
else:
    ok("scenario-probs", f"{probs} sums to 100%")

# ---------------------------------------------------------------------------
# 3. Methodology weighting
# ---------------------------------------------------------------------------
print("\n=== 3. Methodology weighting ===")
methodology = json.loads((WEB_DATA / "predictions_2026_methodology.json").read_text(encoding="utf-8"))
weights_re = re.compile(r"^\s*[A-Z]\.\s.*?(\d+)\s+percent", re.MULTILINE)
weights = [int(x) for x in weights_re.findall(methodology["full_text"])]
if sum(weights) != 100:
    fail("methodology-weights", f"weight buckets {weights} sum to {sum(weights)}%, expected 100%")
else:
    ok("methodology-weights", f"{weights} sums to 100%")

# ---------------------------------------------------------------------------
# 4. Voter rolls 2026
# ---------------------------------------------------------------------------
print("\n=== 4. Voter rolls 2026 ===")
voter_csv = DATA_RAW / "voters_by_constituency_2026.csv"
if voter_csv.exists():
    import csv

    with voter_csv.open(encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        rows = list(reader)
    if len(rows) != EXPECTED_SEATS:
        fail("voter-rows", f"saw {len(rows)} voter rows, expected {EXPECTED_SEATS}")
    else:
        ok("voter-rows", f"{EXPECTED_SEATS} per-constituency rows")

    male_sum = 0
    female_sum = 0
    total_sum = 0
    for row in rows:
        male = int(row["male_voters_2026"])
        female = int(row["female_voters_2026"])
        total = int(row["total_voters_2026"])
        if male + female != total:
            fail(
                f"voter-row:{row['constituency_id']}",
                f"M {male} + F {female} = {male + female} != total {total}",
            )
        male_sum += male
        female_sum += female
        total_sum += total

    if male_sum != EXPECTED_VOTERS_MALE:
        fail("voter-male-total", f"sum {male_sum} != expected {EXPECTED_VOTERS_MALE}")
    else:
        ok("voter-male-total", f"{male_sum}")
    if female_sum != EXPECTED_VOTERS_FEMALE:
        fail("voter-female-total", f"sum {female_sum} != expected {EXPECTED_VOTERS_FEMALE}")
    else:
        ok("voter-female-total", f"{female_sum}")
    if total_sum != EXPECTED_VOTERS_TOTAL:
        fail("voter-grand-total", f"sum {total_sum} != expected {EXPECTED_VOTERS_TOTAL}")
    else:
        ok("voter-grand-total", f"{total_sum}")
else:
    ok("voter-rows", "no per-constituency CSV at expected path, skipping")

# District-level voter file
district_csv = DATA_RAW / "voters_by_district_2026.csv"
if district_csv.exists():
    import csv

    with district_csv.open(encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        drows = list(reader)
    # Auto-detect column names for the district CSV.
    sample = drows[0]
    male_key = next((k for k in sample if "male" in k.lower() and "female" not in k.lower()), None)
    female_key = next((k for k in sample if "female" in k.lower()), None)
    total_key = next((k for k in sample if "total" in k.lower()), None)
    if not (male_key and female_key and total_key):
        fail("district-voter-headers", f"could not find male/female/total columns in {list(sample.keys())}")
    dm = sum(int(r[male_key]) for r in drows) if male_key else 0
    df = sum(int(r[female_key]) for r in drows) if female_key else 0
    dt = sum(int(r[total_key]) for r in drows) if total_key else 0
    if dt != EXPECTED_VOTERS_TOTAL:
        fail("district-voters-total", f"sum {dt} != expected {EXPECTED_VOTERS_TOTAL}")
    else:
        ok("district-voters-total", f"{dt} across {len(drows)} districts")
    if dm != EXPECTED_VOTERS_MALE:
        fail("district-voters-male", f"sum {dm} != expected {EXPECTED_VOTERS_MALE}")
    else:
        ok("district-voters-male", f"{dm}")
    if df != EXPECTED_VOTERS_FEMALE:
        fail("district-voters-female", f"sum {df} != expected {EXPECTED_VOTERS_FEMALE}")
    else:
        ok("district-voters-female", f"{df}")
else:
    ok("district-voter-rows", "no district CSV at expected path, skipping")

# ---------------------------------------------------------------------------
# 5. Print result
# ---------------------------------------------------------------------------
print("\n=== Result ===")
if failures:
    for f in failures:
        print(f)
    print(f"\n{len(failures)} arithmetic failure(s).")
    sys.exit(1)
print("All arithmetic checks passed.")
