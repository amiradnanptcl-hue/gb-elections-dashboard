"""Tests for canonical party-id mapping."""

from __future__ import annotations

import pytest

from gb_pipeline.parties import PARTY_DISPLAY, canonicalise


@pytest.mark.parametrize(
    "raw,expected",
    [
        # PPP variants
        ("PPP", "PPP"),
        ("Pakistan Peoples Party", "PPP"),
        ("Pakistan People's Party", "PPP"),
        ("PPPP", "PPP"),
        ("Pakistan Peoples Party Parliamentarians", "PPP"),
        # PML-N variants — parens, hyphens, space-separated
        ("PML-N", "PML-N"),
        ("PML(N)", "PML-N"),
        ("PML (N)", "PML-N"),
        ("Pakistan Muslim League (N)", "PML-N"),
        ("Pakistan Muslim League N", "PML-N"),
        # PML-Q
        ("PML-Q", "PML-Q"),
        ("PML (Q)", "PML-Q"),
        # PTI
        ("PTI", "PTI"),
        ("Pakistan Tehreek-e-Insaf", "PTI"),
        # JUI-F variants — observed bug from scrape
        ("JUI-F", "JUI-F"),
        ("JUI(F)", "JUI-F"),
        ("JUI (F)", "JUI-F"),
        ("JUI F", "JUI-F"),
        # MWM and the observed MWN typo
        ("MWM", "MWM"),
        ("MWN", "MWM"),
        ("Majlis Wahdat-e-Muslimeen", "MWM"),
        ("Majlis-e-Wahdat-e-Muslimeen", "MWM"),
        # Independent
        ("Independent", "Independent"),
        ("IND", "Independent"),
        ("Indep.", "Independent"),
        # MQM, APML, PAT, AWP added after first sweep surfaced gaps
        ("MQM", "MQM"),
        ("Muttahida Qaumi Movement", "MQM"),
        ("APML", "APML"),
        ("All Pakistan Muslim League", "APML"),
        ("PAT", "PAT"),
        ("Pakistan Awami Tehreek", "PAT"),
        ("AWP", "AWP"),
        ("Awami Workers Party (AWP)", "AWP"),
        # BNF
        ("BNF(N)", "BNF-N"),
        ("Balawaristan National Front (Naji)", "BNF-N"),
    ],
)
def test_canonicalise_known_party(raw: str, expected: str) -> None:
    assert canonicalise(raw) == expected


def test_unknown_party_returns_marked_string() -> None:
    # Unknown parties must surface in audits via a trailing '?', not silently
    # collapse into a default id.
    result = canonicalise("Made-Up Party")
    assert result.endswith("?")


def test_empty_returns_empty() -> None:
    assert canonicalise("") == ""


def test_all_canonical_ids_have_display_names() -> None:
    seen_ids = {canonicalise(v) for v in [
        "PPP", "PML-N", "PTI", "MWM", "ITP", "JUI-F", "JI",
        "BNF(N)", "PML-Q", "MQM", "APML", "PAT", "PSP", "AWP", "Independent",
    ]}
    seen_ids.discard("")
    for cid in seen_ids:
        assert cid in PARTY_DISPLAY, f"Missing display name for {cid}"
