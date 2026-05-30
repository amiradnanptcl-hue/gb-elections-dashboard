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
 * Party flags are everywhere. Revision 4.0 of the model treats MWM and
 * ITP as standalone Shia blocs rather than PTI proxies, so every lane
 * is its own party label.
 */
export function CMRaceMeter() {
  const summaryQ = usePredictions2026Summary();
  const predictionsQ = usePredictions2026();
  const summary = summaryQ.data;
  const predictions = predictionsQ.data;

  const allBlocs = useMemo(() => {
    if (!summary) return [];
    return pickAllBlocs(summary, predictions ?? []);
  }, [summary, predictions]);

  // All 24 rank-1 winners, sorted by GBA number. Renders as the compact
  // grid that replaced the 1st / 2nd / 3rd podium cards.
  const allWinners = useMemo(() => {
    if (!predictions) return [];
    return predictions
      .filter((r) => r.rank === 1)
      .sort((a, b) => {
        const ai = parseInt(a.constituency_id.split("-")[1], 10);
        const bi = parseInt(b.constituency_id.split("-")[1], 10);
        return ai - bi;
      });
  }, [predictions]);

  if (!summary || allBlocs.length === 0) return null;

  // Lanes show every bloc with at least one seat so visitors see the full
  // 24-seat distribution. The bloc podium (gold / silver / bronze cards)
  // was removed in favour of a compact 24-winner grid below.
  const racingBlocs = allBlocs.filter((b) => b.seatsHigh > 0);

  const leader = allBlocs[0];
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
          Forecast 2026 · Polling 7 June 2026 · As of 30 May · Updated every 24 hours
        </p>
        <h2 id="cm-race-heading" className="font-display text-3xl sm:text-5xl leading-[1.02]">
          7 June 2026 <span className="text-headline-gradient">Predictions</span>
        </h2>
      </header>

      {/* RACE PANEL — every bloc with seats gets its own lane so the
         full 24-seat distribution is visible. The redundant 0/17/24
         scale row above the lanes was removed at the user's request. */}
      <div className="space-y-4">
        <ol className="space-y-3 sm:space-y-4">
          {racingBlocs.map((p, i) => {
            const meta = getParty(p.partyId);
            const fillPct = (p.seatsHigh / TOTAL_GENERAL_SEATS) * 100;
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
                    <span
                      className="font-bold text-sm sm:text-base min-w-0 truncate"
                      style={{ color: meta.color }}
                    >
                      {meta.display}
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

      {/* Compact 24-winner grid. Replaces the previous gold / silver /
         bronze podium cards. Six rows of four tiles on desktop, four
         rows of two on mobile. Every tile links to the constituency
         profile; the party colour appears as a 3-pixel left border so
         readers can scan party blocks at a glance. */}
      <section
        aria-label="All 24 constituency winners"
        className="space-y-3"
      >
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-[11px] uppercase tracking-[0.22em] font-bold text-[color:var(--color-muted-foreground)]">
            All 24 constituency winners
          </h3>
          <Link
            to="/predictions"
            className="text-[10px] uppercase tracking-[0.18em] font-bold text-[color:var(--color-accent-gold)] hover:underline underline-offset-4"
          >
            Full seat-by-seat detail →
          </Link>
        </header>
        <ol className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2">
          {allWinners.map((r) => {
            const meta = getParty(r.party_id);
            return (
              <li key={r.constituency_id}>
                <Link
                  to={`/constituency/${r.constituency_id}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)]/70 hover:bg-[color:var(--color-muted)]/40 hover:border-[color:var(--color-border-strong)] transition-colors min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent-gold)]"
                  style={{
                    borderLeftWidth: 3,
                    borderLeftColor: meta.color,
                  }}
                  aria-label={`${r.constituency_id} ${r.area_name}, ${r.candidate_name} (${meta.shortDisplay})`}
                >
                  <span className="font-mono text-[9px] font-bold tabular text-[color:var(--color-muted-foreground)] shrink-0 w-11 text-center">
                    {r.constituency_id}
                  </span>
                  <img
                    src={meta.flag}
                    alt=""
                    width="20"
                    height="13"
                    className="h-3 w-5 rounded-sm ring-1 ring-[color:var(--color-border)] shrink-0"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold leading-tight truncate">
                      {r.candidate_name}
                    </span>
                    <span
                      className="block text-[9px] font-mono font-bold tabular uppercase tracking-[0.12em] truncate"
                      style={{ color: meta.color }}
                    >
                      {meta.shortDisplay} · {r.area_name}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Sources + methodology disclaimer. Small print so readers know
         the per-seat call is sourced externally, not self-attributed. */}
      <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-muted)]/30 px-4 py-3 text-[11px] leading-relaxed text-[color:var(--color-muted-foreground)]">
        <p className="font-bold uppercase tracking-[0.18em] text-[color:var(--color-accent-gold)] mb-1.5">
          Sources and methodology
        </p>
        <p>
          Per-seat winners sourced from the{" "}
          <strong>Independent Survey 2026</strong> single-page report (29
          May 2026), cross-checked against the ECGB Final Candidate List,
          Wikipedia constituency pages and Pakistani press coverage (Dawn,
          Express Tribune, Pamir Times). Calls are scored under a
          six-pillar framework: Ground organisation 30 percent, Historical
          baseline 20 percent, Religious and sectarian dynamics 15
          percent, Structural factors 15 percent, Candidate strength 15
          percent, Social-media signal 5 percent. This is an independent
          reading published for public reference, not a self-prediction.
          Full breakdown on the{" "}
          <Link
            to="/methodology"
            className="underline underline-offset-2 text-[color:var(--color-accent-gold)] font-semibold"
          >
            Methodology page
          </Link>
          .
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)] font-bold">
          Model · qualitative human-analyst, Revision 4.0 · Independent Survey 2026
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
  /** When true, the bloc has formally nominated this candidate for the
   * Chief Minister race (not just inferred from the highest-vote rank-1
   * seat). Surface a "CM Nominee" badge in the podium card. */
  isAppointedCmNominee?: boolean;
}

/**
 * Appointed CM nominees, keyed by canonical party id.
 *
 *   MWM    Maisam Kazim (Muhammad Kazim Maisam) at GBA-8 Skardu-II.
 *   PML-N  Hafiz Hafeezur Rehman (former Chief Minister) at GBA-2
 *          Gilgit-II. The Rev 4.0 survey projects Jameel Ahmed (PPP)
 *          winning GBA-2, but Hafeezur Rehman remains the bloc's CM
 *          face regardless.
 *   IPP    Gulbar Khan (outgoing Chief Minister) at GBA-18 Diamer-IV.
 *          Gulbar Khan is already the projected GBA-18 winner under
 *          IPP; flagging him as the appointed nominee just promotes
 *          him over Shamul Haq Lone (GBA-14) and Atiqullah (GBA-16)
 *          on the bloc's podium card.
 *
 * In every case the appointed face matters more for the CM Race than
 * whichever of the bloc's projected seat winners happens to top the
 * model-internal vote estimate. This override is per-party and
 * intentional. Revision 4.0 treats MWM as a standalone Shia bloc
 * rather than a PTI proxy.
 */
const APPOINTED_CM_NOMINEE: Record<
  string,
  { candidate_name: string; constituency_id: string; area_name: string; party_id: string; pti_proxy: boolean }
> = {
  MWM: {
    candidate_name: "Maisam Kazim",
    constituency_id: "GBA-8",
    area_name: "Skardu-II",
    party_id: "MWM",
    pti_proxy: false,
  },
  "PML-N": {
    candidate_name: "Hafiz Hafeezur Rehman",
    constituency_id: "GBA-2",
    area_name: "Gilgit-II",
    party_id: "PML-N",
    pti_proxy: false,
  },
  IPP: {
    candidate_name: "Gulbar Khan",
    constituency_id: "GBA-18",
    area_name: "Diamer-IV",
    party_id: "IPP",
    pti_proxy: false,
  },
};

function pickAllBlocs(
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

    // Appointed-CM-nominee override takes precedence over the
    // highest-vote heuristic, since a party's CM nominee is the face of
    // the CM Race regardless of whether their own seat tally tops the
    // bloc.
    const appointed = APPOINTED_CM_NOMINEE[partyId];
    let topCandidate: Prediction2026Row | null;
    let isAppointed = false;
    if (appointed) {
      topCandidate = {
        constituency_id: appointed.constituency_id,
        area_name: appointed.area_name,
        rank: 1,
        candidate_name: appointed.candidate_name,
        party_id: appointed.party_id,
        party_raw: pti ? "PTI-backed" : appointed.party_id,
        pti_proxy: appointed.pti_proxy,
        predicted_votes_text: "",
        predicted_votes_estimate: null,
        margin: "",
        social_media_sentiment: "",
        ground_reality: "Appointed CM nominee of the bloc.",
      };
      isAppointed = true;
    } else {
      const rank1 = predictions.filter((r) => r.rank === 1);
      const candidates = pti
        ? rank1.filter(
            (r) =>
              r.party_id === "MWM" ||
              (r.party_id === "Independent" && r.pti_proxy),
          )
        : rank1.filter((r) => r.party_id === partyId);
      topCandidate =
        candidates.length === 0
          ? null
          : candidates.reduce((best, r) =>
              (r.predicted_votes_estimate ?? 0) >
              (best.predicted_votes_estimate ?? 0)
                ? r
                : best,
            );
    }

    return {
      partyId,
      label: pti ? `${labelRaw} (MWM)` : labelRaw,
      seatsText: seatsRaw.replace(/\s*\(.*?\)\s*$/, "").trim(),
      seatsLow,
      seatsHigh,
      driver: row.driver,
      topCandidate,
      isAppointedCmNominee: isAppointed,
    } as TopBloc;
  });
  parsed.sort((a, b) => {
    if (b.seatsHigh !== a.seatsHigh) return b.seatsHigh - a.seatsHigh;
    return b.seatsLow - a.seatsLow;
  });
  return parsed;
}

/* BlocSeatList component removed — the click-to-expand panel was tied
 * to the podium cards (1st / 2nd / 3rd) which have themselves been
 * replaced by the compact 24-winner grid above. The grid renders every
 * winner directly, so no per-bloc drill-down is needed at this scale.
 */
