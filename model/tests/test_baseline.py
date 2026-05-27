"""Tests for the federal-incumbent baseline scorer."""

from __future__ import annotations

import pandas as pd

from gb_model.baseline import baseline_predictions, evaluate


def _runs() -> pd.DataFrame:
    return pd.DataFrame([
        # 2009: PPP won 2 of 3 seats; Independent took the third.
        {"constituency_id": "GBA-1", "election_year": 2009, "won": True,
         "party": "PPP", "candidate_name": "A"},
        {"constituency_id": "GBA-1", "election_year": 2009, "won": False,
         "party": "PML-N", "candidate_name": "B"},
        {"constituency_id": "GBA-2", "election_year": 2009, "won": True,
         "party": "PPP", "candidate_name": "C"},
        {"constituency_id": "GBA-3", "election_year": 2009, "won": True,
         "party": "Independent", "candidate_name": "D"},
        # 2015: PML-N won 1, PTI won 1, PPP won 1.
        {"constituency_id": "GBA-1", "election_year": 2015, "won": True,
         "party": "PML-N", "candidate_name": "E"},
        {"constituency_id": "GBA-2", "election_year": 2015, "won": True,
         "party": "PTI", "candidate_name": "F"},
        {"constituency_id": "GBA-3", "election_year": 2015, "won": True,
         "party": "PPP", "candidate_name": "G"},
    ])


def _elections() -> pd.DataFrame:
    return pd.DataFrame([
        {"year": 2009, "poll_date": "2009-11-12", "ruling_party_centre": "PPP"},
        {"year": 2015, "poll_date": "2015-06-08", "ruling_party_centre": "PML-N"},
    ])


def test_baseline_predicts_federal_party_everywhere() -> None:
    preds = baseline_predictions(_runs(), _elections(), 2009)
    assert (preds["predicted_party"] == "PPP").all()


def test_baseline_correctness_per_constituency() -> None:
    preds = baseline_predictions(_runs(), _elections(), 2009)
    # GBA-1 and GBA-2 won by PPP → correct. GBA-3 won by Independent → wrong.
    assert preds.loc["GBA-1", "correct"]
    assert preds.loc["GBA-2", "correct"]
    assert not preds.loc["GBA-3", "correct"]


def test_evaluate_per_year_accuracy() -> None:
    report = evaluate(_runs(), _elections(), years=(2009, 2015))
    assert report["per_year"]["2009"]["correct_predictions"] == 2
    assert report["per_year"]["2009"]["predicted_winners"] == 3
    # 2015: predicted PML-N everywhere; only GBA-1 actually went PML-N.
    assert report["per_year"]["2015"]["correct_predictions"] == 1
