"""Regression tests for the name-compatibility rule used in candidate clustering.

The rule has to thread two needles at once:

  * Block FALSE POSITIVES like 'Muhammad Ali' <-> 'Muhammad Aziz' or
    'Muhammad Ayub Shah' <-> 'Syed Muhammad Ali Shah'. These share the common
    Muslim given-name prefix 'Muhammad' / 'Ali' but have different surnames,
    so they are different people.
  * Allow TRUE POSITIVES like 'Maulana Sultan Rais' <-> 'Sultan Rais'
    (honorific stripped) and 'Khalid Khurshid' <-> 'Muhammad Khalid Khurshid'
    (strict subset with matching surname).

If these two failure modes start passing into the same cluster, the model's
candidate-level features become noisy and `incumbent_running` etc. start
mis-firing.
"""

from __future__ import annotations

import pytest

from gb_model.candidate_ids import _names_compatible, _strip_titles


@pytest.mark.parametrize(
    "a,b",
    [
        # Exact same name after stripping titles.
        ("Khalid Khurshid", "Khalid Khurshid"),
        ("Maulana Sultan Rais", "Sultan Rais"),
        ("Dr Muhammad Ali", "Muhammad Ali"),
        ("Hafiz Hafeezur Rehman", "Hafeezur Rehman"),
        # Spelling variants on the surname (1-char difference, still >= 90%).
        ("Abdul Hameed Khan", "Abdul Hamid Khan"),
        # Subset / superset, matching surname.
        ("Khalid Khurshid", "Muhammad Khalid Khurshid"),
        # Hyphen vs space (after _strip_titles tokenisation).
        ("Hafeez-ur-Rehman", "Hafeez ur Rehman"),
    ],
)
def test_names_compatible_true(a: str, b: str) -> None:
    assert _names_compatible(a, b), f"Expected {a!r} compatible with {b!r}"


@pytest.mark.parametrize(
    "a,b",
    [
        # Different surnames sharing 'Muhammad' prefix. These were false-merged
        # by the original token_set_ratio rule.
        ("Muhammad Ali", "Muhammad Aziz"),
        ("Muhammad Ali Akhtar", "Muhammad Ali"),
        ("Muhammad Hassan", "Muhammad Issa"),
        # 'Shah' is a common surname; common prefix is not enough.
        ("Muhammad Ayub Shah", "Syed Muhammad Ali Shah"),
        # Different first names, same surname but ratio < 90.
        ("Ghulam Abbas", "Ghulam Akbar"),
        ("Gulbar Khan", "Dilbar Khan"),
    ],
)
def test_names_compatible_false(a: str, b: str) -> None:
    assert not _names_compatible(a, b), f"Expected {a!r} NOT compatible with {b!r}"


def test_strip_titles_removes_honorifics() -> None:
    assert _strip_titles("Maulana Sultan Rais") == "sultan rais"
    assert _strip_titles("Dr. Muhammad Ali") == "muhammad ali"
    assert _strip_titles("Syed Mehdi Shah") == "mehdi shah"
    # 'Muhammad' is a personal name, not a title; must stay.
    assert "muhammad" in _strip_titles("Muhammad Ali")
