# Gilgit-Baltistan Elections Research Pack

**Compiled**: 27 May 2026.
**Source**: Public Wikipedia pages, news reports (The News, Pamir Times, Islamabad Post, Kashmir English, Click Pakistan, Dawn), and publicly searchable Meta posts. No Facebook scraping; no private data.
**Purpose**: Reference input for the forecast model and the dashboard. Values used in modelling are also extracted into structured CSVs under `data/raw/research/`.

## 1. Election Overview

| Year | Polling date | Assembly | Seats (General / Women / Technocrat) | Registered voters | Turnout |
|------|--------------|----------|--------------------------------------|-------------------|---------|
| 2009 | 12 November 2009 | 1st | 24 / 6 / 3 | not recorded | 60.70 percent |
| 2015 | 8 June 2015 | 2nd | 24 / 6 / 3 | 618,364 | 61.29 percent |
| 2020 | 15 November 2020 | 3rd | 24 / 6 / 3 | 745,362 | 48.12 percent |
| 2026 | 7 June 2026 | 4th | 24 / 6 / 3 | 958,480 | (pending) |

Notes:

- 2026 was initially proposed for 24 January 2026, then revised to 7 June 2026 because of winter weather concerns over polling-station access in the higher-altitude districts.
- 2,220 polling stations are planned for 2026 (ECGB planning figure across the 24 general seats). At 958,480 registered voters that's an average of ~349 voters per station, well below the Pakistan-wide guidance of ~1,000 voters per station, consistent with GB's mountainous terrain dispersing voters across many small high-altitude polling sites.
- The 2026 registered-voter figure (958,480) comes from the ECGB Final Electoral Roll 2026, which reconciles BOTH by district (sum of all 10 districts = 958,480 exactly) AND by constituency (sum of GBA-1 through GBA-24 = 958,480 exactly). Male 503,772 + female 454,708 also reconcile to the same total. This is the official Election Commission figure and supersedes an earlier 774,319 Vision Gilgit Baltistan number we had briefly adopted before the final roll was published.

## 2. 2020 Results — Baseline for Modelling

Two seat counts circulate in public sources for 2020. Be careful about which one you compare against.

| Party | Poll-time (Wikipedia scrape) | Post-bloc (Wikipedia editors and news) |
|-------|------------------------------|----------------------------------------|
| PTI | 11 | 16 |
| Independent | 5 | (most joined PTI bloc later) |
| PPP | 3 | 3 |
| PML-N | 2 | 2 |
| JUI-F | 1 | 1 |
| BNF-N | 1 | 1 |
| MWM | 1 | 1 |
| **Total** | **24** | **24** |

The model in this repository trains on the poll-time labels (the Independents who later joined PTI are recorded as Independents). The post-bloc count is what most news outlets report when summarising the election.

Reserved seats added on top of the 24 general seats:

| Party | General | Women | Technocrat | Total | Change vs 2015 |
|-------|---------|-------|------------|-------|----------------|
| PTI | 16 | 4 | 2 | 22 | +21 |
| PPP | 3 | 1 | 1 | 5 | +4 |
| PML-N | 2 | 1 | 0 | 3 | -18 |
| MWM | 1 | 0 | 0 | 1 | -2 |
| JUI-F | 1 | 0 | 0 | 1 | 0 |
| BNF-N | 1 | 0 | 0 | 1 | 0 |

Source: Wikipedia 2020 Gilgit-Baltistan Assembly election.

### 2020 Pre-Election Polls

| Pollster | Date | PTI | PPP | PML-N | JUI-F | Independent | Sample |
|----------|------|-----|-----|-------|-------|-------------|--------|
| Pulse Consultant | 2020-11-08 | 35 percent | 26 percent | 14 percent | 4 percent | 12 percent | 1,423 |
| Gallup Pakistan | 2020-11-06 | 27 percent | 24 percent | 14 percent | 4 percent | 12 percent | ~1,000 |

Poll error: PTI's actual general-seat share over-shot the poll averages by roughly 7 to 8 percentage points. Useful as a prior for how much polling can under-call a federal-incumbent surge in GB.

## 3. 2026 Candidate Landscape

| Metric | Value | Source |
|--------|-------|--------|
| Total nomination papers | 693 | Islamabad Post / ECGB, May 2026 |
| Alternative count | 664 (645 men, 19 women) | Pamir Times |
| Women candidates | 26 (3.8 percent) | Islamabad Post |
| Most contested seat | Gilgit-II (65 candidates) | Islamabad Post |
| Least contested seat | Diamer-IV (12 candidates) | Islamabad Post |

### Party Tickets Announced (May 2026)

| Party | Candidates announced | Date | Coverage |
|-------|----------------------|------|----------|
| PTI | 23 | 2026-05-11 | All 10 districts: Gilgit, Nagar, Hunza, Skardu, Kharmang, Shigar, Astore, Diamer, Ghizer, Ghanche |
| PML-N | 19 | 2026-05-12 | 5 constituencies pending |
| PPP | 21 | 2026-05 | 3 constituencies pending. Known names include Tauqeer Mehdi Shah (Skardu-1 / LA-7) and Iqbal Hassan (Kharmang / LA-11) |
| IPP | 9 | 2026-04-23 | Plus 9 women / technocrat slots planned |

Independents are roughly 67 percent of the field (272 of 403 per a Pamir Times briefing slide). This is the highest fragmentation of any GB election to date and is a key reason to be cautious about party-level forecasts.

## 4. Voter Demographics

| Year | Registered | Male | Female | Gender gap |
|------|------------|------|--------|------------|
| 2015 | 618,364 | not split | not split | not recorded |
| 2020 | 745,362 | 405,365 | 339,997 | 9 percent |
| 2026 | 958,480 | 503,772 | 454,708 | 3.4 percent |

Registered-voter growth 2020 to 2026: +28.6 percent (745,362 → 958,480 per the ECGB Final Electoral Roll 2026; female roll grew faster than male, closing the 2020 gender gap from 9 percent down to 3.4 percent).

## 5. Social Media Signals (public Meta posts only)

These are public Instagram posts identified through Meta's search interface. They are usable as model features (engagement, posting cadence, sentiment label) without scraping anyone's private timeline. For comment-level analysis we would need to apply for Meta Content Library access.

| Date | Platform | Author | Type | Topic | Sentiment | URL |
|------|----------|--------|------|-------|-----------|-----|
| 2026-05-12 | Instagram | PTI Official | candidate_slate | PTI 23 candidates | Formal announcement | https://www.instagram.com/p/DYOus1CDFiM/ |
| 2026-05-12 | Instagram | PML-N | candidate_slate | PML-N 20 candidates | Campaign mobilisation | https://www.instagram.com/p/DYPi6zgoYcj/ |
| 2026-04-23 | Instagram | ARY News | party_briefing | IPP 9 candidates | Neutral, informative | https://www.instagram.com/p/DXekj9eCiCk/ |
| 2025-11-27 | Instagram | IMN | date_announcement | 24 January proposal | Negative (winter feasibility) | https://www.instagram.com/p/DRj_6fjlcpC/ |
| 2026-05-13 | Instagram | Pamir Times | election_stats | 403 candidates incl. 272 independents | Neutral, data | https://www.instagram.com/p/DYSYTKHFroP/ |
| 2026-04-11 | Instagram | IMN | date_announcement | 7 June confirmation | Neutral, official | https://www.instagram.com/p/DW_VhaWjm_6/ |
| 2026-04-04 | Instagram | Dawn Today | political_demand | PPP demands schedule | Frustration | https://www.instagram.com/p/DWtGvKSDQkF/ |

Engagement patterns observed (qualitative, not numeric features yet):

- PML-N rally content reached the highest like counts (around 15k) and comment volume (around 500).
- PTI candidate-slate posts saw roughly 4.5k likes with relatively low debate.
- Date-change posts had comment volume driven by logistics, not partisanship.

## 6. Candidate-Level Notes

- **Khalid Khurshid** (GBA-13, PTI, sitting Chief Minister at the 2020 win) was disqualified in 2023. Cannot stand in 2026. The model should treat the GBA-13 PTI incumbency feature as absent for 2026.
- **Amjad Hussain Azar** (PPP) won GBA-1 and GBA-4 simultaneously in 2020, vacated GBA-4, and that triggered the 2021 by-poll already documented in the data pipeline.

## 7. Suggested Model Features

These are candidate features for v2 of the model, derived from the research pack:

1. `historical_seat_share_2020` — PTI 0.667, PPP 0.152, PML-N 0.091 (using the post-bloc count).
2. `poll_error_2020` — PTI over-shoot of 7 to 8 percentage points; useful as a prior for federal-incumbent surge.
3. `voter_growth_rate` — 0.286 between 2020 and 2026.
4. `candidate_fragmentation` — independents / total = 0.67 in 2026.
5. `party_announcement_timing` — days before polling day that each party announced its slate (PTI 27 days, PML-N 26 days, PPP and IPP earlier).
6. `social_engagement_ratio` — likes per follower for each party's official posts; treat as a sentiment proxy until Meta Content Library access is in place.
7. `sentiment_winter_date` — 1 for the January 2026 date proposal, 0 for June, encoding logistics frustration with the original schedule.
8. `women_candidate_share` — 0.038 across the slate; not constituency-level yet.
9. `incumbency_disqualification` — 1 for GBA-13 in 2026 (Khalid Khurshid), 0 elsewhere.

## 8. Data Limitations and Legal Notes

- No Facebook scraping was performed. Everything in Section 5 is from public Instagram posts surfaced through Meta's own search interface.
- Full comment-level data requires a Meta Content Library application; appropriate for academic predictive work.
- 2026 opinion polls do not exist publicly yet at the time this pack was compiled.

## 9. Sources

- Wikipedia: 2020 Gilgit-Baltistan Assembly election.
- Wikipedia: 2026 Gilgit Baltistan Assembly election.
- The News PK: Election Commission announcements.
- Pamir Times: candidate filings.
- Islamabad Post: 693-candidate count.
- Kashmir English: PML-N and PPP ticket announcements.
- Click Pakistan: PTI candidate list.
- Dawn Today: PPP-demands-schedule reporting.
- Public Instagram posts listed in Section 5.

---
End of research pack. Cross-referenced from `docs/methodology_results.md`.
