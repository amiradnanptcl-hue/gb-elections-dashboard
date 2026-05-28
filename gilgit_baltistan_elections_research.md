# Gilgit-Baltistan Elections Research Pack
*Compiled for predictive modeling – May 27, 2026*

This file consolidates all public data from official election records, news reports, and public Meta posts about the Gilgit-Baltistan Assembly elections. It is designed as a single input for machine-learning models.

## 1. Election Overview

| Year | Polling Date | Assembly | Seats (General/Women/Technocrat) | Registered Voters | Turnout |
|------|--------------|----------|----------------------------------|-------------------|---------|
| 2015 | 8 June 2015 | 2nd | 24 / 6 / 3 | 618,364 | 61.29% |
| 2020 | 15 November 2020 | 3rd | 24 / 6 / 3 | 745,362 | 48.12% |
| 2026 | 7 June 2026 (final) | 4th | 24 / 6 / 3 | 774,319 | — |

Notes:
- 2026 date was initially proposed as 24 January 2026, then revised to 7 June 2026 due to winter weather concerns.
- 2,220 polling stations planned for 2026.

## 2. 2020 Results – Baseline for Modeling

| Party | General Seats | Women | Technocrat | Total | Seat Change vs 2015 |
|-------|---------------|-------|------------|-------|---------------------|
| PTI | 16 | 4 | 2 | 22 | +21 |
| PPP | 3 | 1 | 1 | 5 | +4 |
| PML-N | 2 | 1 | 0 | 3 | -18 |
| MWM | 1 | 0 | 0 | 1 | -2 |
| JUI-F | 1 | 0 | 0 | 1 | 0 |
| BNF-N | 1 | 0 | 0 | 1 | 0 |

Source: Wikipedia 2020 Gilgit-Baltistan Assembly election

### 2020 Pre-Election Polls

| Pollster | Date | PTI | PPP | PML-N | JUI-F | Independent | Sample |
|----------|------|-----|-----|-------|-------|-------------|--------|
| Pulse Consultant | 2020-11-08 | 35% | 26% | 14% | 4% | 12% | 1,423 |
| Gallup Pakistan | 2020-11-06 | 27% | 24% | 14% | 4% | 12% | ~1,000 |

Poll error: PTI overperformed final seat share vs polls by ~7-8 points.

## 3. 2026 Candidate Landscape

| Metric | Value | Source |
|--------|-------|--------|
| Total nomination papers | 693 | Islamabad Post / ECGB, May 2026 |
| Alternative count | 664 (645 men, 19 women) | Pamir Times |
| Women candidates | 26 (3.8%) | Islamabad Post |
| Most contested | Gilgit-II (65 candidates) | Islamabad Post |
| Least contested | Diamer-IV (12 candidates) | Islamabad Post |

### Party Tickets Announced (May 2026)

| Party | Candidates Announced | Date | Coverage |
|-------|----------------------|------|----------|
| PTI | 23 | 2026-05-11 | All 10 districts: Gilgit, Nagar, Hunza, Skardu, Kharmang, Shigar, Astore, Diamer, Ghizer, Ghanche |
| PML-N | 19 | 2026-05-12 | 5 constituencies pending |
| PPP | 21 | 2026-05 | 3 constituencies pending; key names: Tauqeer Mehdi Shah (LA-7 Skardu-1), Iqbal Hassan (LA-11 Kharmang) |
| IPP | 9 | 2026-04-23 | Plus 9 women/technocrat slots planned |

Independents represent ~67% of the field (272 of 403 per Pamir Times briefing), indicating high fragmentation.

## 4. Voter Demographics

| Year | Registered | Male | Female | Gender Gap |
|------|------------|------|--------|------------|
| 2015 | 618,364 | — | — | — |
| 2020 | 745,362 | 405,365 | 339,997 | 9% |
| 2026 | 774,319 | 400,324 | 373,995 | 3.4% |

Growth 2020-2026: +28.6%

## 5. Social Media Signals (Meta Public Posts)

These are public Instagram posts identified via Meta search – usable as features without scraping.

| Date | Platform | Author | Type | Topic | Sentiment Theme | URL |
|------|----------|--------|------|-------|-----------------|-----|
| 2026-05-12 | Instagram | PTI Official | candidate_slate | PTI 23 candidates | Formal announcement | https://www.instagram.com/p/DYOus1CDFiM/ |
| 2026-05-12 | Instagram | PML-N | candidate_slate | PML-N 20 candidates | Campaign mobilization | https://www.instagram.com/p/DYPi6zgoYcj/ |
| 2026-04-23 | Instagram | ARY News | party_briefing | IPP 9 candidates | Neutral informative | https://www.instagram.com/p/DXekj9eCiCk/ |
| 2025-11-27 | Instagram | IMN | date_announcement | Jan 24 proposal | Negative – winter feasibility | https://www.instagram.com/p/DRj_6fjlcpC/ |
| 2026-05-13 | Instagram | Pamir Times | election_stats | 403 candidates incl 272 independents | Neutral data | https://www.instagram.com/p/DYSYTKHFroP/ |
| 2026-04-11 | Instagram | IMN | date_announcement | June 7 confirmation | Neutral official | https://www.instagram.com/p/DW_VhaWjm_6/ |
| 2026-04-04 | Instagram | Dawn Today | political_demand | PPP demands schedule | Frustration | https://www.instagram.com/p/DWtGvKSDQkF/ |

Engagement patterns:
- PML-N rally content: highest likes (~15k) and comments (~500)
- PTI slate: ~4.5k likes, low debate
- Date posts: comment volume driven by logistics, not partisanship

## 6. Key Variables for Predictive Model

Suggested feature set:

1. **historical_seat_share_2020** – PTI 0.667, PPP 0.152, PML-N 0.091
2. **poll_error_2020** – +8 points for PTI
3. **voter_growth_rate** – 0.286
4. **candidate_fragmentation** – independents/total = 0.67
5. **party_announcement_timing** – days before election (PTI 27, PML-N 26)
6. **social_engagement_ratio** – likes/followers (proxy)
7. **sentiment_winter_date** – negative = 1 for Jan proposal, 0 for June
8. **women_candidate_share** – 0.038
9. **incumbency_disqualification** – Khalid Khurshid disqualified 2023 = 1

## 7. Data Limitations and Legal Note

- No Facebook scraping was performed. All data comes from public Wikipedia, news outlets (The News, Pamir Times, Islamabad Post), and public Meta posts accessible via search.
- For full comment-level data, apply for Meta Content Library – required for academic predictive models.
- Opinion polls for 2026 do not yet exist publicly.

## 8. Sources

- Wikipedia – 2020 Gilgit-Baltistan Assembly election
- Wikipedia – 2026 Gilgit Baltistan Assembly election
- The News PK – Election Commission announcements
- Pamir Times – candidate filings
- Islamabad Post – 693 candidates
- Kashmir English – PML-N and PPP ticket announcements
- Click Pakistan – PTI candidate list
- Public Instagram posts listed in Section 5

---
*End of pack – ready for model ingestion*
