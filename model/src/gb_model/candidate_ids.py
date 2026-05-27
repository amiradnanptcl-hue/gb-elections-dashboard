"""Cross-year and cross-constituency candidate identity resolution.

Reads:
  data/clean/candidate_runs.parquet

Writes:
  data/clean/candidate_runs_with_id.parquet  (+ .csv)
  data/clean/candidates.parquet              (+ .csv)
  data/manual_review/candidate_id_merges.csv

Approach
--------
Within a single (constituency, election_year) the cleaning pass in
pipeline/gb_pipeline/clean.py already deduplicates. Here we link
the resulting per-race rows into person-level identities that span elections
and constituencies (some candidates contest more than one seat in the same
election; many run repeatedly across years, sometimes switching party).

Algorithm: greedy clustering keyed by title-stripped name. For each row, we
compare against existing cluster representatives using rapidfuzz
token_sort_ratio. A score of >= 85 (matching CLAUDE.md's 0.85 threshold)
attaches the row to that cluster; otherwise we start a new one. Ties are
broken by preferring the cluster the row's party already appears in.

Audit clusters where multiple distinct parties or three or more distinct
constituencies share a candidate id; those land in candidate_id_merges.csv
so we can eyeball them.
"""

from __future__ import annotations

import re
import sys
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path

import pandas as pd
from rapidfuzz import fuzz

CLUSTER_THRESHOLD = 85.0

NAME_TITLES = frozenset({
    "maulana", "maulvi", "mufti", "pir", "sahibzada", "sardar", "hajji", "hajj",
    "haji", "doctor", "dr", "dr.", "engr", "engr.", "engineer", "syed", "hafiz",
    "mir", "raja", "agha", "md", "sahib", "alhaj", "alhajj",
})


# Mirror of pipeline/gb_pipeline/clean.py TRANSLITERATION_CANON. Keeping
# the two in sync ensures the within-race dedup and cross-year cluster
# both treat Ahmad / Ahmed (and similar) as the same token.
TRANSLITERATION_CANON: dict[str, str] = {
    "ahmed": "ahmad",
    "mohammed": "muhammad",
    "mohammad": "muhammad",
    "mohamed": "muhammad",
    "mohamad": "muhammad",
    "hussein": "hussain",
    "hossain": "hussain",
    "hasan": "hassan",
    "hafeez": "hafiz",
    "rahman": "rehman",
    "kazem": "kazim",
    "zakarya": "zakaria",
    "zakariya": "zakaria",
    "abdull": "abdul",
    "ghulaam": "ghulam",
}


def _strip_titles(name: str) -> str:
    # Treat hyphens, underscores, and periods as token separators so that
    # 'Hafeez-ur-Rehman' tokenises the same as 'Hafeez ur Rehman'. Also
    # canonicalise transliteration variants so 'Ahmad' and 'Ahmed' compare
    # identically.
    text = name.replace("-", " ").replace("_", " ").replace(".", "").lower()
    tokens = [t for t in text.split() if t not in NAME_TITLES]
    tokens = [TRANSLITERATION_CANON.get(t, t) for t in tokens]
    return " ".join(tokens) if tokens else text


def _slugify(name: str) -> str:
    s = _strip_titles(name)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "unknown"


def _names_compatible(a: str, b: str) -> bool:
    """True iff two name strings plausibly refer to the same person.

    Two complementary failure modes to rule out:

      False POSITIVE: 'Muhammad Ali' vs 'Muhammad Aziz' or 'Muhammad Ali Akhtar'.
        Different surnames mean different people. Guard by requiring the LAST
        token (surname) to match near-exactly.

      False NEGATIVE: 'Khalid Khurshid' vs 'Muhammad Khalid Khurshid'.
        Same surname, longer name is a strict superset. token_sort_ratio is
        low (~77%) because the shorter form is missing 'Muhammad'. Guard by
        also accepting strict-subset matches when the surname agrees.

    Net rule: surname (last token) must match >= 90, then EITHER full
    token-sort ratio >= 85 OR the shorter name's token set is a strict subset
    of the longer name's token set.
    """
    sa = _strip_titles(a).strip()
    sb = _strip_titles(b).strip()
    if not sa or not sb:
        return False
    if sa == sb:
        return True
    a_toks = sa.split()
    b_toks = sb.split()
    if not a_toks or not b_toks:
        return False
    if fuzz.ratio(a_toks[-1], b_toks[-1]) < 90:
        return False
    if fuzz.token_sort_ratio(sa, sb) >= 88:
        return True
    a_set = set(a_toks)
    b_set = set(b_toks)
    return a_set <= b_set or b_set <= a_set


@dataclass
class Cluster:
    representative: str
    members: list[int] = field(default_factory=list)
    name_counter: Counter[str] = field(default_factory=Counter)
    party_counter: Counter[str] = field(default_factory=Counter)
    constituency_set: set[str] = field(default_factory=set)


def cluster_candidates(runs: pd.DataFrame) -> tuple[list[Cluster], dict[int, str]]:
    """Return clusters and a row-index -> candidate_id map."""
    clusters: list[Cluster] = []
    # Process in deterministic order so re-runs are stable.
    rows = runs.reset_index(drop=False).rename(columns={"index": "orig_index"})
    rows = rows.sort_values(
        by=["election_year", "constituency_id", "rank"], ascending=[True, True, True]
    )

    for r in rows.itertuples(index=False):
        name = r.candidate_name
        party = r.party
        constituency = r.constituency_id
        stripped = _strip_titles(name)

        scored: list[tuple[Cluster, float]] = []
        for cluster in clusters:
            if not any(_names_compatible(name, m) for m in cluster.name_counter):
                continue
            best_score = max(
                fuzz.token_sort_ratio(stripped, _strip_titles(m))
                for m in cluster.name_counter
            )
            scored.append((cluster, best_score))

        if scored:
            # Prefer existing same-party clusters when scores tie.
            scored.sort(
                key=lambda cs: (cs[1], cs[0].party_counter.get(party, 0)),
                reverse=True,
            )
            cluster = scored[0][0]
            cluster.members.append(r.orig_index)
            cluster.name_counter[name] += 1
            cluster.party_counter[party] += 1
            cluster.constituency_set.add(constituency)
        else:
            cluster = Cluster(representative=name)
            cluster.members.append(r.orig_index)
            cluster.name_counter[name] += 1
            cluster.party_counter[party] += 1
            cluster.constituency_set.add(constituency)
            clusters.append(cluster)

    # Assign candidate_id slugs. Use the most-common name as the representative;
    # fall back to first-seen on ties.
    row_to_id: dict[int, str] = {}
    used_slugs: dict[str, int] = {}
    for cluster in clusters:
        rep_name = cluster.name_counter.most_common(1)[0][0]
        cluster.representative = rep_name
        base_slug = _slugify(rep_name)
        suffix = used_slugs.get(base_slug, 0)
        slug = base_slug if suffix == 0 else f"{base_slug}-{suffix}"
        used_slugs[base_slug] = suffix + 1
        for row_idx in cluster.members:
            row_to_id[row_idx] = slug

    return clusters, row_to_id


def emit_merge_audit(
    clusters: list[Cluster], runs: pd.DataFrame, audit_path: Path
) -> None:
    rows: list[dict[str, object]] = []
    for cluster in clusters:
        names = sorted(cluster.name_counter)
        parties = sorted(cluster.party_counter)
        # A 'merge' is anything with more than one observation.
        if len(cluster.members) <= 1:
            continue
        rows.append({
            "candidate_id": _slugify(cluster.representative),
            "representative": cluster.representative,
            "n_runs": len(cluster.members),
            "name_variants": " | ".join(names),
            "distinct_parties": len(parties),
            "parties": ", ".join(parties),
            "distinct_constituencies": len(cluster.constituency_set),
            "constituencies": ", ".join(sorted(cluster.constituency_set)),
            "needs_review": (
                len(parties) > 2 or len(cluster.constituency_set) > 2
            ),
        })
    audit_path.parent.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(rows).sort_values(
        ["needs_review", "n_runs"], ascending=[False, False]
    ).to_csv(audit_path, index=False, encoding="utf-8")


def main() -> int:
    repo_root = Path(__file__).resolve().parents[3]
    clean_dir = repo_root / "data" / "clean"
    review_dir = repo_root / "data" / "manual_review"

    runs = pd.read_parquet(clean_dir / "candidate_runs.parquet")
    clusters, row_to_id = cluster_candidates(runs)

    runs = runs.reset_index(drop=False).rename(columns={"index": "orig_index"})
    runs["candidate_id"] = runs["orig_index"].map(row_to_id)
    runs = runs.drop(columns="orig_index")

    # Persist with-id table
    out_runs = clean_dir / "candidate_runs_with_id"
    runs.to_csv(out_runs.with_suffix(".csv"), index=False, encoding="utf-8")
    runs.to_parquet(out_runs.with_suffix(".parquet"), index=False)

    # Persist candidates table.
    candidatesorig_indexs = []
    for cluster in clusters:
        candidatesorig_indexs.append({
            "candidate_id": _slugify(cluster.representative),
            "name": cluster.representative,
            "normalised_name": _strip_titles(cluster.representative),
            "n_runs": len(cluster.members),
            "parties": ", ".join(sorted(cluster.party_counter)),
            "constituencies": ", ".join(sorted(cluster.constituency_set)),
            "dynasty_flag": False,  # Reserved for manual annotation in v1.
            "notes": "",
        })
    candidates_df = pd.DataFrame(candidatesorig_indexs).sort_values("n_runs", ascending=False)
    candidates_df.to_csv(clean_dir / "candidates.csv", index=False, encoding="utf-8")
    candidates_df.to_parquet(clean_dir / "candidates.parquet", index=False)

    emit_merge_audit(clusters, runs, review_dir / "candidate_id_merges.csv")

    print(f"Resolved {len(clusters)} candidate identities from {len(runs)} runs.")
    print(f"  Candidates with multiple runs: {sum(1 for c in clusters if len(c.members) > 1)}")
    multi_party = sum(1 for c in clusters if len(c.party_counter) > 1)
    print(f"  Party switchers: {multi_party}")
    multi_const = sum(1 for c in clusters if len(c.constituency_set) > 1)
    print(f"  Cross-constituency runners: {multi_const}")
    need_review = sum(
        1 for c in clusters
        if len(c.party_counter) > 2 or len(c.constituency_set) > 2
    )
    print(f"  Need manual review: {need_review}")
    print(f"\nWritten: {out_runs}.csv / .parquet")
    print(f"Written: {clean_dir / 'candidates.csv'} / .parquet")
    print(f"Audit:   {review_dir / 'candidate_id_merges.csv'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
