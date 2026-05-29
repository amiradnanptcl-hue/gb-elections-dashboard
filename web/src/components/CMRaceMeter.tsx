import { useMemo } from "react";
import { Link } from "react-router-dom";
import { getParty } from "@/lib/parties";
import {
  usePredictions2026,
  usePredictions2026Summary,
  type Prediction2026Row,
  type Predictions2026Summary,
} from "@/lib/data";
import { cn } from "@/lib/utils";

/**
 * 2026 CM Race — the headline component on the home page.
 *
 * Renders the qualitative prediction model (Revision 2.0, 28 May 2026) as
 * a semicircular speedometer with all three top contenders shown on the
 * SAME 0..24-seat scale. The previous revision had a sign error in the
 * needle rotation that flipped PML-N and MWM to the wrong side of the dial
 * and a chip layout that overlapped near the 13 tick. This revision:
 *
 *   - Corrects needle geometry: angle = (seats/24)*180 - 90. seats=0 maps
 *     to -90 (full left), seats=12 maps to 0 (top), seats=24 maps to +90
 *     (full right). Both chips and needles now sit on the same side of
 *     the dial.
 *   - Drops the floating chip-pills that previously cluttered the arc.
 *     Identification moves to a single legend strip directly under the
 *     gauge: three party tiles side by side with flag + shortDisplay +
 *     seats. Zero overlap regardless of how close the seat counts are.
 *   - Centre overlay tightened so it fits cleanly inside the inner circle.
 *
 * The PTI-pact bloc contests under the MWM flagship for 2026 (PTI is not
 * on the ballot), so MWM flag and blue tint are used wherever the bloc
 * appears.
 */
export function CMRaceMeter() {
  const summaryQ = usePredictions2026Summary();
  const predictionsQ = usePredictions2026();
  const summary = summaryQ.data;
  const predictions = predictionsQ.data;

  const top3 = useMemo(() => {
    if (!summary) return [];
    return pickTopThree(summary, predictions ?? []);
  }, [summary, predictions]);

  if (!summary || top3.length === 0) return null;

  const leader = top3[0];
  const leaderMeta = getParty(leader.partyId);

  const TOTAL_GENERAL_SEATS = 24;
  const SIMPLE_MAJORITY = 13;
  const ASSEMBLY_MAJORITY = 17;

  // SVG geometry. viewBox 0..400 wide, 260 tall — enough headroom above
  // the arc for the tick labels without cramping anything.
  const CX = 200;
  const CY = 220;
  const R = 160;
  const STROKE = 24;

  // Polar coordinates. For the arc-point math we use standard angle
  // convention where seats=0 -> angle π (left), seats=24 -> angle 0
  // (right). For the needle rotation we use SVG rotate() angle where
  // seats=0 -> -90 (counterclockwise), seats=24 -> +90 (clockwise),
  // because SVG rotate() spins the needle around the pivot and SVG's
  // y-axis is flipped. The two conventions render the same points; the
  // critical fix vs. the previous revision is the rotation sign.
  const seatsToArcAngle = (seats: number) =>
    Math.PI * (1 - clamp(seats, 0, TOTAL_GENERAL_SEATS) / TOTAL_GENERAL_SEATS);
  const seatsToNeedleDeg = (seats: number) =>
    (clamp(seats, 0, TOTAL_GENERAL_SEATS) / TOTAL_GENERAL_SEATS) * 180 - 90;
  const arcPoint = (seats: number, radius: number = R) => {
    const a = seatsToArcAngle(seats);
    return { x: CX + radius * Math.cos(a), y: CY - radius * Math.sin(a) };
  };

  const fullArcPath = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;

  // Faint stacked tint per party — anchors each bloc's "territory" on
  // the arc behind the needles.
  const cumulative: { partyId: string; from: number; to: number }[] = [];
  let running = 0;
  for (const p of top3) {
    cumulative.push({
      partyId: p.partyId,
      from: running,
      to: running + p.seatsHigh,
    });
    running += p.seatsHigh;
  }
  const segmentPath = (from: number, to: number) => {
    const start = arcPoint(from);
    const end = arcPoint(to);
    const large = to - from > TOTAL_GENERAL_SEATS / 2 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${R} ${R} 0 ${large} 1 ${end.x} ${end.y}`;
  };

  // Majority threshold positions
  const tickThirteen = arcPoint(SIMPLE_MAJORITY);
  const tickSeventeen = arcPoint(ASSEMBLY_MAJORITY);

  // Render lower-seat needles first so the leader's needle stays on top.
  const orderedForDraw = [...top3].sort((a, b) => a.seatsHigh - b.seatsHigh);

  return (
    <section
      aria-labelledby="cm-race-heading"
      className="relative space-y-7 p-6 sm:p-8 rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-card)]/60 overflow-hidden top-edge"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-60 pointer-events-none"
        style={{
          background: `radial-gradient(60% 60% at 50% 100%, ${leaderMeta.color}28, transparent 70%)`,
        }}
      />

      <header className="space-y-2 text-center">
        <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.32em] text-[color:var(--color-accent-gold)]">
          Forecast 2026 · Polling 7 June · Model rev 2.0
        </p>
        <h2 id="cm-race-heading" className="font-display text-3xl sm:text-5xl leading-[1.02]">
          2026 <span className="text-headline-gradient">CM Race</span>
        </h2>
        <p className="text-sm sm:text-base text-[color:var(--color-muted-foreground)] max-w-xl mx-auto">
          All three contenders on a single dial. Each party-coloured needle
          marks the seats the model projects that bloc to win. The gold
          band is the threshold for an outright assembly majority.
        </p>
      </header>

      {/* Speedometer */}
      <div className="relative mx-auto w-full max-w-[460px]">
        <svg
          viewBox="0 0 400 260"
          className="block w-full h-auto"
          role="img"
          aria-label={`Race for Gilgit-Baltistan Chief Minister 2026. ${top3
            .map((p) => `${getParty(p.partyId).shortDisplay} ${p.seatsText}`)
            .join(", ")}.`}
        >
          <defs>
            <linearGradient id="cmTrackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--color-border)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--color-border-strong)" stopOpacity="0.6" />
            </linearGradient>
            {top3.map((p) => {
              const meta = getParty(p.partyId);
              return (
                <linearGradient
                  key={`grad-${p.partyId}`}
                  id={`cm-grad-${p.partyId}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor={meta.color} stopOpacity="0.22" />
                  <stop offset="100%" stopColor={meta.color} stopOpacity="0.55" />
                </linearGradient>
              );
            })}
            <filter id="cmGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background grey track */}
          <path
            d={fullArcPath}
            stroke="url(#cmTrackGrad)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
          />

          {/* Stacked tint zones */}
          {cumulative.map((seg) => (
            <path
              key={`seg-${seg.partyId}`}
              d={segmentPath(seg.from, Math.min(seg.to, TOTAL_GENERAL_SEATS))}
              stroke={`url(#cm-grad-${seg.partyId})`}
              strokeWidth={STROKE}
              strokeLinecap="butt"
              fill="none"
              className="cm-segment"
              style={{
                strokeDasharray: 600,
                strokeDashoffset: 600,
                animation: "cmSegSweep 1400ms 100ms cubic-bezier(0.2, 0.7, 0.2, 1) forwards",
              }}
            />
          ))}

          {/* Tick 13 (grey) */}
          <g aria-hidden>
            <line
              x1={tickThirteen.x}
              y1={tickThirteen.y}
              x2={CX + (R + 18) * Math.cos(seatsToArcAngle(SIMPLE_MAJORITY))}
              y2={CY - (R + 18) * Math.sin(seatsToArcAngle(SIMPLE_MAJORITY))}
              stroke="var(--color-foreground)"
              strokeOpacity="0.5"
              strokeWidth="2"
            />
            <text
              x={CX + (R + 32) * Math.cos(seatsToArcAngle(SIMPLE_MAJORITY))}
              y={CY - (R + 32) * Math.sin(seatsToArcAngle(SIMPLE_MAJORITY))}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="11"
              fontWeight="700"
              fill="var(--color-muted-foreground)"
              dominantBaseline="middle"
            >
              13
            </text>
          </g>

          {/* Tick 17 (gold — the meaningful one) */}
          <g aria-hidden>
            <line
              x1={tickSeventeen.x}
              y1={tickSeventeen.y}
              x2={CX + (R + 18) * Math.cos(seatsToArcAngle(ASSEMBLY_MAJORITY))}
              y2={CY - (R + 18) * Math.sin(seatsToArcAngle(ASSEMBLY_MAJORITY))}
              stroke="var(--color-accent-gold)"
              strokeWidth="2.5"
            />
            <text
              x={CX + (R + 32) * Math.cos(seatsToArcAngle(ASSEMBLY_MAJORITY))}
              y={CY - (R + 32) * Math.sin(seatsToArcAngle(ASSEMBLY_MAJORITY))}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="11"
              fontWeight="700"
              fill="var(--color-accent-gold)"
              dominantBaseline="middle"
            >
              17
            </text>
          </g>

          {/* Endpoint labels */}
          <text x={CX - R} y={CY + 26} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fontWeight="700" fill="var(--color-muted-foreground)">
            0
          </text>
          <text x={CX + R} y={CY + 26} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fontWeight="700" fill="var(--color-muted-foreground)">
            24
          </text>

          {/* Needles — corrected angle convention */}
          {orderedForDraw.map((p, idx) => {
            const meta = getParty(p.partyId);
            const angleDeg = seatsToNeedleDeg(p.seatsHigh);
            const isLeader = p.partyId === leader.partyId;
            const needleLen = R - STROKE / 2 - 6;
            return (
              <g
                key={`needle-${p.partyId}`}
                style={{
                  transformOrigin: `${CX}px ${CY}px`,
                  animation: `cmNeedleSweep-${idx} 1400ms 200ms cubic-bezier(0.2, 0.7, 0.2, 1) forwards`,
                }}
                className="cm-needle"
              >
                <style>{`
                  @keyframes cmNeedleSweep-${idx} {
                    from { transform: rotate(-90deg); }
                    to   { transform: rotate(${angleDeg}deg); }
                  }
                `}</style>
                <g transform={`rotate(${angleDeg} ${CX} ${CY})`}>
                  <line
                    x1={CX}
                    y1={CY}
                    x2={CX}
                    y2={CY - needleLen}
                    stroke={meta.color}
                    strokeWidth={isLeader ? 4.5 : 3.5}
                    strokeOpacity={isLeader ? 1 : 0.9}
                    strokeLinecap="round"
                    filter={isLeader ? "url(#cmGlow)" : undefined}
                  />
                  <circle
                    cx={CX}
                    cy={CY - needleLen}
                    r={isLeader ? 8 : 6}
                    fill={meta.color}
                    filter="url(#cmGlow)"
                  />
                  <circle
                    cx={CX}
                    cy={CY - needleLen}
                    r={isLeader ? 3 : 2}
                    fill="var(--color-card)"
                  />
                </g>
              </g>
            );
          })}

          {/* Pivot hub */}
          <circle cx={CX} cy={CY} r="14" fill="var(--color-card)" stroke="var(--color-border-strong)" strokeWidth="2" />
          <circle cx={CX} cy={CY} r="6" fill={leaderMeta.color} className="winner-dot" />

          {/* Centre overlay — tightened */}
          <g>
            <text x={CX} y={CY - 60} textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="0.22em" fill="var(--color-muted-foreground)">
              LEADER
            </text>
            <text
              x={CX}
              y={CY - 30}
              textAnchor="middle"
              fontFamily="var(--font-display)"
              fontSize="22"
              fontWeight="800"
              fill={leaderMeta.color}
              letterSpacing="-0.02em"
            >
              {leaderMeta.shortDisplay}
            </text>
            <text
              x={CX}
              y={CY + 20}
              textAnchor="middle"
              fontFamily="var(--font-display)"
              fontSize="40"
              fontWeight="800"
              fill={leaderMeta.color}
            >
              {leader.seatsText}
            </text>
            <text x={CX} y={CY + 40} textAnchor="middle" fontSize="10" fontWeight="700" letterSpacing="0.18em" fill="var(--color-muted-foreground)">
              OF 24
            </text>
          </g>

          <style>{`
            @keyframes cmSegSweep { to { stroke-dashoffset: 0; } }
            @media (prefers-reduced-motion: reduce) {
              .cm-segment { stroke-dashoffset: 0 !important; animation: none !important; }
              .cm-needle  { animation: none !important; }
            }
          `}</style>
        </svg>
      </div>

      {/* Legend strip — clear party identification BELOW the dial.
         No overlap with the gauge ever, no matter how close the seat
         counts are. */}
      <ol className="grid grid-cols-3 gap-2 sm:gap-3 max-w-[460px] mx-auto -mt-2">
        {top3.map((p) => {
          const meta = getParty(p.partyId);
          return (
            <li
              key={`legend-${p.partyId}`}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)]/80"
              style={{ borderColor: `${meta.color}55` }}
            >
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: meta.color }}
              />
              <img
                src={meta.flag}
                alt=""
                width="24"
                height="15"
                className="h-4 w-6 rounded-sm ring-1 ring-[color:var(--color-border)] shrink-0"
                loading="lazy"
                decoding="async"
              />
              <span
                className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.14em] truncate"
                style={{ color: meta.color }}
              >
                {meta.shortDisplay}
              </span>
              <span className="ml-auto font-mono tabular text-sm font-bold text-[color:var(--color-foreground)] shrink-0">
                {p.seatsText}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Majority indicators */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-[11px] uppercase tracking-[0.16em] font-bold">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-2 w-2 rounded-full bg-[color:var(--color-muted-foreground)]" />
          <span className="text-[color:var(--color-muted-foreground)]">
            Simple majority · 13 of 24
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-2 w-2 rounded-full bg-[color:var(--color-accent-gold)]" />
          <span className="text-[color:var(--color-accent-gold)]">
            Assembly majority · 17 of 33
          </span>
        </span>
      </div>

      {/* Podium */}
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
                  width="32"
                  height="20"
                  className="h-5 w-8 rounded-sm ring-1 ring-[color:var(--color-border)] shrink-0"
                  loading="lazy"
                  decoding="async"
                />
                <span className="font-mono font-bold tracking-tight" style={{ color: meta.color }}>
                  {p.label}
                </span>
              </div>
              {p.topCandidate && (
                <div className="border-t border-[color:var(--color-border)] pt-2 space-y-0.5">
                  <p className="text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)] font-bold">
                    Top candidate
                  </p>
                  <Link
                    to={`/constituency/${p.topCandidate.constituency_id}`}
                    className="block text-sm font-semibold leading-tight hover:underline underline-offset-4"
                  >
                    {p.topCandidate.candidate_name}
                  </Link>
                  <p className="text-[10px] font-mono tabular text-[color:var(--color-muted-foreground)]">
                    {p.topCandidate.constituency_id} {p.topCandidate.area_name} ·{" "}
                    {p.topCandidate.predicted_votes_text}
                  </p>
                </div>
              )}
              <p className="text-[11px] text-[color:var(--color-foreground)]/80 leading-relaxed">
                {p.driver}
              </p>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)] font-bold">
          Verdict · Hung Assembly · PPP senior partner
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

interface TopBloc {
  partyId: string;
  label: string;
  seatsText: string;
  seatsLow: number;
  seatsHigh: number;
  driver: string;
  topCandidate: Prediction2026Row | null;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function pickTopThree(
  summary: Predictions2026Summary,
  predictions: Prediction2026Row[],
): TopBloc[] {
  const parsed = summary.party_projection.map((row) => {
    const labelRaw = (row.party_or_bloc || "").replace(/\s*Seats\s*$/i, "").trim();
    const seatsRaw = (row.seats || "").trim();
    const nums = (seatsRaw.match(/\d+/g) ?? []).map((s) => parseInt(s, 10));
    const seatsLow = nums.length ? Math.min(...nums) : 0;
    const seatsHigh = nums.length ? Math.max(...nums) : 0;
    const pti = /PTI[\s-]?backed/i.test(labelRaw);
    let partyId = labelRaw;
    if (pti) partyId = "MWM";
    else if (/Independent/i.test(labelRaw)) partyId = "Independent";

    const rank1 = predictions.filter((r) => r.rank === 1);
    const candidates = pti
      ? rank1.filter((r) => r.party_id === "MWM" || (r.party_id === "Independent" && r.pti_proxy))
      : rank1.filter((r) => r.party_id === partyId);
    const topCandidate =
      candidates.length === 0
        ? null
        : candidates.reduce((best, r) =>
            (r.predicted_votes_estimate ?? 0) > (best.predicted_votes_estimate ?? 0) ? r : best,
          );

    return {
      partyId,
      label: pti ? `${labelRaw} (MWM)` : labelRaw,
      seatsText: seatsRaw.replace(/\s*\(.*?\)\s*$/, "").trim(),
      seatsLow,
      seatsHigh,
      driver: row.driver,
      topCandidate,
    } as TopBloc;
  });
  parsed.sort((a, b) => {
    if (b.seatsHigh !== a.seatsHigh) return b.seatsHigh - a.seatsHigh;
    return b.seatsLow - a.seatsLow;
  });
  return parsed.slice(0, 3);
}
