"""Tests that the feature pipeline has no temporal leakage.

A 2015 row's features must depend only on 2009 (and earlier) facts. A 2020
row's features must depend on 2009 + 2015 but never on 2020 itself. If
training accidentally peeks at the holdout year, the holdout numbers become
meaningless.
"""

from __future__ import annotations

import pandas as pd
import pytest

from gb_model.features import build_feature_matrix


def _make_runs() -> pd.DataFrame:
    return pd.DataFrame([
        # GBA-1 2009
        {"constituency_id": "GBA-1", "election_year": 2009, "rank": 1,
         "candidate_id": "alice", "candidate_name": "Alice",
         "party": "PPP", "votes": 100, "vote_share_pct": 50.0,
         "vote_share_pct_imputed": False, "won": True},
        {"constituency_id": "GBA-1", "election_year": 2009, "rank": 2,
         "candidate_id": "bob", "candidate_name": "Bob",
         "party": "PML-N", "votes": 80, "vote_share_pct": 40.0,
         "vote_share_pct_imputed": False, "won": False},
        # GBA-1 2015
        {"constituency_id": "GBA-1", "election_year": 2015, "rank": 1,
         "candidate_id": "alice", "candidate_name": "Alice",
         "party": "PPP", "votes": 120, "vote_share_pct": 55.0,
         "vote_share_pct_imputed": False, "won": True},
        {"constituency_id": "GBA-1", "election_year": 2015, "rank": 2,
         "candidate_id": "charlie", "candidate_name": "Charlie",
         "party": "PTI", "votes": 60, "vote_share_pct": 27.0,
         "vote_share_pct_imputed": False, "won": False},
        # GBA-1 2020 — new candidate
        {"constituency_id": "GBA-1", "election_year": 2020, "rank": 1,
         "candidate_id": "dave", "candidate_name": "Dave",
         "party": "PTI", "votes": 150, "vote_share_pct": 60.0,
         "vote_share_pct_imputed": False, "won": True},
        {"constituency_id": "GBA-1", "election_year": 2020, "rank": 2,
         "candidate_id": "alice", "candidate_name": "Alice",
         "party": "PPP", "votes": 100, "vote_share_pct": 40.0,
         "vote_share_pct_imputed": False, "won": False},
    ])


def _make_elections() -> pd.DataFrame:
    return pd.DataFrame([
        {"year": 2009, "poll_date": "2009-11-12", "ruling_party_centre": "PPP"},
        {"year": 2015, "poll_date": "2015-06-08", "ruling_party_centre": "PML-N"},
        {"year": 2020, "poll_date": "2020-11-15", "ruling_party_centre": "PTI"},
    ])


def _make_constituencies() -> pd.DataFrame:
    return pd.DataFrame([
        {"constituency_id": "GBA-1", "name": "Gilgit I", "district": "Gilgit"},
    ])


@pytest.fixture
def fm() -> pd.DataFrame:
    return build_feature_matrix(_make_runs(), _make_elections(), _make_constituencies())


def test_2009_rows_have_no_prior_features(fm: pd.DataFrame) -> None:
    rows_2009 = fm[fm["election_year"] == 2009]
    # No prior margin should exist for the earliest year in our data.
    assert rows_2009["prior_margin"].isna().all()
    # No prior vote share either.
    assert rows_2009["prior_vote_share"].isna().all()
    # No candidate continuity yet — every 2009 row is a first observation.
    assert (rows_2009["candidate_continuity_score"] == 0).all()


def test_2015_rows_priors_come_only_from_2009(fm: pd.DataFrame) -> None:
    # Alice has a 2009 winning run, so her 2015 row should be flagged as
    # incumbent_running and party_switch_flag = 0 (still PPP).
    alice_2015 = fm[
        (fm["election_year"] == 2015)
        & (fm["candidate_id"] == "alice")
    ].iloc[0]
    assert alice_2015["incumbent_running"] == 1
    assert alice_2015["party_switch_flag"] == 0
    assert alice_2015["prior_vote_share"] == 50.0  # from 2009
    assert alice_2015["candidate_continuity_score"] == 1


def test_2015_prior_margin_uses_2009_only(fm: pd.DataFrame) -> None:
    # GBA-1 2015 rows' prior_margin should equal 2009's margin (50 - 40 = 10).
    rows_2015 = fm[(fm["constituency_id"] == "GBA-1") & (fm["election_year"] == 2015)]
    margins = rows_2015["prior_margin"].dropna().unique()
    assert len(margins) == 1
    assert margins[0] == pytest.approx(10.0, abs=0.01)


def test_2020_prior_margin_uses_2015_only(fm: pd.DataFrame) -> None:
    # GBA-1 2020 rows' prior_margin should equal 2015's margin (55 - 27 = 28),
    # not 2009's margin (10), proving the "most-recent-prior" rule works.
    rows_2020 = fm[(fm["constituency_id"] == "GBA-1") & (fm["election_year"] == 2020)]
    margins = rows_2020["prior_margin"].dropna().unique()
    assert len(margins) == 1
    assert margins[0] == pytest.approx(28.0, abs=0.01)


def test_2020_party_switch_detected(fm: pd.DataFrame) -> None:
    # Alice ran as PPP in 2009 and 2015. In 2020 she's still PPP — no switch.
    alice_2020 = fm[
        (fm["election_year"] == 2020) & (fm["candidate_id"] == "alice")
    ].iloc[0]
    assert alice_2020["party_switch_flag"] == 0


def test_federal_incumbent_match_per_year(fm: pd.DataFrame) -> None:
    # In 2015 the federal centre was PML-N. Alice (PPP) doesn't match;
    # Charlie (PTI) doesn't match either.
    for cid in ("alice", "charlie"):
        row = fm[(fm["election_year"] == 2015) & (fm["candidate_id"] == cid)].iloc[0]
        assert row["federal_incumbent_match"] == 0
    # In 2020 the federal centre was PTI. Dave matches.
    dave = fm[(fm["election_year"] == 2020) & (fm["candidate_id"] == "dave")].iloc[0]
    assert dave["federal_incumbent_match"] == 1


def test_target_preserved(fm: pd.DataFrame) -> None:
    # The `won` column must equal what we put in.
    assert fm[fm["candidate_id"] == "dave"]["won"].iloc[0] == 1
    assert fm[fm["candidate_id"] == "bob"]["won"].iloc[0] == 0
