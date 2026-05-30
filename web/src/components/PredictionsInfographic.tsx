import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  usePredictions2026,
  useConstituencies,
  useDistrictVoters2026,
  type Prediction2026Row,
  type Constituency,
  type DistrictVoters2026,
} from "@/lib/data";
import { getParty } from "@/lib/parties";
import { formatNumber } from "@/lib/utils";

/**
 * DistrictBreakdown — compact per-district breakdown of the Rev 4.0
 * predictions, designed to render INSIDE the CM Race card on the
 * home page (not as its own standalone section).
 *
 * For each of the 10 GB districts shows:
 *   - District name + total seats badge
 *   - Stacked party-coloured allocation bar
 *   - Party chips with flag + seat count
 *   - ECGB voter total + male/female pictogram bar
 *
 * Renders only the heading row + 10-card grid. No outer card,
 * no top stat ribbon, no choropleth — those have been
 * intentionally removed because the parent CM Race card already
 * conveys the headline numbers (lanes + verdict) and the per-seat
 * winners grid.
 *
 * Data dependencies:
 *   - usePredictions2026:     rank-1 winners per seat (Rev 4.0)
 *   - useConstituencies:      seat -> district mapping
 *   - useDistrictVoters2026:  ECGB Final Electoral Roll 2026
 *
 * Reconciles against pipeline/src/gb_pipeline/audit_math.py.
 */
export function DistrictBreakdown() {
  const predictionsQ = usePredictions2026();
  const constituenciesQ = useConstituencies();
  const votersQ = useDistrictVoters2026();

  const blocks = useMemo(() => {
    const preds: Prediction2026Row[] = predictionsQ.data ?? [];
    const cons: Constituency[] = constituenciesQ.data ?? [];
    const voters: DistrictVoters2026[] = votersQ.data ?? [];
    if (!preds.length || !cons.length || !voters.length) return [];

    const czToDistrict = new Map(cons.map((c) => [c.constituency_id, c.district]));

    const byDistrict = new Map<string, Map<string, number>>();
    for (const p of preds) {
      if (p.rank !== 1) continue;
      const district = czToDistrict.get(p.constituency_id);
      if (!district) continue;
      if (!byDistrict.has(district)) byDistrict.set(district, new Map());
      const partyMap = byDistrict.get(district)!;
      partyMap.set(p.party_id, (partyMap.get(p.party_id) ?? 0) + 1);
    }

    return voters
      .map((v) => {
        const partyMap = byDistrict.get(v.district) ?? new Map<string, number>();
        const seats = Array.from(partyMap.entries())
          .map(([partyId, count]) => ({ partyId, count }))
          .sort((a, b) => b.count - a.count);
        const totalSeats = seats.reduce((s, p) => s + p.count, 0);
        const dominantParty = seats[0]?.partyId ?? "Independent";
        return {
          district: v.district,
          seats,
          totalSeats,
          totalVoters: v.total_voters_2026,
          maleVoters: v.male_voters_2026,
          femaleVoters: v.female_voters_2026,
          dominantParty,
        };
      })
      .sort((a, b) => b.totalVoters - a.totalVoters);
  }, [predictionsQ.data, constituenciesQ.data, votersQ.data]);

  if (blocks.length === 0) return null;

  return (
    <section
      aria-label="District-by-district seat allocation and voter demographics"
      className="space-y-3"
    >
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h3 className="text-[11px] uppercase tracking-[0.22em] font-bold text-[color:var(--color-muted-foreground)]">
          District-by-district breakdown
        </h3>
        <Link
          to="/map"
          className="text-[10px] uppercase tracking-[0.18em] font-bold text-[color:var(--color-accent-gold)] hover:underline underline-offset-4"
        >
          Open the full map →
        </Link>
      </div>
      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {blocks.map((b) => (
          <li key={b.district}>
            <DistrictCard block={b} />
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------------ */

interface DistrictBlock {
  district: string;
  seats: { partyId: string; count: number }[];
  totalSeats: number;
  totalVoters: number;
  maleVoters: number;
  femaleVoters: number;
  dominantParty: string;
}

interface DistrictCardProps {
  block: DistrictBlock;
}

function DistrictCard({ block }: DistrictCardProps) {
  const dominantMeta = getParty(block.dominantParty);
  const malePct = (block.maleVoters / block.totalVoters) * 100;
  const femalePct = (block.femaleVoters / block.totalVoters) * 100;
  return (
    <div
      className="rounded-xl border bg-[color:var(--color-card)]/80 px-3.5 py-3 space-y-2.5 top-edge relative overflow-hidden transition-transform hover:-translate-y-0.5"
      style={{
        borderColor: `${dominantMeta.color}55`,
        background: `linear-gradient(135deg, ${dominantMeta.color}10, transparent 70%), color-mix(in oklch, var(--color-card) 80%, transparent)`,
      }}
    >
      {/* District + total seats */}
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="font-display text-base sm:text-lg leading-tight">
          {block.district}
        </h4>
        <span className="inline-flex items-baseline gap-1 shrink-0">
          <span
            className="stat-display font-black text-xl tabular"
            style={{ color: dominantMeta.color }}
          >
            {block.totalSeats}
          </span>
          <span className="text-[9px] uppercase tracking-[0.18em] font-bold text-[color:var(--color-muted-foreground)]">
            seats
          </span>
        </span>
      </div>

      {/* Stacked allocation bar */}
      {block.seats.length > 0 && (
        <div className="flex h-2 rounded-full overflow-hidden border border-[color:var(--color-border)]">
          {block.seats.map((s) => {
            const m = getParty(s.partyId);
            return (
              <div
                key={s.partyId}
                className="h-full"
                style={{
                  width: `${(s.count / block.totalSeats) * 100}%`,
                  backgroundColor: m.color,
                }}
                title={`${m.shortDisplay}: ${s.count}`}
                aria-label={`${m.shortDisplay} wins ${s.count} of ${block.totalSeats} seats in ${block.district}`}
              />
            );
          })}
        </div>
      )}

      {/* Party-by-party seat tags */}
      {block.seats.length > 0 && (
        <ul className="flex flex-wrap gap-1">
          {block.seats.map((s) => {
            const m = getParty(s.partyId);
            return (
              <li
                key={s.partyId}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold"
                style={{
                  backgroundColor: `${m.color}1a`,
                  color: m.color,
                  border: `1px solid ${m.color}55`,
                }}
              >
                <img
                  src={m.flag}
                  alt=""
                  width="12"
                  height="8"
                  className="h-2 w-3 rounded-[1px]"
                  loading="lazy"
                  decoding="async"
                />
                {m.shortDisplay} {s.count}
              </li>
            );
          })}
        </ul>
      )}

      {/* Voter rollup */}
      <div className="pt-1.5 border-t border-[color:var(--color-border)] space-y-1.5">
        <p className="font-mono text-[10px] tabular text-[color:var(--color-muted-foreground)] uppercase tracking-[0.14em] font-bold">
          {formatNumber(block.totalVoters)} voters
        </p>
        <div className="flex h-1.5 rounded-full overflow-hidden bg-[color:var(--color-muted)]/60">
          <div
            className="h-full bg-[#1d4ed8]"
            style={{ width: `${malePct.toFixed(2)}%` }}
            aria-label={`Male voters ${malePct.toFixed(1)}%`}
          />
          <div
            className="h-full bg-[#be185d]"
            style={{ width: `${femalePct.toFixed(2)}%` }}
            aria-label={`Female voters ${femalePct.toFixed(1)}%`}
          />
        </div>
        {/* Coloured dots + spelled-out labels so the male / female
            split reads clearly without relying on the Unicode ♂ / ♀
            glyphs (which render inconsistently and were too small
            on the previous version). */}
        <div className="flex justify-between text-[11px] font-bold tabular">
          <span className="inline-flex items-center gap-1.5 text-[#1d4ed8]">
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-full bg-[#1d4ed8] ring-1 ring-[#1d4ed8]/30"
            />
            Male {malePct.toFixed(1)}%
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#be185d]">
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-full bg-[#be185d] ring-1 ring-[#be185d]/30"
            />
            Female {femalePct.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
