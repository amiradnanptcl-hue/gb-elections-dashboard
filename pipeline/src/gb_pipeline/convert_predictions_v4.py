"""Convert the Independent Survey 2026 Predictive Model Report into web-ready JSON.

This is Revision 4.2 of the per-seat winners (6 June 2026). It carries
forward the Rev 4.0 baseline (Independent Survey 2026 single-page table)
and the Rev 4.1 four-stage overrides, then applies the same pipeline to
one further seat call that the post-Rev-4.1 ground re-check overturned:

  Rev 4.1 overrides (carried forward):
    GBA-7  Skardu-I   PML-N (Haji Akbar Taban)     -> PPP   (Syed Tauqeer Mehdi Shah)
    GBA-10 Skardu-IV  ITP   (Wazir Ejaz Hussain)   -> PML-N (Wazir Hassan)

  Rev 4.2 override (new):
    GBA-24 Ghanche-III PPP   (M. Ismail)           -> Independent (Dr Asad Shafiq, PML-N-backed)

The original Rev 4.0 source was a one-page table titled "Party Wise
Position Election 2026 (Independent Survey 2026)" read from the picture
saved at `prediction_report_v4.jpg` and verified row by row from a 3x
upscale at `prediction_report_v4_3x.png`. Each Rev 4.x override follows
a fresh ground re-check by PPP TEAM AI and passes the four-stage
quorum (survey re-check + regression refit + KPI rubric + 3-of-5 LLM
jury agreement). Every other seat call is unchanged from Rev 4.0.

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
    ("GBA-7",  "Skardu-I",     "Syed Tauqeer Mehdi Shah",        "PPP",         False, "PPP",
        "Rev 4.1 override. PPP takes Skardu-I via dynastic continuity. Syed Tauqeer Mehdi Shah is the son of former GB chief minister Syed Mehdi Shah who held this seat in 2009 and contested it again in 2015 and 2020. The four-stage pipeline converges: the post-Rev-4.0 survey re-check moves the prior toward PPP, the regression refit fires its dynastic-continuity and prior-margin features, the six-pillar rubric weights ground organisation (30%) and candidate strength (15%) heavily for the Mehdi Shah lineage, and the five-model LLM jury reached a three-of-five quorum on the PPP call. Rev 4.0 had projected PML-N (Haji Akbar Taban); that call is retired. Runner-up PML-N, third Independent."),
    ("GBA-8",  "Skardu-II",    "M. Kazim Masum",                 "MWM",         False, "MWM",
        "MWM Chief Minister nominee Maisam Kazim. Runner-up PPP, third PML-N. Appointed CM candidate of the MWM bloc."),
    ("GBA-9",  "Skardu-III",   "Fida M Nashad",                  "PPP",         False, "PPP",
        "PPP flips Skardu-III. Runner-up MWM, third Independent. Strong organisational depth in Baltistan."),
    ("GBA-10", "Skardu-IV",    "Wazir Hassan",                   "PML-N",       False, "PML-N",
        "Rev 4.1 override. PML-N takes Skardu-IV behind ticket-holder Wazir Hassan and the Wazir biraderi network. The four-stage pipeline converges: the post-Rev-4.0 survey re-check moves the prior away from the ITP religious-network reading, the regression refit fires for PML-N's structural-alignment and biraderi-network features, the six-pillar rubric weights ground organisation (30%) and structural factors (15%) for the Wazir clan, and the five-model LLM jury reached a three-of-five quorum on the PML-N call. Rev 4.0 had projected ITP (Wazir Ejaz Hussain); that call is retired. Runner-up ITP, third PPP."),
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
    ("GBA-23", "Ghanche-II",   "Seth Anwar",                     "Independent", False, "Independent",
        "Rev 4.1 update. Seth Anwar wins Ghanche-II as an Independent backed by PML-N (which is not fielding its own ticket-holder here). His name has now been confirmed from the user-verified 2026 constituency table dated 27 May 2026, replacing the earlier 'name not published in source' placeholder. Runner-up PPP."),
    ("GBA-24", "Ghanche-III",  "Dr Asad Shafiq",                 "Independent", False, "Independent",
        "Rev 4.2 override. Dr Asad Shafiq takes Ghanche-III as an Independent backed by PML-N (which is not fielding its own ticket-holder here). The four-stage pipeline converges: the post-Rev-4.1 ground re-check moves the prior toward the Independent column, the regression refit fires PML-N-aligned structural-alignment and biraderi features, the six-pillar rubric weights Ground 30 + Candidate 15 for Dr Asad Shafiq's local profile, and the five-model LLM jury reached a three-of-five quorum on the Independent call. The Rev 4.1 PPP call (M. Ismail) is retired. Runner-up PPP. Election scheduling subject to ECGB revision."),
]


PARTY_PROJECTION = [
    {
        "party_or_bloc": "PPP Seats",
        "seats": "12",
        "driver": "Resurgence across Gilgit, Nagar, Hunza, Baltistan, Astore and Ghizer, plus Skardu-I via Syed Tauqeer Mehdi Shah (Rev 4.1 add). Deep organisational network, Bilawal-Aseefa roadshow impact, and the consolidation of Shia and progressive votes. Rev 4.2 ground re-check moves Ghanche-III out of the PPP column to an Independent (Dr Asad Shafiq) backed by PML-N.",
    },
    {
        "party_or_bloc": "PML-N Seats",
        "seats": "3",
        "driver": "Targeted strongholds in Gilgit-III, Skardu-IV (Rev 4.1: Wazir Hassan, replacing the earlier Skardu-I projection) and Ghizer-II. Federal alignment advantage in Sunni-leaning urban seats. PML-N also backs two Independents (Seth Anwar in Ghanche-II, Dr Asad Shafiq in Ghanche-III) where it is not fielding its own ticket-holder.",
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
        "seats": "1",
        "driver": "Islami Tehreek Pakistan retains Skardu-V (Amjad Zadi). Rev 4.1 ground re-check moves Skardu-IV out of the ITP column and into PML-N.",
    },
    {
        "party_or_bloc": "Independent Seats",
        "seats": "3",
        "driver": "Diamer-I personal vote (M. Dilpazir), Ghanche-II PML-N-backed Independent (Seth Anwar), and Ghanche-III PML-N-backed Independent (Dr Asad Shafiq, Rev 4.2 add). Both Ghanche Independents are aligned with PML-N which has not fielded its own ticket-holders in those seats.",
    },
]


SCENARIOS = [
    {
        "label": "PPP-Led Coalition (70 percent)",
        "description": "PPP (12) sits one seat short of the bare 13/24 general-seat majority after the Rev 4.2 Ghanche-III flip. A PPP + MWM (2) bloc reaches 14 cleanly; adding any of the three Independents (two of whom are PML-N-backed) is harder. Most likely Chief Minister: PPP.",
    },
    {
        "label": "Cross-Bench Coalition (20 percent)",
        "description": "PML-N (3) + IPP (3) + ITP (1) + the two PML-N-backed Independents (Seth Anwar in Ghanche-II, Dr Asad Shafiq in Ghanche-III) = 9 seats with the PML-N + Independent caucus block at 8. Falls short of a majority but could combine with MWM or split PPP loyalists in a horse-trading round to challenge the PPP-led formation.",
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
    {"constituency": "GBA-7 Skardu-I",    "flip": "PML-N -> PPP",
        "reason": "Rev 4.1 override. PPP retakes Skardu-I via Syed Tauqeer Mehdi Shah, son of former GB CM Syed Mehdi Shah who held the seat in 2009. Survey re-check, regression refit (dynastic-continuity + prior-margin features), six-pillar rubric and three-of-five LLM jury all converge on PPP. The Rev 4.0 PML-N call (Haji Akbar Taban) is retired."},
    {"constituency": "GBA-9 Skardu-III",  "flip": "JUI-F -> PPP",
        "reason": "Fida M Nashad takes Skardu-III for PPP. The Rev 3.0 JUI-F projection (Wazir Saleem) collapses; JUI-F now wins zero seats."},
    {"constituency": "GBA-10 Skardu-IV",  "flip": "PPP -> PML-N",
        "reason": "Rev 4.1 override. PML-N takes Skardu-IV via Wazir Hassan and the Wazir biraderi network. Survey re-check, regression refit on structural-alignment + biraderi features, six-pillar rubric and three-of-five LLM jury all converge on PML-N. The Rev 4.0 ITP call (Wazir Ejaz Hussain) is retired."},
    {"constituency": "GBA-11 Skardu-V",   "flip": "PPP -> ITP",
        "reason": "ITP holds Skardu-V via Amjad Zadi. Now the bloc's only seat after the Rev 4.1 Skardu-IV reversal."},
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
    {"constituency": "GBA-24 Ghanche-III","flip": "PML-N -> Independent",
        "reason": "Rev 4.2 override. Dr Asad Shafiq takes Ghanche-III as an Independent backed by PML-N (which is not fielding its own ticket-holder here). Survey re-check, regression refit on biraderi + structural-alignment features, six-pillar rubric and three-of-five LLM jury all converge on the Independent call. The Rev 4.1 PPP projection (M. Ismail) is retired. GBA-24 polling date subject to ECGB revision."},
]


METHODOLOGY_BLOB = """REVISED METHODOLOGY FOR GB 2026 CONSTITUENCY PREDICTIONS (REVISION 4.2)
============================================================================

PREDICTION DATE: 6 June 2026 | REVISION 4.2
SUPERSEDES: Revision 4.1 (4 June 2026, GBA-7 + GBA-10 four-stage overrides)
PRIMARY SOURCE: Independent Survey 2026 single-page report titled
"Party Wise Position Election 2026 (Independent Survey 2026)", carried
forward from Rev 4.0. The Rev 4.1 and Rev 4.2 overrides reflect fresh
ground re-checks by PPP TEAM AI processed through the four-stage
pipeline.

WHAT CHANGED IN REVISION 4.2
----------------------------
1. One seat call revised through the four-stage pipeline:

     GBA-24 Ghanche-III  PPP (M. Ismail) -> Independent (Dr Asad Shafiq)

   Dr Asad Shafiq is an Independent backed by PML-N, which is not
   fielding its own ticket-holder in Ghanche-III. This mirrors the
   GBA-23 Ghanche-II structure (Seth Anwar, also Independent backed
   by PML-N).

2. Bloc totals revised vs Rev 4.1:
     PPP         12  (was 13)   -1 via Ghanche-III reversal
     PML-N       3   (unchanged)
     MWM         2   (unchanged)
     IPP         3   (unchanged)
     ITP         1   (unchanged)
     Independent 3   (was 2)    +1 via Ghanche-III
     JUI-F       0   (unchanged)
     PTI-backed  0   (unchanged; bloc retired in Rev 4.0)

3. Government formation implication: PPP at 12 falls one seat short of
   the 13/24 bare majority threshold and returns to coalition
   territory. PPP-led coalition with MWM (2) remains the central
   scenario; the two PML-N-backed Independents (Seth Anwar in GBA-23,
   Dr Asad Shafiq in GBA-24) align with the PML-N + IPP + ITP
   cross-bench bloc post-poll.

4. The four-stage pipeline applied to the GBA-24 override:
   - Stage 1 (Survey re-check): post-Rev-4.1 ground signal moves the
     prior away from PPP toward an Independent backed by PML-N.
   - Stage 2 (Regression refit): elastic-net logistic regression fires
     biraderi and structural-alignment features for Dr Asad Shafiq.
   - Stage 3 (Six-pillar KPI rubric): Ground 30 + Candidate 15 weight
     for the local-profile Independent.
   - Stage 4 (LLM jury): GPT, Claude, Gemini, Llama, Mistral families
     polled at temperature zero. Three-of-five quorum reached on the
     Independent call.

WHAT CHANGED IN REVISION 4.1
----------------------------
1. Two seat calls revised through the four-stage pipeline (survey prior
   + elastic-net regression + six-pillar KPI rubric + five-model LLM
   jury at temperature zero with a three-of-five quorum):

     GBA-7  Skardu-I   PML-N (Haji Akbar Taban)   -> PPP   (Syed Tauqeer Mehdi Shah)
     GBA-10 Skardu-IV  ITP   (Wazir Ejaz Hussain) -> PML-N (Wazir Hassan)

2. Bloc totals revised:
     PPP        13   (was 12)   +1 via Skardu-I dynastic flip
     PML-N      3    (was 3)    Skardu-I out, Skardu-IV in (net 0)
     MWM        2    (unchanged)
     IPP        3    (unchanged)
     ITP        1    (was 2)    -1 via Skardu-IV reversal
     Independent 2   (unchanged; Seth Anwar name filled in for GBA-23)
     JUI-F      0    (unchanged)
     PTI-backed 0    (unchanged; bloc retired in Rev 4.0)

3. The four-stage pipeline applied to both overrides:
   - Stage 1 (Survey re-check): post-Rev-4.0 ground signal from PPP TEAM
     AI canvassers and local PPP / PML-N ticket-holder briefings.
   - Stage 2 (Regression refit): elastic-net logistic regression with
     the updated party assignment fires dynastic-continuity (GBA-7) and
     biraderi / structural-alignment (GBA-10) features.
   - Stage 3 (Six-pillar KPI rubric): Ground 30 + Candidate 15 weight
     drives GBA-7; Ground 30 + Structural 15 drives GBA-10.
   - Stage 4 (LLM jury): GPT, Claude, Gemini, Llama, Mistral families
     polled at temperature zero. Both seats reached the three-of-five
     quorum required for a locked call.

WHAT CARRIED FORWARD FROM REVISION 4.0
--------------------------------------
- Independent Survey 2026 row-level data as the per-seat ground truth.
- Six-pillar weighting framework (Ground 30, Historical 20, Religious
  15, Structural 15, Candidate 15, Social 5) introduced in Rev 3.0.
- The PTI-backed proxy bloc retirement; MWM and ITP treated as
  standalone Shia parties.
- The per-row reading of the source page (24 total, reconciling cleanly
  to the 24 Assembly seats) versus the source's printed summary strip
  (which sums to 23 and contains a tallying error).

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

SEAT PROJECTION SUMMARY (REVISION 4.2)
--------------------------------------
| Party / Bloc | Seats | Change vs Rev 4.1 | Change vs Rev 4.0 | Change vs Rev 3.0 |
|--------------|-------|-------------------|-------------------|-------------------|
| PPP          | 12    | -1 (Ghanche-III)  |  0                | +1                |
| PML-N        | 3     |  0                |  0 (Skardu swap)  | -5                |
| MWM          | 2     |  0                |  0                | new bloc          |
| IPP          | 3     |  0                |  0                | +3                |
| ITP          | 1     |  0                | -1 (Skardu-IV)    | new bloc          |
| Independent  | 3     | +1 (Ghanche-III)  | +1                | +2                |
| JUI-F        | 0     |  0                |  0                | -1                |
| PTI-backed   | 0     |  0                |  0                | -3 (retired)      |

OVERALL VERDICT: PPP is the largest single bloc at 12 seats but sits
one seat short of the 13/24 bare majority threshold after the Rev 4.2
Ghanche-III reversal. Most likely scenario: PPP-led coalition with MWM
(Maisam Kazim as a CM-rank ally) plus one of the three Independents,
of whom two are PML-N-backed (Seth Anwar in Ghanche-II, Dr Asad Shafiq
in Ghanche-III). Likely PPP Chief Minister, subject to post-poll
caucus arithmetic.
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
            "GILGIT-BALTISTAN ELECTION 2026 · REVISION 4.2 PREDICTION SUMMARY (6 June 2026)",
            "POST-REV-4.1 GROUND RE-CHECK BY PPP TEAM AI. THE FOUR-STAGE PIPELINE OVERTURNS GBA-24 GHANCHE-III FROM PPP (M. ISMAIL) TO INDEPENDENT (DR ASAD SHAFIQ, BACKED BY PML-N). PPP RETURNS TO 12 SEATS, ONE SHORT OF THE 13/24 BARE MAJORITY THRESHOLD; PPP-LED COALITION REMAINS THE CENTRAL SCENARIO.",
            "Election Date: 7 June 2026 (GBA-24 polling separately scheduled per ECGB notification).",
        ],
        "party_projection": PARTY_PROJECTION,
        "critical_flips": CRITICAL_FLIPS,
        "government_formation_scenarios": SCENARIOS,
        "election_date": "2026-06-07",
        "gba24_delay_note": "GBA-24 (Ghanche-III) polling note: ECGB scheduling subject to revision.",
    }

    methodology = {
        "title": "Revised methodology for GB 2026 constituency predictions (Revision 4.2)",
        "revision": "4.2",
        "prediction_date": "2026-06-06",
        "full_text": METHODOLOGY_BLOB.strip(),
    }

    DATA_EXPORTS.mkdir(parents=True, exist_ok=True)
    WEB_DATA.mkdir(parents=True, exist_ok=True)
    for target_dir in (DATA_EXPORTS, WEB_DATA):
        _write_json(target_dir / "predictions_2026_revised.json", rows)
        _write_json(target_dir / "predictions_2026_summary.json", summary)
        _write_json(target_dir / "predictions_2026_methodology.json", methodology)

    print(f"Wrote {len(rows)} per-seat winners (Rev 4.2)")
    print(f"Party totals: {by_party}")
    print(f"Scenarios: {len(SCENARIOS)}")
    print(f"Critical flips: {len(CRITICAL_FLIPS)}")
    print(f"Methodology chars: {len(METHODOLOGY_BLOB)}")


if __name__ == "__main__":
    convert()
