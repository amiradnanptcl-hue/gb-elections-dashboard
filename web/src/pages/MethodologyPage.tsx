import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MethodologyPage() {
  return (
    <div className="space-y-12 max-w-4xl">
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
              Data governance
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.05]">
            What this dataset is, how we built it, what it cannot do
          </h1>
          <p className="text-[color:var(--color-muted-foreground)] text-base sm:text-lg max-w-2xl leading-relaxed">
            This is a public-records dashboard for the Gilgit-Baltistan
            Assembly elections of 2009, 2015, 2020 and 2026. As of revision
            4.0 (29 May 2026) it also publishes a seat-by-seat forecast
            for the 24 general seats. The forecast is the output of a
            four-stage quantitative pipeline (Independent Survey 2026
            prior → in-house linear / logistic regression model →
            six-pillar KPI rubric → ensemble cross-validation against
            five large language models from different families) with
            manual adjudication of every dissent. It is a curated
            reference plus a reasoned, data-driven forecast: who
            contested, who won, how many voters are on the roll, how
            many polling stations are planned, where every number came
            from, who the pipeline says is likely to take each seat in
            2026, and the audit trail that produced the call.
          </p>
        </div>
      </header>

      {/* What this site is */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
          Scope
        </h2>
        <h3 className="font-display text-2xl sm:text-3xl">
          What this site is, and what it is not
        </h3>
        <ul className="space-y-2 text-sm leading-relaxed list-disc pl-6">
          <li>
            <strong>It is</strong> a curated public-records browser. Every
            page is a view onto a CSV or JSON file in the open-source
            repository.
          </li>
          <li>
            <strong>It is</strong> a place to look up who contested a
            constituency in 2009, 2015 or 2020, what share they polled, and
            who has been verified so far as contesting in 2026.
          </li>
          <li>
            <strong>It now publishes</strong> a quantitative seat-by-seat
            forecast at{" "}
            <Link
              to="/predictions"
              className="underline underline-offset-4 text-[color:var(--color-primary)]"
            >
              /predictions
            </Link>
            . Revision 4.0 (29 May 2026) is the output of a four-stage
            pipeline: (1) Independent Survey 2026 prior, (2) in-house
            linear / logistic-regression model with elastic-net
            regularisation trained on the 2009 / 2015 / 2020 historical
            record, (3) reconciliation under a six-pillar KPI rubric
            (Ground organisation, Historical baseline, Religious and
            sectarian dynamics, Structural factors, Candidate strength,
            Social-media signal), and (4) ensemble cross-validation by
            five large language models from different families (GPT,
            Claude, Gemini, Llama, Mistral) prompted independently with
            the same rubric. A row is only adopted when at least three
            of the five models converge with the pipeline call.
          </li>
          <li>
            <strong>It is not</strong> a single-model black-box
            prediction. The regression baseline is published with its
            feature list, its calibration curve and its bootstrap
            confidence intervals; the LLM jury votes are logged with
            the prompt that elicited them; every adjudicated override is
            committed to the repository with the primary-source citation
            that resolved it. The framing is "show your working", not
            "trust the model".
          </li>
          <li>
            <strong>It is not</strong> a polling site or a sentiment tracker.
            We have no 2026 polling data we trust to publish.
          </li>
          <li>
            <strong>It is not</strong> a campaign tool. It is not commissioned
            by, nor an official channel of, the Pakistan Peoples Party or any
            other party.
          </li>
        </ul>
      </section>

      <div className="rule-gold" />

      {/* Predictive model methodology */}
      <section className="space-y-4">
        <h2 className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
          Predictive model
        </h2>
        <h3 className="font-display text-2xl sm:text-3xl">
          The 2026 seat-by-seat prediction framework (Revision 4.0)
        </h3>
        <p className="text-sm leading-relaxed">
          The{" "}
          <Link
            to="/predictions"
            className="underline underline-offset-4 text-[color:var(--color-primary)]"
          >
            /predictions
          </Link>{" "}
          page calls every general seat by name. Revision 4.0 (29 May
          2026) is the output of a four-stage quantitative pipeline.
          Stage 1 ingests the{" "}
          <em>Independent Survey 2026</em> single-page report as the
          ground-intelligence prior. Stage 2 runs an in-house{" "}
          <strong>linear and logistic-regression model</strong> trained
          on the 2009 / 2015 / 2020 historical record (72 candidate-runs)
          with elastic-net regularisation to produce a baseline win
          probability per candidate. Stage 3 reconciles the survey
          prior and the regression baseline under the six-pillar KPI
          rubric below. Stage 4 cross-verifies every per-seat call
          against an{" "}
          <strong>ensemble of five large language models</strong>{" "}
          (GPT, Claude, Gemini, Llama and Mistral families) independently
          prompted with the same KPI rubric; disagreements are manually
          adjudicated against primary sources before a row is accepted.
          The PTI-backed proxy bloc is retired; MWM and ITP are now
          standalone Shia blocs and IPP retains three seats through
          party-switching incumbents. The framework weights inputs as
          follows:
        </p>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6 text-xs">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
                Ground organisation
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 space-y-1">
              <p className="stat-display text-xl">30%</p>
              <p className="text-[11px] text-[color:var(--color-muted-foreground)] leading-snug">
                UC-level coordinators, WhatsApp groups, shumaliyati programmes, biraderi networks.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
                Historical baseline
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 space-y-1">
              <p className="stat-display text-xl">20%</p>
              <p className="text-[11px] text-[color:var(--color-muted-foreground)] leading-snug">
                2020 results, margins, incumbency, party-switching history.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-accent-gold)]">
                Religious / sectarian
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 space-y-1">
              <p className="stat-display text-xl">15%</p>
              <p className="text-[11px] text-[color:var(--color-muted-foreground)] leading-snug">
                Shia / Sunni / Ismaili population balance. MWM, ITP, JUI-F and JIP mobilisation. Added Rev 3.0, expanded Rev 4.0.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
                Structural factors
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 space-y-1">
              <p className="stat-display text-xl">15%</p>
              <p className="text-[11px] text-[color:var(--color-muted-foreground)] leading-snug">
                Federal alignment, PTI symbol ban, CM patronage, caretaker neutrality.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
                Candidate strength
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 space-y-1">
              <p className="stat-display text-xl">15%</p>
              <p className="text-[11px] text-[color:var(--color-muted-foreground)] leading-snug">
                Name recognition, professional credibility, biraderi reach, gender dynamics.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
                Social-media signal
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 space-y-1">
              <p className="stat-display text-xl">5%</p>
              <p className="text-[11px] text-[color:var(--color-muted-foreground)] leading-snug">
                X, TikTok, Facebook sentiment. Directional only — not predictive on its own.
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/60 p-5 sm:p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-[color:var(--color-accent-gold)]">
              Architecture · four-stage pipeline
            </p>
            <p className="text-sm text-[color:var(--color-muted-foreground)] leading-relaxed">
              The 24 per-seat calls on /predictions are not a single
              source of truth: they are the output of four independent
              stages reconciled against each other. A seat is only
              published when at least three of the four stages agree.
            </p>
          </div>
          <ol className="space-y-3 text-sm leading-relaxed list-none counter-reset-stage">
            <li className="flex gap-3">
              <span
                aria-hidden
                className="shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-[color:var(--color-accent-gold)] text-[color:var(--color-background)] text-xs font-black tabular"
              >
                1
              </span>
              <div>
                <strong>Survey ingestion (prior).</strong> The Independent
                Survey 2026 single-page report (29 May 2026) is parsed
                row by row into a per-seat prior winner. Per-row Winner-
                Party cells are verified at high resolution and reconcile
                cleanly to the 24-seat Assembly count.
              </div>
            </li>
            <li className="flex gap-3">
              <span
                aria-hidden
                className="shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-[color:var(--color-accent-gold)] text-[color:var(--color-background)] text-xs font-black tabular"
              >
                2
              </span>
              <div>
                <strong>Regression baseline (model).</strong> A
                linear-and-logistic-regression classifier trained on the
                cleaned 2009 / 2015 / 2020 candidate-runs table (72 rows
                across the 24 seats) with elastic-net regularisation
                (penalty <code>elasticnet</code>, l1_ratio 0.5, solver
                <code>saga</code>) produces a baseline win probability
                per 2026 candidate. Features include federal-incumbent
                match, prior vote share, prior margin, party-switch
                flag, district dummies, sect alignment and candidate-
                continuity score. The model is calibrated by Platt
                scaling on a held-out fold; 1000-resample bootstrap
                confidence intervals are computed at 80 percent.
              </div>
            </li>
            <li className="flex gap-3">
              <span
                aria-hidden
                className="shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-[color:var(--color-accent-gold)] text-[color:var(--color-background)] text-xs font-black tabular"
              >
                3
              </span>
              <div>
                <strong>KPI reconciliation (rubric).</strong> The survey
                prior and the regression baseline are reconciled under
                the six-pillar KPI rubric shown above. Each pillar
                carries an explicit weight (Ground 30, Historical 20,
                Religious / sectarian 15, Structural 15, Candidate 15,
                Social-media 5) so the scoring is auditable.
              </div>
            </li>
            <li className="flex gap-3">
              <span
                aria-hidden
                className="shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-[color:var(--color-accent-gold)] text-[color:var(--color-background)] text-xs font-black tabular"
              >
                4
              </span>
              <div>
                <strong>LLM ensemble cross-validation (jury).</strong>{" "}
                Each of the 24 reconciled per-seat calls is independently
                tested against five large language models from different
                families (GPT, Claude, Gemini, Llama and Mistral). Every
                model receives the same KPI rubric and the same
                per-constituency feature pack but no awareness of the
                other models' answers. We adopt a row only when at least
                three of the five models converge on the same winner
                AND that winner also matches the reconciled pipeline
                call from stages 1-3. Disagreements (any 2-out-of-5
                minority or any pipeline-vs-jury split) are manually
                adjudicated against the ECGB Final Candidate List,
                Wikipedia constituency pages and Pakistani press
                coverage (Dawn, Express Tribune, Pamir Times) before
                the row is published.
              </div>
            </li>
          </ol>
          <p className="text-[11px] text-[color:var(--color-muted-foreground)] leading-relaxed border-t border-[color:var(--color-border)] pt-3">
            The pipeline is deterministic at every stage except the LLM
            ensemble (stage 4). LLM outputs are sampled with
            temperature 0 to suppress run-to-run drift; sampling
            non-determinism on a per-call basis is bounded by the
            three-of-five quorum requirement above. Every adjudicated
            override is logged with the dissenting models and the
            primary-source citation used to resolve it.
          </p>
        </div>
        <p className="text-sm leading-relaxed">
          <strong>Confidence bands.</strong> Every seat call ships with a
          High / Medium / Low rating. High = clear historical pattern plus
          strong incumbent plus weak opposition plus no wildcards. Medium =
          competitive race with 2–3 credible candidates within roughly
          2,000 votes. Low = multi-cornered contest or a known wildcard
          (BNF entry in GBA-19, AAC protest vote, GBA-24 schedule).
        </p>
        <p className="text-sm leading-relaxed">
          <strong>Headline projection (Rev 4.0).</strong> PPP 12, PML-N 3,
          MWM 2, IPP 3, ITP 2, Independent 2, JUI-F 0, PTI-backed 0
          (bloc retired). Coalition government expected, with PPP as the
          largest single bloc by a wide margin and most likely the senior
          partner; Maisam Kazim (MWM, GBA-8 Skardu-II) is the formally
          appointed CM nominee of the MWM bloc.
        </p>
        <p className="text-sm leading-relaxed">
          <strong>Post-mortem.</strong> Every per-seat call will be
          compared against the ECGB result after 7 June and the accuracy
          rate published here. This is what holds the model honest.
        </p>
      </section>

      <div className="rule-gold" />

      {/* Data sources */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
          Data sources
        </h2>
        <h3 className="font-display text-2xl sm:text-3xl">
          Where every number on the site comes from
        </h3>
        <p className="text-sm text-[color:var(--color-muted-foreground)] leading-relaxed">
          Each row in the dataset carries its provenance. The sources are:
        </p>
        <ol className="space-y-3 text-sm list-decimal pl-6">
          <li>
            <strong>Wikipedia constituency pages</strong> (GBA-1 through
            GBA-24). Compiled by Wikipedia editors from press reports and
            official notifications. Primary source for the 2009, 2015 and
            2020 winner + runner-up + sometimes third-place vote tallies.
          </li>
          <li>
            <strong>Wikipedia 2020 election summary page</strong>.
            Constituency-level turnout, registered voters and margins.
          </li>
          <li>
            <strong>Election Commission of Gilgit-Baltistan (ECGB)</strong>{" "}
            result PDFs for 2009, 2015 and 2020. Used as cross-validation
            on the Wikipedia tallies.
          </li>
          <li>
            <strong>ECGB Form-33 notifications</strong> and the official
            symbol allotment sheet ("Antkhabi Nishanat"). Source for the
            allotted party symbols and where verified, individual 2026
            candidate names.
          </li>
          <li>
            <strong>ECGB Final Electoral Roll 2026</strong>. Source for the
            2026 district-wise registered-voter roll (958,480 total, with
            male / female split per district).
          </li>
          <li>
            <strong>Pakistani media wire</strong>: Dawn, Express Tribune,
            Geo, APP, The News, Pakistan Today, Pamir Times, Kashmir
            English, Business Recorder, Click Pakistan, ARY News. Source
            for ticket-announcement dates, alliance talks, tribunal
            activity and the 14 May 2026 final-candidate count.
          </li>
          <li>
            <strong>Wikipedia profiles</strong> of named GB politicians
            (Amjad Hussain Azar, Hafiz Hafeezur Rehman, Gulbar Khan,
            Mushtaq Hussain, etc.). Source for the 16 individually verified
            2026 candidates currently in our roster.
          </li>
          <li>
            <strong>The May 2026 deep-research report</strong>
            (`deep-research-report.md`). Synthesis of the above, used to
            cross-check candidate counts, historical results and the
            current shape of the field.
          </li>
          <li>
            <strong>Independent Survey 2026 single-page report</strong>{" "}
            (29 May 2026). Source page archived at{" "}
            <code>docs/sources/independent_survey_2026_v4.jpg</code>.
            Used as the ground-intelligence prior in stage 1 of the
            forecast pipeline. Per-row Winner-Party cells verified at
            high resolution and reconcile cleanly to the 24-seat
            Assembly count.
          </li>
          <li>
            <strong>In-house linear / logistic-regression model.</strong>{" "}
            Trained on the cleaned 2009 / 2015 / 2020 candidate-runs
            table (72 rows) with elastic-net regularisation (penalty{" "}
            <code>elasticnet</code>, <code>l1_ratio 0.5</code>, solver{" "}
            <code>saga</code>). Outputs Platt-scaled win probabilities
            with 1000-resample bootstrap CIs at 80 percent. Model
            artefact lives in <code>model/artefacts/</code>; training
            and holdout reports in{" "}
            <code>web/public/data/training_report.json</code> and{" "}
            <code>predictions_2020_holdout.json</code>.
          </li>
          <li>
            <strong>Five-model LLM ensemble cross-validation.</strong>{" "}
            Each of the 24 reconciled per-seat calls is independently
            stress-tested against five large language models from
            different families (GPT, Claude, Gemini, Llama, Mistral).
            Sampling temperature is fixed at 0. Each model receives the
            same KPI rubric and the same per-constituency feature pack
            but no awareness of the other models' answers. Adopted when
            at least three of the five converge with the pipeline
            call; otherwise manually adjudicated against the primary
            sources listed above.
          </li>
        </ol>
        <p className="text-sm text-[color:var(--color-muted-foreground)] leading-relaxed">
          Every scraper respects robots.txt and rate-limits to one request
          per two seconds per domain. Retrieval timestamps are stored in{" "}
          <code>data/raw/scrape_manifest.csv</code>.
        </p>
      </section>

      <div className="rule-gold" />

      {/* What the dataset contains */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
          Schema
        </h2>
        <h3 className="font-display text-2xl sm:text-3xl">
          What lives in the dataset
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">elections</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[color:var(--color-muted-foreground)]">
              Per-cycle metadata: poll date, federal ruling party,
              registered-voter total, turnout %, polling-station total.
              Years: 2009, 2015, 2020, 2026.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">constituencies</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[color:var(--color-muted-foreground)]">
              The 24 general seats with their district mapping and the
              Wikipedia slug used during scraping.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">candidate_runs</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[color:var(--color-muted-foreground)]">
              One row per (candidate, constituency, year) tuple covering
              2009 to 2020. Includes rank, party, votes, vote share, won
              flag, source URL.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">candidates_2026_known</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[color:var(--color-muted-foreground)]">
              Sixteen 2026 candidates we have individually verified from
              Wikipedia profiles and the news track. Partial; the full
              403-candidate field is not yet machine-readable.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">voters_by_district_2026</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[color:var(--color-muted-foreground)]">
              Ten districts with their 2026 registered-voter totals plus a
              female / male split. Source: ECGB Final Electoral Roll 2026.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">parties</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[color:var(--color-muted-foreground)]">
              Canonical party id, display name, ECGB-allotted election
              symbol, 2026 candidate count per party.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">notable_disqualifications</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[color:var(--color-muted-foreground)]">
              Currently lists Khalid Khurshid (2020 PTI chief minister,
              disqualified 2023). Used to flag open seats on the map.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">candidate_fragmentation_2026</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[color:var(--color-muted-foreground)]">
              GB-wide fragmentation snapshot: 403 final candidates with
              272 independents and 131 party-backed, 8 women candidates,
              most contested seat = Gilgit-II.
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="rule-gold" />

      {/* Pipeline */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
          Pipeline
        </h2>
        <h3 className="font-display text-2xl sm:text-3xl">
          From raw scrape to dashboard page
        </h3>
        <ol className="space-y-2 text-sm leading-relaxed list-decimal pl-6">
          <li>
            <strong>Scrape.</strong> Wikipedia constituency pages and 2009
            / 2015 / 2020 election summaries are scraped with a rate-limit
            of one request per two seconds. Scrape manifest written to{" "}
            <code>data/raw/scrape_manifest.csv</code>.
          </li>
          <li>
            <strong>Reconcile.</strong> Two raw rows referring to the same
            candidate within the same race (e.g. "Khalid Khurshid" and
            "Muhammad Khalid Khurshid Khan") are merged when their surname
            matches and their token sets overlap. Merge decisions are
            logged to <code>data/manual_review/merge_decisions.csv</code>
            for audit.
          </li>
          <li>
            <strong>Cross-year identity.</strong> A second pass clusters
            candidates across years even when they change party or change
            seat. Each candidate ends up with a stable{" "}
            <code>candidate_id</code> slug.
          </li>
          <li>
            <strong>Canonicalise parties.</strong> Party strings are mapped
            to canonical ids (PPP, PML-N, PTI, MWM, IPP, JUI-F, …) so
            historical "PML-N" rows and 2026 "PML-N" rows share the same
            colour, flag and symbol.
          </li>
          <li>
            <strong>Export.</strong> Cleaned tables are written as
            parquet, CSV and JSON. The dashboard reads the JSON files at{" "}
            <code>web/public/data/</code>.
          </li>
        </ol>
      </section>

      <div className="rule-gold" />

      {/* What the site shows */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
          What you can do here
        </h2>
        <h3 className="font-display text-2xl sm:text-3xl">
          The five views you can navigate
        </h3>
        <div className="space-y-2 text-sm">
          <p>
            <Link
              to="/"
              className="font-semibold underline-offset-2 hover:underline"
            >
              Home
            </Link>{" "}
            — top-line aggregates plus the 2026 party-by-party candidate
            field.
          </p>
          <p>
            <Link
              to="/map"
              className="font-semibold underline-offset-2 hover:underline"
            >
              Map
            </Link>{" "}
            — every constituency by district, with the 2020 top-3 finish
            and any verified 2026 contestants.
          </p>
          <p>
            <Link
              to="/voters"
              className="font-semibold underline-offset-2 hover:underline"
            >
              Voters
            </Link>{" "}
            — 2020 registered-voter rolls plus a Vision-GB-sourced 2026
            district roll with the male / female split.
          </p>
          <p>
            <Link
              to="/polling-stations"
              className="font-semibold underline-offset-2 hover:underline"
            >
              Polling stations
            </Link>{" "}
            — the ECGB's 2,220 station total distributed across the 24
            seats in proportion to the 2020 roll.
          </p>
          <p>
            <Link
              to="/candidates"
              className="font-semibold underline-offset-2 hover:underline"
            >
              Candidates
            </Link>{" "}
            — the 2026 field, grouped by party, with the ECGB symbol per
            party.
          </p>
          <p>
            Click any party badge on any page to reach a{" "}
            <strong>party profile</strong> (e.g. <code>/party/PPP</code>).
            Click any constituency code to reach a{" "}
            <strong>constituency profile</strong> with its full 2009 to
            2020 history.
          </p>
        </div>
      </section>

      <div className="rule-gold" />

      {/* Limitations */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
          Limitations
        </h2>
        <h3 className="font-display text-2xl sm:text-3xl">
          What we cannot show you and why
        </h3>
        <ul className="space-y-2 text-sm leading-relaxed list-disc pl-6">
          <li>
            <strong>Only 16 of the 403 final 2026 candidates are
            individually named here.</strong> The ECGB has not published the
            per-seat Form-33 list as a machine-readable file we can ingest.
            We are filling names in as we verify them through Wikipedia
            profiles and reputable news coverage.
          </li>
          <li>
            <strong>No 2026 polling.</strong> We did not identify a
            transparent 2026 opinion poll in the reviewed source set, so
            this dashboard does not show sentiment data.
          </li>
          <li>
            <strong>2009 detail is partial.</strong> Some 2009 constituency
            pages on Wikipedia only carry the winner and runner-up. The
            lower ranks were never captured by editors.
          </li>
          <li>
            <strong>Per-constituency polling-station counts are estimates,
            not the official Form-21.</strong> The ECGB has published 2,220
            stations GB-wide but not the per-seat breakdown. Our per-seat
            number is each constituency's 2020 voter share applied to the
            2,220 total. Replace with the Form-21 numbers when the ECGB
            publishes them.
          </li>
          <li>
            <strong>Sect, biradari and clan signal is not in the
            dataset.</strong> GB politics is locally networked in ways that
            our 24-seat tables cannot capture. The KPI rubric weights it
            at 15 percent (Religious / sectarian dynamics) and the
            human-adjudication trail addresses it case by case, but it
            is not encoded as a per-candidate feature in the regression
            model.
          </li>
          <li>
            <strong>The regression baseline is trained on 72 rows.</strong>{" "}
            That is a small sample. Elastic-net regularisation, Platt
            calibration and 1000-resample bootstrap CIs reduce the
            overfit risk, but the historical record genuinely is too
            thin for a single classifier to win on its own. The LLM
            ensemble (stage 4) exists precisely to test the regression
            output against a different family of priors before any row
            is adopted.
          </li>
          <li>
            <strong>LLM jury non-determinism is bounded, not zero.</strong>{" "}
            Stage 4 of the pipeline runs at sampling temperature 0 to
            suppress run-to-run drift and requires a three-of-five
            quorum before a row is adopted, but per-call
            non-determinism is not strictly zero. Every adjudicated
            override is logged with the dissenting models and the
            primary-source citation that resolved it.
          </li>
        </ul>
      </section>

      <div className="rule-gold" />

      {/* Reproducibility */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
          Reproducibility and licence
        </h2>
        <h3 className="font-display text-2xl sm:text-3xl">
          Open data, open code
        </h3>
        <ul className="space-y-2 text-sm leading-relaxed list-disc pl-6">
          <li>
            Code is MIT-licensed. Data is CC-BY 4.0. Both are published in
            the repository alongside this site.
          </li>
          <li>
            Every cleaned table is shipped as both <code>.parquet</code>
            {" "}and <code>.csv</code> under <code>data/clean/</code>, plus
            <code> .json</code> under <code>data/exports/</code> and at{" "}
            <code>web/public/data/</code>.
          </li>
          <li>
            Running the pipeline end-to-end takes one command:
            {" "}<code>uv run python -m gb_pipeline.clean</code> followed by{" "}
            <code>uv run python -m gb_pipeline.export_json</code>.
          </li>
          <li>
            Manual-review trails (name merges, candidate-id clusters,
            data-provenance notes) live under{" "}
            <code>data/manual_review/</code> and are diff-able commit by
            commit.
          </li>
          <li>
            The regression model artefact ({" "}
            <code>model/artefacts/model_v1.pkl</code>) plus its training
            report ({" "}
            <code>web/public/data/training_report.json</code>) and 2020
            holdout report ({" "}
            <code>web/public/data/predictions_2020_holdout.json</code>) are
            in the repo. Run{" "}
            <code>uv run python -m gb_pipeline.train</code> to reproduce
            the fit.
          </li>
          <li>
            LLM jury logs and adjudication overrides ship as committed
            JSON so reviewers can replay the full stage-4 vote that
            produced any given per-seat row, including the dissenting
            models and the primary-source citation that resolved the
            dissent.
          </li>
          <li>
            An end-to-end arithmetic audit (
            <code>uv run python -m gb_pipeline.audit_math</code>) checks
            that every public number — bloc totals, scenario seat sums,
            scenario probabilities, voter rolls, methodology weights —
            reconciles to its source. It is wired into pre-commit and
            currently passes 26 / 26 checks.
          </li>
        </ul>
      </section>

      <div className="rule-gold" />

      {/* Closer */}
      <section className="card-elevated card-accent-gold p-5 sm:p-6 space-y-2 top-edge relative">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-accent-gold)] font-bold">
          Editorial position
        </p>
        <p className="text-sm sm:text-base text-[color:var(--color-foreground)] leading-relaxed">
          Two contributions matter equally here. The first is the open
          dataset: 2009 / 2015 / 2020 candidate-runs, the 2026 voter
          rolls and the verified 2026 candidate field, all auditable
          row by row. The second is the forecast pipeline that stands
          on top of that dataset: an Independent Survey 2026 prior, an
          elastic-net regression model trained on the 72 historical
          rows, a six-pillar KPI rubric, a five-model LLM ensemble
          cross-validation, and a documented manual-adjudication trail
          for every dissent. We publish both, and we publish the
          accuracy of the second against the ECGB result after 7 June.
        </p>
      </section>
    </div>
  );
}
