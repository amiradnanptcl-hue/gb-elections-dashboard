import { Link } from "react-router-dom";
import { getParty } from "@/lib/parties";
import {
  usePredictions2026Summary,
  type Predictions2026Summary,
} from "@/lib/data";
import { cn } from "@/lib/utils";

/**
 * Headline 2026 CM Race component.
 *
 * Reads the qualitative model summary (Revision 2.0, 28 May 2026), surfaces
 * the top-three blocs by projected seats, and renders:
 *
 *   1) A semicircular speedometer SVG (180° arc):
 *        - Grey track for the full 24-seat scale.
 *        - Coloured arc for the leader, length = (leaderSeats / 24) * 180°.
 *        - Two tick marks at 13 (simple majority of general seats) and
 *          17 (overall majority of the 33-seat assembly including
 *          6 women + 3 technocrat seats reserved seats).
 *        - Animated needle that points at the leader's seat position.
 *        - Centre overlay: leader's flag, party abbreviation, seat count,
 *          and an "of 24 general seats" caption.
 *   2) A podium row of three party cards (1st = gold, 2nd = silver,
 *      3rd = bronze), each carrying the party flag, name, seat count,
 *      and the one-line driver-of-change note from the model.
 *
 * Every party reference uses the project's existing colour and flag
 * palette in lib/parties.ts. The colour tint of the gauge arc is
 * derived from the leader's party colour via a CSS custom property,
 * so the meter automatically re-tints if the leader changes.
 *
 * Accessibility: gauge has role="img" + aria-label spelling out the
 * leader and seat count. Needle animation respects prefers-reduced-
 * motion via the existing `winner-pulse` and `winner-chip` CSS rules.
 */
export function CMRaceMeter() {
  const summaryQ = usePredictions2026Summary();
  const summary = summaryQ.data;

  if (!summary) return null;

  const top3 = pickTopThree(summary);
  if (top3.length === 0) return null;

  const leader = top3[0];
  const leaderMeta = getParty(leader.partyId);

  const TOTAL_GENERAL_SEATS = 24;
  const SIMPLE_MAJORITY = 13;
  const ASSEMBLY_MAJORITY = 17;

  // SVG geometry constants. viewBox spans 0..400 wide; the arc occupies
  // the top half. Use a generous radius so the gauge feels substantial.
  const CX = 200;
  const CY = 200;
  const R = 160;
  const STROKE = 26;

  // Convert a seat count (0..24) to a polar angle on the arc.
  // 0 seats -> 180° (full left, π rad); 24 seats -> 0° (full right, 0 rad).
  const seatsToAngle = (seats: number): number =>
    Math.PI * (1 - Math.min(Math.max(seats, 0), TOTAL_GENERAL_SEATS) / TOTAL_GENERAL_SEATS);

  // Cartesian point on the gauge arc at a given seat count.
  const arcPoint = (seats: number) => {
    const a = seatsToAngle(seats);
    return { x: CX + R * Math.cos(a), y: CY - R * Math.sin(a) };
  };

  // SVG path for the filled arc representing the leader's progress.
  // Goes from the leftmost (0 seats) point to the leader's seat position.
  const leaderEnd = arcPoint(leader.seatsHigh);
  const largeArc = leader.seatsHigh > TOTAL_GENERAL_SEATS / 2 ? 1 : 0;
  const leaderArcPath = `M ${CX - R} ${CY} A ${R} ${R} 0 ${largeArc} 1 ${leaderEnd.x} ${leaderEnd.y}`;
  const fullArcPath = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;

  // Needle: a thin pointer from (CX, CY) out to the leader endpoint.
  // Animated via CSS transform on the wrapper so the needle "sweeps" in
  // on page load.
  const needleAngleDeg = (1 - leader.seatsHigh / TOTAL_GENERAL_SEATS) * 180 - 90;

  // Tick label positions
  const tickThirteen = arcPoint(SIMPLE_MAJORITY);
  const tickSeventeen = arcPoint(ASSEMBLY_MAJORITY);

  return (
    <section
      aria-labelledby="cm-race-heading"
      className="relative space-y-6 p-6 sm:p-8 rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-card)]/60 overflow-hidden top-edge"
    >
      {/* Subtle background glow tinted by the leader colour */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-60 pointer-events-none"
        style={{
          background: `radial-gradient(60% 60% at 50% 100%, ${leaderMeta.color}24, transparent 70%)`,
        }}
      />

      {/* Eyebrow + heading */}
      <header className="space-y-2 text-center">
        <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.32em] text-[color:var(--color-accent-gold)]">
          Forecast 2026 · Polling 7 June
        </p>
        <h2
          id="cm-race-heading"
          className="font-display text-3xl sm:text-5xl leading-[1.02]"
        >
          2026 <span className="text-headline-gradient">CM Race</span>
        </h2>
        <p className="text-sm sm:text-base text-[color:var(--color-muted-foreground)] max-w-xl mx-auto">
          Who is on course to lead the next Gilgit-Baltistan Assembly. Live
          gauge from the qualitative model (Revision 2.0, 28 May 2026).
        </p>
      </header>

      {/* Speedometer */}
      <div className="relative mx-auto w-full max-w-[460px]">
        <svg
          viewBox="0 0 400 240"
          className="block w-full h-auto"
          role="img"
          aria-label={`${leaderMeta.display} leads the 2026 CM race with ${leader.seatsText} of ${TOTAL_GENERAL_SEATS} general seats`}
          style={{
            ["--leader-color" as string]: leaderMeta.color,
          } as React.CSSProperties}
        >
          <defs>
            <linearGradient id="cmTrackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--color-border)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--color-border-strong)" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="cmLeaderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={leaderMeta.color} stopOpacity="0.65" />
              <stop offset="100%" stopColor={leaderMeta.color} stopOpacity="1" />
            </linearGradient>
            <filter id="cmGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background track */}
          <path
            d={fullArcPath}
            stroke="url(#cmTrackGrad)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
          />

          {/* Leader fill */}
          <path
            d={leaderArcPath}
            stroke="url(#cmLeaderGrad)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            filter="url(#cmGlow)"
            className="cm-arc-fill"
            style={{
              strokeDasharray: 1000,
              strokeDashoffset: 1000,
              animation: "cmArcSweep 1600ms 200ms cubic-bezier(0.2, 0.7, 0.2, 1) forwards",
            }}
          />

          {/* Tick: simple majority of general seats (13) */}
          <g aria-hidden>
            <line
              x1={tickThirteen.x}
              y1={tickThirteen.y}
              x2={CX + (R + 18) * Math.cos(seatsToAngle(SIMPLE_MAJORITY))}
              y2={CY - (R + 18) * Math.sin(seatsToAngle(SIMPLE_MAJORITY))}
              stroke="var(--color-foreground)"
              strokeOpacity="0.55"
              strokeWidth="2"
            />
            <text
              x={CX + (R + 32) * Math.cos(seatsToAngle(SIMPLE_MAJORITY))}
              y={CY - (R + 32) * Math.sin(seatsToAngle(SIMPLE_MAJORITY))}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="11"
              fontWeight="700"
              fill="var(--color-muted-foreground)"
            >
              13
            </text>
          </g>

          {/* Tick: overall majority including reserved seats (17) */}
          <g aria-hidden>
            <line
              x1={tickSeventeen.x}
              y1={tickSeventeen.y}
              x2={CX + (R + 18) * Math.cos(seatsToAngle(ASSEMBLY_MAJORITY))}
              y2={CY - (R + 18) * Math.sin(seatsToAngle(ASSEMBLY_MAJORITY))}
              stroke="var(--color-accent-gold)"
              strokeWidth="2.5"
            />
            <text
              x={CX + (R + 32) * Math.cos(seatsToAngle(ASSEMBLY_MAJORITY))}
              y={CY - (R + 32) * Math.sin(seatsToAngle(ASSEMBLY_MAJORITY))}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="11"
              fontWeight="700"
              fill="var(--color-accent-gold)"
            >
              17
            </text>
          </g>

          {/* 0 and 24 endpoint labels */}
          <text
            x={CX - R}
            y={CY + 26}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="11"
            fontWeight="700"
            fill="var(--color-muted-foreground)"
          >
            0
          </text>
          <text
            x={CX + R}
            y={CY + 26}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="11"
            fontWeight="700"
            fill="var(--color-muted-foreground)"
          >
            24
          </text>

          {/* Needle. Rotated about the pivot point. */}
          <g
            transform={`rotate(${needleAngleDeg} ${CX} ${CY})`}
            style={{
              transformOrigin: `${CX}px ${CY}px`,
              animation: "cmNeedleSweep 1600ms 200ms cubic-bezier(0.2, 0.7, 0.2, 1) forwards",
            }}
            className="cm-needle"
          >
            <line
              x1={CX}
              y1={CY}
              x2={CX}
              y2={CY - R + STROKE / 2 + 6}
              stroke={leaderMeta.color}
              strokeWidth="3"
              strokeLinecap="round"
              filter="url(#cmGlow)"
            />
            <circle
              cx={CX}
              cy={CY - R + STROKE / 2 + 6}
              r="5"
              fill={leaderMeta.color}
              filter="url(#cmGlow)"
            />
          </g>

          {/* Pivot hub */}
          <circle cx={CX} cy={CY} r="12" fill="var(--color-card)" stroke="var(--color-border-strong)" strokeWidth="2" />
          <circle cx={CX} cy={CY} r="5" fill={leaderMeta.color} className="winner-dot" />

          {/* Needle and arc sweep keyframes */}
          <style>{`
            @keyframes cmArcSweep { to { stroke-dashoffset: 0; } }
            @keyframes cmNeedleSweep {
              from { transform: rotate(-90deg); }
              to   { transform: rotate(${needleAngleDeg}deg); }
            }
            @media (prefers-reduced-motion: reduce) {
              .cm-arc-fill { stroke-dashoffset: 0 !important; animation: none !important; }
              .cm-needle   { animation: none !important; }
            }
          `}</style>

          {/* Centre overlay: leader info */}
          <g>
            <text
              x={CX}
              y={CY - 30}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              letterSpacing="0.22em"
              fill="var(--color-muted-foreground)"
            >
              LEADER
            </text>
            <text
              x={CX}
              y={CY + 6}
              textAnchor="middle"
              fontFamily="var(--font-display)"
              fontSize="44"
              fontWeight="800"
              fill={leaderMeta.color}
            >
              {leader.seatsText}
            </text>
            <text
              x={CX}
              y={CY + 26}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              letterSpacing="0.16em"
              fill="var(--color-foreground)"
            >
              {leaderMeta.shortDisplay.toUpperCase()} · OF {TOTAL_GENERAL_SEATS}
            </text>
          </g>
        </svg>

        {/* Leader flag chip floating below the centre */}
        <div className="absolute left-1/2 -translate-x-1/2 -mt-1 flex items-center gap-2">
          <img
            src={leaderMeta.flag}
            alt=""
            width="32"
            height="20"
            className="h-5 w-8 rounded-sm ring-1 ring-[color:var(--color-border)] shrink-0"
            loading="eager"
            decoding="async"
          />
          <span
            className="text-[11px] uppercase tracking-[0.18em] font-bold"
            style={{ color: leaderMeta.color }}
          >
            {leaderMeta.display}
          </span>
        </div>
      </div>

      {/* Majority indicators */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[11px] uppercase tracking-[0.16em] font-bold">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-2 w-2 rounded-full bg-[color:var(--color-muted-foreground)]" />
          <span className="text-[color:var(--color-muted-foreground)]">
            Simple majority: 13 of 24
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-2 w-2 rounded-full bg-[color:var(--color-accent-gold)]" />
          <span className="text-[color:var(--color-accent-gold)]">
            Assembly majority: 17 of 33
          </span>
        </span>
      </div>

      {/* Podium — three contenders, gold/silver/bronze accents */}
      <ol className="grid gap-3 sm:gap-4 sm:grid-cols-3 mt-2">
        {top3.map((p, i) => {
          const meta = getParty(p.partyId);
          const podium = ["1st", "2nd", "3rd"][i];
          const accent =
            i === 0
              ? { ring: "ring-[#facc15]", bg: "bg-[#facc15]/12", chip: "text-[#facc15] border-[#facc15]/40 bg-[#facc15]/15" }
              : i === 1
                ? { ring: "ring-[#cbd5e1]", bg: "bg-[#cbd5e1]/8", chip: "text-[#94a3b8] border-[#cbd5e1]/40 bg-[#cbd5e1]/12" }
                : { ring: "ring-[#b45309]", bg: "bg-[#b45309]/12", chip: "text-[#d97706] border-[#b45309]/40 bg-[#b45309]/15" };
          return (
            <li
              key={p.partyId}
              className={cn(
                "card-elevated p-4 sm:p-5 space-y-3 relative top-edge ring-1",
                accent.ring,
                accent.bg,
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-[0.22em] px-2 py-0.5 rounded-md border",
                    accent.chip,
                  )}
                >
                  {podium}
                </span>
                <span className="stat-display text-3xl">{p.seatsText}</span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={meta.flag}
                  alt=""
                  width="28"
                  height="18"
                  className="h-4 w-7 rounded-sm ring-1 ring-[color:var(--color-border)] shrink-0"
                  loading="lazy"
                  decoding="async"
                />
                <span
                  className="font-mono font-bold tracking-tight"
                  style={{ color: meta.color }}
                >
                  {p.label}
                </span>
              </div>
              <p className="text-[11px] text-[color:var(--color-foreground)]/80 leading-relaxed">
                {p.driver}
              </p>
            </li>
          );
        })}
      </ol>

      {/* CTA to full predictions page */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)] font-bold">
          Verdict · Hung Assembly, PPP senior partner
        </p>
        <Link
          to="/predictions"
          className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-accent-gold)] hover:underline underline-offset-4"
        >
          Open seat-by-seat predictions
          <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Top-3 derivation from the model summary                            */
/* ------------------------------------------------------------------ */

interface TopBloc {
  partyId: string;
  label: string;
  seatsText: string;
  seatsLow: number;
  seatsHigh: number;
  driver: string;
}

/**
 * The model's party_projection list uses strings like "PPP Seats", "PML-N Seats",
 * "PTI-backed Seats", etc. Parse those into the canonical party_id used in
 * lib/parties.ts (so the flag and colour lookups work) plus a display label.
 */
function pickTopThree(summary: Predictions2026Summary): TopBloc[] {
  const parsed: TopBloc[] = summary.party_projection.map((row) => {
    const labelRaw = (row.party_or_bloc || "").replace(/\s*Seats\s*$/i, "").trim();
    const seatsRaw = (row.seats || "").trim();
    // Extract numeric range, e.g. "12", "3-4", "0-1", "3-4 (MWM/Ind)".
    const matches = seatsRaw.match(/\d+/g) ?? [];
    const nums = matches.map((s) => parseInt(s, 10));
    const seatsLow = nums.length ? Math.min(...nums) : 0;
    const seatsHigh = nums.length ? Math.max(...nums) : 0;
    // Canonicalise to party ID. "PTI-backed" maps to PTI's colour even though
    // they aren't formally on the ballot — the user has consistently used
    // PTI orange to mark PTI-backed seats elsewhere on the dashboard.
    let partyId = labelRaw;
    if (/PTI[\s-]?backed/i.test(labelRaw)) partyId = "PTI";
    else if (/Independent/i.test(labelRaw)) partyId = "Independent";
    return {
      partyId,
      label: labelRaw,
      seatsText: seatsRaw.replace(/\s*\(.*?\)\s*$/, "").trim(),
      seatsLow,
      seatsHigh,
      driver: row.driver,
    };
  });
  // Sort by high estimate desc, then low. Take top 3.
  parsed.sort((a, b) => {
    if (b.seatsHigh !== a.seatsHigh) return b.seatsHigh - a.seatsHigh;
    return b.seatsLow - a.seatsLow;
  });
  return parsed.slice(0, 3);
}
