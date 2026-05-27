import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useModelReport } from "@/lib/data";
import { formatPercent } from "@/lib/utils";

export function MethodologyPage() {
  const reportQ = useModelReport();
  const report = reportQ.data;

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Methodology</h1>
        <p className="text-[color:var(--color-muted-foreground)] mt-2">
          How the forecast is built, what it cannot do, and how to reproduce it.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Data sources</h2>
        <ol className="list-decimal pl-6 space-y-2 text-sm">
          <li>
            Wikipedia constituency pages (`GBA-1` through `GBA-24`) for
            historical winner + runner-up + sometimes third-place tallies.
          </li>
          <li>
            Wikipedia election summary page for 2020 (constituency-level
            turnout, registered voters, margin).
          </li>
          <li>
            Electoral Commission of Gilgit-Baltistan (ECGB) result PDFs for
            2009, 2015, 2020 (used as cross-validation). 2009 detail backfill
            from these PDFs is a pending workstream.
          </li>
          <li>
            Pakistan Bureau of Statistics 2023 Census, attributed at district
            level only (no public constituency overlay).
          </li>
        </ol>
        <p className="text-sm text-[color:var(--color-muted-foreground)]">
          All scrapers respect robots.txt, rate-limit to one request per
          two seconds per domain, and log retrieval timestamps. See{" "}
          <code>data/raw/scrape_manifest.csv</code> for the audit trail.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Model</h2>
        <p className="text-sm">
          Logistic regression with elastic-net regularisation
          (<code>l1_ratio=0.5</code>), preceded by standard scaling and
          followed by Platt scaling for calibration. Trained on candidate-runs
          from 2009 + 2015. The 2020 election is held out as a true test set;
          it is never touched during feature engineering or hyperparameter
          search.
        </p>
        <p className="text-sm">
          Features implemented in v1: federal-incumbent match, incumbent
          running, party-switch flag, prior vote share, prior winner-party
          match, prior margin, district one-hot dummies, and candidate
          continuity score.
        </p>
        <p className="text-sm">
          Deferred to v2: sect alignment (no public constituency-level sect
          data), turnout delta 2015 to 2020 (we currently have 2020 turnout
          only; 2015 turnout needs extraction from the constituency-page
          tables).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Holdout results</h2>
        {report ? (
          <Card>
            <CardHeader>
              <CardTitle>Model v1 vs federal-incumbent baseline</CardTitle>
              <CardDescription>2020 holdout, 24 general seats</CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 pr-4">Best regularisation C</td>
                    <td className="py-2 tabular text-right">{report.best_c}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">CV Brier (training folds)</td>
                    <td className="py-2 tabular text-right">
                      {report.cv_brier_train.toFixed(4)}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">Train Brier</td>
                    <td className="py-2 tabular text-right">
                      {report.train_brier.toFixed(4)}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">Test Brier (2020 holdout)</td>
                    <td className="py-2 tabular text-right">
                      {report.test_brier.toFixed(4)}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">Model accuracy on 2020</td>
                    <td className="py-2 tabular text-right">
                      {report.test_constituencies_correct}/
                      {report.test_constituencies_total} (
                      {formatPercent(report.test_constituency_accuracy * 100)})
                    </td>
                  </tr>
                  {report.baseline_2020_accuracy != null && (
                    <tr>
                      <td className="py-2 pr-4">Baseline accuracy on 2020</td>
                      <td className="py-2 tabular text-right">
                        {report.baseline_2020_correct}/
                        {report.test_constituencies_total} (
                        {formatPercent(report.baseline_2020_accuracy * 100)})
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ) : (
          <p className="text-sm text-[color:var(--color-muted-foreground)]">
            Loading…
          </p>
        )}
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium mb-2">Calibration</p>
            <img
              src="/data/calibration_plot.png"
              alt="Reliability diagram for 2020 holdout"
              className="rounded-md border"
            />
            <p className="text-xs text-[color:var(--color-muted-foreground)] mt-2">
              The model is mildly under-confident below 0.25 and over-confident
              around 0.5, reflecting that many federal-incumbent candidates did
              not actually win their seats in the unusually fragmented 2020
              election.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">
          Limitations
        </h2>
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li>
            187-row training set. Even with elastic-net regularisation, variance
            is high. Reported 80 percent confidence intervals are wide.
          </li>
          <li>
            2009 detail is winner-only for most constituencies on Wikipedia.
            Roughly 60 percent of 2015 rows therefore have missing prior-margin
            data. Filling this gap requires OCR of the ECGB 2009 PDF.
          </li>
          <li>
            Two same-party candidates contesting one seat (e.g. GBA-13 2020 had
            two PTI candidates with similar profiles) give the model very weak
            signal to discriminate.
          </li>
          <li>
            Wikipedia party labels may incorporate post-election defections.
            The 2020 PTI count in our data (11) likely includes one or two
            candidates who won as Independents and later joined the PTI bloc.
          </li>
          <li>
            No sentiment, polling, or kinship features in v1 by design.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">Reproducibility</h2>
        <pre className="rounded-md bg-[color:var(--color-muted)] p-3 text-xs overflow-x-auto">
{`# Data layer
cd pipeline && uv sync --extra dev
uv run python -m gb_pipeline.sweep
uv run python -m gb_pipeline.clean

# Model
cd model && uv sync --extra dev
uv run python -m gb_model.baseline
uv run python -m gb_model.candidate_ids
uv run python -m gb_model.features
uv run python -m gb_model.train`}
        </pre>
      </section>
    </div>
  );
}
