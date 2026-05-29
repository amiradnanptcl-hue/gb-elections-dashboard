"""Convert the Revision 3 Predictive Model Report into web-ready JSON.

Reads the markdown report at `docs/predictive_model_report_rev3.md` for
provenance but holds the per-seat predictions as a Python literal here so
this script is self-validating: typos in seat counts are caught at run time
because the totals must reconcile to the party_projection summary.

Emits the same three files that convert_predictions.py emits, replacing the
Revision 2 output:

  data/exports/predictions_2026_revised.json     (24 rank-1 winners)
  data/exports/predictions_2026_summary.json     (party totals + scenarios)
  data/exports/predictions_2026_methodology.json (framework + sources)

And the same files in web/public/data/ so the dashboard picks them up.

Why one row per seat (vs Rev 2's three per seat)?
  Revision 3 of the model only publishes the projected winner per seat.
  The runners-up rows in Rev 2 were paired with prose social-media and
  ground-reality notes that came from the analyst's underlying deep-dive,
  not from a formal rank-2 / rank-3 model output. Rather than fabricate
  runners-up data, we publish exactly what the new model declares.

Run from anywhere via:
    uv run python -m gb_pipeline.convert_predictions_v3
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[3]
DATA_EXPORTS = ROOT / "data" / "exports"
WEB_DATA = ROOT / "web" / "public" / "data"


# ---------------------------------------------------------------------------
# Revision 3 — 24 per-seat projected winners.
# Sourced from docs/predictive_model_report_rev3.md (29 May 2026).
# ---------------------------------------------------------------------------

# Each tuple: (constituency_id, area_name, candidate, party_id, pti_proxy,
#              party_raw_label, rationale)
PREDICTIONS_V3: list[tuple[str, str, str, str, bool, str, str]] = [
    ("GBA-1",  "Gilgit-I",     "Amjad Hussain Azar",          "PPP",         False, "PPP",
        "Strong personal vote + high TikTok/social media engagement."),
    ("GBA-2",  "Gilgit-II",    "Hafiz Hafeezur Rehman",       "PML-N",       False, "PML-N",
        "Established base + former CM status; Sunni voter consolidation."),
    ("GBA-3",  "Gilgit-III",   "Aftab Haider",                "PPP",         False, "PPP",
        "Flip from PTI. Ground campaign > fading PTI symbol vote."),
    ("GBA-4",  "Nagar-I",      "Muhammad Ali Akhter",         "PPP",         False, "PPP",
        "Flip from PTI. Reversion to PPP mean without PTI symbol."),
    ("GBA-5",  "Nagar-II",     "Rizwan Ali",                  "MWM",         True,  "PTI-backed",
        "Core PTI base remains strong in Nagar-II; MWM support."),
    ("GBA-6",  "Hunza-I",      "Col (R) Imtiaz ul Haq",       "PPP",         False, "PPP",
        "Military background + progressive Hunza appeal; high youth support."),
    ("GBA-7",  "Skardu-I",     "Raja Zakaria Khan Maqpoon",   "PPP",         False, "PPP",
        "Strong Baltistan organization; Bilawal-Aseefa roadshow impact."),
    ("GBA-8",  "Skardu-II",    "Kachoo Imtiaz Haider",        "MWM",         True,  "PTI-backed",
        "Persecution narrative mobilizing base; strong local family legacy."),
    ("GBA-9",  "Skardu-III",   "Wazir Saleem",                "JUI-F",       False, "JUI-F",
        "Personal vote + religious network; effective local mobilization."),
    ("GBA-10", "Skardu-IV",    "Raja Nasir Abbas",            "PPP",         False, "PPP",
        "Consolidation of Shia votes; PPP's deep organizational strength."),
    ("GBA-11", "Skardu-V",     "Syed Amjad Ali Zaidi",        "PPP",         False, "PPP",
        "Incumbent strength + alignment with PPP's rising momentum."),
    ("GBA-12", "Shigar",       "Imran Nadeem",                "PPP",         False, "PPP",
        "Flip from PML-N. Youth energy + UC network > traditional biraderi."),
    ("GBA-13", "Astore-I",     "Rana Farman Ali",             "PML-N",       False, "PML-N",
        "Strong PML-N base in Astore; federal alignment advantage."),
    ("GBA-14", "Astore-II",    "Shamsul Haq Lone",            "PML-N",       False, "PML-N",
        "Established local influence + PML-N's organizational edge."),
    ("GBA-15", "Diamer-I",     "Engr. Muhammad Anwar",        "PML-N",       False, "PML-N",
        "Sunni-dominated area; traditional PML-N stronghold."),
    ("GBA-16", "Diamer-II",    "Engr. Muhammad Ismail",       "PML-N",       False, "PML-N",
        "Local development focus + strong biraderi support."),
    ("GBA-17", "Diamer-III",   "Haider Khan",                 "PML-N",       False, "PML-N",
        "Consolidation of conservative votes; PML-N's local dominance."),
    ("GBA-18", "Diamer-IV",    "Malik Kifayat-ur-Rehman",     "PML-N",       False, "PML-N",
        "Flip from IPP. CM Gulbar Khan (IPP) fatigue + biraderi shift."),
    ("GBA-19", "Ghizer-I",     "Pir Syed Jalal Ali Shah",     "PPP",         False, "PPP",
        "Religious influence + PPP's historical Ghizer base."),
    ("GBA-20", "Ghizer-II",    "Nazir Ahmed",                 "MWM",         True,  "PTI-backed",
        "Strong youth mobilization; PTI base intact despite symbol ban."),
    ("GBA-21", "Ghizer-III",   "Ghulam Muhammad",             "PPP",         False, "PPP",
        "Veteran politician status + PPP's organizational resurgence."),
    ("GBA-22", "Ghanche-I",    "Dr. Ashiq Hussain",           "PPP",         False, "PPP",
        "Flip from IPP. 'Doctor vs. turncoat' narrative hurts IPP."),
    ("GBA-23", "Ghanche-II",   "Amina Ansari",                "Independent", False, "Independent",
        "Multi-cornered fragmentation; strong local personal vote."),
    ("GBA-24", "Ghanche-III",  "Haji Fida Muhammad Nashad",   "PML-N",       False, "PML-N",
        "Strong personal vote + PML-N's traditional Ghanche support."),
]


PARTY_PROJECTION = [
    {
        "party_or_bloc": "PPP Seats",
        "seats": "11",
        "driver": "Resurgence in Baltistan and Nagar, deep organizational strength, Bilawal-Aseefa roadshow impact, consolidation of Shia votes.",
    },
    {
        "party_or_bloc": "PML-N Seats",
        "seats": "8",
        "driver": "Gains from IPP collapse; strongholds in Diamer, parts of Astore, and Ghanche; federal alignment in Sunni-majority seats.",
    },
    {
        "party_or_bloc": "PTI-backed Seats",
        "seats": "3",
        "driver": "Persecution narrative mobilising base. Symbol ban hurts but core vote intact in Nagar-II, Skardu-II, Ghizer-II.",
    },
    {
        "party_or_bloc": "JUI-F Seats",
        "seats": "1",
        "driver": "Wazir Saleem personal vote and religious network in GBA-9 Skardu-III.",
    },
    {
        "party_or_bloc": "Independent Seats",
        "seats": "1",
        "driver": "GBA-23 Ghanche-II multi-cornered fragmentation; Amina Ansari personal vote.",
    },
    {
        "party_or_bloc": "IPP Seats",
        "seats": "0",
        "driver": "Collapse due to 'turncoat' narrative. CM Gulbar Khan loses GBA-18.",
    },
]


SCENARIOS = [
    {
        "label": "PPP-Led Coalition (65 percent)",
        "description": "PPP (11) + PML-N (8) = 19 seats. PPP becomes the senior partner; coalition continues but the leadership balance flips from the 2020-2026 era. Possible PPP Chief Minister.",
    },
    {
        "label": "PPP-PTI Alternative (25 percent)",
        "description": "PPP (11) + PTI-backed (3) + Independent (1) + JUI-F (1) = 16 seats. PPP-led coalition without PML-N. Possible if federal balance shifts and PTI proxies cooperate.",
    },
    {
        "label": "Hung Assembly (10 percent)",
        "description": "No clear majority. Heavy post-election horse-trading expected. Reserved-seat allocation becomes decisive.",
    },
]


CRITICAL_FLIPS = [
    {"constituency": "GBA-3 Gilgit-III",  "flip": "PTI -> PPP",
        "reason": "Aftab Haider's 18-month ground campaign + Bilawal roadshow outpaces Sohail Abbas's fading PTI-symbol vote."},
    {"constituency": "GBA-4 Nagar-I",     "flip": "PTI -> PPP",
        "reason": "Without the PTI bat symbol, Nagar-I reverts to its pre-2020 PPP-leaning mean. Muhammad Ali Akhter's family legacy + Shia base."},
    {"constituency": "GBA-6 Hunza-I",     "flip": "Independent (PTI) -> PPP",
        "reason": "Col (R) Imtiaz ul Haq's military background + progressive Hunza appeal lift PPP back into the seat."},
    {"constituency": "GBA-12 Shigar",     "flip": "PML-N -> PPP",
        "reason": "Imran Nadeem's UC network + TLP vote collapse + PPP youth energy outweigh Shigri's traditional biraderi."},
    {"constituency": "GBA-18 Diamer-IV",  "flip": "IPP -> PML-N",
        "reason": "CM Gulbar Khan loses. Anti-IPP sentiment + Malik Kifayat's biraderi + CM fatigue flip the seat."},
    {"constituency": "GBA-22 Ghanche-I",  "flip": "IPP -> PPP",
        "reason": "Mushtaq Hussain's IPP label toxic. 'Doctor vs. turncoat' narrative helps Dr Ashiq Hussain."},
]


METHODOLOGY_BLOB = """REVISED METHODOLOGY FOR GB 2026 CONSTITUENCY PREDICTIONS (REVISION 3.0)
============================================================================

PREDICTION DATE: 29 May 2026 | REVISION 3.0
SUPERSEDES: Revision 2.0 (28 May 2026, GB_2026_REVISED_Predictions_28May.xlsx)

WHAT CHANGED IN REVISION 3.0
----------------------------
1. Religious and Sectarian Dynamics added as an explicit input. Shia, Sunni,
   and Ismaili population distributions and the influence of religious
   organisations (MWM, JUI-F, JIP) now sit alongside ground organisation
   and structural factors when calling each seat.

2. Constituency-level deep dive refined for all 24 seats with new web-search
   intelligence on social media sentiment, candidate viability, and local
   biraderi dynamics.

3. Bloc totals revised:
     PPP        11   (was 12)
     PML-N      8    (was 9)
     PTI-backed 3    (was 3-4 midpoint, now point estimate)
     JUI-F      1    (unchanged)
     Independent 1   (unchanged)
     IPP        0    (was 0-1, now confirmed zero)

4. Specific seat re-attributions (vs Rev 2):
     GBA-5  PTI-backed candidate name (Rizwan Ali) confirmed
     GBA-6  flips PTI-backed -> PPP (Col Imtiaz ul Haq)
     GBA-7  PPP candidate identified as Raja Zakaria Khan Maqpoon
     GBA-8  PTI-backed candidate identified as Kachoo Imtiaz Haider
     GBA-10 PPP candidate identified as Raja Nasir Abbas
     GBA-11 PPP candidate identified as Syed Amjad Ali Zaidi
     GBA-14 PML-N candidate refined to Shamsul Haq Lone
     GBA-20 flips PPP -> PTI-backed (Nazir Ahmed)
     GBA-21 flips PML-N -> PPP (Ghulam Muhammad)
     GBA-23 Independent candidate identified as Amina Ansari
     GBA-24 PML-N candidate identified as Haji Fida Muhammad Nashad

DATA SOURCES
------------
- Election Commission Gilgit-Baltistan (ECGB) Final Candidate List, 14 May 2026
- ECGB Final Electoral Roll 2026 (per-constituency male / female / total)
- PTI Central Secretariat notification (11 May 2026) — PTI proxy candidates
- PML-N candidate list via The Express Tribune (10 May 2026)
- PPP candidate list via official party notifications + Senator Nayyer Bukhari statements
- User-confirmed constituency tables (May 2026)
- electionpakistani.com constituency pages
- Wikipedia candidate profiles (2020 baseline + 2026 updates)
- Gallup Pakistan pre-election note: "PTI most popular but very closely
  followed by PPP — prediction very murky and difficult"
- ICPS / MP-IDSA analysis (March 2026): coalition prediction, AAC / BNF rise
- Leopard Media analysis (May 2026): PML-N electable struggle, split mandate
- Pamir Times social media analysis (May 2026): TikTok / X sentiment by seat
- Dawn, Nawaiwaqt, Daily Aaj, Kashmir Times, The News coverage
- X / Twitter monitoring: @PTIGBOfficial, PPP GB accounts, PML-N GB accounts
- TikTok trend analysis: #GBElections2026, #ImranKhan, #BilawalBhutto, #BatSymbol

WEIGHTED PREDICTION FRAMEWORK (REVISION 3.0)
--------------------------------------------
A. HISTORICAL BASELINE                                    20 percent
   - 2020 election results and margins
   - Incumbency advantage / disadvantage
   - Party-switching history of candidates

B. GROUND ORGANISATION                                    30 percent
   - UC-level coordinator networks
   - WhatsApp group mobilisation
   - Shumaliyati (induction) programme strength
   - Biraderi and tribal network activation

C. RELIGIOUS AND SECTARIAN DYNAMICS                       15 percent (NEW)
   - Shia, Sunni, Ismaili population balance per seat
   - MWM mobilisation in Shia-majority seats
   - JUI-F and JIP mobilisation in Sunni-majority seats
   - Cross-sectarian PPP appeal in mixed seats

D. STRUCTURAL FACTORS                                     15 percent
   - Federal alignment (less weight than Rev 2)
   - PTI bat symbol ban impact
   - CM patronage and development fund control
   - Caretaker government neutrality perceptions

E. CANDIDATE STRENGTH                                     15 percent
   - Name recognition and personal vote
   - Professional credibility (doctors, engineers, military)
   - Biraderi and tribal network size
   - Gender dynamics

F. SOCIAL MEDIA AND SENTIMENT                              5 percent
   - X / Twitter hashtag volume and engagement
   - TikTok viral content and share ratios
   - Facebook community page sentiment
   - Social-media volume is directional, not predictive on its own.

CRITICAL WILDCARDS
------------------
1. Nawaz Khan Naji (BNF). If he enters GBA-19, the Ghizer-I projection
   collapses. BNF is resurgent per ICPS.
2. GBA-24 polling. The Rev 2 schedule moved GBA-24 to 15 November 2026
   due to weather; the Rev 3 model still assumes a same-day result for
   summary purposes but flags the delay as a wildcard.
3. Voter silence. Many voters are hiding preferences and waiting for
   establishment signals. Could mean hidden PPP or PTI strength not
   visible in social media or public rallies.
4. Post-election defection wave. If IPP wins 0 seats, the small number
   of IPP assembly members already in place may defect to PPP or PML-N,
   changing coalition math.
5. Awami Action Committee (AAC). Protest vote over wheat subsidies and
   electricity crisis could consolidate behind independents in two to
   three constituencies.

CONFIDENCE LEVELS
-----------------
- HIGH:   Clear historical pattern + strong incumbent + weak opposition
- MEDIUM: Competitive race within ~2,000 votes, 2-3 credible candidates
- LOW:    Multi-cornered contest, protest vote potential, or wildcard

SEAT PROJECTION SUMMARY (REVISION 3.0)
--------------------------------------
| Party / Bloc            | Seats | Change vs Rev 2 |
|-------------------------|-------|------------------|
| PPP                     | 11    | -1               |
| PML-N                   | 8     | -1               |
| PTI-backed (MWM / Ind)  | 3     | unchanged        |
| JUI-F                   | 1     | unchanged        |
| Independent             | 1     | unchanged        |
| IPP                     | 0     | -1 (collapse)    |

OVERALL VERDICT: Coalition government expected. PPP is the largest single
bloc at 11 seats. Most likely scenario: PPP + PML-N coalition continues
with PPP as the senior partner. Possible PPP Chief Minister.
"""


def _write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def convert() -> None:
    # Sanity check: party seat totals declared in the summary must match the
    # winning party tallied across the 24 per-seat rows.
    by_party: dict[str, int] = {}
    for _, _, _, party_id, pti, _, _ in PREDICTIONS_V3:
        canonical = "PTI-backed" if pti else party_id
        by_party[canonical] = by_party.get(canonical, 0) + 1
    declared: dict[str, int] = {}
    for row in PARTY_PROJECTION:
        label = row["party_or_bloc"].replace(" Seats", "").strip()
        declared[label] = int(row["seats"])
    if sum(by_party.values()) != 24:
        raise ValueError(f"Per-seat winners sum to {sum(by_party.values())} (expected 24)")
    for label, declared_seats in declared.items():
        actual = by_party.get(label, 0)
        if actual != declared_seats:
            raise ValueError(
                f"Party '{label}' declared {declared_seats} but tallied {actual} winners"
            )

    rows: list[dict[str, Any]] = []
    for cz, area, candidate, party_id, pti, party_raw, rationale in PREDICTIONS_V3:
        rows.append({
            "constituency_id": cz,
            "area_name": area,
            "rank": 1,
            "candidate_name": candidate,
            "party_id": party_id,
            "party_raw": party_raw,
            "pti_proxy": pti,
            "predicted_votes_text": "",
            "predicted_votes_estimate": None,
            "margin": "",
            "social_media_sentiment": "",
            "ground_reality": rationale,
        })

    summary = {
        "title_lines": [
            "GILGIT-BALTISTAN ELECTION 2026 — REVISION 3.0 PREDICTION SUMMARY (29 May 2026)",
            "REVISED MODEL: PPP resurgence in Baltistan and Nagar; PML-N gains from IPP collapse; PTI base fragmented by symbol ban.",
            "Election Date: 7 June 2026 (GBA-24 polling separately scheduled per ECGB notification).",
        ],
        "party_projection": PARTY_PROJECTION,
        "critical_flips": CRITICAL_FLIPS,
        "government_formation_scenarios": SCENARIOS,
        "election_date": "2026-06-07",
        "gba24_delay_note": "GBA-24 (Ghanche-III) polling note: ECGB scheduling subject to revision.",
    }

    methodology = {
        "title": "Revised methodology for GB 2026 constituency predictions (Revision 3.0)",
        "revision": "3.0",
        "prediction_date": "2026-05-29",
        "full_text": METHODOLOGY_BLOB.strip(),
    }

    DATA_EXPORTS.mkdir(parents=True, exist_ok=True)
    WEB_DATA.mkdir(parents=True, exist_ok=True)
    for target_dir in (DATA_EXPORTS, WEB_DATA):
        _write_json(target_dir / "predictions_2026_revised.json", rows)
        _write_json(target_dir / "predictions_2026_summary.json", summary)
        _write_json(target_dir / "predictions_2026_methodology.json", methodology)

    print(f"Wrote {len(rows)} per-seat winners (Rev 3.0)")
    print(f"Party totals: {by_party}")
    print(f"Scenarios: {len(SCENARIOS)}")
    print(f"Critical flips: {len(CRITICAL_FLIPS)}")
    print(f"Methodology chars: {len(METHODOLOGY_BLOB)}")


if __name__ == "__main__":
    convert()
