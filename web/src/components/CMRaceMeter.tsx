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
 * 2026 CM Race — top-of-home headline component.
 *
 * Earlier revisions used a semicircular speedometer. Visually striking
 * but cognitively expensive for a non-technical visitor: the gauge had
 * to communicate "seats" via an arc angle, which is one step removed
 * from the underlying number.
 *
 * This revision drops the gauge and presents the race as it really is —
 * three horizontal lanes racing toward a majority finish line. Each
 * lane is one party. Lane length is proportional to seats won.
 * Anyone who has watched a sprint understands the picture in two
 * seconds.
 *
 * Layout:
 *   1) Eyebrow + display heading.
 *   2) "Race to majority" panel — three lanes, gold finish-line at 17
 *      seats (the threshold for an outright majority of the 33-seat
 *      assembly including reserved seats). Each lane animates from
 *      empty to its projected length on load.
 *   3) Verdict ribbon — large, plain-English read of the standings.
 *   4) Podium cards (1st gold / 2nd silver / 3rd bronze) with the
 *      projected top candidate for each bloc.
 *
 * Party flags are everywhere. PTI-pact bloc renders as MWM (PTI is not
 * on the 2026 GB ballot).
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
  const SIMPLE_MAJORITY_PCT = (SIMPLE_MAJORITY / TOTAL_GENERAL_SEATS) * 100;
  const ASSEMBLY_MAJORITY_PCT = (ASSEMBLY_MAJORITY / TOTAL_GENERAL_SEATS) * 100;

  const leaderShort = ASSEMBLY_MAJORITY - leader.seatsHigh;

  return (
    <section
      aria-labelledby="cm-race-heading"
      className="relative space-y-8 p-6 sm:p-8 rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-card)]/60 overflow-hidden top-edge"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-60 pointer-events-none"
        style={{
          background: `radial-gradient(60% 60% at 50% 100%, ${leaderMeta.color}28, transparent 70%)`,
        }}
      />

      {/* Heading */}
      <header className="space-y-2 text-center">
        <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.32em] text-[color:var(--color-accent-gold)]">
          Forecast 2026 · Polling 7 June · Model rev 3.0
        </p>
        <h2 id="cm-race-heading" className="font-display text-3xl sm:text-5xl leading-[1.02]">
          2026 <span className="text-headline-gradient">CM Race</span>
        </h2>
        <p className="text-sm sm:text-base text-[color:var(--color-muted-foreground)] max-w-xl mx-auto">
          Three parties racing toward an assembly majority. Each lane below
          is one bloc; the gold flag is the 17-seat finish line. No bloc
          crosses it on its own — so the verdict is a coalition government.
        </p>
      </header>

      {/* RACE PANEL — three horizontal lanes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.14em] sm:tracking-[0.22em] font-bold whitespace-nowrap">
          <span className="text-[color:var(--color-muted-foreground)]">0 seats</span>
          <span className="text-[color:var(--color-accent-gold)] inline-flex items-center gap-1 whitespace-nowrap">
            <span aria-hidden>⚑</span>
            <span className="hidden sm:inline">Finish line ·&nbsp;</span>
            <span>17 of 33</span>
          </span>
          <span className="text-[color:var(--color-muted-foreground)]">24 seats</span>
        </div>

        <ol className="space-y-3 sm:space-y-4">
          {top3.map((p, i) => {
            const meta = getParty(p.partyId);
            const fillPct = (p.seatsHigh / TOTAL_GENERAL_SEATS) * 100;
            const reachedMajority = p.seatsHigh >= ASSEMBLY_MAJORITY;
            return (
              <li key={p.partyId} className="space-y-1.5">
                {/* Label row — party identity + seat count */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="inline-flex items-center justify-center font-mono text-[10px] font-bold uppercase tracking-[0.22em] h-5 w-7 rounded text-[color:var(--color-muted-foreground)] border border-[color:var(--color-border)] shrink-0"
                      aria-hidden
                    >
                      {i + 1}
                    </span>
                    <img
                      src={meta.flag}
                      alt=""
                      width="32"
                      height="20"
                      className="h-5 w-8 rounded-sm ring-1 ring-[color:var(--color-border)] shrink-0"
                      loading="eager"
                      decoding="async"
                    />
                    <span className="font-bold text-sm sm:text-base min-w-0 truncate">
                      <span style={{ color: meta.color }}>{p.label}</span>
                      {p.topCandidate && (
                        <span className="text-[color:var(--color-muted-foreground)] font-medium">
                          {" "}
                          ({p.topCandidate.candidate_name})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="shrink-0 inline-flex items-baseline gap-1.5">
                    <span
                      className="font-display font-black text-2xl sm:text-3xl tabular"
                      style={{ color: meta.color }}
                    >
                      {p.seatsText}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)] font-bold">
                      of 24
                    </span>
                  </div>
                </div>

                {/* Lane — track + filled bar + finish-line marker */}
                <div className="relative h-7 sm:h-8 rounded-full overflow-visible">
                  {/* Track */}
                  <div
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-[color:var(--color-muted)]/60 border border-[color:var(--color-border)]"
                  />
                  {/* Filled portion — animates from 0% to final width on
                     mount, with a continuous internal stripe scroll. */}
                  <div
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={TOTAL_GENERAL_SEATS}
                    aria-valuenow={p.seatsHigh}
                    aria-label={`${meta.display}: ${p.seatsText} of ${TOTAL_GENERAL_SEATS} general seats`}
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full cm-lane-fill overflow-hidden",
                      i === 0 && "cm-leader-finish",
                    )}
                    style={{
                      ["--final-pct" as string]: `${fillPct}%`,
                      ["--lane-color" as string]: meta.color,
                      background: `linear-gradient(90deg, ${meta.color} 0%, ${meta.color} 70%, ${meta.color}cc 100%)`,
                      boxShadow: `0 0 0 1px ${meta.color}55, 0 2px 12px -2px ${meta.color}66`,
                    }}
                  />
                  {/* Runner / trophy glyph at the leading edge — sized
                     up for clear visibility and flipped horizontally
                     for the runners so they face the finish line. The
                     trophy on the leader's lane is left upright. */}
                  <span
                    aria-hidden
                    className="absolute top-1/2 -translate-y-1/2 text-2xl sm:text-3xl pointer-events-none cm-runner select-none"
                    style={{
                      left: `calc(${fillPct}% - 18px)`,
                      filter: `drop-shadow(0 0 8px ${meta.color}) drop-shadow(0 0 14px ${meta.color}aa)`,
                      animation: "cmRunnerSlide 1800ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
                      ["--target-left" as string]: `calc(${fillPct}% - 18px)`,
                    } as React.CSSProperties}
                  >
                    <span
                      className="inline-block"
                      style={i === 0 ? undefined : { transform: "scaleX(-1)" }}
                    >
                      {i === 0 ? "🏆" : "🏃"}
                    </span>
                  </span>
                  {/* Simple majority marker (13) */}
                  <div
                    aria-hidden
                    className="absolute top-0 bottom-0 w-px bg-[color:var(--color-foreground)]/40"
                    style={{ left: `${SIMPLE_MAJORITY_PCT}%` }}
                  />
                  {/* Assembly majority finish line (17) */}
                  <div
                    aria-hidden
                    className="absolute -top-1 -bottom-1 w-[3px] bg-[color:var(--color-accent-gold)] rounded-full shadow-[0_0_8px_var(--color-accent-gold)]"
                    style={{ left: `calc(${ASSEMBLY_MAJORITY_PCT}% - 1.5px)` }}
                  />
                  {/* Finish flag at top of the gold line on first lane only */}
                  {i === 0 && (
                    <span
                      aria-hidden
                      className="absolute -top-3 sm:-top-4 text-[color:var(--color-accent-gold)] text-base sm:text-lg leading-none"
                      style={{
                        left: `calc(${ASSEMBLY_MAJORITY_PCT}% - 7px)`,
                        textShadow: "0 0 6px var(--color-accent-gold)",
                      }}
                    >
                      ⚑
                    </span>
                  )}
                  {/* "Gap to majority" callout, only when not reached */}
                  {!reachedMajority && (
                    <span
                      className="absolute -bottom-5 text-[10px] uppercase tracking-[0.18em] font-bold whitespace-nowrap text-[color:var(--color-muted-foreground)]"
                      style={{ left: `calc(${fillPct}% + 6px)` }}
                    >
                      −{Math.max(ASSEMBLY_MAJORITY - p.seatsHigh, 0)} to majority
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

      </div>

      {/* Verdict ribbon */}
      <div
        className="relative rounded-xl p-4 sm:p-5 text-center border-2"
        style={{
          borderColor: `${leaderMeta.color}55`,
          background: `linear-gradient(135deg, ${leaderMeta.color}18, transparent 70%)`,
        }}
      >
        <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[color:var(--color-accent-gold)] mb-1">
          Verdict
        </p>
        <p className="font-display text-xl sm:text-2xl leading-tight">
          Coalition Government ·{" "}
          <span style={{ color: leaderMeta.color }}>{leaderMeta.shortDisplay} leads</span>{" "}
          at {leader.seatsText} seats
        </p>
        <p className="text-sm text-[color:var(--color-muted-foreground)] mt-1.5">
          {leaderShort > 0
            ? `${leaderShort} short of the 17-seat finish line on their own. Coalition government expected, with ${leaderMeta.shortDisplay} as senior partner.`
            : `${leaderMeta.shortDisplay} clears the 17-seat majority threshold outright.`}
        </p>
      </div>

      {/* Podium with named candidates */}
      <ol className="grid gap-3 sm:gap-4 sm:grid-cols-3">
        {top3.map((p, i) => {
          const meta = getParty(p.partyId);
          const podium = ["1st", "2nd", "3rd"][i];
          const medal = ["🥇", "🥈", "🥉"][i];
          const accent =
            i === 0
              ? {
                  ring: "ring-2 ring-[#fbbf24]",
                  bg: "bg-gradient-to-br from-[#fbbf24]/22 via-[#fbbf24]/10 to-transparent",
                  chip:
                    "text-[#451a03] bg-[#fbbf24] border-[#fbbf24] shadow-[0_0_10px_#fbbf24]",
                  glow: "podium-glow-gold",
                }
              : i === 1
                ? {
                    ring: "ring-2 ring-[#cbd5e1]",
                    bg: "bg-gradient-to-br from-[#cbd5e1]/22 via-[#cbd5e1]/10 to-transparent",
                    chip:
                      "text-[#0f172a] bg-[#cbd5e1] border-[#cbd5e1] shadow-[0_0_10px_#cbd5e1]",
                    glow: "podium-glow-silver",
                  }
                : {
                    ring: "ring-2 ring-[#ea580c]",
                    bg: "bg-gradient-to-br from-[#ea580c]/22 via-[#ea580c]/10 to-transparent",
                    chip:
                      "text-[#1c1917] bg-[#fb923c] border-[#fb923c] shadow-[0_0_10px_#fb923c]",
                    glow: "podium-glow-bronze",
                  };
          return (
            <li
              key={p.partyId}
              className={cn(
                "card-elevated p-4 sm:p-5 space-y-3 relative top-edge",
                accent.ring,
                accent.bg,
                accent.glow,
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden
                    className="text-2xl sm:text-3xl drop-shadow-[0_0_8px_rgba(0,0,0,0.5)] podium-medal"
                  >
                    {medal}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-black uppercase tracking-[0.22em] px-2 py-0.5 rounded-md border-2",
                      accent.chip,
                    )}
                  >
                    {podium}
                  </span>
                </span>
                <span
                  className="stat-display text-3xl sm:text-4xl font-black"
                  style={{ color: meta.color }}
                >
                  {p.seatsText}
                </span>
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
          Model · qualitative human-analyst, Revision 3.0
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
