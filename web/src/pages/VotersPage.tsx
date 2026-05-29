import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  useCandidateRuns,
  useConstituencies,
  useConstituencySummary,
  useConstituencyVoters2026,
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
  const constituencyVotersQ = useConstituencyVoters2026();

  const constituencies = constituenciesQ.data ?? [];
  const districtVoters = districtVotersQ.data ?? [];
  const constituencyVoters = constituencyVotersQ.data ?? [];
  const constituencyVotersByCz = new Map(
    constituencyVoters.map((d) => [d.constituency_id, d] as const),
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

  // Growth from the 2020 roll to the 2026 ECGB Final Electoral Roll.
  // 745,362 -> 958,480 = +28.6 percent (was incorrectly +3.9 percent when we
  // were briefly using the Vision GB 774,319 number before the final roll
  // landed).
  const growthFactor =
    totalRegistered2026 && totalRegistered2020
      ? totalRegistered2026 / totalRegistered2020
      : 1.286;

  const summaryByCz = new Map(summary2020.map((s) => [s.constituency_id, s]));

  // 2020 share is used only for the polling-station estimate (ECGB has not
  // published a per-seat 2026 station allocation yet). The 2026 registered
  // voter number is now sourced directly from the ECGB per-seat roll.
  const totalSummary2020Registered = summary2020.reduce(
    (s, x) => s + (x.registered_voters ?? 0),
    0,
  );

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
          // Real per-constituency 2026 voters from the ECGB Final Electoral
          // Roll. No estimation needed — the official per-seat number is
          // what we publish.
          const cv = constituencyVotersByCz.get(c.constituency_id);
          const registered2026 = cv?.total_voters_2026 ?? null;
          const male2026 = cv?.male_voters_2026 ?? null;
          const female2026 = cv?.female_voters_2026 ?? null;
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
            registered2026,
            male2026,
            female2026,
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
      constituencyVotersByCz,
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
    (s, r) => s + (r.registered2026 ?? 0),
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
            Constituency-level aggregates only — no individual voter data
            is held or surfaced anywhere on this site. The 2026 figures
            come directly from the{" "}
            <strong className="text-[color:var(--color-foreground)]">
              ECGB Final Electoral Roll 2026
            </strong>{" "}
            with a per-constituency male / female split. GB-wide total:{" "}
            {totalRegistered2026 ? formatNumber(totalRegistered2026) : "—"}{" "}
            (M 503,772 + F 454,708). 24-seat and 10-district sums both
            reconcile to this number exactly.
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
            GB-wide total per the ECGB Final Electoral Roll 2026.
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
            +{((growthFactor - 1) * 100).toFixed(1)}%
          </p>
            <p className="text-xs text-[color:var(--color-muted-foreground)]">
            745,362 → 958,480 on the ECGB Final Electoral Roll.
          </p>
        </article>
      </section>

      {/* District-level voter roll panel, sourced from the ECGB Final
        Electoral Roll 2026 (aggregated up from the per-constituency rows).
        Surfaces the male / female split per district so
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
              ))}{" "}across {districtVoters.length} districts. Source:
              ECGB Final Electoral Roll 2026.
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
                  Registered (2026)
                </th>
                <th className="px-4 py-3 font-medium text-right">
                  Male (2026)
                </th>
                <th className="px-4 py-3 font-medium text-right">
                  Female (2026)
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
                    colSpan={7}
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
                      {r.registered2026 != null
                        ? formatNumber(r.registered2026)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular text-[color:var(--color-muted-foreground)]">
                      {r.male2026 != null ? formatNumber(r.male2026) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular text-[color:var(--color-muted-foreground)]">
                      {r.female2026 != null
                        ? formatNumber(r.female2026)
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
                  colSpan={7}
                  className="px-4 py-3 text-[11px] text-[color:var(--color-muted-foreground)]"
                >
                  Aggregates only. Per CLAUDE.md no individual voter data
                  is held. 2026 figures sourced directly from the ECGB
                  Final Electoral Roll 2026 (24-seat sum = 958,480, exact
                  match to the GB-wide total above). Male {formatNumber(503772)}{" "}
                  · female {formatNumber(454708)}.
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
