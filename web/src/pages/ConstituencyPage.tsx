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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getParty } from "@/lib/parties";
import {
  useCandidateRuns,
  useConstituencies,
  useConstituencySummary,
  useHoldoutPredictions,
} from "@/lib/data";
import { formatNumber, formatPercent } from "@/lib/utils";

export function ConstituencyPage() {
  const { id } = useParams<{ id: string }>();
  const cz = id ?? "";

  const constituenciesQ = useConstituencies();
  const runsQ = useCandidateRuns();
  const summaryQ = useConstituencySummary();
  const predsQ = useHoldoutPredictions();

  const constituency = constituenciesQ.data?.find(
    (c) => c.constituency_id === cz,
  );
  const runs = (runsQ.data ?? []).filter((r) => r.constituency_id === cz);
  const summaries = (summaryQ.data ?? []).filter(
    (s) => s.constituency_id === cz,
  );
  const preds = (predsQ.data ?? []).filter((p) => p.constituency_id === cz);

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

      {/* 2020 holdout prediction */}
      {preds.length > 0 && (
        <Card>
          <CardHeader>
            <CardDescription>Model v1 retro on 2020 holdout</CardDescription>
            <CardTitle>Predictions vs. actual</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left text-[color:var(--color-muted-foreground)]">
                  <th className="pb-2 pr-2">Candidate</th>
                  <th className="pb-2 pr-2">Party</th>
                  <th className="pb-2 pr-2 text-right tabular">Predicted</th>
                  <th className="pb-2 pr-2 text-right tabular">80% CI</th>
                  <th className="pb-2 pl-2">Actual</th>
                </tr>
              </thead>
              <tbody>
                {[...preds]
                  .sort((a, b) => b.pred_proba - a.pred_proba)
                  .map((p) => {
                    const meta = getParty(p.party);
                    return (
                      <tr key={`${p.candidate_id}-${p.party}`} className="border-b last:border-b-0">
                        <td className="py-2 pr-2">{p.candidate_name}</td>
                        <td className="py-2 pr-2">
                          <PartyBadge
                            party={meta.shortDisplay}
                            color={meta.color}
                            textOnColor={meta.textOnColor}
                          />
                        </td>
                        <td className="py-2 pr-2 text-right tabular">
                          {formatPercent(p.pred_proba * 100)}
                        </td>
                        <td className="py-2 pr-2 text-right tabular text-[color:var(--color-muted-foreground)]">
                          {formatPercent(p.ci_lower_80 * 100, 0)} –{" "}
                          {formatPercent(p.ci_upper_80 * 100, 0)}
                        </td>
                        <td className="py-2 pl-2">
                          {p.actual_won === 1 ? (
                            <Badge>Won</Badge>
                          ) : (
                            <Badge variant="muted">—</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

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
                          />
                          <span className="font-mono tabular text-xs text-[color:var(--color-muted-foreground)]">
                            {r.votes != null ? formatNumber(r.votes) : "?"}
                          </span>
                          {r.won && <Badge variant="muted">won</Badge>}
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
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="year" />
                  <YAxis unit="%" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      borderColor: "var(--color-border)",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  />
                  {topParties.map((p) => (
                    <Bar
                      key={p}
                      dataKey={p}
                      fill={getParty(p).color}
                      name={getParty(p).shortDisplay}
                    />
                  ))}
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
            {summaries.map((s) => (
              <div key={`${s.constituency_id}-${s.election_year}`} className="contents">
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
                    <CardDescription>Votes cast</CardDescription>
                    <CardTitle className="font-mono">
                      {s.votes_cast != null ? formatNumber(s.votes_cast) : "—"}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardDescription>Turnout</CardDescription>
                    <CardTitle className="font-mono">
                      {s.turnout_pct != null
                        ? formatPercent(s.turnout_pct)
                        : "—"}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardDescription>Winning margin</CardDescription>
                    <CardTitle className="font-mono">
                      {s.margin != null ? formatNumber(s.margin) : "—"}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
