"""Canonical party abbreviations and mapping from all observed Wikipedia forms.

CLAUDE.md uses Pakistani party abbreviations (PPP, PML-N, PTI, JUI-F, MWM, JI)
in code with expansion only in user-facing copy on first mention. This module
defines those canonical IDs and a lookup that handles every spelling we have
seen so far across the constituency pages and summary pages.

Unknown party strings are returned as-is with a trailing '?' marker so they
surface in audits rather than silently slipping into the dataset under a wrong
canonical id.
"""

from __future__ import annotations

import re
import unicodedata

# Canonical id -> human-readable display name. The display name is shown only
# on first mention in user-facing copy, per CLAUDE.md.
PARTY_DISPLAY: dict[str, str] = {
    "PPP": "Pakistan Peoples Party",
    "PML-N": "Pakistan Muslim League (N)",
    "PTI": "Pakistan Tehreek-e-Insaf",
    "MWM": "Majlis Wahdat-e-Muslimeen",
    "ITP": "Islami Tehreek Pakistan",
    "JUI-F": "Jamiat Ulema-e-Islam (F)",
    "JI": "Jamaat-e-Islami",
    "BNF-N": "Balawaristan National Front (Naji)",
    "PML-Q": "Pakistan Muslim League (Q)",
    "PML": "Pakistan Muslim League (faction unspecified)",
    "MQM": "Muttahida Qaumi Movement",
    "APML": "All Pakistan Muslim League",
    "PAT": "Pakistan Awami Tehreek",
    "PSP": "Pak Sarzameen Party",
    "AWP": "Awami Workers Party",
    "TLP": "Tehreek-e-Labbaik Pakistan",
    "ANP": "Awami National Party",
    "Independent": "Independent",
}

# Maps lowercased, ASCII-folded observed strings to canonical id. Keys here
# match how _normalise() reduces the input. Order matters within each block
# (longer phrases first) only when they overlap; we look up exact normalised
# keys first, then fall back to substring rules in CANONICALISATION_RULES.
EXACT_FORMS: dict[str, str] = {
    # PPP variants
    "ppp": "PPP",
    "pakistan peoples party": "PPP",
    "pakistan people's party": "PPP",
    # PML-N variants
    "pml-n": "PML-N",
    "pml(n)": "PML-N",
    "pmln": "PML-N",
    "pakistan muslim league (n)": "PML-N",
    "pakistan muslim league n": "PML-N",
    # PTI
    "pti": "PTI",
    "pakistan tehreek-e-insaf": "PTI",
    "pakistan tehreek e insaf": "PTI",
    # MWM
    "mwm": "MWM",
    "mwn": "MWM",  # observed once; Wikipedia transcription typo for MWM.
    "majlis-e-wahdat-e-muslimeen": "MWM",
    "majlis wahdat-e-muslimeen": "MWM",
    "majlis-e-wahdat-ul-muslimeen": "MWM",
    "mwm-p": "MWM",
    # ITP
    "itp": "ITP",
    "islami tehreek pakistan": "ITP",
    "islami tehrik pakistan": "ITP",
    # JUI-F
    "jui-f": "JUI-F",
    "jui(f)": "JUI-F",
    "juif": "JUI-F",
    "jui f": "JUI-F",
    "jamiat ulema-e-islam (f)": "JUI-F",
    "jamiat ulema e islam (f)": "JUI-F",
    "jamiat ulema-e-islam(f)": "JUI-F",
    # JI
    "ji": "JI",
    "jamaat-e-islami": "JI",
    "jamaat e islami": "JI",
    "jamaat-i-islami": "JI",
    # BNF
    "bnf-n": "BNF-N",
    "bnf(n)": "BNF-N",
    "bnf": "BNF-N",
    "balawaristan national front (naji)": "BNF-N",
    "balawaristan national front naji": "BNF-N",
    # PML-Q
    "pml-q": "PML-Q",
    "pml(q)": "PML-Q",
    "pakistan muslim league (q)": "PML-Q",
    # TLP
    "tlp": "TLP",
    "tehreek-e-labbaik pakistan": "TLP",
    # ANP
    "anp": "ANP",
    "awami national party": "ANP",
    # Independent
    "ind": "Independent",
    "independent": "Independent",
    "indep.": "Independent",
    "indep": "Independent",
    # MQM
    "mqm": "MQM",
    "muttahida qaumi movement": "MQM",
    "mqm-p": "MQM",
    # APML (Musharraf's All Pakistan Muslim League)
    "apml": "APML",
    "all pakistan muslim league": "APML",
    # PAT (Pakistan Awami Tehreek)
    "pat": "PAT",
    "pakistan awami tehreek": "PAT",
    "pakistan awami tehrik": "PAT",
    # PPPP — the formal party name registered with the ECP for the Peoples
    # Party. Always rolls up to PPP.
    "pppp": "PPP",
    "pakistan peoples party parliamentarians": "PPP",
    # Pak Sarzameen Party
    "psp": "PSP",
    "pak sarzameen party": "PSP",
    # Awami Workers Party
    "awp": "AWP",
    "awami workers party": "AWP",
    "awami workers party (awp)": "AWP",
    # Bare 'PML' (faction unspecified — Wikipedia editors occasionally drop the
    # suffix; we keep a separate canonical id rather than guessing).
    "pml": "PML",
}


def _normalise(text: str) -> str:
    """Lowercase, ASCII-fold, collapse whitespace, strip wiki annotations,
    and remove spaces adjacent to parentheses so 'PML (N)' matches 'pml(n)'."""
    if not text:
        return ""
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"\[[^\]]*\]", "", text)
    text = text.lower()
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"\s*([()])\s*", r"\1", text)
    return text


def canonicalise(party_text: str) -> str:
    """Return the canonical party id, or the original string with '?' appended."""
    if party_text is None or party_text == "":
        return ""
    key = _normalise(party_text)
    if key in EXACT_FORMS:
        return EXACT_FORMS[key]
    # Best-effort substring rules for free-form text that fell through.
    if re.fullmatch(r"pml\s*[-(]?\s*n\s*\)?", key):
        return "PML-N"
    if re.fullmatch(r"pml\s*[-(]?\s*q\s*\)?", key):
        return "PML-Q"
    if "muslim league" in key and "(n)" in key:
        return "PML-N"
    if "muslim league" in key and "(q)" in key:
        return "PML-Q"
    if "peoples party" in key or "people's party" in key:
        return "PPP"
    if "tehreek-e-insaf" in key or "tehreek e insaf" in key:
        return "PTI"
    if "wahdat" in key:
        return "MWM"
    if "islami tehreek" in key or "islami tehrik" in key:
        return "ITP"
    if "jamiat ulema" in key:
        return "JUI-F"
    if "jamaat-e-islami" in key or "jamaat e islami" in key or "jamaat-i-islami" in key:
        return "JI"
    if "balawaristan" in key:
        return "BNF-N"
    if "muttahida" in key:
        return "MQM"
    if "awami workers" in key:
        return "AWP"
    if "awami tehreek" in key or "awami tehrik" in key:
        return "PAT"
    if "sarzameen" in key:
        return "PSP"
    return f"{party_text}?"
