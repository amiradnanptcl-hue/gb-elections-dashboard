import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge, PartyBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getParty } from "@/lib/parties";
import {
  useCandidateRuns,
  useForecast2026Summary,
  useHoldoutPredictions,
  useModelReport,
} from "@/lib/data";
import { formatPercent } from "@/lib/utils";

export function HomePage() {
  const reportQ = useModelReport();
  const runsQ = useCandidateRuns();
  const predsQ = useHoldoutPredictions();
  const forecastQ = useForecast2026Summary();

  const report = reportQ.data;
  const runs = runsQ.data;
  const preds = predsQ.data;
  const forecast = forecastQ.data;

  // 2020 actual winners, grouped by party.
  const winners2020 =
    runs?.filter((r) => r.election_year === 2020 && r.won) ?? [];
  const byParty = new Map<string, number>();
  for (const w of winners2020) {
    byParty.set(w.party, (byParty.get(w.party) ?? 0) + 1);
  }
  const partyOrder = [...byParty.entries()].sort((a, b) => b[1] - a[1]);

  // Per-constituency predicted-vs-actual party for a quick visual.
  const constituencyRows = new Map<
    string,
    { predicted_party: string; actual_party: string; correct: boolean }
  >();
  if (preds) {
    const byCz = new Map<string, typeof preds>();
    for (const p of preds) {
      const arr = byCz.get(p.constituency_id) ?? [];
      arr.push(p);
      byCz.set(p.constituency_id, arr);
    }
    for (const [cz, rows] of byCz) {
      const sorted = [...rows].sort((a, b) => b.pred_proba - a.pred_proba);
      const predicted = sorted[0];
      const actual = rows.find((r) => r.actual_won === 1) ?? sorted[0];
      constituencyRows.set(cz, {
        predicted_party: predicted.party,
        actual_party: actual.party,
        correct: predicted.candidate_id === actual.candidate_id,
      });
    }
  }

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="space-y-4">
        <Badge variant="muted">Pre-release · awaiting 2026 candidate data</Badge>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          Gilgit-Baltistan Legislative Assembly 2026 Forecast
        </h1>
        <p className="text-[color:var(--color-muted-foreground)] max-w-2xl">
          A public reference forecast for the election on 7 June 2026.
          Cleaned dataset, transparent model, honest uncertainty.
          Constituency-level predictions ship once the 2026 candidate
          list is fully ingested.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/methodology">Read the methodology</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/map">Explore the map</Link>
          </Button>
        </div>
      </section>

      {/* 2026 forecast — honest reporting */}
      {forecast && (
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-semibold tracking-tight">
              2026 forecast (party-level, candidate slate not yet published)
            </h2>
            <span className="text-sm text-[color:var(--color-muted-foreground)] font-mono">
              {forecast.election_date}
            </span>
          </div>

          {!forecast.forecast_is_informative && (
            <Card>
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Honest finding</Badge>
                </div>
                <p className="text-sm">
                  Without candidate-level features, our model collapses to the
                  federal-incumbent baseline. It assigns the highest win
                  probability to {forecast.federal_incumbent} in every
                  constituency, mirroring the same approach that scored only{" "}
                  {report?.baseline_2020_correct}/
                  {report?.test_constituencies_total} on the 2020 holdout.
                </p>
                <p className="text-sm text-[color:var(--color-muted-foreground)]">
                  We publish these numbers transparently rather than claim
                  predictive power we do not have. Per-constituency, candidate-
                  level forecasts will land here once the 2026 slate is
                  available. Read the methodology page for details.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Object.entries(forecast.point_estimate_seats)
              .sort(([, a], [, b]) => b - a)
              .filter(([, count]) => count > 0)
              .map(([party, count]) => {
                const meta = getParty(party);
                const ci = forecast.bootstrap_80_ci_seats[party];
                return (
                  <Card key={party}>
                    <CardHeader>
                      <CardDescription>
                        <PartyBadge
                          party={meta.shortDisplay}
                          color={meta.color}
                          textOnColor={meta.textOnColor}
                        />
                      </CardDescription>
                      <CardTitle className="font-mono text-3xl">
                        {count}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-[color:var(--color-muted-foreground)]">
                      80% CI: {Math.round(ci.p10)} – {Math.round(ci.p90)} seats
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </section>
      )}

      {/* Model snapshot */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>2020 holdout accuracy</CardDescription>
            <CardTitle className="font-mono text-3xl">
              {report
                ? `${report.test_constituencies_correct}/${report.test_constituencies_total}`
                : "…"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-[color:var(--color-muted-foreground)]">
            {report
              ? `Model v1 picked ${report.test_constituencies_correct} of ${report.test_constituencies_total} winners on the held-out 2020 election (${formatPercent(report.test_constituency_accuracy * 100)}).`
              : "Loading…"}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Baseline (federal incumbent)</CardDescription>
            <CardTitle className="font-mono text-3xl">
              {report?.baseline_2020_correct != null
                ? `${report.baseline_2020_correct}/${report.test_constituencies_total}`
                : "…"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-[color:var(--color-muted-foreground)]">
            {report?.baseline_2020_accuracy != null
              ? `Always predicting the federal ruling party would win every seat: ${formatPercent(report.baseline_2020_accuracy * 100)} accuracy.`
              : "Loading…"}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Brier score (lower is better)</CardDescription>
            <CardTitle className="font-mono text-3xl">
              {report ? report.test_brier.toFixed(3) : "…"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-[color:var(--color-muted-foreground)]">
            {report
              ? `Train ${report.train_brier.toFixed(3)} → test ${report.test_brier.toFixed(3)}. Gap signals moderate overfitting at this dataset scale.`
              : "Loading…"}
          </CardContent>
        </Card>
      </section>

      {/* 2020 winners by party */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold tracking-tight">
            2020 actual winners by party
          </h2>
          <span className="text-sm text-[color:var(--color-muted-foreground)]">
            24 general seats
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {partyOrder.map(([party, count]) => {
            const meta = getParty(party);
            return (
              <div
                key={party}
                className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: meta.color }}
                  aria-hidden
                />
                <span className="font-medium">{meta.shortDisplay}</span>
                <span className="font-mono text-[color:var(--color-muted-foreground)]">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Constituency grid: 2020 predicted vs actual */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold tracking-tight">
            2020 holdout: predicted vs actual winning party
          </h2>
          <span className="text-sm text-[color:var(--color-muted-foreground)]">
            Click a seat for detail
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[...constituencyRows.entries()]
            .sort(([a], [b]) => {
              const ai = parseInt(a.split("-")[1], 10);
              const bi = parseInt(b.split("-")[1], 10);
              return ai - bi;
            })
            .map(([cz, row]) => {
              const predicted = getParty(row.predicted_party);
              const actual = getParty(row.actual_party);
              return (
                <Link
                  key={cz}
                  to={`/constituency/${cz}`}
                  className="block rounded-md border p-3 hover:bg-[color:var(--color-muted)] transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm">{cz}</span>
                    {row.correct ? (
                      <Badge variant="muted" className="text-[10px]">
                        Correct
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        Missed
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-[color:var(--color-muted-foreground)] w-12">
                        Pred:
                      </span>
                      <PartyBadge
                        party={predicted.shortDisplay}
                        color={predicted.color}
                        textOnColor={predicted.textOnColor}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[color:var(--color-muted-foreground)] w-12">
                        Actual:
                      </span>
                      <PartyBadge
                        party={actual.shortDisplay}
                        color={actual.color}
                        textOnColor={actual.textOnColor}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
        </div>
      </section>
    </div>
  );
}
