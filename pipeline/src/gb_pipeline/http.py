"""HTTP utilities with rate limiting and retries.

Wikipedia's robots.txt allows bots that send a descriptive User-Agent. We send a
contact-bearing UA and rate-limit to 1 request per 2 seconds per domain, as
required by CLAUDE.md.
"""

from __future__ import annotations

import threading
import time
from collections import defaultdict
from dataclasses import dataclass
from urllib.parse import urlparse

import requests
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

USER_AGENT = (
    "gb-election-forecast-2026/0.1 "
    "(https://github.com/syedaamiradnan/gb-election-forecast-2026; "
    "amiradnan.ptcl@gmail.com) "
    "requests/2.x"
)

MIN_INTERVAL_SECONDS = 2.0

_last_request_at: dict[str, float] = defaultdict(float)
_lock = threading.Lock()


def _wait_for_slot(domain: str) -> None:
    """Block until at least MIN_INTERVAL_SECONDS have passed since last hit to domain."""
    with _lock:
        elapsed = time.monotonic() - _last_request_at[domain]
        if elapsed < MIN_INTERVAL_SECONDS:
            time.sleep(MIN_INTERVAL_SECONDS - elapsed)
        _last_request_at[domain] = time.monotonic()


@dataclass(frozen=True)
class FetchResult:
    url: str
    status_code: int
    html: str
    fetched_at: str


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((requests.ConnectionError, requests.Timeout)),
    reraise=True,
)
def fetch(url: str, *, timeout: float = 20.0) -> FetchResult:
    """GET a URL with rate limiting, retries, and a polite User-Agent."""
    domain = urlparse(url).netloc
    _wait_for_slot(domain)
    headers = {"User-Agent": USER_AGENT, "Accept": "text/html"}
    response = requests.get(url, headers=headers, timeout=timeout)
    response.raise_for_status()
    return FetchResult(
        url=url,
        status_code=response.status_code,
        html=response.text,
        fetched_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    )
