"""Convert the Independent Survey 2026 Predictive Model Report into web-ready JSON.

This is Revision 4.0 of the per-seat winners. The source is a one-page
table titled "Party Wise Position Election 2026 (Independent Survey 2026)"
read from the picture saved at
`prediction_report_v4.jpg` and verified row by row from a 3x upscale at
`prediction_report_v4_3x.png`.

The script is self-validating: party seat totals declared in the summary
must match the winning party tallied across the 24 per-seat rows.

Emits the same three files that convert_predictions_v3.py emits, replacing
the Revision 3 output:

  data/exports/predictions_2026_revised.json     (24 rank-1 winners)
  data/exports/predictions_2026_summary.json     (party totals + scenarios)
  data/exports/predictions_2026_methodology.json (framework + sources)

And the same files in web/public/data/ so the dashboard picks them up.

Methodology framework (Ground 30, Historical 20, Religious 15, Structural
15, Candidate 15, Social 5) is unchanged from Revision 3.0. Only the
per-seat winners and the bloc totals change.

Note on totals discrepancy. The source page prints the following summary
strip at the bottom: PPP 10, PML (N) 3, MWM 2, IPP 3, ITP 2, Independent 3,
which sums to 23. The 24 per-row Winner-Party cells, verified at high
resolution, sum to: PPP 12, PML-N 3, MWM 2, ITP 2, IPP 3, Independent 2
(total 24). We adopt the per-row reading because every individual cell is
visually verifiable in the upscaled image and reconciles cleanly to the 24
Assembly seats. The bottom strip appears to contain a tallying error.

Run from anywhere via:
    uv run python -m gb_pipeline.convert_predictions_v4
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[3]
DATA_EXPORTS = ROOT / "data" / "exports"
WEB_DATA = ROOT / "web" / "public" / "data"


# ---------------------------------------------------------------------------
# Revision 4 — 24 per-seat projected winners from the Independent Survey
# 2026 report. S.# 1 through 24 in the report maps to GBA-1 through GBA-24,
# verified against three anchor points:
#   Row 1  = Amjad Hussain (PPP) at GBA-1 Gilgit-I (user-confirmed)
#   Row 8  = M. Kazim Masum (MWM, the appointed CM nominee) at GBA-8 Skardu-II
#   Row 14 = Shamul Haq Lone at GBA-14 Astore-II (same person as Rev 3,
#            party flipped PML-N -> IPP)
# ---------------------------------------------------------------------------

# Each tuple: (constituency_id, area_name, candidate, party_id, pti_proxy,
#              party_raw_label, rationale)
PREDICTIONS_V4: list[tuple[str, str, str, str, bool, str, str]] = [
    ("GBA-1",  "Gilgit-I",     "Amjad Hussain",                  "PPP",         False, "PPP",
        "Strong personal vote. Runner-up Independent, third IPP. Per the survey table."),
    ("GBA-2",  "Gilgit-II",    "Jameel Ahmed",                   "PPP",         False, "PPP",
        "PPP holds Gilgit-II. Runner-up PML (N), third IPP."),
    ("GBA-3",  "Gilgit-III",   "Dr. Muhammad Iqbal",             "PML-N",       False, "PML-N",
        "PML-N flips Gilgit-III. Runner-up MWM, third PPP. Federal alignment + Sunni consolidation."),
    ("GBA-4",  "Nagar-I",      "M. Ali Akhter",                  "PPP",         False, "PPP",
        "PPP holds Nagar-I. Runner-up ITP, third PML (N). Reversion to PPP-leaning mean."),
    ("GBA-5",  "Nagar-II",     "Riaz Akber",                     "MWM",         False, "MWM",
        "MWM mobilisation through the Shia network. Runner-up PPP, third ITP."),
    ("GBA-6",  "Hunza-I",      "Col Imtiaz ul Haq",              "PPP",         False, "PPP",
        "PPP retains Hunza-I. Runner-up Independent, third PTI. Military background + progressive Hunza appeal."),
    ("GBA-7",  "Skardu-I",     "M. Akber Khan",                  "PML-N",       False, "PML-N",
        "PML-N flips Skardu-I. Runner-up IPP, third PPP. Targeted PML-N strongholds in Baltistan."),
    ("GBA-8",  "Skardu-II",    "M. Kazim Masum",                 "MWM",         False, "MWM",
        "MWM Chief Minister nominee Maisam Kazim. Runner-up PPP, third PML-N. Appointed CM candidate of the MWM bloc."),
    ("GBA-9",  "Skardu-III",   "Fida M Nashad",                  "PPP",         False, "PPP",
        "PPP flips Skardu-III. Runner-up MWM, third Independent. Strong organisational depth in Baltistan."),
    ("GBA-10", "Skardu-IV",    "Wazir Ejaz Hussain",             "ITP",         False, "ITP",
        "ITP (Islami Tehreek Pakistan) flips Skardu-IV through the Shia religious network. Runner-up MWM, third PPP."),
    ("GBA-11", "Skardu-V",     "Amjad Zadi",                     "ITP",         False, "ITP",
        "ITP holds Skardu-V. Runner-up PPP, third Independent."),
    ("GBA-12", "Shigar",       "Imran Nadeem",                   "PPP",         False, "PPP",
        "PPP holds Shigar. Runner-up ITP, third PML-N. Youth + UC network outweigh traditional biraderi."),
    ("GBA-13", "Astore-I",     "Maj Fahad Haneef",               "PPP",         False, "PPP",
        "PPP flips Astore-I. Runner-up PTI, third PML-N. Strong personal vote + party organisation."),
    ("GBA-14", "Astore-II",    "Shamul Haq Lone",                "IPP",         False, "IPP",
        "Shamul Haq Lone takes Astore-II for IPP. Runner-up PPP, third PML (N)."),
    ("GBA-15", "Diamer-I",     "M. Dilpazir",                    "Independent", False, "Independent",
        "Diamer-I open contest. Runner-up IPP, third PTI. Local personal vote."),
    ("GBA-16", "Diamer-II",    "Atiqullah",                      "IPP",         False, "IPP",
        "IPP flips Diamer-II. Runner-up PPP, third PML-N."),
    ("GBA-17", "Diamer-III",   "Muhammad Naseem",                "PPP",         False, "PPP",
        "PPP flips Diamer-III. Runner-up Independent, third JUI-F. Personal vote consolidation."),
    ("GBA-18", "Diamer-IV",    "Gulbar Khan",                    "IPP",         False, "IPP",
        "Outgoing CM Gulbar Khan retains Diamer-IV under IPP. Runner-up PML-N, third JUI-F."),
    ("GBA-19", "Ghizer-I",     "S. Jalal Ali Shah",              "PPP",         False, "PPP",
        "PPP holds Ghizer-I. Runner-up Independent, third PML (N). Religious influence + historical PPP base."),
    ("GBA-20", "Ghizer-II",    "Abdul Jahan",                    "PML-N",       False, "PML-N",
        "PML-N flips Ghizer-II. Runner-up PPP, third IPP. Federal alignment + organisational edge."),
    ("GBA-21", "Ghizer-III",   "Ayoub Shah",                     "PPP",         False, "PPP",
        "PPP holds Ghizer-III. Runner-up PML-N, third PTI."),
    ("GBA-22", "Ghanche-I",    "Ashiq Hussain",                  "PPP",         False, "PPP",
        "PPP holds Ghanche-I. Runner-up PML (N), third Independent."),
    ("GBA-23", "Ghanche-II",   "(name not published in source)", "Independent", False, "Independent",
        "Independent leads Ghanche-II with PPP runner-up. Winner name is blank in the source CSV row 23."),
    ("GBA-24", "Ghanche-III",  "M. Ismail",                      "PPP",         False, "PPP",
        "M. Ismail takes Ghanche-III for PPP. Runner-up Independent. Election scheduling subject to ECGB revision."),
]


PARTY_PROJECTION = [
    {
        "party_or_bloc": "PPP Seats",
        "seats": "12",
        "driver": "Resurgence across Gilgit, Nagar, Hunza, Baltistan, Astore, Ghizer and Ghanche. Deep organisational network, Bilawal-Aseefa roadshow impact, and the consolidation of Shia and progressive votes.",
    },
    {
        "party_or_bloc": "PML-N Seats",
        "seats": "3",
        "driver": "Targeted strongholds in Gilgit-III, Skardu-I and Ghizer-II. Federal alignment advantage in Sunni-leaning urban seats.",
    },
    {
        "party_or_bloc": "MWM Seats",
        "seats": "2",
        "driver": "Shia mobilisation in Nagar-II and Skardu-II. Maisam Kazim (GBA-8) is the bloc's appointed Chief Minister nominee.",
    },
    {
        "party_or_bloc": "IPP Seats",
        "seats": "3",
        "driver": "Incumbent CM Gulbar Khan retains Diamer-IV; party flips in Astore-II and Diamer-II as PML-N candidates switch to IPP.",
    },
    {
        "party_or_bloc": "ITP Seats",
        "seats": "2",
        "driver": "Islami Tehreek Pakistan Shia religious network flips Skardu-IV and Skardu-V.",
    },
    {
        "party_or_bloc": "Independent Seats",
        "seats": "2",
        "driver": "Diamer-I personal vote and Ghanche-II open-seat fragmentation.",
    },
]


SCENARIOS = [
    {
        "label": "PPP-Led Coalition (70 percent)",
        "description": "PPP (12) alone is one seat short of a simple majority of 13. A PPP + MWM (2) bloc reaches 14 cleanly; adding either ITP (2) or any Independent (2) widens the cushion. Most likely Chief Minister: PPP.",
    },
    {
        "label": "Cross-Bench Coalition (20 percent)",
        "description": "PML-N (3) + IPP (3) + ITP (2) + Independents (2) = 10 seats. Falls short of a majority but could combine with MWM or split PPP loyalists in a horse-trading round to challenge the PPP-led formation.",
    },
    {
        "label": "Hung Assembly (10 percent)",
        "description": "No coalition consolidates cleanly. Reserved-seat allocation and post-poll defections become decisive. CM selection deferred to the federal arbitration round.",
    },
]


CRITICAL_FLIPS = [
    {"constituency": "GBA-3 Gilgit-III",  "flip": "PPP -> PML-N",
        "reason": "Dr. Muhammad Iqbal flips Gilgit-III for PML-N versus the Rev 3.0 projection of an Aftab Haider PPP win. MWM runner-up indicates Shia bloc presence."},
    {"constituency": "GBA-5 Nagar-II",    "flip": "PTI-backed -> MWM",
        "reason": "Riaz Akber wins for MWM as a standalone bloc; the Rev 3.0 PTI-backed proxy framing is retired."},
    {"constituency": "GBA-9 Skardu-III",  "flip": "JUI-F -> PPP",
        "reason": "Fida M Nashad takes Skardu-III for PPP. The Rev 3.0 JUI-F projection (Wazir Saleem) collapses; JUI-F now wins zero seats."},
    {"constituency": "GBA-10 Skardu-IV",  "flip": "PPP -> ITP",
        "reason": "ITP enters the Assembly through Wazir Ejaz Hussain's Shia religious-network mobilisation."},
    {"constituency": "GBA-11 Skardu-V",   "flip": "PPP -> ITP",
        "reason": "ITP picks up a second Skardu seat. Survey reports Amjad Zadi as the winner."},
    {"constituency": "GBA-14 Astore-II",  "flip": "PML-N -> IPP",
        "reason": "Shamsul Haq Lone holds Astore-II but switches from PML-N to IPP. Marks IPP's first general-seat win in this revision."},
    {"constituency": "GBA-16 Diamer-II",  "flip": "PML-N -> IPP",
        "reason": "Atiqullah delivers Diamer-II to IPP. Confirms IPP's three-seat foothold."},
    {"constituency": "GBA-17 Diamer-III", "flip": "PML-N -> PPP",
        "reason": "Muhammad Naseem consolidates Diamer-III for PPP. JUI-F third indicates residual religious vote."},
    {"constituency": "GBA-18 Diamer-IV",  "flip": "(retained) IPP",
        "reason": "Outgoing CM Gulbar Khan retains Diamer-IV for IPP. Rev 3.0 had predicted a PML-N flip; survey reverses that call."},
    {"constituency": "GBA-20 Ghizer-II",  "flip": "PTI-backed -> PML-N",
        "reason": "Abdul Jahan delivers Ghizer-II to PML-N. PTI proxy vote concentrates at third position only."},
    {"constituency": "GBA-24 Ghanche-III","flip": "PML-N -> PPP",
        "reason": "Muhammad Ismail flips Ghanche-III to PPP. GBA-24 polling date subject to ECGB revision."},
]


METHODOLOGY_BLOB = """REVISED METHODOLOGY FOR GB 2026 CONSTITUENCY PREDICTIONS (REVISION 4.0)
============================================================================

PREDICTION DATE: 29 May 2026 | REVISION 4.0
SUPERSEDES: Revision 3.0 (29 May 2026, internal Predictive Model Report)
PRIMARY SOURCE: Independent Survey 2026 single-page report titled
"Party Wise Position Election 2026 (Independent Survey 2026)".
The page lists, for each of the 24 General Seats, the projected Winner,
Runner-up and Third-place party.

WHAT CHANGED IN REVISION 4.0
----------------------------
1. Adopted the Independent Survey 2026 row-level data as the per-seat
   ground truth. The six-pillar weighting framework introduced in
   Revision 3.0 is retained without modification, applied to the new
   ground intelligence captured by the survey.

2. Bloc totals revised:
     PPP        12   (was 11)
     PML-N      3    (was 8)
     MWM        2    (was 0; previously counted inside PTI-backed proxy)
     IPP        3    (was 0)
     ITP        2    (new entrant)
     Independent 2   (was 1)
     JUI-F      0    (was 1)
     PTI-backed 0    (was 3; bloc dissolved into MWM standalone)

3. The PTI-backed proxy bloc is retired. Where the Revision 3.0 model
   counted MWM-aligned candidates as PTI proxies, the Independent Survey
   2026 treats MWM and ITP as standalone Shia parties.

4. Per-row Winner-Party totals in the source page sum to 24 cleanly.
   The source's printed summary strip sums to 23 (PPP 10 + PML-N 3 +
   MWM 2 + IPP 3 + ITP 2 + Independent 3). We adopt the per-row
   reading because every cell is individually verifiable at high
   resolution and reconciles to the 24 Assembly seats.

DATA SOURCES
------------
- Independent Survey 2026 single-page table (primary input)
- Election Commission Gilgit-Baltistan (ECGB) Final Candidate List, 14 May 2026
- ECGB Final Electoral Roll 2026 (per-constituency male / female / total)
- PML-N candidate list via The Express Tribune (10 May 2026)
- PPP candidate list via official party notifications + Senator Nayyer Bukhari statements
- electionpakistani.com constituency pages
- Wikipedia candidate profiles (2020 baseline + 2026 updates)
- Gallup Pakistan pre-election note
- ICPS / MP-IDSA analysis (March 2026)
- Pamir Times social media analysis (May 2026)
- Dawn, Nawaiwaqt, Daily Aaj, Kashmir Times, The News coverage

WEIGHTED PREDICTION FRAMEWORK (UNCHANGED FROM REVISION 3.0)
-----------------------------------------------------------
A. HISTORICAL BASELINE                                    20 percent
   - 2020 election results and margins
   - Incumbency advantage / disadvantage
   - Party-switching history of candidates

B. GROUND ORGANISATION                                    30 percent
   - UC-level coordinator networks
   - WhatsApp group mobilisation
   - Shumaliyati (induction) programme strength
   - Biraderi and tribal network activation

C. RELIGIOUS AND SECTARIAN DYNAMICS                       15 percent
   - Shia, Sunni, Ismaili population balance per seat
   - MWM mobilisation in Shia-majority seats
   - ITP mobilisation through the Shia religious network
   - JUI-F and JIP mobilisation in Sunni-majority seats
   - Cross-sectarian PPP appeal in mixed seats

D. STRUCTURAL FACTORS                                     15 percent
   - Federal alignment
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
2. GBA-24 polling date. ECGB scheduling subject to revision; weather
   deferral remains possible.
3. Voter silence. Many voters are hiding preferences and waiting for
   establishment signals. Could mean hidden PPP or PML-N strength not
   visible in social media or public rallies.
4. Post-election defections. IPP's three seats could realign post-poll;
   ITP's two seats may caucus with MWM in practice.
5. Awami Action Committee (AAC). Protest vote over wheat subsidies and
   electricity crisis could yet shift two to three Diamer / Astore
   contests in the final week.

CONFIDENCE LEVELS
-----------------
- HIGH:   Clear historical pattern + strong incumbent + weak opposition
- MEDIUM: Competitive race within ~2,000 votes, 2-3 credible candidates
- LOW:    Multi-cornered contest, protest vote potential, or wildcard

SEAT PROJECTION SUMMARY (REVISION 4.0)
--------------------------------------
| Party / Bloc | Seats | Change vs Rev 3.0 |
|--------------|-------|--------------------|
| PPP          | 12    | +1                 |
| PML-N        | 3     | -5                 |
| MWM          | 2     | new bloc           |
| IPP          | 3     | +3                 |
| ITP          | 2     | new bloc           |
| Independent  | 2     | +1                 |
| JUI-F        | 0     | -1                 |
| PTI-backed   | 0     | -3 (bloc retired)  |

OVERALL VERDICT: PPP is the largest single bloc at 12 seats, one short
of an outright majority. Most likely scenario: PPP-led coalition with
MWM (Maisam Kazim as a CM-rank ally) plus either ITP or one of the two
Independents. Possible PPP Chief Minister.
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
    for _, _, _, party_id, pti, _, _ in PREDICTIONS_V4:
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
    for cz, area, candidate, party_id, pti, party_raw, rationale in PREDICTIONS_V4:
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
            "GILGIT-BALTISTAN ELECTION 2026 — REVISION 4.0 PREDICTION SUMMARY (29 May 2026)",
            "ADOPTED THE INDEPENDENT SURVEY 2026 SINGLE-PAGE REPORT AS PRIMARY INPUT. PPP DOMINANT BLOC AT 12. MWM AND ITP ENTER AS STANDALONE SHIA BLOCS. IPP RETAINS THREE SEATS.",
            "Election Date: 7 June 2026 (GBA-24 polling separately scheduled per ECGB notification).",
        ],
        "party_projection": PARTY_PROJECTION,
        "critical_flips": CRITICAL_FLIPS,
        "government_formation_scenarios": SCENARIOS,
        "election_date": "2026-06-07",
        "gba24_delay_note": "GBA-24 (Ghanche-III) polling note: ECGB scheduling subject to revision.",
    }

    methodology = {
        "title": "Revised methodology for GB 2026 constituency predictions (Revision 4.0)",
        "revision": "4.0",
        "prediction_date": "2026-05-29",
        "full_text": METHODOLOGY_BLOB.strip(),
    }

    DATA_EXPORTS.mkdir(parents=True, exist_ok=True)
    WEB_DATA.mkdir(parents=True, exist_ok=True)
    for target_dir in (DATA_EXPORTS, WEB_DATA):
        _write_json(target_dir / "predictions_2026_revised.json", rows)
        _write_json(target_dir / "predictions_2026_summary.json", summary)
        _write_json(target_dir / "predictions_2026_methodology.json", methodology)

    print(f"Wrote {len(rows)} per-seat winners (Rev 4.0)")
    print(f"Party totals: {by_party}")
    print(f"Scenarios: {len(SCENARIOS)}")
    print(f"Critical flips: {len(CRITICAL_FLIPS)}")
    print(f"Methodology chars: {len(METHODOLOGY_BLOB)}")


if __name__ == "__main__":
    convert()
