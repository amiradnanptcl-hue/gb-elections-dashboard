import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CMRaceMeter } from "@/components/CMRaceMeter";
import { getCandidateField2026, getParty } from "@/lib/parties";
import { useCandidateRuns, useElections } from "@/lib/data";
import { useDocumentMeta } from "@/lib/seo";
import { formatNumber } from "@/lib/utils";

export function HomePage() {
  useDocumentMeta({
    title: "GB Elections 2026 — Gilgit-Baltistan Assembly election dashboard",
    description:
      "Public-records dashboard for the Gilgit-Baltistan Assembly election on 7 June 2026. 24 general seats, 403 candidates, 774,319 voters, ECGB polling-station data. Historical results 2009, 2015, 2020.",
    path: "/",
  });
  const navigate = useNavigate();
  const runsQ = useCandidateRuns();
  const electionsQ = useElections();

  const runs = runsQ.data;
  const election2026 = electionsQ.data?.find((e) => e.year === 2026);

  // Historical 2020 winners-by-party tally — used by the 2020 winners chips
  // below the candidate field table. Pure database read; no model output.
  const winners2020 =
    runs?.filter((r) => r.election_year === 2020 && r.won) ?? [];
  const byParty = new Map<string, number>();
  for (const w of winners2020) {
    byParty.set(w.party, (byParty.get(w.party) ?? 0) + 1);
  }
  const partyOrder = [...byParty.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-16">
      {/* 2026 CM Race — first thing the visitor sees */}
      <CMRaceMeter />

      {/* Hero — editorial */}
      <section className="grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12 items-center">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="inline-block h-px w-10 bg-[color:var(--color-accent-gold)]" />
            <span className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
              Polling 7 June 2026 · 4th Assembly cycle
            </span>
          </div>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.02]">
            Gilgit-Baltistan{" "}
            <span className="text-headline-gradient">
              Assembly
            </span>
            <br />
            Election Records 2026
          </h1>
          <p className="text-[color:var(--color-muted-foreground)] text-lg max-w-xl leading-relaxed">
            A public-records dashboard for the GB Assembly
            elections of 2009, 2015, 2020 and 2026. Open dataset,
            traceable sources, no forecast. Browse the seats, the parties,
            the candidates and the voter rolls — each figure linked to
            where it came from.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button asChild size="lg">
              <Link to="/methodology">Data governance</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/map">Explore by constituency</Link>
            </Button>
            <Badge variant="outline" className="ml-1">
              Beta version under testing
            </Badge>
          </div>
        </div>

        <figure className="relative m-0 rounded-xl overflow-hidden border border-[color:var(--color-border)] shadow-[var(--shadow-lg)]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--color-accent-gold)] to-transparent z-10" />
          <img
            src="/leaders.jpg"
            alt="Pakistan Peoples Party leadership"
            width="1229"
            height="849"
            className="block w-full h-auto"
            loading="eager"
            decoding="async"
          />
          <figcaption className="px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-[color:var(--color-muted-foreground)] border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)]/60">
            Pakistan Peoples Party leadership · published under PPP TEAM AI
          </figcaption>
        </figure>
      </section>

      <div className="rule-gold" />

      {/* What we know about 2026 */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
              Pre-poll snapshot
            </p>
            <h2 className="font-display text-3xl sm:text-4xl">
              What we know about 2026 so far
            </h2>
          </div>
          <p className="text-sm text-[color:var(--color-muted-foreground)] max-w-sm">
            Sourced from the ECGB notifications, news reports and the
            research pack. Updates as the slate is published.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            no="01"
            label="Registered voters"
            value={
              election2026?.registered_voters
                ? formatNumber(election2026.registered_voters)
                : "…"
            }
            blurb="+3.9 percent growth versus the 2020 roll (745,362). Female 373,995 · male 400,324 per Vision GB."
            accent="green"
            href="/voters"
          />
          <StatCard
            no="02"
            label="Polling stations"
            value={
              election2026?.polling_stations
                ? formatNumber(election2026.polling_stations)
                : "…"
            }
            blurb="ECGB planning total for the 24 general seats."
            accent="gold"
            href="/polling-stations"
          />
          <StatCard
            no="03"
            label="Final candidates"
            value="403"
            blurb="Final ECGB list of 14 May 2026: 272 independents and 131 party-backed candidates. 693 papers were filed pre-scrutiny."
            accent="red"
            href="/candidates"
          />
          <StatCard
            no="04"
            label="Party-backed candidates"
            value="131"
            blurb="PPP 23 · PML-N 22 · IPP 15 · PML 11 · ITP 10 · PNP 10 · JUI-F 9. Eight women candidates in total."
            accent="gold"
            href="/sources"
          />
        </div>
      </section>

      {/* 2020 actual winners by party — moved up so the historical anchor
        sits above the forward-looking 2026 candidate field below. */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
              Ground truth
            </p>
            <h2 className="font-display text-3xl sm:text-4xl">
              2020 winners by party
            </h2>
          </div>
          <span className="text-sm font-mono tabular text-[color:var(--color-muted-foreground)]">
            24 general seats · poll-time labels
          </span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {partyOrder.map(([party, count]) => {
            const meta = getParty(party);
            return (
              <Link
                key={party}
                to={`/party/${encodeURIComponent(meta.id)}?year=2020&filter=winners`}
                className="group flex items-center gap-2.5 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] pl-0 pr-3 py-0 overflow-hidden transition-all hover:border-[color:var(--color-border-strong)] hover:shadow-[var(--shadow-md)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent-gold)]"
                aria-label={`Open ${meta.display} 2020 winners (${count} ${count === 1 ? "seat" : "seats"})`}
              >
                <img
                  src={meta.flag}
                  alt=""
                  width="40"
                  height="28"
                  className="h-10 w-10 object-cover shrink-0"
                  loading="lazy"
                  decoding="async"
                />
                <span className="font-medium text-sm">{meta.shortDisplay}</span>
                <span className="font-mono tabular text-sm text-[color:var(--color-muted-foreground)] font-semibold">
                  {count}
                </span>
                <span
                  aria-hidden
                  className="text-[color:var(--color-muted-foreground)]/60 text-sm transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 2026 candidate field — by party with election symbols */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
              Who is on the ballot
            </p>
            <h2 className="font-display text-3xl sm:text-4xl">
              The 2026 candidate field
            </h2>
          </div>
          <p className="text-sm text-[color:var(--color-muted-foreground)] max-w-sm">
            Post-scrutiny totals filed with the ECGB. Independents carry
            their own allotted symbols.
          </p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)] border-b border-[color:var(--color-border)]">
                <th className="px-4 py-3 font-medium">Party</th>
                <th className="px-4 py-3 font-medium">Symbol</th>
                <th className="px-4 py-3 font-medium text-right">2026 candidates</th>
              </tr>
            </thead>
            <tbody>
              {getCandidateField2026().map((p) => {
                const href = `/party/${encodeURIComponent(p.id)}`;
                return (
                  <tr
                    key={p.id}
                    role="link"
                    tabIndex={0}
                    onClick={() => navigate(href)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(href);
                      }
                    }}
                    className="cursor-pointer border-b border-[color:var(--color-border)] last:border-b-0 hover:bg-[color:var(--color-muted)]/40 focus:bg-[color:var(--color-muted)]/40 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[color:var(--color-accent-gold)] transition-colors"
                    aria-label={`View ${p.display} candidates`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={p.flag}
                          alt=""
                          width="28"
                          height="18"
                          className="h-[18px] w-7 rounded-sm object-cover shrink-0"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{p.shortDisplay}</span>
                          <span className="text-[11px] text-[color:var(--color-muted-foreground)]">
                            {p.display}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[color:var(--color-muted-foreground)]">
                      <span className="inline-flex items-center gap-2">
                        {p.electionSymbolIcon && (
                          <span className="text-lg leading-none" aria-hidden>
                            {p.electionSymbolIcon}
                          </span>
                        )}
                        <span>{p.electionSymbol ?? "—"}</span>
                        {p.id === "Independent" && (
                          <span className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-muted-foreground)]/70">
                            · per candidate
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-2 font-mono tabular text-base font-semibold">
                        {p.candidates2026 ?? 0}
                        <span
                          aria-hidden
                          className="text-[color:var(--color-muted-foreground)] text-sm"
                        >
                          →
                        </span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[color:var(--color-border-strong)]">
                <td className="px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
                  Notable absence
                </td>
                <td colSpan={2} className="px-4 py-3 text-[11px] text-[color:var(--color-muted-foreground)]">
                  PTI is not on this 2026 list. Their symbol allocation has
                  been under review since 2024; verify before final reporting.
                </td>
              </tr>
              <tr className="border-t border-[color:var(--color-border)]">
                <td colSpan={3} className="px-4 py-2.5 text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-muted-foreground)]">
                  Source · ECGB Form-33 allocated-symbols sheet ·{" "}
                  <a
                    href="https://ecgb.gov.pk/storage/attachments/P60sv18v3lIzEcgBl3XooTUChhAKMXyqLj7h2FwZ.jpg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[color:var(--color-primary)] hover:underline"
                  >
                    party sheet
                  </a>
                  {" · "}
                  <a
                    href="https://ecgb.gov.pk/storage/attachments/ZiSvNKGXOagYqNitD3uchdaeAObLurOOvxOFoXuW.jpg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[color:var(--color-primary)] hover:underline"
                  >
                    independent sheet
                  </a>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Editorial close — clarifies that the site is a database, not a
        forecast, and points at the methodology / data-governance page. */}
      <section className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
            What this dashboard is
          </p>
          <h2 className="font-display text-3xl sm:text-4xl">
            A public-records browser, not a forecast
          </h2>
        </div>
        <article className="relative card-elevated card-accent-gold p-6 sm:p-8 space-y-4 top-edge">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-[color:var(--color-accent-gold-soft)] text-[color:var(--color-accent-gold)]"
            >
              Editorial position
            </Badge>
          </div>
          <p className="text-base sm:text-lg leading-relaxed">
            Every figure on this site is a database read. The 2009, 2015
            and 2020 results come from Wikipedia constituency pages and
            ECGB notifications. The 2026 candidate names that appear here
            are individually verified from Wikipedia profiles and Pakistani
            news outlets. The 2026 voter rolls come from the Vision Gilgit
            Baltistan portal. The party symbols come from the ECGB
            allotted-symbol sheet.
          </p>
          <p className="text-base sm:text-lg leading-relaxed">
            We do not publish a forecast. An earlier build trained a
            logistic-regression model on the 72 historical candidate rows
            and ran it forward to 2026. The result was statistically thin
            and collapsed to the federal-incumbent baseline ("PML-N wins
            all 24"), which would have misled readers. We removed it.
          </p>
          <p className="text-sm text-[color:var(--color-muted-foreground)] max-w-3xl">
            For the full data-source list, the schema, the cleaning
            pipeline and a candid list of limitations, see the data
            governance page.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="muted">
              <Link to="/methodology" className="underline">
                Read the data governance page
              </Link>
            </Badge>
            <Badge variant="muted">
              <Link to="/sources" className="underline">
                Browse the source list
              </Link>
            </Badge>
          </div>
        </article>
      </section>
    </div>
  );
}

interface StatCardProps {
  no: string;
  label: string;
  value: string | number;
  blurb: string;
  accent?: "green" | "red" | "gold";
  href?: string;
}

function StatCard({ no, label, value, blurb, accent = "green", href }: StatCardProps) {
  const body = (
    <>
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
          {no}
        </span>
        <span className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--color-muted-foreground)]">
          {label}
        </span>
      </div>
      <div className="stat-display text-3xl sm:text-4xl">{value}</div>
      <p className="text-xs text-[color:var(--color-muted-foreground)] leading-relaxed mt-auto">
        {blurb}
      </p>
      {href && (
        <p className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-primary)] font-bold mt-1 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
          Open detail
          <span aria-hidden>→</span>
        </p>
      )}
    </>
  );
  const className = `card-elevated card-accent-${accent} p-5 space-y-3 flex flex-col ${
    href ? "group cursor-pointer hover:border-[color:var(--color-border-strong)]" : ""
  }`;
  if (href) {
    return (
      <Link to={href} className={className}>
        {body}
      </Link>
    );
  }
  return <article className={className}>{body}</article>;
}

