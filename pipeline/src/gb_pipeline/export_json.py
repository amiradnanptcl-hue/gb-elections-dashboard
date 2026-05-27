"""Export the clean dataset + model artefacts as JSON for the dashboard.

Reads:
  data/clean/*.parquet
  model/artefacts/training_report.json
  model/artefacts/predictions_2020_holdout.csv
  model/artefacts/calibration_plot.png

Writes:
  data/exports/*.json              (canonical exports)
  web/public/data/*.json           (served by the dashboard's dev/prod server)
  web/public/data/calibration_plot.png

We write to both locations so the dataset can be released independently of the
dashboard and the dashboard can run from its own static directory without
symlinking out of /web.
"""

from __future__ import annotations

import json
import math
import shutil
import sys
from pathlib import Path
from typing import Any

import pandas as pd


def _clean_value(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, float) and math.isnan(value):
        return None
    if value is pd.NA:
        return None
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass
    return value


def _df_to_records(df: pd.DataFrame) -> list[dict[str, object]]:
    raw_records = df.to_dict(orient="records")
    return [{k: _clean_value(v) for k, v in row.items()} for row in raw_records]


def _write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(
            payload,
            indent=None,
            separators=(",", ":"),
            ensure_ascii=False,
            allow_nan=False,
        ),
        encoding="utf-8",
    )


def export(repo_root: Path) -> None:
    clean_dir = repo_root / "data" / "clean"
    exports_dir = repo_root / "data" / "exports"
    web_data_dir = repo_root / "web" / "public" / "data"
    artefacts_dir = repo_root / "model" / "artefacts"

    targets: dict[str, object] = {}

    # candidate_runs (with candidate_id from the model pipeline if present).
    runs_with_id_path = clean_dir / "candidate_runs_with_id.parquet"
    runs_path = clean_dir / "candidate_runs.parquet"
    source = runs_with_id_path if runs_with_id_path.exists() else runs_path
    runs = pd.read_parquet(source)
    if "candidate_id" not in runs.columns:
        # Older snapshot without IDs; fall back to a name-based slug.
        runs["candidate_id"] = runs["candidate_name"].str.lower().str.replace(
            r"[^a-z0-9]+", "-", regex=True
        ).str.strip("-")
    targets["candidate_runs.json"] = _df_to_records(runs)

    # constituencies, elections, parties, summary.
    targets["constituencies.json"] = _df_to_records(
        pd.read_parquet(clean_dir / "constituencies.parquet")
    )
    targets["elections.json"] = _df_to_records(
        pd.read_parquet(clean_dir / "elections.parquet")
    )
    targets["parties.json"] = _df_to_records(
        pd.read_parquet(clean_dir / "parties.parquet")
    )
    targets["constituency_election_summary.json"] = _df_to_records(
        pd.read_parquet(clean_dir / "constituency_election_summary.parquet")
    )

    # Predictions and report.
    preds_csv = artefacts_dir / "predictions_2020_holdout.csv"
    if preds_csv.exists():
        targets["predictions_2020_holdout.json"] = _df_to_records(
            pd.read_csv(preds_csv)
        )
    report_path = artefacts_dir / "training_report.json"
    if report_path.exists():
        targets["training_report.json"] = json.loads(
            report_path.read_text(encoding="utf-8")
        )
    baseline_path = artefacts_dir / "baseline_report.json"
    if baseline_path.exists():
        targets["baseline_report.json"] = json.loads(
            baseline_path.read_text(encoding="utf-8")
        )

    # 2026 confirmed nominees (research-pack roster). Read straight from the
    # raw CSV; this file is curated by hand from ECGB Form-33 notifications
    # and the news track, so there is no cleaner step to run on it.
    known_2026_csv = repo_root / "data" / "raw" / "research" / "candidates_2026_known.csv"
    if known_2026_csv.exists():
        targets["candidates_2026_known.json"] = _df_to_records(
            pd.read_csv(known_2026_csv)
        )

    # Notable disqualifications (e.g. Khalid Khurshid 2023). The dashboard
    # uses this to flag open seats on the constituency page.
    disq_csv = repo_root / "data" / "raw" / "research" / "notable_disqualifications.csv"
    if disq_csv.exists():
        targets["notable_disqualifications.json"] = _df_to_records(
            pd.read_csv(disq_csv)
        )

    # 2026 district-wise voter rolls from Vision Gilgit Baltistan. Includes
    # female + male totals per district and is the source for the
    # district-level voter card on /voters.
    voters_dist_csv = repo_root / "data" / "raw" / "research" / "voters_by_district_2026.csv"
    if voters_dist_csv.exists():
        targets["voters_by_district_2026.json"] = _df_to_records(
            pd.read_csv(voters_dist_csv)
        )

    # 2026 party-slate forecast.
    preds_2026 = clean_dir / "predictions_2026.parquet"
    if preds_2026.exists():
        targets["predictions_2026.json"] = _df_to_records(
            pd.read_parquet(preds_2026)
        )
    summary_2026 = artefacts_dir / "forecast_summary_2026.json"
    if summary_2026.exists():
        targets["forecast_summary_2026.json"] = json.loads(
            summary_2026.read_text(encoding="utf-8")
        )

    # Write.
    for name, payload in targets.items():
        _write_json(exports_dir / name, payload)
        _write_json(web_data_dir / name, payload)

    # Calibration plot image.
    calib = artefacts_dir / "calibration_plot.png"
    if calib.exists():
        web_data_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(calib, web_data_dir / "calibration_plot.png")

    print(f"Exported {len(targets)} JSON payloads to:")
    print(f"  {exports_dir}")
    print(f"  {web_data_dir}")


def main() -> int:
    repo_root = Path(__file__).resolve().parents[3]
    export(repo_root)
    return 0


if __name__ == "__main__":
    sys.exit(main())
