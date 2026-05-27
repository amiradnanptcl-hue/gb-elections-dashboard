import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  useCandidateRuns,
  useConstituencies,
  useConstituencySummary,
  useDistrictVoters2026,
  useElections,
} from "@/lib/data";
import { formatNumber, formatPercent } from "@/lib/utils";

export function VotersPage() {
  const constituenciesQ = useConstituencies();
  const summaryQ = useConstituencySummary();
  const electionsQ = useElections();
  const runsQ = useCandidateRuns();
  const districtVotersQ = useDistrictVoters2026();

  const constituencies = constituenciesQ.data ?? [];
  const districtVoters = districtVotersQ.data ?? [];
  const districtVotersByDistrict = new Map(
    districtVoters.map((d) => [d.district, d] as const),
  );
  // election_year may arrive as a string from JSON; coerce before comparing.
  const summary2020 = (summaryQ.data ?? []).filter(
    (s) => Number(s.election_year) === 2020,
  );
  // Fill in turnout from candidate vote totals where the source summary
  // table left the cell blank (e.g. GBA-1 and GBA-5 on Wikipedia's 2020 page).
  const runs2020 = (runsQ.data ?? []).filter((r) => r.election_year === 2020);
  const candidateVotesByCz = new Map<string, number>();
  for (const r of runs2020) {
    if (r.votes != null) {
      candidateVotesByCz.set(
        r.constituency_id,
        (candidateVotesByCz.get(r.constituency_id) ?? 0) + r.votes,
      );
    }
  }
  const election2020 = electionsQ.data?.find((e) => e.year === 2020);
  const election2026 = electionsQ.data?.find((e) => e.year === 2026);

  const totalRegistered2020 = election2020?.registered_voters ?? null;
  const totalRegistered2026 = election2026?.registered_voters ?? null;
  const totalStations2026 = election2026?.polling_stations ?? null;

  // Growth factor used only as a fallback when the Vision GB district roll
  // is missing for a constituency. Primary estimation uses district-
  // proportional allocation, which is the truer signal because district
  // totals are now sourced from the official Vision Gilgit Baltistan
  // portal.
  const fallbackGrowthFactor =
    totalRegistered2026 && totalRegistered2020
      ? totalRegistered2026 / totalRegistered2020
      : 1.039;

  const summaryByCz = new Map(summary2020.map((s) => [s.constituency_id, s]));

  // Compute the 2020 share of each constituency's roll — used for both the
  // 2026 voter estimate and the polling-station estimate.
  const totalSummary2020Registered = summary2020.reduce(
    (s, x) => s + (x.registered_voters ?? 0),
    0,
  );

  // For district-proportional allocation we need each constituency's share
  // of its DISTRICT's 2020 registered voters. That lets us distribute the
  // district's 2026 roll across its constituencies without assuming an
  // identical growth rate everywhere.
  const district2020Total = new Map<string, number>();
  for (const c of constituencies) {
    const s = summaryByCz.get(c.constituency_id);
    if (s?.registered_voters != null) {
      district2020Total.set(
        c.district,
        (district2020Total.get(c.district) ?? 0) + s.registered_voters,
      );
    }
  }

  const rows = useMemo(
    () =>
      constituencies
        .map((c) => {
          const s = summaryByCz.get(c.constituency_id);
          const registered2020 = s?.registered_voters ?? null;
          const share =
            totalSummary2020Registered > 0 && registered2020 != null
              ? registered2020 / totalSummary2020Registered
              : null;
          // District-proportional 2026 estimate: take the constituency's
          // share of its district's 2020 roll and apply it to the
          // district's published 2026 total. Fall back to the GB-wide
          // growth factor only when the district roll is unavailable.
          const districtRow = districtVotersByDistrict.get(c.district);
          const districtTotal2020 =
            district2020Total.get(c.district) ?? null;
          let estRegistered2026: number | null = null;
          if (
            districtRow &&
            districtTotal2020 &&
            districtTotal2020 > 0 &&
            registered2020 != null
          ) {
            const shareWithinDistrict = registered2020 / districtTotal2020;
            estRegistered2026 = Math.round(
              shareWithinDistrict * districtRow.total_voters_2026,
            );
          } else if (registered2020 != null) {
            estRegistered2026 = Math.round(
              registered2020 * fallbackGrowthFactor,
            );
          }
          const estStations =
            share != null && totalStations2026 != null
              ? Math.max(1, Math.round(share * totalStations2026))
              : null;
          const derivedVotes =
            candidateVotesByCz.get(c.constituency_id) ?? null;
          const turnoutFromSource = s?.turnout_pct ?? null;
          const turnoutDerived =
            turnoutFromSource == null && registered2020 && derivedVotes != null
              ? (derivedVotes / registered2020) * 100
              : null;
          return {
            constituency_id: c.constituency_id,
            name: c.name,
            district: c.district,
            registered2020,
            estRegistered2026,
            turnout2020: turnoutFromSource ?? turnoutDerived,
            estStations,
            searchKey:
              `${c.constituency_id} ${c.name} ${c.district}`.toLowerCase(),
          };
        })
        .sort((a, b) => {
          const ai = parseInt(a.constituency_id.split("-")[1], 10);
          const bi = parseInt(b.constituency_id.split("-")[1], 10);
          return ai - bi;
        }),
    [
      constituencies,
      summaryByCz,
      totalSummary2020Registered,
      totalStations2026,
      fallbackGrowthFactor,
      districtVotersByDistrict,
      district2020Total,
    ],
  );

  // Search state — filters by constituency id, name, or district.
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filteredRows = q
    ? rows.filter((r) => r.searchKey.includes(q))
    : rows;

  // Aggregates for the visible (filtered) set.
  const visibleTotalRegistered2026 = filteredRows.reduce(
    (s, r) => s + (r.estRegistered2026 ?? 0),
    0,
  );
  const visibleTotalStations = filteredRows.reduce(
    (s, r) => s + (r.estStations ?? 0),
    0,
  );

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
              Electoral roll
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.05]">
            Registered voters by constituency
          </h1>
          <p className="text-[color:var(--color-muted-foreground)] text-base sm:text-lg max-w-2xl leading-relaxed">
            Constituency-level aggregates only — no individual voter data is
            held or surfaced anywhere on this site. The Vision Gilgit
            Baltistan portal publishes a district-level 2026 roll totalling{" "}
            {totalRegistered2026 ? formatNumber(totalRegistered2026) : "—"}{" "}
            with male and female splits per district. Per-constituency 2026
            figures below are distributed inside each district in proportion
            to the seat's 2020 share of its district roll.
          </p>
        </div>
      </header>

      {/* Top stat strip */}
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="card-elevated card-accent-green p-5 space-y-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
            2026 registered voters
          </p>
          <p className="stat-display text-4xl">
            {totalRegistered2026 ? formatNumber(totalRegistered2026) : "…"}
          </p>
          <p className="text-xs text-[color:var(--color-muted-foreground)]">
            GB-wide total per Vision Gilgit Baltistan.
          </p>
        </article>
        <article className="card-elevated card-accent-gold p-5 space-y-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
            2020 baseline
          </p>
          <p className="stat-display text-4xl">
            {totalRegistered2020 ? formatNumber(totalRegistered2020) : "…"}
          </p>
          <p className="text-xs text-[color:var(--color-muted-foreground)]">
            ECGB 2020 roll. Used as the per-constituency anchor.
          </p>
        </article>
        <article className="card-elevated card-accent-green p-5 space-y-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
            Six-year growth
          </p>
          <p className="stat-display text-4xl">
            +{((fallbackGrowthFactor - 1) * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-[color:var(--color-muted-foreground)]">
            Compound increase from the 2020 to the 2026 roll.
          </p>
        </article>
      </section>

      {/* District-level voter roll panel, sourced from the Vision Gilgit
        Baltistan portal. Surfaces the male / female split per district so
        visitors can see the gender breakdown that the per-constituency
        table doesn't. */}
      {districtVoters.length > 0 && (
        <section className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
              District roll · 2026
            </p>
            <h2 className="font-display text-2xl sm:text-3xl">
              Voters by district, with gender split
            </h2>
            <p className="text-sm text-[color:var(--color-muted-foreground)] max-w-2xl">
              Female {formatNumber(districtVoters.reduce(
                (s, d) => s + d.female_voters_2026,
                0,
              ))}
              {" "}· male {formatNumber(districtVoters.reduce(
                (s, d) => s + d.male_voters_2026,
                0,
              ))}
              {" "}· total {formatNumber(districtVoters.reduce(
                (s, d) => s + d.total_voters_2026,
                0,
              ))}{" "}across {districtVoters.length} districts. Source: Vision
              Gilgit Baltistan portal.
            </p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)] border-b border-[color:var(--color-border)]">
                  <th className="px-4 py-3 font-medium">District</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium text-right">Female</th>
                  <th className="px-4 py-3 font-medium text-right">Male</th>
                  <th className="px-4 py-3 font-medium text-right">Female %</th>
                  <th className="px-4 py-3 font-medium text-right">Male %</th>
                </tr>
              </thead>
              <tbody>
                {[...districtVoters]
                  .sort((a, b) => b.total_voters_2026 - a.total_voters_2026)
                  .map((d) => {
                    // Compute both percentages from the same denominator so
                    // the row always sums to 100% (within rounding).
                    const femalePct =
                      (d.female_voters_2026 / d.total_voters_2026) * 100;
                    const malePct =
                      (d.male_voters_2026 / d.total_voters_2026) * 100;
                    return (
                      <tr
                        key={d.district}
                        className="border-b border-[color:var(--color-border)] last:border-b-0 hover:bg-[color:var(--color-muted)]/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold">
                          {d.district}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular font-semibold">
                          {formatNumber(d.total_voters_2026)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular text-[color:var(--color-muted-foreground)]">
                          {formatNumber(d.female_voters_2026)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular text-[color:var(--color-muted-foreground)]">
                          {formatNumber(d.male_voters_2026)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular text-[color:var(--color-muted-foreground)]">
                          {formatPercent(femalePct, 1)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular text-[color:var(--color-muted-foreground)]">
                          {formatPercent(malePct, 1)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[color:var(--color-border-strong)]">
                  <td className="px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular font-semibold">
                    {formatNumber(
                      districtVoters.reduce(
                        (s, d) => s + d.total_voters_2026,
                        0,
                      ),
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular">
                    {formatNumber(
                      districtVoters.reduce(
                        (s, d) => s + d.female_voters_2026,
                        0,
                      ),
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular">
                    {formatNumber(
                      districtVoters.reduce(
                        (s, d) => s + d.male_voters_2026,
                        0,
                      ),
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular">
                    {formatPercent(
                      (districtVoters.reduce(
                        (s, d) => s + d.female_voters_2026,
                        0,
                      ) /
                        districtVoters.reduce(
                          (s, d) => s + d.total_voters_2026,
                          0,
                        )) *
                        100,
                      1,
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular">
                    {formatPercent(
                      (districtVoters.reduce(
                        (s, d) => s + d.male_voters_2026,
                        0,
                      ) /
                        districtVoters.reduce(
                          (s, d) => s + d.total_voters_2026,
                          0,
                        )) *
                        100,
                      1,
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {/* Search */}
      <section className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
            Find a constituency
          </p>
          <h2 className="font-display text-2xl sm:text-3xl">
            Search by name, ID, or district
          </h2>
        </div>
        <div className="relative max-w-xl">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try “Skardu”, “GBA-1”, or “Diamer”"
            aria-label="Search constituencies"
            className="w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-4 py-3 pr-12 text-sm sm:text-base placeholder:text-[color:var(--color-muted-foreground)]/60 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent-gold)] focus:border-[color:var(--color-accent-gold)] transition-shadow"
          />
          <span
            aria-hidden
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--color-muted-foreground)]"
          >
            ⌕
          </span>
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)] text-xs uppercase tracking-[0.18em]"
            >
              Clear
            </button>
          )}
        </div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
          Showing {filteredRows.length} of {rows.length} constituencies
          {q
            ? ` · ${formatNumber(visibleTotalRegistered2026)} projected voters · ${formatNumber(visibleTotalStations)} estimated stations`
            : ""}
        </p>
      </section>

      {/* Table */}
      <section className="space-y-3">
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
                  Est. registered (2026)
                </th>
                <th className="px-4 py-3 font-medium text-right">
                  Est. stations
                </th>
                <th className="px-4 py-3 font-medium text-right">
                  Turnout (2020)
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-[color:var(--color-muted-foreground)]"
                  >
                    No constituency matches “{query}”.
                  </td>
                </tr>
              ) : (
                filteredRows.map((r) => (
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
                    <td className="px-4 py-3 text-right font-mono tabular font-semibold">
                      {r.estRegistered2026 != null
                        ? formatNumber(r.estRegistered2026)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular">
                      {r.estStations != null
                        ? formatNumber(r.estStations)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular text-[color:var(--color-muted-foreground)]">
                      {r.turnout2020 != null
                        ? formatPercent(r.turnout2020)
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[color:var(--color-border-strong)]">
                <td
                  colSpan={6}
                  className="px-4 py-3 text-[11px] text-[color:var(--color-muted-foreground)]"
                >
                  Aggregates only. Per CLAUDE.md no individual voter data is
                  held. 2026 figures are projected from 2020 share of the GB
                  roll scaled by the published growth rate; replace with
                  ECGB Form-21 numbers when those land.
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
