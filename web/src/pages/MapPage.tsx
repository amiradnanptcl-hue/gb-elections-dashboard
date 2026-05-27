import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, PartyBadge } from "@/components/ui/badge";
import { getParty } from "@/lib/parties";
import {
  useCandidateRuns,
  useConstituencies,
  useKnownNominees2026,
  useNotableDisqualifications,
} from "@/lib/data";
import { formatNumber, formatPercent } from "@/lib/utils";

const DISTRICT_ORDER = [
  "Gilgit",
  "Nagar",
  "Hunza",
  "Ghizer",
  "Skardu",
  "Shigar",
  "Kharmang",
  "Ghanche",
  "Astore",
  "Diamer",
];

export function MapPage() {
  const constituenciesQ = useConstituencies();
  const runsQ = useCandidateRuns();
  const knownNomineesQ = useKnownNominees2026();
  const disqualificationsQ = useNotableDisqualifications();

  const constituencies = constituenciesQ.data ?? [];
  const runs2020 = (runsQ.data ?? []).filter((r) => r.election_year === 2020);
  const known2026 = knownNomineesQ.data ?? [];
  const disqualifications = disqualificationsQ.data ?? [];

  // Group 2020 candidate runs by constituency, sorted by rank so we can show
  // the top three finishers as the historical reference card.
  const runs2020ByCz = new Map<string, typeof runs2020>();
  for (const r of runs2020) {
    const arr = runs2020ByCz.get(r.constituency_id) ?? [];
    arr.push(r);
    runs2020ByCz.set(r.constituency_id, arr);
  }

  // Known 2026 nominees by constituency.
  const known2026ByCz = new Map<string, typeof known2026>();
  for (const n of known2026) {
    const arr = known2026ByCz.get(n.constituency_id) ?? [];
    arr.push(n);
    known2026ByCz.set(n.constituency_id, arr);
  }

  // Disqualifications by their 2020 constituency, used to flag open seats.
  const disqByCz = new Map<string, typeof disqualifications>();
  for (const d of disqualifications) {
    const arr = disqByCz.get(d.constituency_id_2020) ?? [];
    arr.push(d);
    disqByCz.set(d.constituency_id_2020, arr);
  }

  const byDistrict = new Map<string, typeof constituencies>();
  for (const c of constituencies) {
    const arr = byDistrict.get(c.district) ?? [];
    arr.push(c);
    byDistrict.set(c.district, arr);
  }

  // For the data-availability stat strip at the top.
  const totalSeats = constituencies.length;
  const seatsWithKnownNominee = known2026ByCz.size;

  return (
    <div className="space-y-10 max-w-6xl">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="inline-block h-px w-10 bg-[color:var(--color-accent-gold)]" />
          <span className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
            ECGB constituencies
          </span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl leading-[1.05]">
          The 24 general seats
        </h1>
        <p className="text-[color:var(--color-muted-foreground)] text-base sm:text-lg max-w-2xl leading-relaxed">
          Every constituency, grouped by district, with the 2020 top-three
          result on the left and what we know about the 2026 contest on the
          right. The geographic GeoJSON map is a planned future deliverable;
          this card view is the source of truth in the meantime.
        </p>
      </header>

      {/* Data-availability strip. Honest about how much of the 2026 field is
        machine-readable for us today vs how much is still pending the full
        ECGB Form-33 publication. */}
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="card-elevated card-accent-green p-5 space-y-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
            Seats with a verified 2026 name
          </p>
          <p className="stat-display text-4xl">
            {seatsWithKnownNominee} / {totalSeats}
          </p>
          <p className="text-xs text-[color:var(--color-muted-foreground)]">
            Sourced from ECGB Form-33 notifications and the research-pack
            news track. More names land in this dashboard as they are
            confirmed.
          </p>
        </article>
        <article className="card-elevated card-accent-gold p-5 space-y-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
            Final candidate field (all seats)
          </p>
          <p className="stat-display text-4xl">403</p>
          <p className="text-xs text-[color:var(--color-muted-foreground)]">
            14 May 2026 ECGB final list. 272 independents, 131 party-backed
            candidates. Per-seat breakdown is not in our dataset yet.
          </p>
        </article>
        <article className="card-elevated card-accent-red p-5 space-y-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
            Open seats
          </p>
          <p className="stat-display text-4xl">{disqByCz.size}</p>
          <p className="text-xs text-[color:var(--color-muted-foreground)]">
            Seats whose 2020 winner has been disqualified and is not
            contesting. Updated from notable_disqualifications.csv.
          </p>
        </article>
      </section>

      {DISTRICT_ORDER.filter((d) => byDistrict.has(d)).map((district) => {
        const items = (byDistrict.get(district) ?? []).slice().sort(
          (a, b) => {
            const ai = parseInt(a.constituency_id.split("-")[1], 10);
            const bi = parseInt(b.constituency_id.split("-")[1], 10);
            return ai - bi;
          },
        );
        return (
          <section key={district} className="space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-display text-2xl sm:text-3xl">
                {district}
              </h2>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
                {items.length} seat{items.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {items.map((c) => {
                const cz = c.constituency_id;
                const top3 = (runs2020ByCz.get(cz) ?? [])
                  .slice()
                  .sort((a, b) => a.rank - b.rank)
                  .slice(0, 3);
                const winner = top3[0];
                const known = known2026ByCz.get(cz) ?? [];
                const disq = disqByCz.get(cz) ?? [];
                const winnerMeta = winner ? getParty(winner.party) : null;
                return (
                  <Link
                    key={cz}
                    to={`/constituency/${cz}`}
                    className="group"
                    aria-label={`Open ${cz} ${c.name} constituency detail`}
                  >
                    <Card className="hover:bg-[color:var(--color-muted)]/40 transition-colors h-full">
                      <CardContent className="py-5 space-y-4">
                        {/* Header. The top-right badge is explicitly the
                          2020 winner's party so it can't be read as a
                          claim about who currently holds the seat or who
                          is contesting in 2026. */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-mono text-sm font-semibold">
                              {cz}
                            </p>
                            <p className="text-base sm:text-lg font-display leading-tight truncate">
                              {c.name}
                            </p>
                          </div>
                          {winnerMeta && (
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span className="text-[9px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)] font-bold">
                                2020 winner
                              </span>
                              <span className="winner-pulse rounded-md">
                                <PartyBadge
                                  party={winnerMeta.shortDisplay}
                                  color={winnerMeta.color}
                                  textOnColor={winnerMeta.textOnColor}
                                  flag={winnerMeta.flag}
                                  variant="row"
                                />
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Open-seat flag where 2020 winner is disqualified. */}
                        {disq.length > 0 && (
                          <div className="rounded-md border border-[color:var(--color-accent-red)]/40 bg-[color:var(--color-accent-red-soft)]/20 px-3 py-2">
                            <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-[color:var(--color-accent-red)]">
                              Open seat for 2026
                            </p>
                            {disq.map((d) => (
                              <p
                                key={`${d.candidate_name}-${d.year_disqualified}`}
                                className="text-[12px] text-[color:var(--color-foreground)] leading-snug mt-1"
                              >
                                {d.candidate_name} ({d.party_at_disqualification})
                                disqualified in {d.year_disqualified}.
                              </p>
                            ))}
                          </div>
                        )}

                        {/* 2026 confirmed contestants */}
                        <div className="space-y-2">
                          <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-[color:var(--color-accent-gold)]">
                            2026 confirmed contestants
                          </p>
                          {known.length > 0 ? (
                            <ul className="space-y-1.5">
                              {known.map((n) => {
                                const m = getParty(n.party);
                                return (
                                  <li
                                    key={`${n.candidate_name}-${n.party}`}
                                    className="flex flex-wrap items-center gap-2 text-sm"
                                  >
                                    <span className="font-semibold">
                                      {n.candidate_name}
                                    </span>
                                    <PartyBadge
                                      party={m.shortDisplay}
                                      color={m.color}
                                      textOnColor={m.textOnColor}
                                      flag={m.flag}
                                      variant="row"
                                    />
                                  </li>
                                );
                              })}
                              <li className="text-[11px] text-[color:var(--color-muted-foreground)] pt-0.5">
                                Further candidate names pending from the
                                ECGB Form-33 list.
                              </li>
                            </ul>
                          ) : (
                            <p className="text-[12px] text-[color:var(--color-muted-foreground)] leading-snug">
                              No individual names confirmed yet from the
                              ECGB Form-33 list for this seat. Candidate
                              count and party slate are partial.
                            </p>
                          )}
                        </div>

                        {/* 2020 historical top 3 for reference */}
                        <div className="space-y-2 pt-1 border-t border-[color:var(--color-border)]">
                          <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-[color:var(--color-muted-foreground)] pt-2">
                            2020 result (top 3)
                          </p>
                          {top3.length === 0 ? (
                            <p className="text-[12px] text-[color:var(--color-muted-foreground)]">
                              No 2020 record on file.
                            </p>
                          ) : (
                            <ol className="space-y-1.5">
                              {top3.map((r) => {
                                const m = getParty(r.party);
                                return (
                                  <li
                                    key={`${r.candidate_id}-${r.party}`}
                                    className="flex items-center justify-between gap-2 text-[13px]"
                                  >
                                    <span className="flex items-center gap-2 min-w-0">
                                      <span className="font-mono text-[10px] tabular text-[color:var(--color-muted-foreground)] w-3">
                                        {r.rank}
                                      </span>
                                      <span className="truncate">
                                        {r.candidate_name}
                                      </span>
                                      {r.won && (
                                        <Badge className="text-[9px] px-1.5 py-0">
                                          Won
                                        </Badge>
                                      )}
                                    </span>
                                    <span className="flex items-center gap-2 shrink-0">
                                      <PartyBadge
                                        party={m.shortDisplay}
                                        color={m.color}
                                        textOnColor={m.textOnColor}
                                        flag={m.flag}
                                        variant="row"
                                      />
                                      <span className="font-mono text-[11px] tabular text-[color:var(--color-muted-foreground)] min-w-[44px] text-right">
                                        {r.votes != null
                                          ? formatNumber(r.votes)
                                          : "?"}
                                      </span>
                                      {r.vote_share_pct != null && (
                                        <span className="font-mono text-[10px] tabular text-[color:var(--color-muted-foreground)]/70 min-w-[36px] text-right">
                                          {formatPercent(r.vote_share_pct, 1)}
                                        </span>
                                      )}
                                    </span>
                                  </li>
                                );
                              })}
                            </ol>
                          )}
                        </div>

                        <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--color-muted-foreground)] group-hover:text-[color:var(--color-foreground)] transition-colors inline-flex items-center gap-1 pt-1">
                          Open constituency profile
                          <span
                            aria-hidden
                            className="transition-transform group-hover:translate-x-0.5"
                          >
                            →
                          </span>
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Data-source disclosure block so visitors understand exactly what is
        in scope and what we're missing. */}
      <section className="card-elevated card-accent-gold p-5 sm:p-6 space-y-2 top-edge relative">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-accent-gold)] font-bold">
          Why some seats have no 2026 candidate names yet
        </p>
        <p className="text-sm text-[color:var(--color-foreground)] leading-relaxed">
          The ECGB published a final list of 403 candidates on 14 May 2026
          (272 independents and 131 party-backed candidates). The per-seat
          breakdown of that list is not yet published as a machine-readable
          file we can ingest. The names that do appear above come from the
          research-pack (Kashmir English, Pamir Times, ARY News, the May
          2026 deep-research report) and from ECGB Form-33 notifications
          that name specific candidates. As we get more verified names,
          drop them into{" "}
          <code className="font-mono">
            data/raw/research/candidates_2026_known.csv
          </code>{" "}
          and every constituency card on this page populates automatically.
        </p>
      </section>
    </div>
  );
}
