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
import { cn, formatNumber } from "@/lib/utils";

/**
 * 2026 Predictions — Geographic and Demographic Infographic.
 *
 * Sits on the home page directly under the CMRaceMeter (lanes + 24-tile
 * winner grid). Designed to be the "$100k editorial graphics" payoff:
 * the lanes show the headline number, the winner grid names every
 * seat, and this block answers the next question — "where on the map
 * is the assembly being won, and what does the electorate look like?".
 *
 * Three coupled layers, top to bottom:
 *
 *   1) Headline ribbon — total voters (958,480), male / female split,
 *      24 general seats across 10 districts, dominant bloc, six-pillar
 *      framework footnote.
 *
 *   2) Geographic district cartogram — a hand-positioned 5x3 grid that
 *      mirrors the rough geographic layout of the GB tehsils map
 *      (Ghizer west, Hunza-Nagar north, Diamer south-west, Skardu /
 *      Shigar / Ghanche / Kharmang east, Astore south, Gilgit centre).
 *      Each district tile is filled with the dominant predicted
 *      winning party's colour so the audience can see at a glance
 *      which bloc dominates which region.
 *
 *   3) Per-district demographic and seat breakdown card — one card per
 *      district sorted by voter weight. Shows registered voters, the
 *      male / female pictogram, the seat allocation across parties as
 *      stacked colour chips, and the projected dominant winner.
 *
 * Data dependencies:
 *   - usePredictions2026:        rank-1 winners per seat (Rev 4.0)
 *   - useConstituencies:         seat -> district mapping
 *   - useDistrictVoters2026:     ECGB Final Electoral Roll 2026 by
 *                                district
 *
 * All three feeds reconcile against the audit script at
 * pipeline/src/gb_pipeline/audit_math.py.
 */
export function PredictionsInfographic() {
  const predictionsQ = usePredictions2026();
  const constituenciesQ = useConstituencies();
  const votersQ = useDistrictVoters2026();

  const blocks = useMemo(() => {
    const preds: Prediction2026Row[] = predictionsQ.data ?? [];
    const cons: Constituency[] = constituenciesQ.data ?? [];
    const voters: DistrictVoters2026[] = votersQ.data ?? [];
    if (!preds.length || !cons.length || !voters.length) return [];

    const czToDistrict = new Map(cons.map((c) => [c.constituency_id, c.district]));

    // Aggregate predicted seat wins by (district -> partyId -> count)
    const byDistrict = new Map<string, Map<string, number>>();
    for (const p of preds) {
      if (p.rank !== 1) continue;
      const district = czToDistrict.get(p.constituency_id);
      if (!district) continue;
      if (!byDistrict.has(district)) byDistrict.set(district, new Map());
      const partyMap = byDistrict.get(district)!;
      partyMap.set(p.party_id, (partyMap.get(p.party_id) ?? 0) + 1);
    }

    return voters.map((v) => {
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
    });
  }, [predictionsQ.data, constituenciesQ.data, votersQ.data]);

  if (blocks.length === 0) return null;

  const grandTotalVoters = blocks.reduce((s, b) => s + b.totalVoters, 0);
  const grandMale = blocks.reduce((s, b) => s + b.maleVoters, 0);
  const grandFemale = blocks.reduce((s, b) => s + b.femaleVoters, 0);
  const grandTotalSeats = blocks.reduce((s, b) => s + b.totalSeats, 0);
  const malePct = (grandMale / grandTotalVoters) * 100;
  const femalePct = (grandFemale / grandTotalVoters) * 100;

  // For the demographic cards we want the most populous district
  // first, so the user's eye lands on Diamer / Gilgit (the heaviest
  // electorates) before Kharmang / Hunza (the lightest).
  const cardsByVoters = [...blocks].sort((a, b) => b.totalVoters - a.totalVoters);

  return (
    <section
      aria-labelledby="predictions-infographic-heading"
      className="relative space-y-8 p-6 sm:p-8 rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-card)]/60 overflow-hidden top-edge"
    >
      {/* Decorative gold glow behind the heading */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-40 -z-10 pointer-events-none opacity-60"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, var(--color-accent-gold-soft) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <header className="space-y-2 text-center">
        <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.32em] text-[color:var(--color-accent-gold)]">
          Geographic & Demographic Breakdown · Rev 4.0
        </p>
        <h2
          id="predictions-infographic-heading"
          className="font-display text-2xl sm:text-4xl leading-[1.05]"
        >
          Where the <span className="text-headline-gradient">24 seats</span>{" "}
          land across Gilgit-Baltistan
        </h2>
        <p className="text-xs sm:text-sm text-[color:var(--color-muted-foreground)] max-w-2xl mx-auto leading-relaxed">
          One tile per district. Tile fill is the projected dominant
          winning bloc; the inner chips show every party with a seat.
          Voter rolls below each district are the ECGB Final Electoral
          Roll 2026 (per-constituency totals reconcile to{" "}
          {formatNumber(grandTotalVoters)} GB-wide).
        </p>
      </header>

      {/* Top stat strip */}
      <div className="grid sm:grid-cols-3 gap-3">
        <StatCard
          eyebrow="Registered voters"
          value={formatNumber(grandTotalVoters)}
          sub={
            <span className="flex items-center gap-2 text-[11px]">
              <span className="text-[#1d4ed8] font-bold">
                ♂ {formatNumber(grandMale)}
              </span>
              <span>·</span>
              <span className="text-[#be185d] font-bold">
                ♀ {formatNumber(grandFemale)}
              </span>
            </span>
          }
          bar={
            <div className="mt-2 h-1.5 rounded-full overflow-hidden bg-[color:var(--color-muted)]/60 flex">
              <div
                className="h-full bg-[#1d4ed8]"
                style={{ width: `${malePct.toFixed(2)}%` }}
                aria-label={`${malePct.toFixed(1)}% male`}
              />
              <div
                className="h-full bg-[#be185d]"
                style={{ width: `${femalePct.toFixed(2)}%` }}
                aria-label={`${femalePct.toFixed(1)}% female`}
              />
            </div>
          }
        />
        <StatCard
          eyebrow="General seats"
          value={String(grandTotalSeats)}
          sub={`Across ${blocks.length} districts on 7 June 2026`}
        />
        <StatCard
          eyebrow="Leading bloc"
          value="PPP · 12"
          sub="50% of the assembly. One seat short of an outright 13-seat majority — coalition expected."
          accent="ppp"
        />
      </div>


      {/* Per-district demographic cards */}
      <div className="space-y-3">
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
          {cardsByVoters.map((b) => (
            <li key={b.district}>
              <DistrictCard block={b} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                     */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  eyebrow: string;
  value: string;
  sub: React.ReactNode;
  bar?: React.ReactNode;
  accent?: "ppp";
}

function StatCard({ eyebrow, value, sub, bar, accent }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/80 px-4 py-3 space-y-1 top-edge",
        accent === "ppp" && "ring-2 ring-[#b91c1c]/30",
      )}
    >
      <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-[color:var(--color-muted-foreground)]">
        {eyebrow}
      </p>
      <p
        className={cn(
          "stat-display font-black text-2xl sm:text-3xl tabular leading-none",
          accent === "ppp" && "text-[#b91c1c]",
        )}
      >
        {value}
      </p>
      <div className="text-[11px] text-[color:var(--color-foreground)]/80 leading-snug">
        {sub}
      </div>
      {bar}
    </div>
  );
}

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
      {/* Top: district + total seats */}
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

      {/* Seat allocation: stacked colored chips, one per party with seats */}
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
      <div className="pt-1 border-t border-[color:var(--color-border)] space-y-1">
        <p className="font-mono text-[10px] tabular text-[color:var(--color-muted-foreground)] uppercase tracking-[0.14em] font-bold">
          {formatNumber(block.totalVoters)} voters
        </p>
        <div className="flex h-1 rounded-full overflow-hidden bg-[color:var(--color-muted)]/60">
          <div
            className="h-full bg-[#1d4ed8]"
            style={{ width: `${malePct.toFixed(2)}%` }}
          />
          <div
            className="h-full bg-[#be185d]"
            style={{ width: `${femalePct.toFixed(2)}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-bold tabular">
          <span className="text-[#1d4ed8]">♂ {malePct.toFixed(1)}%</span>
          <span className="text-[#be185d]">♀ {femalePct.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

/* GBChoroplethMap component removed — hand-crafted SVG polygons did
 * not read as a real map and labels collided with eastern districts.
 * The per-district detail cards rendered below already convey the
 * full party-by-district breakdown without the visual noise of a
 * stylised cartogram. */
