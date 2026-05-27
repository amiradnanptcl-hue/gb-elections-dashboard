# Gilgit-Baltistan Election Forecast 2026

Public reference forecast for the Gilgit-Baltistan Legislative Assembly election on 7 June 2026.

This repository contains:

1. A cleaned public dataset of GB Legislative Assembly elections (2009, 2015, 2020), normalised to a single schema and published as CSV plus Parquet.
2. A constituency-level forecast model with 80% confidence intervals on every prediction.
3. A public dashboard at a Vercel domain showing predictions, history, and methodology.

## Status

Pre-release. Working towards `v1.0-pre-election` tag before polling day.

## Repository Layout

```
/pipeline    Data extraction. Python 3.11, managed by uv.
/model       Forecast model. Python 3.11.
/web         Dashboard. Vite + React + TypeScript + TailwindCSS.
/data        Raw scrapes, cleaned outputs, exports for the dashboard.
/docs        Methodology, data dictionary, model card.
```

## Quick Start

Pipeline:

```
cd pipeline
uv sync
uv run python -m gb_pipeline.scrape_wikipedia --constituency GBA-1
```

## Licence

Code: MIT. Data: CC-BY 4.0.

## Author

Syed Aamir Adnan, MSc AI in Business, Queen's University Belfast.

## Disclaimer

This is an academic and civic-technology forecast based on public data. It is not a prediction of certainty, not an instruction to vote, and not affiliated with any party, candidate, or media organisation.
