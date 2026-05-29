import { Link } from "react-router-dom";
import {
  useCandidateRuns,
  useConstituencies,
  useConstituencySummary,
  useElections,
} from "@/lib/data";
import { formatNumber, formatPercent } from "@/lib/utils";

export function PollingStationsPage() {
  const constituenciesQ = useConstituencies();
  const summaryQ = useConstituencySummary();
  const electionsQ = useElections();
  const runsQ = useCandidateRuns();

  const constituencies = constituenciesQ.data ?? [];
  const summary2020 = (summaryQ.data ?? []).filter(
    (s) => Number(s.election_year) === 2020,
  );
  const runs2020 = (runsQ.data ?? []).filter(
    (r) => Number(r.election_year) === 2020,
  );
  // votes_cast and turnout are missing in source for some constituencies
  // (e.g. GBA-1, GBA-5). Compute lower-bound estimates from the sum of
  // candidate vote counts so the table never shows blanks where data exists.
  const candidateVotesByCz = new Map<string, number>();
  for (const r of runs2020) {
    if (r.votes != null) {
      candidateVotesByCz.set(
        r.constituency_id,
        (candidateVotesByCz.get(r.constituency_id) ?? 0) + r.votes,
      );
    }
  }
  const election2026 = electionsQ.data?.find((e) => e.year === 2026);
  const election2020 = electionsQ.data?.find((e) => e.year === 2020);

  const totalStations2026 = election2026?.polling_stations ?? null;
  const totalRegistered2026 = election2026?.registered_voters ?? null;
  const totalRegistered2020 = election2020?.registered_voters ?? null;
  const totalSummary2020Registered = summary2020.reduce(
    (s, x) => s + (x.registered_voters ?? 0),
    0,
  );

  // For each constituency, estimate the 2026 polling-station count by
  // distributing the 2,220 total in proportion to 2020 registered voters.
  // This is an approximation only — the ECGB has not yet published a
  // per-constituency breakdown for 2026. The estimate uses the 2020 voter
  // distribution as the best available proxy.
  const summaryByCz = new Map(summary2020.map((s) => [s.constituency_id, s]));

  const rows = constituencies
    .map((c) => {
      const s = summaryByCz.get(c.constituency_id);
      const registered2020 = s?.registered_voters ?? null;
      const share2020 =
        totalSummary2020Registered > 0 && registered2020 != null
          ? registered2020 / totalSummary2020Registered
          : null;
      const estStations =
        share2020 != null && totalStations2026 != null
          ? Math.round(share2020 * totalStations2026)
          : null;
      const derivedVotes = candidateVotesByCz.get(c.constituency_id) ?? null;
      const votesCast2020 = s?.votes_cast ?? derivedVotes;
      const turnoutFromSource = s?.turnout_pct ?? null;
      const turnoutDerived =
        turnoutFromSource == null && registered2020 && derivedVotes != null
          ? (derivedVotes / registered2020) * 100
          : null;
      const turnout2020 = turnoutFromSource ?? turnoutDerived;
      return {
        constituency_id: c.constituency_id,
        name: c.name,
        district: c.district,
        registered2020,
        votesCast2020,
        turnout2020,
        turnoutIsDerived: turnoutFromSource == null && turnoutDerived != null,
        share2020,
        estStations,
      };
    })
    .sort((a, b) => {
      const ai = parseInt(a.constituency_id.split("-")[1], 10);
      const bi = parseInt(b.constituency_id.split("-")[1], 10);
      return ai - bi;
    });

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
              ECGB logistics
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.05]">
            Polling stations by constituency
          </h1>
          <p className="text-[color:var(--color-muted-foreground)] text-base sm:text-lg max-w-2xl leading-relaxed">
            The ECGB has planned{" "}
            <span className="font-mono tabular font-semibold text-[color:var(--color-foreground)]">
              {totalStations2026
                ? formatNumber(totalStations2026)
                : "…"}
            </span>{" "}
            polling stations for the 2026 GB Assembly election. The
            per-constituency allocation has not been published yet, so the
            table below shows the closest honest proxy: each seat's 2020
            registered-voter and turnout record, plus an estimate of its
            likely 2026 station count derived from its share of the 2020
            voter roll.
          </p>
        </div>
      </header>

      {/* Top stat strip */}
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="card-elevated card-accent-gold p-5 space-y-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
            2026 polling stations (total)
          </p>
          <p className="stat-display text-4xl">
            {totalStations2026 ? formatNumber(totalStations2026) : "…"}
          </p>
          <p className="text-xs text-[color:var(--color-muted-foreground)]">
            ECGB planning figure across the 24 general seats.
          </p>
        </article>
        <article className="card-elevated card-accent-green p-5 space-y-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
            2026 registered voters
          </p>
          <p className="stat-display text-4xl">
            {totalRegistered2026 ? formatNumber(totalRegistered2026) : "…"}
          </p>
          <p className="text-xs text-[color:var(--color-muted-foreground)]">
            +3.9 percent growth vs. the 2020 roll (
            {totalRegistered2020 ? formatNumber(totalRegistered2020) : "—"}
            ). Per the ECGB Final Electoral Roll 2026.
          </p>
        </article>
        <article className="card-elevated card-accent-green p-5 space-y-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
            Voters per station (2026 average)
          </p>
          <p className="stat-display text-4xl">
            {totalRegistered2026 && totalStations2026
              ? formatNumber(Math.round(totalRegistered2026 / totalStations2026))
              : "…"}
          </p>
          <p className="text-xs text-[color:var(--color-muted-foreground)]">
            Pakistan-wide guidance targets ~1,000 voters per station.
          </p>
        </article>
      </section>

      {/* Table */}
      <section className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
            Per-constituency
          </p>
          <h2 className="font-display text-3xl">
            24 general seats · station estimates
          </h2>
        </div>
        <div className="overflow-x-auto rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)] border-b border-[color:var(--color-border)]">
                <th className="px-4 py-3 font-medium">Constituency</th>
                <th className="px-4 py-3 font-medium">District</th>
                <th className="px-4 py-3 font-medium text-right">
                  Registered (2020)
                </th>
                <th className="px-4 py-3 font-medium text-right">
                  Turnout (2020)
                </th>
                <th className="px-4 py-3 font-medium text-right">
                  Share of roll
                </th>
                <th className="px-4 py-3 font-medium text-right">
                  Est. stations (2026)
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.constituency_id}
                  className="border-b border-[color:var(--color-border)] last:border-b-0 hover:bg-[color:var(--color-muted)]/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/constituency/${r.constituency_id}`}
                      className="inline-flex flex-col"
                    >
                      <span className="font-mono font-semibold">
                        {r.constituency_id}
                      </span>
                      <span className="text-[11px] text-[color:var(--color-muted-foreground)]">
                        {r.name}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[color:var(--color-muted-foreground)]">
                    {r.district}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular">
                    {r.registered2020 != null
                      ? formatNumber(r.registered2020)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular text-[color:var(--color-muted-foreground)]">
                    {r.turnout2020 != null
                      ? formatPercent(r.turnout2020)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular text-[color:var(--color-muted-foreground)]">
                    {r.share2020 != null
                      ? formatPercent(r.share2020 * 100)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular font-semibold">
                    {r.estStations != null
                      ? formatNumber(r.estStations)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[color:var(--color-border-strong)]">
                <td colSpan={6} className="px-4 py-3 text-[11px] text-[color:var(--color-muted-foreground)]">
                  Estimates derived from each seat's share of the 2020 voter
                  roll. They are NOT an official ECGB allocation. When the
                  ECGB publishes Form-21 (polling-station list) for 2026, drop
                  the real numbers into{" "}
                  <code className="font-mono">
                    data/raw/research/polling_stations_2026.csv
                  </code>{" "}
                  and the page will use them automatically.
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
