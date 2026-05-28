import { useMemo } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";
import {
  useCandidateRuns,
  useConstituencies,
  useConstituencySummary,
  useDistrictVoters2026,
  useElections,
  useKnownNominees2026,
  useNotableDisqualifications,
  type CandidateRun,
} from "@/lib/data";
import { getCandidateField2026, getParty } from "@/lib/parties";
import { useDocumentMeta } from "@/lib/seo";
import { cn, formatNumber, formatPercent } from "@/lib/utils";

const SECTION_META: Record<
  string,
  { title: string; description: string }
> = {
  constituencies: {
    title: "GB constituencies — all 24 seats, GBA-1 to GBA-24 | gbelections.com",
    description:
      "Every Gilgit-Baltistan constituency: district, registered voters, 2020 winner, 2026 nominees. Click any seat for full profile.",
  },
  candidates: {
    title: "GB 2026 candidates list — 75 verified nominees | gbelections.com",
    description:
      "Every verified 2026 candidate for the Gilgit-Baltistan Assembly election, grouped by constituency. Party tag + source on every entry.",
  },
  parties: {
    title: "Political parties on the 2026 GB ballot | gbelections.com",
    description:
      "Every party contesting the 2026 GB Assembly election: PPP, PML-N, MWM, IPP, JUI-F, JI, and more. Election symbols, ECP codes, 2026 candidate counts.",
  },
  "old-results": {
    title: "GB election historical results — 2009, 2015, 2020 | gbelections.com",
    description:
      "Winners and runners-up of every Gilgit-Baltistan Assembly election since 2009. Per-seat vote counts and margins. Source-traceable open data.",
  },
  "voting-stations": {
    title: "GB polling-day logistics — 2,220 stations | gbelections.com",
    description:
      "Polling-day footprint for the 2026 GB Assembly election: 2,220 stations across 24 seats, 774,319 registered voters, all-cycle logistics comparison.",
  },
  "polling-stations": {
    title: "Polling stations per GB seat — 2026 estimates | gbelections.com",
    description:
      "Per-constituency polling-station estimate for the 2026 GB Assembly election, derived from each seat's share of the 2020 voter roll.",
  },
  voters: {
    title: "GB district voter roll 2026 — 774,319 voters | gbelections.com",
    description:
      "District-level registered voters for the 2026 GB Assembly election from Vision Gilgit Baltistan. Male and female split per district.",
  },
};

// Section catalogue. The URL slug drives which sub-view renders; if no slug
// is present we show the index grid with all 7 tiles. Each entry carries a
// short description rendered on the index card so the records hub doubles as
// a sitemap for every dataset on the dashboard.
const SECTIONS = [
  {
    slug: "constituencies",
    label: "Constituency-wise",
    blurb:
      "All 24 general seats with district, 2020 registered roll, 2020 winner, and 2026 candidate count.",
    accent: "card-accent-green" as const,
  },
  {
    slug: "candidates",
    label: "Candidate-wise",
    blurb:
      "The 75 verified 2026 nominees, grouped by seat, with party tag and source note.",
    accent: "card-accent-gold" as const,
  },
  {
    slug: "parties",
    label: "Party-wise",
    blurb:
      "Every party on the 2026 ballot with election symbol, candidate count, and a link through to its full profile.",
    accent: "card-accent-red" as const,
  },
  {
    slug: "old-results",
    label: "Old results",
    blurb:
      "Winners and runners-up from the 2009, 2015, and 2020 GB Assembly elections, drawn from the cleaned dataset.",
    accent: "card-accent-green" as const,
  },
  {
    slug: "voting-stations",
    label: "Voting stations",
    blurb:
      "Polling-day footprint: total stations, average voters per station, and 2026 vs 2020 logistics ratios.",
    accent: "card-accent-gold" as const,
  },
  {
    slug: "polling-stations",
    label: "Polling stations",
    blurb:
      "Per-constituency polling-station estimates derived from each seat's share of the 2020 voter roll.",
    accent: "card-accent-red" as const,
  },
  {
    slug: "voters",
    label: "Voters",
    blurb:
      "District-level registered voters for 2026, with male and female split, per the Vision Gilgit Baltistan roll.",
    accent: "card-accent-green" as const,
  },
];

type SectionSlug = (typeof SECTIONS)[number]["slug"];

const VALID_SLUGS = new Set<string>(SECTIONS.map((s) => s.slug));

function isSectionSlug(value: string | undefined): value is SectionSlug {
  return value != null && VALID_SLUGS.has(value);
}

/**
 * Returns the props to spread on a <tr> so the whole row behaves as a link.
 * Adds mouse click, keyboard activation (Enter / Space), a pointer cursor,
 * and the right ARIA role + label for screen readers. Used by every table
 * inside the Records page so a click anywhere on a row navigates to the
 * relevant detail page.
 */
function useRowNav(to: string, ariaLabel: string) {
  const navigate = useNavigate();
  return {
    onClick: () => navigate(to),
    onKeyDown: (e: React.KeyboardEvent<HTMLTableRowElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        navigate(to);
      }
    },
    role: "link" as const,
    tabIndex: 0,
    "aria-label": ariaLabel,
    className: "cursor-pointer",
  };
}

export function RecordsPage() {
  const { section } = useParams<{ section?: string }>();
  const active: SectionSlug | null = isSectionSlug(section) ? section : null;

  const meta = active
    ? SECTION_META[active]
    : {
        title: "Records hub — every GB election dataset in one place | gbelections.com",
        description:
          "All seven Gilgit-Baltistan election datasets: constituencies, candidates, parties, historical results, voting stations, polling stations, voters. One click each.",
      };
  useDocumentMeta({
    title: meta.title,
    description: meta.description,
    path: active ? `/records/${active}` : "/records",
  });

  return (
    <div className="space-y-10 max-w-6xl">
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
              Records
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.05]">
            Every record on this dashboard, in one place
          </h1>
          <p className="text-[color:var(--color-muted-foreground)] text-base sm:text-lg max-w-2xl leading-relaxed">
            One hub for the seven data slices we publish: constituencies,
            candidates, parties, old results, voting stations, polling
            stations, and voters. Pick a section below; every figure is
            traceable to a source.
          </p>
        </div>
      </header>

      {/* Section sub-nav. URL-driven so each tab has a shareable link. */}
      <nav
        className="-mx-1 flex flex-wrap gap-1.5 sm:gap-2 text-sm"
        aria-label="Records sections"
      >
        <NavLink
          to="/records"
          end
          className={({ isActive }) =>
            cn(
              "px-3 py-1.5 rounded-md border whitespace-nowrap transition-colors font-semibold tracking-wide",
              isActive
                ? "border-[color:var(--color-accent-gold)] bg-[color:var(--color-accent-gold-soft)] text-[color:var(--color-foreground)]"
                : "border-[color:var(--color-border)] text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)] hover:border-[color:var(--color-border-strong)]",
            )
          }
        >
          Overview
        </NavLink>
        {SECTIONS.map((s) => (
          <NavLink
            key={s.slug}
            to={`/records/${s.slug}`}
            className={({ isActive }) =>
              cn(
                "px-3 py-1.5 rounded-md border whitespace-nowrap transition-colors font-semibold tracking-wide",
                isActive
                  ? "border-[color:var(--color-accent-gold)] bg-[color:var(--color-accent-gold-soft)] text-[color:var(--color-foreground)]"
                  : "border-[color:var(--color-border)] text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)] hover:border-[color:var(--color-border-strong)]",
              )
            }
          >
            {s.label}
          </NavLink>
        ))}
      </nav>

      {active === null && <OverviewIndex />}
      {active === "constituencies" && <ConstituenciesSection />}
      {active === "candidates" && <CandidatesSection />}
      {active === "parties" && <PartiesSection />}
      {active === "old-results" && <OldResultsSection />}
      {active === "voting-stations" && <VotingStationsSection />}
      {active === "polling-stations" && <PollingStationsSection />}
      {active === "voters" && <VotersSection />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section 0 — Overview tile grid                                       */
/* ------------------------------------------------------------------ */

function OverviewIndex() {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
          Choose a section
        </p>
        <h2 className="font-display text-2xl sm:text-3xl">
          Seven datasets, each one click away
        </h2>
      </div>
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s, i) => (
          <Link
            key={s.slug}
            to={`/records/${s.slug}`}
            className={cn(
              "card-elevated p-5 sm:p-6 space-y-3 relative top-edge group",
              s.accent,
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[color:var(--color-accent-gold)]">
                {String(i + 1).padStart(2, "0")} · {s.label}
              </span>
              <span
                aria-hidden
                className="text-[color:var(--color-muted-foreground)] group-hover:text-[color:var(--color-foreground)] transition-transform group-hover:translate-x-0.5"
              >
                →
              </span>
            </div>
            <p className="text-sm text-[color:var(--color-foreground)]/80 leading-relaxed">
              {s.blurb}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section 1 — Constituencies                                           */
/* ------------------------------------------------------------------ */

function ConstituenciesSection() {
  const constituenciesQ = useConstituencies();
  const summaryQ = useConstituencySummary();
  const runsQ = useCandidateRuns();
  const nomineesQ = useKnownNominees2026();

  const constituencies = constituenciesQ.data ?? [];
  const summary2020 = (summaryQ.data ?? []).filter(
    (s) => Number(s.election_year) === 2020,
  );
  const summaryByCz = new Map(summary2020.map((s) => [s.constituency_id, s]));
  const winners2020 = new Map<string, CandidateRun>();
  for (const r of runsQ.data ?? []) {
    if (Number(r.election_year) === 2020 && r.rank === 1) {
      winners2020.set(r.constituency_id, r);
    }
  }
  const nomineeCountByCz = new Map<string, number>();
  for (const n of nomineesQ.data ?? []) {
    nomineeCountByCz.set(
      n.constituency_id,
      (nomineeCountByCz.get(n.constituency_id) ?? 0) + 1,
    );
  }

  const rows = constituencies.slice().sort((a, b) => {
    const ai = parseInt(a.constituency_id.split("-")[1], 10);
    const bi = parseInt(b.constituency_id.split("-")[1], 10);
    return ai - bi;
  });

  return (
    <SectionShell
      eyebrow="Constituency-wise"
      title="24 general seats at a glance"
      caption="Tap any card to open that seat's full constituency profile."
    >
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((c) => {
          const s = summaryByCz.get(c.constituency_id);
          const w = winners2020.get(c.constituency_id);
          const wParty = w ? getParty(w.party) : null;
          const n = nomineeCountByCz.get(c.constituency_id) ?? 0;
          return (
            <Link
              key={c.constituency_id}
              to={`/constituency/${c.constituency_id}`}
              aria-label={`Open ${c.constituency_id} ${c.name} constituency profile`}
              className="card-elevated card-accent-green p-4 sm:p-5 space-y-3 relative top-edge block group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono font-semibold text-[color:var(--color-foreground)] group-hover:text-[color:var(--color-primary)] transition-colors">
                    {c.constituency_id}
                  </p>
                  <p className="text-sm font-display leading-tight truncate">
                    {c.name}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
                  {c.district}
                </span>
              </div>
              <dl className="space-y-1.5 text-[12px]">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-[color:var(--color-muted-foreground)] uppercase tracking-[0.14em] text-[10px]">
                    Registered 2020
                  </dt>
                  <dd className="font-mono tabular">
                    {s?.registered_voters != null
                      ? formatNumber(s.registered_voters)
                      : "—"}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-[color:var(--color-muted-foreground)] uppercase tracking-[0.14em] text-[10px]">
                    2020 winner
                  </dt>
                  <dd className="text-right min-w-0">
                    {w && wParty ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="truncate max-w-[140px]">
                          {w.candidate_name}
                        </span>
                        <span
                          className="text-[10px] font-bold uppercase tracking-[0.16em]"
                          style={{ color: wParty.color }}
                        >
                          {wParty.shortDisplay}
                        </span>
                      </span>
                    ) : (
                      <span className="text-[color:var(--color-muted-foreground)]">
                        —
                      </span>
                    )}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-[color:var(--color-muted-foreground)] uppercase tracking-[0.14em] text-[10px]">
                    2026 nominees
                  </dt>
                  <dd className="font-mono tabular font-semibold">{n}</dd>
                </div>
              </dl>
              <p className="pt-1 text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)] group-hover:text-[color:var(--color-primary)] transition-colors inline-flex items-center gap-1">
                Open seat profile
                <span
                  aria-hidden
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </p>
            </Link>
          );
        })}
      </div>
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/* Section 2 — Candidates (2026 nominees grouped by seat)               */
/* ------------------------------------------------------------------ */

function CandidatesSection() {
  const nomineesQ = useKnownNominees2026();
  const nominees = nomineesQ.data ?? [];

  const grouped = useMemo(() => {
    const map = new Map<string, typeof nominees>();
    for (const n of nominees) {
      const list = map.get(n.constituency_id) ?? [];
      list.push(n);
      map.set(n.constituency_id, list);
    }
    return Array.from(map.entries()).sort((a, b) => {
      const ai = parseInt(a[0].split("-")[1], 10);
      const bi = parseInt(b[0].split("-")[1], 10);
      return ai - bi;
    });
  }, [nominees]);

  return (
    <SectionShell
      eyebrow="Candidate-wise"
      title={`${nominees.length} verified 2026 nominees across 24 seats`}
      caption="PTI is not on the 2026 ballot; its allotted ticket-holders contest as Independents or under the MWM flagship."
    >
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
        {grouped.map(([cz, list]) => (
          <Link
            key={cz}
            to={`/constituency/${cz}`}
            aria-label={`Open ${cz} constituency profile`}
            className="card-elevated card-accent-gold p-4 sm:p-5 space-y-3 relative top-edge block group"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-mono font-semibold text-[color:var(--color-foreground)] group-hover:text-[color:var(--color-accent-gold)] transition-colors">
                {cz}
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
                {list.length} nominee{list.length === 1 ? "" : "s"}
              </span>
            </div>
            <ul className="space-y-2">
              {list.map((n) => {
                const meta = getParty(n.party);
                return (
                  <li
                    key={`${n.constituency_id}-${n.candidate_name}`}
                    className="flex items-start justify-between gap-3"
                  >
                    <span className="text-sm leading-snug">
                      {n.candidate_name}
                    </span>
                    <span
                      className="shrink-0 text-[10px] font-bold uppercase tracking-[0.18em]"
                      style={{ color: meta.color }}
                    >
                      {meta.shortDisplay}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="pt-1 text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)] group-hover:text-[color:var(--color-accent-gold)] transition-colors inline-flex items-center gap-1">
              Open seat profile
              <span
                aria-hidden
                className="transition-transform group-hover:translate-x-0.5"
              >
                →
              </span>
            </p>
          </Link>
        ))}
      </div>
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/* Section 3 — Parties                                                  */
/* ------------------------------------------------------------------ */

function PartiesSection() {
  const field = useMemo(() => getCandidateField2026(), []);

  return (
    <SectionShell
      eyebrow="Party-wise"
      title="Every party on the 2026 ballot"
      caption="Click a row to open the full party profile with historical wins, 2026 ticket holders, and per-seat vote share."
    >
      <div className="overflow-x-auto rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/40">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)] border-b border-[color:var(--color-border)]">
              <th className="px-4 py-3 font-medium">Party</th>
              <th className="px-4 py-3 font-medium">Full name</th>
              <th className="px-4 py-3 font-medium">Symbol</th>
              <th className="px-4 py-3 font-medium text-right">
                2026 candidates
              </th>
              <th className="px-4 py-3 font-medium text-right">ECP code</th>
            </tr>
          </thead>
          <tbody>
            {field.map((p) => {
              const meta = getParty(p.id);
              return (
                <PartyRow key={p.id} party={meta} count={p.candidates2026 ?? 0} />
              );
            })}
          </tbody>
        </table>
      </div>
    </SectionShell>
  );
}

/** One row of the parties table, wired so a click anywhere on the row
 * routes to that party's profile. Kept as its own component so the
 * onClick / keyboard handler can be attached cleanly without polluting
 * the .map() in PartiesSection. */
function PartyRow({
  party,
  count,
}: {
  party: ReturnType<typeof getParty>;
  count: number;
}) {
  const nav = useRowNav(
    `/party/${encodeURIComponent(party.id)}`,
    `Open ${party.display} party profile`,
  );
  return (
    <tr
      {...nav}
      className={`${nav.className} border-b border-[color:var(--color-border)] last:border-b-0 hover:bg-[color:var(--color-muted)]/30 transition-colors`}
    >
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-2">
          <img
            src={party.flag}
            alt=""
            width="28"
            height="18"
            className="party-flag"
            loading="lazy"
            decoding="async"
          />
          <span
            className="font-mono font-semibold"
            style={{ color: party.color }}
          >
            {party.shortDisplay}
          </span>
        </span>
      </td>
      <td className="px-4 py-3 text-[color:var(--color-muted-foreground)]">
        {party.display}
      </td>
      <td className="px-4 py-3">
        {party.electionSymbol ? (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="text-base">
              {party.electionSymbolIcon ?? "•"}
            </span>
            <span className="text-xs">{party.electionSymbol}</span>
          </span>
        ) : (
          <span className="text-[color:var(--color-muted-foreground)]">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-right font-mono tabular font-semibold">
        {count}
      </td>
      <td className="px-4 py-3 text-right font-mono tabular text-[color:var(--color-muted-foreground)]">
        {party.electionSymbolCode ?? "—"}
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/* Section 4 — Old results (2009, 2015, 2020 winners + runners-up)      */
/* ------------------------------------------------------------------ */

function OldResultsSection() {
  const runsQ = useCandidateRuns();
  const constituenciesQ = useConstituencies();
  const disqsQ = useNotableDisqualifications();

  const runs = runsQ.data ?? [];
  const constituencies = constituenciesQ.data ?? [];
  const disqs = disqsQ.data ?? [];
  const czName = new Map(
    constituencies.map((c) => [c.constituency_id, c.name] as const),
  );

  const yearGrouped = useMemo(() => {
    const map = new Map<number, CandidateRun[]>();
    for (const r of runs) {
      const y = Number(r.election_year);
      if (![2009, 2015, 2020].includes(y)) continue;
      if (r.rank !== 1 && r.rank !== 2) continue;
      const list = map.get(y) ?? [];
      list.push(r);
      map.set(y, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [runs]);

  return (
    <SectionShell
      eyebrow="Old results"
      title="Historical winners and runners-up, 2009 to 2020"
      caption="Three GB Assembly cycles. The 2020 record drives the model and the per-seat margin chart."
    >
      <div className="space-y-8">
        {yearGrouped.map(([year, list]) => {
          const byCz = new Map<string, { winner?: CandidateRun; runnerUp?: CandidateRun }>();
          for (const r of list) {
            const entry = byCz.get(r.constituency_id) ?? {};
            if (r.rank === 1) entry.winner = r;
            else if (r.rank === 2) entry.runnerUp = r;
            byCz.set(r.constituency_id, entry);
          }
          const ordered = Array.from(byCz.entries()).sort((a, b) => {
            const ai = parseInt(a[0].split("-")[1], 10);
            const bi = parseInt(b[0].split("-")[1], 10);
            return ai - bi;
          });
          return (
            <div key={year} className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-2xl">{year} general election</h3>
                <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
                  {ordered.length} seats
                </span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/40">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)] border-b border-[color:var(--color-border)]">
                      <th className="px-4 py-3 font-medium">Seat</th>
                      <th className="px-4 py-3 font-medium">Winner</th>
                      <th className="px-4 py-3 font-medium text-right">
                        Winner votes
                      </th>
                      <th className="px-4 py-3 font-medium">Runner-up</th>
                      <th className="px-4 py-3 font-medium text-right">
                        Runner-up votes
                      </th>
                      <th className="px-4 py-3 font-medium text-right">
                        Margin
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordered.map(([cz, { winner, runnerUp }]) => (
                      <OldResultRow
                        key={`${year}-${cz}`}
                        cz={cz}
                        czName={czName.get(cz) ?? ""}
                        winner={winner}
                        runnerUp={runnerUp}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {disqs.length > 0 && (
          <section className="card-elevated card-accent-red p-5 space-y-2 relative top-edge">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[color:var(--color-accent-red)]">
              Notable post-2020 disqualifications
            </p>
            <ul className="space-y-2 text-sm">
              {disqs.map((d, i) => (
                <li key={i} className="leading-relaxed">
                  <span className="font-medium">{d.candidate_name}</span> ·{" "}
                  <span className="text-[color:var(--color-muted-foreground)]">
                    {d.constituency_id_2020} ·{" "}
                    {d.party_at_disqualification} · disqualified{" "}
                    {d.year_disqualified}. {d.impact_2026}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </SectionShell>
  );
}

/** One row of an old-results table. Click anywhere → constituency profile. */
function OldResultRow({
  cz,
  czName,
  winner,
  runnerUp,
}: {
  cz: string;
  czName: string;
  winner?: CandidateRun;
  runnerUp?: CandidateRun;
}) {
  const nav = useRowNav(
    `/constituency/${cz}`,
    `Open ${cz} ${czName} constituency profile`,
  );
  const wParty = winner ? getParty(winner.party) : null;
  const rParty = runnerUp ? getParty(runnerUp.party) : null;
  const margin =
    winner?.votes != null && runnerUp?.votes != null
      ? winner.votes - runnerUp.votes
      : null;
  return (
    <tr
      {...nav}
      className={`${nav.className} border-b border-[color:var(--color-border)] last:border-b-0 hover:bg-[color:var(--color-muted)]/30 transition-colors`}
    >
      <td className="px-4 py-3">
        <span className="inline-flex flex-col">
          <span className="font-mono font-semibold">{cz}</span>
          <span className="text-[11px] text-[color:var(--color-muted-foreground)]">
            {czName}
          </span>
        </span>
      </td>
      <td className="px-4 py-3">
        {winner ? (
          <div className="flex flex-col">
            <span>{winner.candidate_name}</span>
            {wParty && (
              <span
                className="text-[11px] font-bold uppercase tracking-[0.18em]"
                style={{ color: wParty.color }}
              >
                {wParty.shortDisplay}
              </span>
            )}
          </div>
        ) : (
          <span className="text-[color:var(--color-muted-foreground)]">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-right font-mono tabular">
        {winner?.votes != null ? formatNumber(winner.votes) : "—"}
      </td>
      <td className="px-4 py-3">
        {runnerUp ? (
          <div className="flex flex-col">
            <span>{runnerUp.candidate_name}</span>
            {rParty && (
              <span
                className="text-[11px] font-bold uppercase tracking-[0.18em]"
                style={{ color: rParty.color }}
              >
                {rParty.shortDisplay}
              </span>
            )}
          </div>
        ) : (
          <span className="text-[color:var(--color-muted-foreground)]">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-right font-mono tabular text-[color:var(--color-muted-foreground)]">
        {runnerUp?.votes != null ? formatNumber(runnerUp.votes) : "—"}
      </td>
      <td className="px-4 py-3 text-right font-mono tabular font-semibold">
        {margin != null ? formatNumber(margin) : "—"}
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/* Section 5 — Voting stations (logistics overview)                     */
/* ------------------------------------------------------------------ */

function VotingStationsSection() {
  const electionsQ = useElections();
  const elections = electionsQ.data ?? [];
  const e2026 = elections.find((e) => e.year === 2026) ?? null;
  const e2020 = elections.find((e) => e.year === 2020) ?? null;
  const e2015 = elections.find((e) => e.year === 2015) ?? null;
  const e2009 = elections.find((e) => e.year === 2009) ?? null;

  const stations2026 = e2026?.polling_stations ?? null;
  const stations2020 = e2020?.polling_stations ?? null;
  const reg2026 = e2026?.registered_voters ?? null;
  const reg2020 = e2020?.registered_voters ?? null;
  const votersPerStation2026 =
    stations2026 && reg2026 ? Math.round(reg2026 / stations2026) : null;
  const votersPerStation2020 =
    stations2020 && reg2020 ? Math.round(reg2020 / stations2020) : null;

  return (
    <SectionShell
      eyebrow="Voting stations"
      title="Polling-day footprint at a glance"
      caption="The ECGB plans 2,220 stations across the 24 general seats for 7 June 2026."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <article className="card-elevated card-accent-gold p-5 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
            Stations · 2026
          </p>
          <p className="stat-display text-4xl">
            {stations2026 ? formatNumber(stations2026) : "…"}
          </p>
          <p className="text-xs text-[color:var(--color-muted-foreground)]">
            ECGB planning figure across the 24 general seats.
          </p>
        </article>
        <article className="card-elevated card-accent-green p-5 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
            Voters per station · 2026
          </p>
          <p className="stat-display text-4xl">
            {votersPerStation2026
              ? formatNumber(votersPerStation2026)
              : "…"}
          </p>
          <p className="text-xs text-[color:var(--color-muted-foreground)]">
            Pakistan-wide guidance targets ~1,000 voters per station.
          </p>
        </article>
        <article className="card-elevated card-accent-green p-5 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
            Stations · 2020
          </p>
          <p className="stat-display text-4xl">
            {stations2020 ? formatNumber(stations2020) : "—"}
          </p>
          <p className="text-xs text-[color:var(--color-muted-foreground)]">
            Last-cycle baseline. Voters per station then:{" "}
            {votersPerStation2020 ? formatNumber(votersPerStation2020) : "—"}.
          </p>
        </article>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/40 mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)] border-b border-[color:var(--color-border)]">
              <th className="px-4 py-3 font-medium">Cycle</th>
              <th className="px-4 py-3 font-medium">Poll date</th>
              <th className="px-4 py-3 font-medium">Federal incumbent</th>
              <th className="px-4 py-3 font-medium text-right">
                Registered voters
              </th>
              <th className="px-4 py-3 font-medium text-right">
                Polling stations
              </th>
              <th className="px-4 py-3 font-medium text-right">Turnout</th>
            </tr>
          </thead>
          <tbody>
            {[e2009, e2015, e2020, e2026]
              .filter((e): e is NonNullable<typeof e> => e != null)
              .map((e) => (
                <tr
                  key={e.year}
                  className="border-b border-[color:var(--color-border)] last:border-b-0"
                >
                  <td className="px-4 py-3 font-mono font-semibold">
                    {e.year}
                  </td>
                  <td className="px-4 py-3 text-[color:var(--color-muted-foreground)]">
                    {e.poll_date ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-[color:var(--color-muted-foreground)]">
                    {e.ruling_party_centre ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular">
                    {e.registered_voters != null
                      ? formatNumber(e.registered_voters)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular">
                    {e.polling_stations != null
                      ? formatNumber(e.polling_stations)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular text-[color:var(--color-muted-foreground)]">
                    {e.turnout_pct != null
                      ? formatPercent(e.turnout_pct)
                      : "—"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/* Section 6 — Polling stations (per-constituency allocation)           */
/* ------------------------------------------------------------------ */

function PollingStationsSection() {
  const constituenciesQ = useConstituencies();
  const summaryQ = useConstituencySummary();
  const electionsQ = useElections();

  const constituencies = constituenciesQ.data ?? [];
  const summary2020 = (summaryQ.data ?? []).filter(
    (s) => Number(s.election_year) === 2020,
  );
  const election2026 = electionsQ.data?.find((e) => e.year === 2026) ?? null;
  const totalStations2026 = election2026?.polling_stations ?? null;
  const totalSummary2020Registered = summary2020.reduce(
    (s, x) => s + (x.registered_voters ?? 0),
    0,
  );
  const summaryByCz = new Map(summary2020.map((s) => [s.constituency_id, s]));

  const rows = constituencies
    .map((c) => {
      const s = summaryByCz.get(c.constituency_id);
      const reg = s?.registered_voters ?? null;
      const share =
        totalSummary2020Registered > 0 && reg != null
          ? reg / totalSummary2020Registered
          : null;
      const estStations =
        share != null && totalStations2026 != null
          ? Math.round(share * totalStations2026)
          : null;
      return {
        constituency_id: c.constituency_id,
        name: c.name,
        district: c.district,
        reg,
        share,
        estStations,
      };
    })
    .sort((a, b) => {
      const ai = parseInt(a.constituency_id.split("-")[1], 10);
      const bi = parseInt(b.constituency_id.split("-")[1], 10);
      return ai - bi;
    });

  return (
    <SectionShell
      eyebrow="Polling stations"
      title="Per-constituency 2026 station estimate"
      caption="Each seat's share of the 2020 voter roll, scaled to the 2,220-station ECGB planning total. Swap in Form-21 once the ECGB publishes the official allocation."
    >
      <div className="overflow-x-auto rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/40">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)] border-b border-[color:var(--color-border)]">
              <th className="px-4 py-3 font-medium">Seat</th>
              <th className="px-4 py-3 font-medium">District</th>
              <th className="px-4 py-3 font-medium text-right">
                Registered 2020
              </th>
              <th className="px-4 py-3 font-medium text-right">
                Share of roll
              </th>
              <th className="px-4 py-3 font-medium text-right">
                Est. stations 2026
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <PollingStationRow key={r.constituency_id} {...r} />
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-[color:var(--color-muted-foreground)] mt-3">
        For the full polling-stations page with per-row notes, see{" "}
        <Link
          to="/polling-stations"
          className="underline underline-offset-4 text-[color:var(--color-primary)]"
        >
          /polling-stations
        </Link>
        .
      </p>
    </SectionShell>
  );
}

/** One row of the polling-stations table. Click anywhere → constituency profile. */
function PollingStationRow({
  constituency_id,
  name,
  district,
  reg,
  share,
  estStations,
}: {
  constituency_id: string;
  name: string;
  district: string;
  reg: number | null;
  share: number | null;
  estStations: number | null;
}) {
  const nav = useRowNav(
    `/constituency/${constituency_id}`,
    `Open ${constituency_id} ${name} constituency profile`,
  );
  return (
    <tr
      {...nav}
      className={`${nav.className} border-b border-[color:var(--color-border)] last:border-b-0 hover:bg-[color:var(--color-muted)]/30 transition-colors`}
    >
      <td className="px-4 py-3">
        <span className="inline-flex flex-col">
          <span className="font-mono font-semibold">{constituency_id}</span>
          <span className="text-[11px] text-[color:var(--color-muted-foreground)]">
            {name}
          </span>
        </span>
      </td>
      <td className="px-4 py-3 text-[color:var(--color-muted-foreground)]">
        {district}
      </td>
      <td className="px-4 py-3 text-right font-mono tabular">
        {reg != null ? formatNumber(reg) : "—"}
      </td>
      <td className="px-4 py-3 text-right font-mono tabular text-[color:var(--color-muted-foreground)]">
        {share != null ? formatPercent(share * 100) : "—"}
      </td>
      <td className="px-4 py-3 text-right font-mono tabular font-semibold">
        {estStations != null ? formatNumber(estStations) : "—"}
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/* Section 7 — Voters (district roll)                                   */
/* ------------------------------------------------------------------ */

function VotersSection() {
  const districtVotersQ = useDistrictVoters2026();
  const districtVoters = districtVotersQ.data ?? [];
  const rows = districtVoters
    .slice()
    .sort((a, b) => b.total_voters_2026 - a.total_voters_2026);
  const totals = rows.reduce(
    (acc, r) => {
      acc.total += r.total_voters_2026;
      acc.female += r.female_voters_2026;
      acc.male += r.male_voters_2026;
      return acc;
    },
    { total: 0, female: 0, male: 0 },
  );

  return (
    <SectionShell
      eyebrow="Voters"
      title="District-level registered voters for 2026"
      caption="Sourced from the Vision Gilgit Baltistan district roll. Totals reconcile against the GB-wide registered_voters figure."
    >
      <div className="overflow-x-auto rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/40">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)] border-b border-[color:var(--color-border)]">
              <th className="px-4 py-3 font-medium">District</th>
              <th className="px-4 py-3 font-medium text-right">
                Total voters
              </th>
              <th className="px-4 py-3 font-medium text-right">Female</th>
              <th className="px-4 py-3 font-medium text-right">Female %</th>
              <th className="px-4 py-3 font-medium text-right">Male</th>
              <th className="px-4 py-3 font-medium text-right">Male %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const femalePct = r.total_voters_2026
                ? (r.female_voters_2026 / r.total_voters_2026) * 100
                : null;
              const malePct = r.total_voters_2026
                ? (r.male_voters_2026 / r.total_voters_2026) * 100
                : null;
              return (
                <tr
                  key={r.district}
                  className="border-b border-[color:var(--color-border)] last:border-b-0 hover:bg-[color:var(--color-muted)]/30 transition-colors"
                >
                  <td className="px-4 py-3">{r.district}</td>
                  <td className="px-4 py-3 text-right font-mono tabular font-semibold">
                    {formatNumber(r.total_voters_2026)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular">
                    {formatNumber(r.female_voters_2026)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular text-[color:var(--color-muted-foreground)]">
                    {femalePct != null ? formatPercent(femalePct) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular">
                    {formatNumber(r.male_voters_2026)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular text-[color:var(--color-muted-foreground)]">
                    {malePct != null ? formatPercent(malePct) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[color:var(--color-border-strong)] font-semibold">
              <td className="px-4 py-3">All districts</td>
              <td className="px-4 py-3 text-right font-mono tabular">
                {formatNumber(totals.total)}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular">
                {formatNumber(totals.female)}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular text-[color:var(--color-muted-foreground)]">
                {totals.total
                  ? formatPercent((totals.female / totals.total) * 100)
                  : "—"}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular">
                {formatNumber(totals.male)}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular text-[color:var(--color-muted-foreground)]">
                {totals.total
                  ? formatPercent((totals.male / totals.total) * 100)
                  : "—"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-[11px] text-[color:var(--color-muted-foreground)] mt-3">
        For the per-constituency voter projection (district roll distributed
        proportionally across each seat) see{" "}
        <Link
          to="/voters"
          className="underline underline-offset-4 text-[color:var(--color-primary)]"
        >
          /voters
        </Link>
        .
      </p>
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/* Shared section shell                                                 */
/* ------------------------------------------------------------------ */

interface SectionShellProps {
  eyebrow: string;
  title: string;
  caption?: string;
  children: React.ReactNode;
}

function SectionShell({ eyebrow, title, caption, children }: SectionShellProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
          {eyebrow}
        </p>
        <h2 className="font-display text-2xl sm:text-3xl">{title}</h2>
        {caption && (
          <p className="text-sm text-[color:var(--color-muted-foreground)] max-w-3xl leading-relaxed">
            {caption}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}
