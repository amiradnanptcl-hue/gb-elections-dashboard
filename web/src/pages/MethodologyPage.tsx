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
            2.0 (28 May 2026) it also publishes a qualitative human-analyst
            seat-by-seat prediction for the 24 general seats. It does{" "}
            <em>not</em> assign machine-derived win probabilities to
            candidates. It is a curated reference plus a reasoned forecast:
            who contested, who won, how many voters are on the roll, how many
            polling stations are planned, where every number came from, and
            who the model says is likely to take each seat in 2026 (with the
            reasoning attached).
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
            <strong>It now publishes</strong> a qualitative seat-by-seat
            prediction at{" "}
            <Link
              to="/predictions"
              className="underline underline-offset-4 text-[color:var(--color-primary)]"
            >
              /predictions
            </Link>{" "}
            — a human-analyst framework (revision 2.0, 28 May 2026) that
            weights ground organisation, party machinery, biraderi networks
            and incumbent vulnerability above social-media volume.
          </li>
          <li>
            <strong>It is not</strong> a machine-learning probability output.
            An earlier build trained a logistic regression on the 72-row
            historical record; the only feature with real signal was "the
            federal ruling party also wins in GB", which made the 2026
            output collapse to "PML-N wins all 24 seats" and would have
            misled visitors. That model was removed in v1.3. The new
            prediction layer is qualitative and human-reasoned, not a
            classifier.
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
          The 2026 seat-by-seat prediction framework (Revision 2.0)
        </h3>
        <p className="text-sm leading-relaxed">
          The{" "}
          <Link
            to="/predictions"
            className="underline underline-offset-4 text-[color:var(--color-primary)]"
          >
            /predictions
          </Link>{" "}
          page calls every general seat by name. The model is a
          human-analyst framework that was revised on 28 May 2026 after
          three errors in the initial pass: it had over-weighted federal
          alignment, ignored PPP's ground machinery, and missed the
          "turncoat" stigma on IPP candidates. The revised framework
          weights inputs as follows:
        </p>
        <div className="grid gap-3 sm:grid-cols-5 text-xs">
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
              <p className="stat-display text-xl">25%</p>
              <p className="text-[11px] text-[color:var(--color-muted-foreground)] leading-snug">
                2020 results, margins, incumbency, party-switching history.
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
              <p className="stat-display text-xl">20%</p>
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
              <p className="stat-display text-xl">20%</p>
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
        <p className="text-sm leading-relaxed">
          <strong>Confidence bands.</strong> Every seat call ships with a
          High / Medium / Low rating. High = clear historical pattern plus
          strong incumbent plus weak opposition plus no wildcards. Medium =
          competitive race with 2–3 credible candidates within roughly
          2,000 votes. Low = multi-cornered contest or a known wildcard
          (BNF entry in GBA-19, AAC protest vote, GBA-24 delay).
        </p>
        <p className="text-sm leading-relaxed">
          <strong>Headline projection.</strong> PPP 12, PML-N 9,
          PTI-backed 3–4, IPP 0–1, JUI-F 1, Independent 1. Hung Assembly
          with PPP as the largest single bloc and most likely the senior
          partner in a continued PPP–PML-N coalition.
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
            <strong>Vision Gilgit Baltistan portal</strong>. Source for the
            2026 district-wise registered-voter roll (774,319 total, with
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
              female / male split. Source: Vision Gilgit Baltistan portal.
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
            our 24-seat tables cannot capture. Where the deep-research
            report makes that point qualitatively, we surface it as text;
            we do not encode it as a feature.
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
        </ul>
      </section>

      <div className="rule-gold" />

      {/* Closer */}
      <section className="card-elevated card-accent-gold p-5 sm:p-6 space-y-2 top-edge relative">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-accent-gold)] font-bold">
          Editorial position
        </p>
        <p className="text-sm sm:text-base text-[color:var(--color-foreground)] leading-relaxed">
          The strongest contribution this project can make is the dataset,
          not a forecast. The dataset can be inspected, criticised,
          extended and reused. A forecast on 72 historical rows would have
          either been a tautology or a lie. We chose neither.
        </p>
      </section>
    </div>
  );
}
