import { Link, useParams, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { getParty } from "@/lib/parties";
import {
  useCandidateRuns,
  useConstituencies,
  useKnownNominees2026,
} from "@/lib/data";
import { useDocumentMeta } from "@/lib/seo";
import { formatNumber } from "@/lib/utils";

interface CandidateAggregate {
  candidate_id: string;
  display_name: string;
  constituencies: Set<string>;
  best_year: number | null;
  best_constituency: string | null;
  best_rank: number | null;
  best_won: boolean;
  best_vote_share: number | null;
  total_votes: number;
  appearances: number;
}

export function PartyPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const partyId = id ?? "";
  const meta = getParty(partyId);
  useDocumentMeta({
    title: `${meta.display} (${meta.shortDisplay}) in Gilgit-Baltistan elections — gbelections.com`,
    description: `${meta.display} performance in every GB Assembly election since 2009. 2026 ticket-holders, historical winners, per-seat vote share. ${meta.electionSymbol ? `Election symbol: ${meta.electionSymbol}.` : ""}`,
    path: `/party/${encodeURIComponent(partyId)}`,
  });

  // Optional filters from the URL. /party/PTI?year=2020&filter=winners restricts
  // the roster to the 11 PTI candidates who actually won in 2020. Use this
  // entry point from the home "2020 winners by party" chips.
  // /party/PPP?year=2026 switches the page into a forward-looking view that
  // shows ONLY the 2026 contesting candidates, hiding the historical roster.
  const filterYearRaw = searchParams.get("year");
  const filterYear = filterYearRaw ? Number.parseInt(filterYearRaw, 10) : null;
  const filterWinnersOnly = searchParams.get("filter") === "winners";
  const filtersActive =
    (filterYear != null && !Number.isNaN(filterYear)) || filterWinnersOnly;
  const is2026View = filterYear === 2026;

  const runsQ = useCandidateRuns();
  const constituenciesQ = useConstituencies();
  const knownNomineesQ = useKnownNominees2026();

  const runs = runsQ.data ?? [];
  const constituencies = constituenciesQ.data ?? [];
  const known2026 = (knownNomineesQ.data ?? []).filter((n) => {
    const partyMeta = getParty(n.party);
    return partyMeta.id === meta.id;
  });

  const constituencyName = new Map(
    constituencies.map((c) => [c.constituency_id, c.name] as const),
  );

  // Filter candidate runs to those matching this party. We compare against
  // both the canonical id and the shortDisplay so legacy spellings still
  // resolve. Independent and partyless rows are matched on the raw string.
  // After party filtering, apply optional year + winners-only filters from
  // the URL query string.
  const partyRuns = runs
    .filter((r) => {
      const m = getParty(r.party);
      return m.id === meta.id;
    })
    .filter((r) => (filterYear != null ? r.election_year === filterYear : true))
    .filter((r) => (filterWinnersOnly ? r.won : true));

  // Group by candidate to produce one row per person, with the constituencies
  // they have contested under this party and their best historical result.
  const grouped = new Map<string, CandidateAggregate>();
  for (const r of partyRuns) {
    const key = r.candidate_id;
    const existing = grouped.get(key) ?? {
      candidate_id: r.candidate_id,
      display_name: r.candidate_name,
      constituencies: new Set<string>(),
      best_year: null,
      best_constituency: null,
      best_rank: null,
      best_won: false,
      best_vote_share: null,
      total_votes: 0,
      appearances: 0,
    };
    existing.constituencies.add(r.constituency_id);
    existing.appearances += 1;
    if (r.votes) existing.total_votes += r.votes;

    // "Best" = lowest rank (1 is best), then highest vote share as tiebreaker.
    const isBetter =
      existing.best_rank == null ||
      r.rank < existing.best_rank ||
      (r.rank === existing.best_rank &&
        (r.vote_share_pct ?? 0) > (existing.best_vote_share ?? 0));
    if (isBetter) {
      existing.best_rank = r.rank;
      existing.best_won = r.won;
      existing.best_year = r.election_year;
      existing.best_constituency = r.constituency_id;
      existing.best_vote_share = r.vote_share_pct;
    }
    grouped.set(key, existing);
  }

  const candidates = [...grouped.values()].sort((a, b) => {
    // Winners first, then by rank, then by total votes.
    if (a.best_won !== b.best_won) return a.best_won ? -1 : 1;
    if ((a.best_rank ?? 99) !== (b.best_rank ?? 99))
      return (a.best_rank ?? 99) - (b.best_rank ?? 99);
    return b.total_votes - a.total_votes;
  });

  const winnersCount = candidates.filter((c) => c.best_won).length;

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="space-y-5">
        <Link
          to="/"
          className="text-sm text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)] inline-flex items-center gap-1"
        >
          ← Back to home
        </Link>
        {filtersActive && (
          <div className="card-elevated card-accent-gold flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
            <span className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-accent-gold)] font-bold">
              Filter active
            </span>
            <span className="text-[color:var(--color-foreground)]">
              {filterYear != null && !Number.isNaN(filterYear)
                ? `Election year ${filterYear}`
                : "All years"}
              {filterWinnersOnly ? " · winners only" : ""}
            </span>
            <Link
              to={`/party/${encodeURIComponent(meta.id)}`}
              className="ml-auto text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)] underline-offset-4 hover:underline"
            >
              Clear filter ✕
            </Link>
          </div>
        )}
        <div className="flex items-start gap-4 sm:gap-6">
          <img
            src={meta.flag}
            alt={`${meta.display} flag`}
            width="96"
            height="64"
            className="h-16 w-24 rounded-md object-cover border border-[color:var(--color-border)] shadow-[var(--shadow-md)] shrink-0"
            loading="eager"
            decoding="async"
          />
          <div className="space-y-2 min-w-0">
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
              Party profile
            </p>
            <h1 className="font-display text-4xl sm:text-5xl leading-[1.05] truncate">
              {meta.display}
            </h1>
            <p className="text-[color:var(--color-muted-foreground)] flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="font-mono uppercase tracking-wider">
                {meta.shortDisplay}
              </span>
              {meta.electionSymbol && (
                <>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1.5">
                    {meta.electionSymbolIcon && (
                      <span className="text-base leading-none" aria-hidden>
                        {meta.electionSymbolIcon}
                      </span>
                    )}
                    <span>Symbol: {meta.electionSymbol}</span>
                  </span>
                </>
              )}
              {meta.candidates2026 != null && (
                <>
                  <span aria-hidden>·</span>
                  <span>
                    <span className="font-mono tabular font-semibold">
                      {meta.candidates2026}
                    </span>{" "}
                    candidates filed for 2026
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      </header>

      {/* Stat strip. The "2026 candidates" card is now a Link so visitors can
        jump to a forward-looking view that hides historical 2009-2020 rows
        and shows only the people contesting in 2026. The other two cards
        stay informational because they describe the historical roster which
        already renders below. */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Link
          to={`/party/${encodeURIComponent(meta.id)}?year=2026`}
          aria-label={`Show only the 2026 ${meta.shortDisplay} candidates`}
          className={`card-elevated card-accent-green p-5 space-y-2 block transition-colors ${
            is2026View
              ? "ring-2 ring-[color:var(--color-primary)] ring-offset-2 ring-offset-[color:var(--color-background)]"
              : ""
          }`}
        >
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
            2026 candidates {is2026View ? "· active" : "→ click to filter"}
          </p>
          <p className="stat-display text-4xl">
            {meta.candidates2026 ?? "—"}
          </p>
        </Link>
        <div className="card-elevated card-accent-gold p-5 space-y-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
            Historical candidates in our dataset
          </p>
          <p className="stat-display text-4xl">{candidates.length}</p>
        </div>
        <div className="card-elevated card-accent-green p-5 space-y-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
            Historical seat wins (2009–2020)
          </p>
          <p className="stat-display text-4xl">{winnersCount}</p>
        </div>
      </section>

      {/* 2026 candidates — unified by-constituency list. One section, one
        table, sorted by seat number. Where we have a verified name we show
        it inline with the constituency name; where the party has filed a
        candidate but we don't yet have the name from ECGB Form-33, that
        gap is folded into the table's footer note instead of being split
        into a second visual block. */}
      {(known2026.length > 0 || is2026View) && (
        <section className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-accent-gold)] font-bold">
              2026 candidates
            </p>
            <h2 className="font-display text-2xl sm:text-3xl">
              {meta.shortDisplay} candidates contesting in 2026
            </h2>
            <p className="text-sm text-[color:var(--color-muted-foreground)] max-w-2xl">
              {meta.candidates2026 != null ? (
                <>
                  {meta.shortDisplay} has filed{" "}
                  <span className="font-mono tabular font-semibold text-[color:var(--color-foreground)]">
                    {meta.candidates2026}
                  </span>{" "}
                  candidates for 2026 in total. We have verified{" "}
                  <span className="font-mono tabular font-semibold text-[color:var(--color-foreground)]">
                    {known2026.length}
                  </span>{" "}
                  name{known2026.length === 1 ? "" : "s"} from ECGB Form-33
                  notifications and the research-pack news track.
                </>
              ) : (
                <>
                  Names sourced from ECGB Form-33 notifications and the
                  research-pack news track.
                </>
              )}
            </p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)] border-b border-[color:var(--color-border)]">
                  <th className="px-4 py-3 font-medium">Constituency</th>
                  <th className="px-4 py-3 font-medium">2026 candidate</th>
                  <th className="px-4 py-3 font-medium">Source / notes</th>
                </tr>
              </thead>
              <tbody>
                {known2026.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-sm text-[color:var(--color-muted-foreground)] text-center"
                    >
                      No individual {meta.shortDisplay} names have been
                      verified yet from the ECGB Form-33 sheet.
                    </td>
                  </tr>
                ) : (
                  [...known2026]
                    .sort((a, b) => {
                      const ai = parseInt(a.constituency_id.split("-")[1], 10);
                      const bi = parseInt(b.constituency_id.split("-")[1], 10);
                      return ai - bi;
                    })
                    .map((n) => (
                      <tr
                        key={`${n.candidate_name}-${n.constituency_id}`}
                        className="border-b border-[color:var(--color-border)] last:border-b-0 hover:bg-[color:var(--color-muted)]/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <Link
                            to={`/constituency/${n.constituency_id}`}
                            className="inline-flex flex-col"
                          >
                            <span className="font-mono font-semibold text-[color:var(--color-accent-gold)]">
                              {n.constituency_id}
                            </span>
                            <span className="text-[11px] text-[color:var(--color-muted-foreground)]">
                              {constituencyName.get(n.constituency_id) ?? ""}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold">
                            {n.candidate_name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-[color:var(--color-muted-foreground)]">
                          {n.role_notes && (
                            <span className="block">{n.role_notes}</span>
                          )}
                          <span className="block text-[10px] opacity-80 mt-1">
                            Source: {n.source}
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
              {meta.candidates2026 != null &&
                meta.candidates2026 > known2026.length && (
                  <tfoot>
                    <tr className="border-t-2 border-[color:var(--color-border-strong)]">
                      <td
                        colSpan={3}
                        className="px-4 py-3 text-[11px] text-[color:var(--color-muted-foreground)] leading-relaxed"
                      >
                        <span className="font-mono tabular font-semibold text-[color:var(--color-foreground)]">
                          {meta.candidates2026 - known2026.length}
                        </span>{" "}
                        more {meta.shortDisplay} candidate
                        {meta.candidates2026 - known2026.length === 1
                          ? ""
                          : "s"}{" "}
                        are in the field for 2026 but the names are pending
                        publication from the ECGB Form-33 sheet. As soon as
                        we get verified names they appear in this table.
                      </td>
                    </tr>
                  </tfoot>
                )}
            </table>
          </div>
          {is2026View && (
            <p className="text-[11px] text-[color:var(--color-muted-foreground)] pt-2">
              Looking for past performance instead?{" "}
              <Link
                to={`/party/${encodeURIComponent(meta.id)}`}
                className="underline underline-offset-2 hover:text-[color:var(--color-foreground)]"
              >
                View the full 2009 to 2020 roster
              </Link>
              .
            </p>
          )}
        </section>
      )}

      {/* Candidate list. Hidden when the user is in the 2026-only view so
        that filter actually filters; the in-section CTA above offers a
        link back to the full roster. When year=2020 or year=2015 is set the
        roster naturally filters down to that year via partyRuns above, so
        we leave the section in place in those cases. */}
      {!is2026View && (
      <section className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
            Historical roster
          </p>
          <h2 className="font-display text-3xl sm:text-4xl">
            Candidates affiliated with {meta.shortDisplay}
          </h2>
          <p className="text-sm text-[color:var(--color-muted-foreground)] max-w-2xl">
            One row per unique candidate who contested under {meta.shortDisplay}
            {" "}in 2009, 2015 or 2020. These are historical names only — they
            are not the 2026 nominees. The 2026 candidates appear in the
            section above this one as they are confirmed from ECGB Form-33.
          </p>
        </div>

        {candidates.length === 0 ? (
          <div className="card-elevated p-6 text-sm text-[color:var(--color-muted-foreground)]">
            No historical candidates for this party in the 2009 to 2020
            dataset. As 2026 nomination data lands, named candidates will
            appear here.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)] border-b border-[color:var(--color-border)]">
                  <th className="px-4 py-3 font-medium">Candidate</th>
                  <th className="px-4 py-3 font-medium">Constituencies</th>
                  <th className="px-4 py-3 font-medium">Best historical result</th>
                  <th className="px-4 py-3 font-medium text-right">Runs</th>
                  <th className="px-4 py-3 font-medium text-right">
                    Total votes polled
                  </th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr
                    key={c.candidate_id}
                    className="border-b border-[color:var(--color-border)] last:border-b-0 hover:bg-[color:var(--color-muted)]/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{c.display_name}</span>
                        {c.best_won && (
                          <Badge className="text-[10px] winner-pulse">
                            Won
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[color:var(--color-muted-foreground)]">
                      <div className="flex flex-wrap gap-1.5">
                        {[...c.constituencies].sort().map((cz) => (
                          <Link
                            key={cz}
                            to={`/constituency/${cz}`}
                            className="inline-flex items-center gap-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)]/60 px-2 py-0.5 text-xs font-mono hover:bg-[color:var(--color-muted)]/40 transition-colors"
                          >
                            {cz}
                            <span className="text-[10px] text-[color:var(--color-muted-foreground)]">
                              {constituencyName.get(cz) ?? ""}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {c.best_year != null && c.best_constituency ? (
                        <span>
                          <span className="font-mono tabular">{c.best_year}</span>{" "}
                          <span className="text-[color:var(--color-muted-foreground)]">
                            {c.best_constituency} ·
                          </span>{" "}
                          {c.best_won ? (
                            <span className="text-[color:var(--color-primary)] font-medium">
                              Won
                            </span>
                          ) : (
                            <span>Rank {c.best_rank}</span>
                          )}
                          {c.best_vote_share != null && (
                            <span className="text-[color:var(--color-muted-foreground)]">
                              {" "}
                              · {c.best_vote_share.toFixed(1)}%
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-[color:var(--color-muted-foreground)]">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular">
                      {c.appearances}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular font-semibold">
                      {c.total_votes > 0 ? formatNumber(c.total_votes) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[color:var(--color-border-strong)]">
                  <td
                    colSpan={4}
                    className="px-4 py-3 text-[11px] text-[color:var(--color-muted-foreground)]"
                  >
                    Totals across {candidates.length} unique candidate
                    {candidates.length === 1 ? "" : "s"} under {meta.shortDisplay}.
                    Vote counts cover 2009 to 2020 contests.
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular font-semibold text-[color:var(--color-foreground)]">
                    {formatNumber(
                      candidates.reduce((s, c) => s + c.total_votes, 0),
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
      )}
    </div>
  );
}
