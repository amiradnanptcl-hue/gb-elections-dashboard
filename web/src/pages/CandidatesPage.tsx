import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCandidateField2026, getParty } from "@/lib/parties";
import { formatNumber } from "@/lib/utils";

// Source: deep-research-report.md. The ECGB received 693 nomination papers,
// then scrutinised the field and released the final 403-candidate list on
// 14 May 2026 (272 independents plus 131 party-backed candidates, of whom 8
// are women: 5 independents and one each from PPP, IPP, and PNP).
const NOMINATION_PAPERS_FILED = 693;
const FINAL_CANDIDATES = 403;
const FINAL_WOMEN_CANDIDATES = 8;

export function CandidatesPage() {
  const field = useMemo(() => getCandidateField2026(), []);
  const namedTotal = field
    .filter((p) => p.id !== "Independent")
    .reduce((s, p) => s + (p.candidates2026 ?? 0), 0);
  const independentCount =
    field.find((p) => p.id === "Independent")?.candidates2026 ?? 0;
  const postScrutinyTotal = namedTotal + independentCount;

  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = q
    ? field.filter((p) => {
        const haystack =
          `${p.id} ${p.display} ${p.shortDisplay} ${p.electionSymbol ?? ""}`.toLowerCase();
        return haystack.includes(q);
      })
    : field;

  return (
    <div className="space-y-10 max-w-5xl">
      <header className="space-y-4">
        <Link
          to="/"
          className="text-sm text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)] inline-flex items-center gap-1"
        >
          ← Back to home
        </Link>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="inline-block h-px w-10 bg-[color:var(--color-accent-gold)]" />
            <span className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
              The 2026 field
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.05]">
            403 candidates in the final field
          </h1>
          <p className="text-[color:var(--color-muted-foreground)] text-base sm:text-lg max-w-2xl leading-relaxed">
            ECGB received{" "}
            <span className="font-mono tabular font-semibold text-[color:var(--color-foreground)]">
              {formatNumber(NOMINATION_PAPERS_FILED)}
            </span>{" "}
            nomination papers for the 2026 GB Assembly election. After
            scrutiny, withdrawals, and the rejection of duplicate-seat
            filings, the final list released on 14 May 2026 carries{" "}
            <span className="font-mono tabular font-semibold text-[color:var(--color-foreground)]">
              {formatNumber(FINAL_CANDIDATES)}
            </span>{" "}
            candidates: {independentCount} independents and {namedTotal}{" "}
            party-backed nominees. Only {FINAL_WOMEN_CANDIDATES} women made
            the final list.
          </p>
        </div>
      </header>

      {/* Top stat strip */}
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="card-elevated card-accent-green p-5 space-y-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
            Final candidates (14 May 2026)
          </p>
          <p className="stat-display text-4xl">{FINAL_CANDIDATES}</p>
          <p className="text-xs text-[color:var(--color-muted-foreground)]">
            Independents {formatNumber(independentCount)} · party-backed{" "}
            {formatNumber(namedTotal)}.
          </p>
        </article>
        <article className="card-elevated card-accent-gold p-5 space-y-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
            Nomination papers filed
          </p>
          <p className="stat-display text-4xl">{NOMINATION_PAPERS_FILED}</p>
          <p className="text-xs text-[color:var(--color-muted-foreground)]">
            Pre-scrutiny total. Includes duplicates and applications later
            rejected or withdrawn.
          </p>
        </article>
        <article className="card-elevated card-accent-red p-5 space-y-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
            Independents share
          </p>
          <p className="stat-display text-4xl">
            {Math.round((independentCount / FINAL_CANDIDATES) * 100)}%
          </p>
          <p className="text-xs text-[color:var(--color-muted-foreground)]">
            Highest fragmentation on record for a GB cycle.
          </p>
        </article>
      </section>

      {/* Search */}
      <section className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
            Find a party
          </p>
          <h2 className="font-display text-2xl sm:text-3xl">
            Search by party name, symbol, or abbreviation
          </h2>
        </div>
        <div className="relative max-w-xl">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try “Peoples”, “Tractor”, or “PML”"
            aria-label="Search parties"
            className="w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-4 py-3 pr-12 text-sm sm:text-base placeholder:text-[color:var(--color-muted-foreground)]/60 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent-gold)] focus:border-[color:var(--color-accent-gold)] transition-shadow"
          />
          <span
            aria-hidden
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--color-muted-foreground)]"
          >
            ⌕
          </span>
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)] text-xs uppercase tracking-[0.18em]"
            >
              Clear
            </button>
          )}
        </div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
          Showing {filtered.length} of {field.length} parties
        </p>
      </section>

      {/* Party-grouped grid */}
      <section className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const meta = getParty(p.id);
            const isHighRoller = (p.candidates2026 ?? 0) >= 10;
            const accent =
              p.id === "Independent"
                ? "card-accent-red"
                : isHighRoller
                  ? "card-accent-green"
                  : "card-accent-gold";
            return (
              <Link
                key={p.id}
                to={`/party/${encodeURIComponent(p.id)}`}
                className={`card-elevated ${accent} p-5 space-y-3 flex flex-col group`}
              >
                <div className="flex items-start justify-between gap-3">
                  <img
                    src={meta.flag}
                    alt=""
                    width="40"
                    height="28"
                    className="h-10 w-12 rounded-md object-cover ring-1 ring-[color:var(--color-border)] shrink-0"
                    loading="lazy"
                    decoding="async"
                  />
                  {meta.electionSymbolIcon && (
                    <span
                      className="text-2xl leading-none"
                      aria-hidden
                      title={meta.electionSymbol ?? undefined}
                    >
                      {meta.electionSymbolIcon}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-mono tabular text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
                    {meta.shortDisplay}
                  </p>
                  <h3 className="font-display text-xl sm:text-2xl leading-[1.1]">
                    {meta.display}
                  </h3>
                </div>
                <div className="flex items-baseline justify-between mt-auto pt-2">
                  <span className="stat-display text-3xl">
                    {p.candidates2026 ?? 0}
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)] group-hover:text-[color:var(--color-foreground)] inline-flex items-center gap-1 transition-colors">
                    {meta.electionSymbol ?? "—"}
                    <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-[color:var(--color-muted-foreground)] py-12">
            No party matches “{query}”.
          </p>
        )}
      </section>

      <section className="card-elevated card-accent-gold p-5 sm:p-6 space-y-2 top-edge relative">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-accent-gold)] font-bold">
          693 papers vs 403 final candidates
        </p>
        <p className="text-sm text-[color:var(--color-foreground)] leading-relaxed">
          The {formatNumber(NOMINATION_PAPERS_FILED)} figure is the count of
          nomination papers filed pre-scrutiny. After the ECGB scrutiny,
          withdrawals, and the rejection of duplicate-seat filings, the
          contested field settles at {formatNumber(FINAL_CANDIDATES)}{" "}
          candidates ({formatNumber(postScrutinyTotal)} in our roster — close
          enough that the residual gap reflects independents we have not yet
          attributed to a single seat). Both numbers are accurate; they
          answer different questions.
        </p>
      </section>
    </div>
  );
}
