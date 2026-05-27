<div align="center">
  <img src="web/public/og-image.jpg" alt="GB Elections Dashboard · PPP TEAM AI" width="640" />

  <h1>GB Elections Dashboard</h1>

  <p><strong>A public-records dashboard for the Gilgit-Baltistan Legislative Assembly elections of 2009, 2015, 2020, and 2026.</strong></p>

  <p>
    <a href="https://gb-elections-dashboard.vercel.app">
      <img src="https://img.shields.io/badge/live-gb--elections--dashboard.vercel.app-0070f3?style=flat-square" alt="Live site" />
    </a>
    <a href="./LICENSE">
      <img src="https://img.shields.io/badge/code-MIT-22c55e?style=flat-square" alt="Code: MIT" />
    </a>
    <a href="./LICENSE-DATA">
      <img src="https://img.shields.io/badge/data-CC--BY%204.0-eab308?style=flat-square" alt="Data: CC BY 4.0" />
    </a>
    <img src="https://img.shields.io/badge/election-7%20June%202026-be185d?style=flat-square" alt="Election day: 7 June 2026" />
    <img src="https://img.shields.io/badge/no--forecast-database%20only-64748b?style=flat-square" alt="Database only, no forecast" />
  </p>

  <p><a href="https://gb-elections-dashboard.vercel.app"><strong>Open the live dashboard ↗</strong></a></p>
</div>

---

## What this is

This repository is an **open-source dataset and dashboard** for the 24
general seats of the Gilgit-Baltistan Legislative Assembly. Every figure on
the live site traces back to a CSV or JSON file in this repository, and
every file in this repository cites its source.

The dashboard covers four election cycles:

* **2009, 2015, 2020** &nbsp;Cleaned per-constituency results (winners,
  runners-up, vote shares, margins, turnout, registered voters).
* **2026** &nbsp;The candidate field as it stands today: 403 final
  candidates (272 independents and 131 party-backed), the verified named
  nominees we have so far, the ECGB-allotted party symbols, and the
  district-level voter rolls from Vision Gilgit Baltistan.

## What this is not

* It is **not a forecast.** An earlier build of this project trained a
  logistic-regression model on the 72-row historical record and ran it
  forward to 2026. The strongest predictor was simply "the party at the
  federal centre also wins GB", which made the projection collapse to
  *PML-N wins all 24*. That would have misled readers, so the model was
  removed in v1.3. The dashboard now consumes data only.
* It is **not commissioned by, nor an official channel of**, the Pakistan
  Peoples Party or any other party, candidate, or media organisation.
* It is **not** a polling site. No 2026 opinion polling with disclosed
  methodology was identified in the reviewed sources.

## At a glance

| Item | Value |
| --- | --- |
| Live URL | [gb-elections-dashboard.vercel.app](https://gb-elections-dashboard.vercel.app) |
| Election date | 7 June 2026 (postponed from 24 January 2026) |
| General seats | 24 |
| Final 2026 candidate field | 403 (272 independents + 131 party-backed) |
| Verified 2026 nominees in this repo | 16 |
| 2026 registered voters | 774,319 (F 373,995 + M 400,324) |
| ECGB polling-station total for 2026 | 2,220 |
| Historical training rows | 72 (across 2009 + 2015 + 2020) |
| Frontend | Vite + React 18 + TypeScript + Tailwind |
| Pipeline | Python 3.11 + uv |
| Hosting | Vercel |

## Repository layout

```
.
├── data/
│   ├── raw/            Raw scrapes (Wikipedia, ECGB, news track) and research CSVs
│   ├── clean/          Cleaned parquet + CSV (canonical dataset)
│   ├── exports/        Dataset published as JSON for the dashboard
│   └── manual_review/  Audit trail for name-merge and candidate-ID decisions
├── pipeline/           Python scrapers + cleaning pipeline (uv-managed)
├── model/              Historical forecast artefacts (retained for audit only)
├── web/                Vite + React + TypeScript dashboard
├── docs/               Data dictionary, methodology notes, research pack
└── .github/            CI workflow + issue / PR templates
```

## Quickstart

Three workspaces, three commands.

### 1. Run the dashboard locally

```bash
cd web
pnpm install
pnpm dev          # http://localhost:5173
```

### 2. Re-run the data cleaning pipeline

```bash
cd pipeline
uv sync
uv run python -m gb_pipeline.clean
uv run python -m gb_pipeline.export_json
```

The exporter writes both `data/exports/*.json` (the canonical dataset
release) and `web/public/data/*.json` (what the dashboard reads).

### 3. Build for production

```bash
cd web
pnpm build        # outputs to web/dist
```

## Data sources

Every figure in this repository carries provenance. The primary sources are:

* **Wikipedia constituency pages** (GBA-1 through GBA-24) for the 2009,
  2015, and 2020 winner / runner-up / vote tallies.
* **Election Commission of Gilgit-Baltistan** result PDFs and the
  *Antkhabi Nishanat* (Form-33) symbol-allotment sheet.
* **Vision Gilgit Baltistan** portal for the district-level 2026 voter
  rolls including the female / male split.
* **Wikipedia profiles of named GB politicians** for the verified 2026
  candidate roster.
* **Pakistani media wire**: Dawn, Express Tribune, Geo, APP, The News,
  Pakistan Today, Pamir Times, Kashmir English, Business Recorder, Click
  Pakistan, ARY News.

The methodology page on the live site walks through each source in detail
and documents the limitations of the dataset.

## Branding and editorial position

This project is produced under the **PPP TEAM AI** brand. The author is
openly sympathetic to the Pakistan Peoples Party (PPP). The dataset and
pipeline are published as open source so the analysis can be inspected and
reproduced independently of the author's political sympathies. The
dashboard does not endorse any candidate and does not publish a forecast.

## Tech stack

* **Frontend:** Vite, React 18, TypeScript (strict), Tailwind CSS, shadcn/ui
  primitives, Recharts, React Router 7, TanStack React Query.
* **Pipeline:** Python 3.11 (uv), pandas, polars (optional), BeautifulSoup,
  pdfplumber, pytesseract, rapidfuzz.
* **Hosting:** Vercel (production deploy from `main`).

## Contributing

The most valuable contribution is usually a **data correction** with a
citation, but PRs of any shape are welcome. See
[`CONTRIBUTING.md`](./CONTRIBUTING.md) for the data-update flow and the
review bar.

## Citation

If you use this dataset in a publication, please cite via the
`CITATION.cff` file in this repository. GitHub will render a one-click
"Cite this repository" button on the project page.

## Licences

* **Code** is licensed under the [MIT License](./LICENSE).
* **Data** (everything under `data/clean/`, `data/exports/`,
  `data/raw/research/`, and `web/public/data/`) is licensed under
  [CC BY 4.0](./LICENSE-DATA). Attribution to *"GB Elections Dashboard,
  published by PPP TEAM AI"* with a link back to this repository is
  required.

## Acknowledgements

Built by **Syed Aamir Adnan**, founder of PPP TEAM AI, MSc AI in Business
at Queen's University Belfast.

The dashboard's design references are listed on the live About page. The
research pack draws on the work of independent Pakistani journalists and
the editors of the Wikipedia constituency articles.

## Disclaimer

This is an academic and civic-technology dashboard built on public records.
It is not a prediction of certainty and not an instruction to vote. The
dashboard freezes at 23:59 PKT on 6 June 2026 and resumes with the
post-poll tables once the ECGB publishes counts.
