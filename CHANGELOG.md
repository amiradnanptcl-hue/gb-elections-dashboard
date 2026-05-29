# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] — 2026-05-29

### Changed
* **Predictive model upgraded to Revision 3.0.** Source report archived
  at `docs/predictive_model_report_rev3.md`. Revised bloc totals: PPP 11
  (was 12), PML-N 8 (was 9), PTI-backed 3 (was 3-4), JUI-F 1,
  Independent 1, IPP 0 (was 0-1, now confirmed zero).
* **Religious / sectarian dynamics added as a 15 percent input** — Shia
  / Sunni / Ismaili population balance per seat plus the influence of
  MWM, JUI-F and JIP. New weighting framework: Ground 30, Historical 20,
  Religious-Sectarian 15 (NEW), Structural 15, Candidate 15, Social
  media 5.
* Specific seat-level candidate / party refinements across 11 seats
  (GBA-5, 6, 7, 8, 10, 11, 14, 20, 21, 23, 24).
* `MethodologyPage` weighting grid grew from 5 cards to 6 and the
  copy now flags Rev 3.0 changes vs Rev 2.0.
* `CMRaceMeter` eyebrow text bumped to "Model rev 3.0".
* `PredictionsPage` hero, SEO description and "How to read this page"
  paragraph reflect Rev 3.0 totals and methodology.

### Added
* `pipeline/src/gb_pipeline/convert_predictions_v3.py` — self-
  validating converter that hardcodes the Rev 3.0 winners and emits the
  three JSON files to both `data/exports/` and `web/public/data/`.
  Cross-checks per-seat winner tallies against the declared party
  totals at runtime to catch typos.
* `docs/predictive_model_report_rev3.md` archived for permanent
  reference (29 May 2026 report).

## [1.3.0] — 2026-05-27

### Changed
* Dashboard repositioned as a public-records database, no forecast. The
  prediction model has been removed from the production read path.
* `MethodologyPage` rewritten as a data-governance page covering sources,
  schema, pipeline, scope, and limitations.
* HomePage hero now reads "Election Records 2026" with explicit copy
  that this is a public-records browser and not a forecast.

### Added
* District-wise 2026 voter rolls (female / male split) sourced from the
  ECGB Final Electoral Roll 2026: total 958,480 (M 503,772 + F 454,708).
* `useDistrictVoters2026` data hook plus a district panel on `/voters`
  with the gender breakdown per district.
* Key-metrics panel on every constituency page (registered voters,
  estimated 2026 voters and gender split, votes cast, turnout, margin,
  estimated polling stations) with explicit "actual vs estimate" labels.
* Verified 2026 candidate roster expanded from 4 to 16 names from
  Wikipedia profiles. Includes 11 party switchers (PTI to IPP / PPP / TLP /
  JUI-F).
* `notable_disqualifications` data + open-seat banner where the 2020
  winner is disqualified for 2026 (currently GBA-13 / Khalid Khurshid).
* Map page rewritten as a 24-card district browser with 2020 top-3 results
  and verified 2026 contestants per seat.
* `AnthemsPage` listing 13 PPP TEAM AI campaign-anthem Facebook reels.
* PartyPage filter `?year=2026` showing the party's 2026 candidate list
  by constituency, hiding the historical roster.

### Removed
* `federal_incumbent_match` feature from the production model. It carried
  signal on historical data but collapsed the 2026 forecast to "the
  federal ruling party wins every seat".
* HomePage 2020 forecast scoreboard and the "why no 2026 prediction" closer.
* ConstituencyPage `Model v1 retro on 2020 holdout` card.
* Per-seat 2026 forecast probabilities from the dashboard. Model artefacts
  remain in the repo for audit but are not consumed by the UI.

### Fixed
* `election_year` string-to-int coercion at the pipeline export step plus
  defensive coercion in the dashboard data layer. Restored the /voters,
  /polling-stations, and ConstituencyPage tables which had been blank.
* Name-deduplication in the cleaning pipeline now uses a relaxed
  within-race predicate that catches subset matches and reordered tokens.

## [1.2.0] — 2026-05-26

### Added
* `candidates_2026_known.csv` with the first verified 2026 nominees from
  the Kashmir English research track.
* Per-party election-symbol allocations from the official ECGB
  Antkhabi Nishanat sheet (Form-33).
* Eight-tile homepage stat strip linking out to dedicated detail pages
  (Voters, Polling stations, Candidates, Sources).
* About page expanded with author photo, LinkedIn, and the
  "Roles and memberships" grid (Atoshi, Atomic Properties, Dubai RERA,
  QSMF, Queen's Alumni Union).

### Changed
* PTI election symbol corrected from "bat animal" to "Cricket Bat".
* Assembly cycle label corrected from 3rd to 4th.

## [1.1.0] — 2026-05-24

### Added
* Elastic-net logistic-regression forecast model trained on 2009 + 2015
  with 2020 as a holdout. Reported 14 / 24 = 58.3 % per-seat accuracy
  vs the federal-incumbent baseline at 11 / 24 = 45.8 %.
* Bootstrap 80 % confidence intervals on every prediction.
* Calibration plot via Platt scaling.

(This version's model has been removed from the live dashboard in 1.3.0;
artefacts remain in the repository for audit.)

## [1.0.0] — 2026-05-22

### Added
* Initial public release. Cleaned candidate-runs dataset for 2009, 2015,
  and 2020 across all 24 GB Assembly constituencies.
* Vite + React + TypeScript dashboard with five routes.
* Vercel deployment.
