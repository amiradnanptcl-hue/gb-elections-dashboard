import { Link, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge, PartyBadge } from "@/components/ui/badge";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { getParty } from "@/lib/parties";
import {
  useCandidateRuns,
  useConstituencies,
  useConstituencySummary,
  useDistrictVoters2026,
  useElections,
  useKnownNominees2026,
  useNotableDisqualifications,
} from "@/lib/data";
import { useDocumentMeta } from "@/lib/seo";
import { formatNumber, formatPercent } from "@/lib/utils";

export function ConstituencyPage() {
  const { id } = useParams<{ id: string }>();
  const cz = id ?? "";

  const constituenciesQ = useConstituencies();
  const runsQ = useCandidateRuns();
  const summaryQ = useConstituencySummary();
  const knownNomineesQ = useKnownNominees2026();
  const disqualificationsQ = useNotableDisqualifications();
  const electionsQ = useElections();
  const districtVotersQ = useDistrictVoters2026();

  const constituency = constituenciesQ.data?.find(
    (c) => c.constituency_id === cz,
  );
  useDocumentMeta({
    title: constituency
      ? `${cz} ${constituency.name} 2026 candidates and results — GB Elections`
      : `${cz || "Constituency"} — GB Elections 2026`,
    description: constituency
      ? `${cz} ${constituency.name} (${constituency.district} district) profile: 2026 candidates, 2009-2020 historical winners, vote shares, margins, registered voters, polling-station logistics. Source-traceable open data.`
      : "Constituency profile from the GB Elections 2026 dashboard.",
    path: `/constituency/${cz}`,
  });
  const runs = (runsQ.data ?? []).filter((r) => r.constituency_id === cz);
  const summaries = (summaryQ.data ?? []).filter(
    (s) => s.constituency_id === cz,
  );
  const summary2020 = summaries.find((s) => s.election_year === 2020) ?? null;
  const known2026 = (knownNomineesQ.data ?? []).filter(
    (n) => n.constituency_id === cz,
  );
  const disqualifications2026 = (disqualificationsQ.data ?? []).filter(
    (d) => d.constituency_id_2020 === cz,
  );
  const election2026 = electionsQ.data?.find((e) => e.year === 2026) ?? null;
  const districtRow = constituency
    ? districtVotersQ.data?.find((d) => d.district === constituency.district)
    : null;

  if (!constituency && constituenciesQ.isSuccess) {
    return (
      <div className="space-y-3">
        <p>Constituency {cz} not found.</p>
        <Link to="/" className="text-[color:var(--color-primary)] underline">
          Back home
        </Link>
      </div>
    );
  }

  const years = [2009, 2015, 2020] as const;
  const runsByYear = new Map<number, typeof runs>();
  for (const r of runs) {
    const arr = runsByYear.get(r.election_year) ?? [];
    arr.push(r);
    runsByYear.set(r.election_year, arr);
  }

  // Trend chart: top-3 parties' vote share per year.
  const partyTotals = new Map<string, number>();
  for (const r of runs) {
    partyTotals.set(r.party, (partyTotals.get(r.party) ?? 0) + (r.votes ?? 0));
  }
  const topParties = [...partyTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([p]) => p);
  const trendData = years.map((y) => {
    const row: Record<string, number | string> = { year: y };
    for (const p of topParties) {
      const r = (runsByYear.get(y) ?? []).find((x) => x.party === p);
      row[p] = r?.vote_share_pct ?? 0;
    }
    return row;
  });

  // ----------------------------------------------------------------
  // Per-constituency key metrics
  // ----------------------------------------------------------------
  // We use the same district-proportional allocation as /voters: each
  // constituency's 2020 share of its district's 2020 roll is applied to the
  // district's published 2026 total. The 2026 male / female estimate uses
  // the district-level gender ratio applied to that estimated total. Pure
  // database derivation; no model output.
  const allSummary2020 = (summaryQ.data ?? []).filter(
    (s) => s.election_year === 2020,
  );
  const allConstituencies = constituenciesQ.data ?? [];
  const districtCzIds = constituency
    ? new Set(
        allConstituencies
          .filter((c) => c.district === constituency.district)
          .map((c) => c.constituency_id),
      )
    : new Set<string>();
  const districtTotal2020 = allSummary2020
    .filter((s) => districtCzIds.has(s.constituency_id))
    .reduce((sum, s) => sum + (s.registered_voters ?? 0), 0);

  const registered2020 = summary2020?.registered_voters ?? null;
  // Votes cast: prefer source value, else derive from sum of candidate votes.
  const candidateVotes2020 = (runsByYear.get(2020) ?? []).reduce(
    (sum, r) => sum + (r.votes ?? 0),
    0,
  );
  const votesCast2020 =
    summary2020?.votes_cast ?? (candidateVotes2020 > 0 ? candidateVotes2020 : null);
  const turnout2020Raw = summary2020?.turnout_pct ?? null;
  const turnout2020Derived =
    turnout2020Raw == null && registered2020 && votesCast2020
      ? (votesCast2020 / registered2020) * 100
      : null;
  const turnout2020 = turnout2020Raw ?? turnout2020Derived;
  const margin2020 = summary2020?.margin ?? null;

  // 2026 estimates (district-proportional).
  const shareWithinDistrict =
    registered2020 && districtTotal2020 > 0
      ? registered2020 / districtTotal2020
      : null;
  const estRegistered2026 =
    shareWithinDistrict != null && districtRow
      ? Math.round(shareWithinDistrict * districtRow.total_voters_2026)
      : null;
  const estFemale2026 =
    shareWithinDistrict != null && districtRow
      ? Math.round(shareWithinDistrict * districtRow.female_voters_2026)
      : null;
  const estMale2026 =
    shareWithinDistrict != null && districtRow
      ? Math.round(shareWithinDistrict * districtRow.male_voters_2026)
      : null;

  // Polling-station estimate: GB-wide 2026 total (2,220 per ECGB) distributed
  // proportionally to each seat's share of the 2020 roll. Same method as
  // /polling-stations.
  const allSummary2020TotalRegistered = allSummary2020.reduce(
    (sum, s) => sum + (s.registered_voters ?? 0),
    0,
  );
  const shareOfGbWide =
    registered2020 && allSummary2020TotalRegistered > 0
      ? registered2020 / allSummary2020TotalRegistered
      : null;
  const estStations2026 =
    shareOfGbWide != null && election2026?.polling_stations
      ? Math.max(1, Math.round(shareOfGbWide * election2026.polling_stations))
      : null;

  // 2020 winner inline for context.
  const winner2020 = (runsByYear.get(2020) ?? []).find((r) => r.won);
  const winnerParty2020 = winner2020 ? getParty(winner2020.party) : null;

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/"
          className="text-sm text-[color:var(--color-muted-foreground)] hover:underline"
        >
          ← Home
        </Link>
        <div className="mt-2 flex flex-wrap items-baseline gap-3">
          <h1 className="text-3xl font-semibold tracking-tight font-mono">
            {cz}
          </h1>
          <p className="text-xl">{constituency?.name}</p>
          {constituency?.district && (
            <Badge variant="muted">{constituency.district} district</Badge>
          )}
        </div>
      </div>

      {/* Key metrics for this seat. Each tile is either an actual value from
        the database (2020 roll, 2020 turnout, 2020 margin, 2020 winner) or a
        district-proportional estimate (2026 registered voters, 2026 male /
        female split, 2026 polling stations). Estimates are explicitly
        labelled so visitors know which is which. */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-[color:var(--color-muted-foreground)]">
              Key metrics
            </p>
            <h2 className="font-display text-2xl sm:text-3xl">
              {cz} at a glance
            </h2>
          </div>
          {winnerParty2020 && (
            <span className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--color-muted-foreground)]">
              2020 winner: {winner2020?.candidate_name} ·{" "}
              <span className="text-[color:var(--color-foreground)] font-semibold">
                {winnerParty2020.shortDisplay}
              </span>
            </span>
          )}
        </div>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {/* Tile: 2020 registered voters (actual) */}
          <article className="card-elevated p-4 space-y-1">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-muted-foreground)] font-medium">
              Registered (2020)
            </p>
            <p className="stat-display text-2xl">
              {registered2020 != null ? formatNumber(registered2020) : "—"}
            </p>
            <p className="text-[10px] text-[color:var(--color-muted-foreground)]/80">
              ECGB 2020 roll, this seat.
            </p>
          </article>

          {/* Tile: 2026 estimated registered (district-proportional) */}
          <article className="card-elevated card-accent-green p-4 space-y-1">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-muted-foreground)] font-medium">
              Est. registered (2026)
            </p>
            <p className="stat-display text-2xl">
              {estRegistered2026 != null
                ? formatNumber(estRegistered2026)
                : "—"}
            </p>
            <p className="text-[10px] text-[color:var(--color-muted-foreground)]/80">
              Share of district roll · Vision GB.
            </p>
          </article>

          {/* Tile: 2026 estimated female voters */}
          <article className="card-elevated p-4 space-y-1">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-muted-foreground)] font-medium">
              Est. female (2026)
            </p>
            <p className="stat-display text-2xl">
              {estFemale2026 != null ? formatNumber(estFemale2026) : "—"}
            </p>
            <p className="text-[10px] text-[color:var(--color-muted-foreground)]/80">
              Applied district gender ratio.
            </p>
          </article>

          {/* Tile: 2026 estimated male voters */}
          <article className="card-elevated p-4 space-y-1">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-muted-foreground)] font-medium">
              Est. male (2026)
            </p>
            <p className="stat-display text-2xl">
              {estMale2026 != null ? formatNumber(estMale2026) : "—"}
            </p>
            <p className="text-[10px] text-[color:var(--color-muted-foreground)]/80">
              Applied district gender ratio.
            </p>
          </article>

          {/* Tile: 2020 votes cast (actual or derived) */}
          <article className="card-elevated p-4 space-y-1">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-muted-foreground)] font-medium">
              Votes cast (2020)
            </p>
            <p className="stat-display text-2xl">
              {votesCast2020 != null ? formatNumber(votesCast2020) : "—"}
            </p>
            <p className="text-[10px] text-[color:var(--color-muted-foreground)]/80">
              {summary2020?.votes_cast != null
                ? "ECGB summary."
                : "Sum of candidate votes."}
            </p>
          </article>

          {/* Tile: 2020 turnout (actual or derived) */}
          <article className="card-elevated p-4 space-y-1">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-muted-foreground)] font-medium">
              Turnout (2020)
            </p>
            <p className="stat-display text-2xl">
              {turnout2020 != null ? formatPercent(turnout2020, 1) : "—"}
            </p>
            <p className="text-[10px] text-[color:var(--color-muted-foreground)]/80">
              {turnout2020Raw != null
                ? "ECGB summary."
                : turnout2020Derived != null
                  ? "Votes cast ÷ registered."
                  : "Not on record."}
            </p>
          </article>

          {/* Tile: 2020 winning margin (actual) */}
          <article className="card-elevated p-4 space-y-1">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-muted-foreground)] font-medium">
              Winning margin (2020)
            </p>
            <p className="stat-display text-2xl">
              {margin2020 != null ? formatNumber(margin2020) : "—"}
            </p>
            <p className="text-[10px] text-[color:var(--color-muted-foreground)]/80">
              Votes between rank 1 and rank 2.
            </p>
          </article>

          {/* Tile: 2026 polling stations (estimate) */}
          <article className="card-elevated card-accent-gold p-4 space-y-1">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-muted-foreground)] font-medium">
              Est. polling stations (2026)
            </p>
            <p className="stat-display text-2xl">
              {estStations2026 != null ? formatNumber(estStations2026) : "—"}
            </p>
            <p className="text-[10px] text-[color:var(--color-muted-foreground)]/80">
              Share of 2,220 ECGB stations.
            </p>
          </article>
        </div>
      </section>

      {/* 2026 candidate field for this seat — data only. Shows the named
        2026 contestants we have verified for this seat plus any
        disqualification that turns the seat into an open contest. No
        model predictions, no probabilities. */}
      <Card className="border-l-4 border-l-[color:var(--color-primary)]">
        <CardHeader>
          <CardDescription className="text-[10px] uppercase tracking-[0.22em] font-bold text-[color:var(--color-primary)]">
            2026 candidate field
          </CardDescription>
          <CardTitle>Who is contesting this seat in 2026</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {disqualifications2026.length > 0 && (
            <div className="rounded-md border border-[color:var(--color-accent-red)]/40 bg-[color:var(--color-accent-red-soft)]/20 px-3 py-2 space-y-1">
              <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-[color:var(--color-accent-red)]">
                Open seat
              </p>
              {disqualifications2026.map((d) => (
                <p
                  key={`${d.candidate_name}-${d.year_disqualified}`}
                  className="text-sm"
                >
                  <span className="font-semibold">{d.candidate_name}</span>
                  {" "}({d.party_at_disqualification}, {d.role_at_time}) was
                  disqualified in {d.year_disqualified}. {d.impact_2026}
                </p>
              ))}
            </div>
          )}
          {known2026.length > 0 ? (
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-[color:var(--color-muted-foreground)] mb-2">
                Confirmed nominees ({known2026.length})
              </p>
              <ul className="space-y-2">
                {known2026.map((n) => {
                  const meta = getParty(n.party);
                  return (
                    <li
                      key={`${n.candidate_name}-${n.party}`}
                      className="flex flex-wrap items-center gap-2 text-sm"
                    >
                      <span className="font-semibold">{n.candidate_name}</span>
                      <PartyBadge
                        party={meta.shortDisplay}
                        color={meta.color}
                        textOnColor={meta.textOnColor}
                        flag={meta.flag}
                        variant="row"
                      />
                      {n.role_notes && (
                        <span className="text-[color:var(--color-muted-foreground)] basis-full text-[12px]">
                          {n.role_notes}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-[color:var(--color-muted-foreground)]">
              No individual names confirmed yet from the ECGB Form-33 sheet
              for this seat. Names land here as we verify them.
            </p>
          )}
          <p className="text-[11px] text-[color:var(--color-muted-foreground)] leading-relaxed pt-1">
            This dashboard does not publish a 2026 forecast for this seat.
            See the data governance page for why.
          </p>
        </CardContent>
      </Card>

      {/* Historical results by year */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          Historical results
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {years.map((year) => {
            const yearRuns = (runsByYear.get(year) ?? []).slice().sort(
              (a, b) => a.rank - b.rank,
            );
            return (
              <Card key={year}>
                <CardHeader>
                  <CardDescription className="font-mono">{year}</CardDescription>
                  <CardTitle className="text-base">
                    {yearRuns.length} candidate{yearRuns.length === 1 ? "" : "s"}{" "}
                    in our data
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {yearRuns.length === 0 && (
                    <p className="text-[color:var(--color-muted-foreground)]">
                      No data captured for this election.
                    </p>
                  )}
                  {yearRuns.map((r) => {
                    const meta = getParty(r.party);
                    return (
                      <div
                        key={`${year}-${r.candidate_id}-${r.party}`}
                        className="flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[color:var(--color-muted-foreground)] tabular w-5">
                            {r.rank}
                          </span>
                          <span className="truncate">{r.candidate_name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <PartyBadge
                            party={meta.shortDisplay}
                            color={meta.color}
                            textOnColor={meta.textOnColor}
                            flag={meta.flag}
                            variant="row"
                          />
                          <span className="font-mono tabular text-xs text-[color:var(--color-muted-foreground)]">
                            {r.votes != null ? formatNumber(r.votes) : "?"}
                          </span>
                          {r.won && (
                            <Badge className="winner-pulse">
                              <span className="winner-dot mr-1 h-1.5 w-1.5 rounded-full bg-white/90" />
                              Won
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Vote share trend */}
      {trendData.length > 0 && topParties.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            Vote share trend by party
          </h2>
          <Card>
            <CardContent className="pt-6 space-y-5">
              {/* Custom legend: flag + name + colour for each party in this chart */}
              <div className="flex flex-wrap gap-2.5">
                {topParties.map((p) => {
                  const meta = getParty(p);
                  return (
                    <span
                      key={p}
                      className="inline-flex items-center gap-2 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)] pl-0 pr-3 py-0 overflow-hidden text-xs"
                    >
                      <img
                        src={meta.flag}
                        alt=""
                        width="36"
                        height="24"
                        className="h-8 w-9 object-cover shrink-0"
                        loading="lazy"
                        decoding="async"
                      />
                      <span
                        aria-hidden
                        className="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: meta.color }}
                      />
                      <span className="font-medium">{meta.shortDisplay}</span>
                      {meta.electionSymbol && (
                        <span className="text-[10px] tracking-[0.14em] text-[color:var(--color-muted-foreground)]">
                          {meta.electionSymbolIcon} {meta.electionSymbol}
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={trendData}
                  margin={{ top: 20, right: 12, left: 0, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 12, fontWeight: 600 }}
                  />
                  <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    cursor={{ fill: "var(--color-muted)", opacity: 0.3 }}
                    content={<PartyTooltip />}
                  />
                  {topParties.map((p) => {
                    const meta = getParty(p);
                    return (
                      <Bar
                        key={p}
                        dataKey={p}
                        fill={meta.color}
                        name={meta.shortDisplay}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={48}
                      >
                        <LabelList
                          dataKey={p}
                          position="top"
                          formatter={(v: unknown) => {
                            const n = Number(v);
                            return n > 4 ? `${n.toFixed(0)}%` : "";
                          }}
                          style={{
                            fill: "var(--color-foreground)",
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        />
                      </Bar>
                    );
                  })}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>
      )}

      {/* 2020 turnout snapshot */}
      {summaries.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            2020 turnout snapshot
          </h2>
          <div className="grid gap-3 sm:grid-cols-4">
            {summaries.map((s) => {
              // Compute candidate-derived totals when the Wikipedia summary
              // page left votes_cast or turnout blank. The candidate-vote sum
              // is a lower bound (excludes invalid ballots we do not have).
              const candidateRuns2020 = (runsByYear.get(2020) ?? []).filter(
                (r) => r.votes != null,
              );
              const sumCandidateVotes = candidateRuns2020.reduce(
                (acc, r) => acc + (r.votes ?? 0),
                0,
              );

              const officialCast = s.votes_cast;
              const officialTurnout = s.turnout_pct;
              const derivedCast = sumCandidateVotes > 0 ? sumCandidateVotes : null;
              const derivedTurnout =
                derivedCast != null && s.registered_voters
                  ? (derivedCast / s.registered_voters) * 100
                  : null;

              const cast = officialCast ?? derivedCast;
              const castIsDerived = officialCast == null && derivedCast != null;
              const turnout = officialTurnout ?? derivedTurnout;
              const turnoutIsDerived =
                officialTurnout == null && derivedTurnout != null;

              // Compute margin from candidate runs if missing in source.
              const ranked = candidateRuns2020
                .slice()
                .sort(
                  (a, b) => (b.votes ?? 0) - (a.votes ?? 0),
                );
              const derivedMargin =
                ranked.length >= 2
                  ? (ranked[0].votes ?? 0) - (ranked[1].votes ?? 0)
                  : null;
              const margin = s.margin ?? derivedMargin;
              const marginIsDerived = s.margin == null && derivedMargin != null;

              return (
                <div
                  key={`${s.constituency_id}-${s.election_year}`}
                  className="contents"
                >
                  <Card>
                    <CardHeader>
                      <CardDescription>Registered voters</CardDescription>
                      <CardTitle className="font-mono">
                        {s.registered_voters != null
                          ? formatNumber(s.registered_voters)
                          : "—"}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardDescription>
                        Votes cast
                        {castIsDerived && (
                          <span className="ml-2 text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-accent-gold)]">
                            estimated
                          </span>
                        )}
                      </CardDescription>
                      <CardTitle className="font-mono">
                        {cast != null ? formatNumber(cast) : "—"}
                      </CardTitle>
                      {castIsDerived && (
                        <p className="text-[10px] text-[color:var(--color-muted-foreground)] mt-1">
                          Sum of candidate vote counts. Excludes invalid ballots.
                        </p>
                      )}
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardDescription>
                        Turnout
                        {turnoutIsDerived && (
                          <span className="ml-2 text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-accent-gold)]">
                            estimated
                          </span>
                        )}
                      </CardDescription>
                      <CardTitle className="font-mono">
                        {turnout != null ? formatPercent(turnout) : "—"}
                      </CardTitle>
                      {turnoutIsDerived && (
                        <p className="text-[10px] text-[color:var(--color-muted-foreground)] mt-1">
                          Candidate votes ÷ registered voters.
                        </p>
                      )}
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardDescription>
                        Winning margin
                        {marginIsDerived && (
                          <span className="ml-2 text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-accent-gold)]">
                            derived
                          </span>
                        )}
                      </CardDescription>
                      <CardTitle className="font-mono">
                        {margin != null ? formatNumber(margin) : "—"}
                      </CardTitle>
                      {marginIsDerived && (
                        <p className="text-[10px] text-[color:var(--color-muted-foreground)] mt-1">
                          Winner minus runner-up vote count.
                        </p>
                      )}
                    </CardHeader>
                  </Card>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * Custom Recharts tooltip that renders a small flag tile + party name + colour
 * swatch alongside the percentage. Replaces the default "PML-N: 36.39" string
 * with a properly identified party row.
 */
function PartyTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const rows = payload
    .filter((p) => p.value != null && Number(p.value) > 0)
    .sort((a, b) => Number(b.value) - Number(a.value));
  if (rows.length === 0) return null;
  return (
    <div
      className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] shadow-[var(--shadow-md)] px-3 py-2 text-xs"
      style={{ minWidth: 180 }}
    >
      <p className="font-mono tabular text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)] mb-1.5">
        {label}
      </p>
      <ul className="space-y-1">
        {rows.map((row) => {
          const partyId = String(row.dataKey ?? row.name ?? "");
          const meta = getParty(partyId);
          return (
            <li
              key={partyId}
              className="flex items-center gap-2"
            >
              <img
                src={meta.flag}
                alt=""
                width="20"
                height="14"
                className="h-3.5 w-5 rounded-[2px] object-cover shrink-0 ring-1 ring-[color:var(--color-border)]"
                loading="lazy"
                decoding="async"
              />
              <span
                aria-hidden
                className="inline-block h-2 w-2 rounded-sm"
                style={{ backgroundColor: meta.color }}
              />
              <span className="font-semibold">{meta.shortDisplay}</span>
              <span className="ml-auto font-mono tabular">
                {Number(row.value).toFixed(2)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
