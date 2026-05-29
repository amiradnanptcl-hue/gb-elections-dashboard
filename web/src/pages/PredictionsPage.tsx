import { useMemo } from "react";
import { Link } from "react-router-dom";
import { PartyBadge } from "@/components/ui/badge";
import {
  usePredictions2026,
  usePredictions2026Summary,
  type Prediction2026Row,
} from "@/lib/data";
import { getParty } from "@/lib/parties";
import { useDocumentMeta } from "@/lib/seo";
import { cn } from "@/lib/utils";

/**
 * Author's qualitative prediction model, revised 28 May 2026.
 *
 * This page is the dashboard surface for the user-supplied model that lives
 * in GB_2026_REVISED_Predictions_28May.xlsx. It is *not* the old logistic-
 * regression model we removed in v1.3 — that was a 72-row ML attempt that
 * collapsed to "federal incumbent wins everything." This is a human-analyst
 * model that weights ground organisation (30%) above structural factors
 * (20%) and explicitly downgrades social media (5%).
 *
 * Render order: hero + headline projection → critical flips → government
 * formation scenarios → 24 per-seat blocks in GBA-1..GBA-24 order. Every
 * party reference carries the party flag via PartyBadge.
 */
export function PredictionsPage() {
  useDocumentMeta({
    title:
      "2026 Predictions — Gilgit-Baltistan Assembly seat-by-seat forecast | gbelections.com",
    description:
      "Qualitative predictive model for the 24 general seats of the Gilgit-Baltistan Assembly, 7 June 2026. PPP 12, PML-N 9, PTI-backed 3-4, IPP 0-1, JUI-F 1, Independent 1. Headed for a hung assembly with PPP as the senior coalition partner.",
    path: "/predictions",
  });

  const predictionsQ = usePredictions2026();
  const summaryQ = usePredictions2026Summary();
  const rows = predictionsQ.data ?? [];
  const summary = summaryQ.data;

  // Group by seat, sort GBA-1..GBA-24, then by rank within each seat.
  const grouped = useMemo(() => {
    const map = new Map<string, Prediction2026Row[]>();
    for (const r of rows) {
      const arr = map.get(r.constituency_id) ?? [];
      arr.push(r);
      map.set(r.constituency_id, arr);
    }
    for (const [, arr] of map) arr.sort((a, b) => a.rank - b.rank);
    return Array.from(map.entries()).sort((a, b) => {
      const ai = parseInt(a[0].split("-")[1], 10);
      const bi = parseInt(b[0].split("-")[1], 10);
      return ai - bi;
    });
  }, [rows]);

  return (
    <div className="space-y-12 max-w-6xl">
      {/* Hero */}
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
              Author's model · Revision 2.0 · 28 May 2026
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.02]">
            2026 Predictions
            <br />
            <span className="text-headline-gradient">seat by seat</span>
          </h1>
          <p className="text-[color:var(--color-muted-foreground)] text-base sm:text-lg max-w-2xl leading-relaxed">
            A qualitative human-analyst model of the 24 general seats of
            the Gilgit-Baltistan Assembly, polled 7 June 2026 (GBA-24
            delayed to 15 November). The model weights ground organisation,
            party machinery, and biraderi networks above social-media
            volume. Every prediction carries the published reasoning so
            you can disagree with the call, not just the verdict.
          </p>
        </div>
      </header>

      {/* Headline party projection */}
      {summary && (
        <section className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
              Headline projection
            </p>
            <h2 className="font-display text-2xl sm:text-3xl">
              How the 24 general seats split
            </h2>
          </div>
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {summary.party_projection.map((p) => {
              const partyId = p.party_or_bloc
                .replace(/\s*Seats\s*$/i, "")
                .trim();
              const meta = getParty(partyId);
              const isPpp = meta.id === "PPP";
              return (
                <article
                  key={p.party_or_bloc}
                  className={cn(
                    "card-elevated p-5 space-y-3 relative top-edge",
                    isPpp ? "card-accent-red" : "card-accent-gold",
                  )}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <PartyBadge
                      party={meta.shortDisplay}
                      color={meta.color}
                      textOnColor={meta.textOnColor}
                      flag={meta.flag}
                      variant="row"
                    />
                    <span className="stat-display text-3xl">{p.seats}</span>
                  </div>
                  <p className="text-[12px] text-[color:var(--color-foreground)]/85 leading-relaxed">
                    {p.driver}
                  </p>
                </article>
              );
            })}
          </div>
          <p className="text-[11px] text-[color:var(--color-muted-foreground)] leading-relaxed max-w-3xl">
            <strong>Verdict.</strong> Hung Assembly with PPP as the largest
            single bloc. Coalition government inevitable. Most likely
            scenario: PPP + PML-N coalition continues, but PPP is now the{" "}
            <em>senior</em> partner, not junior. Possible PPP Chief Minister.
          </p>
        </section>
      )}

      {/* Critical flips */}
      {summary && summary.critical_flips.length > 0 && (
        <section className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
              Critical flips vs. the initial model
            </p>
            <h2 className="font-display text-2xl sm:text-3xl">
              {summary.critical_flips.length} seats that moved
            </h2>
          </div>
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            {summary.critical_flips.map((f) => {
              const [oldP, newP] = f.flip
                .split(/\s*[→\->]+\s*/)
                .map((s) => s.trim());
              const oldMeta = oldP ? getParty(oldP) : null;
              const newMeta = newP ? getParty(newP) : null;
              return (
                <article
                  key={f.constituency}
                  className="card-elevated card-accent-red p-5 space-y-3 relative top-edge"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="font-mono font-semibold">{f.constituency}</p>
                    <div className="inline-flex items-center gap-2">
                      {oldMeta && (
                        <PartyBadge
                          party={oldMeta.shortDisplay}
                          color={oldMeta.color}
                          textOnColor={oldMeta.textOnColor}
                          flag={oldMeta.flag}
                          variant="row"
                        />
                      )}
                      <span aria-hidden className="text-[color:var(--color-muted-foreground)]">
                        →
                      </span>
                      {newMeta && (
                        <PartyBadge
                          party={newMeta.shortDisplay}
                          color={newMeta.color}
                          textOnColor={newMeta.textOnColor}
                          flag={newMeta.flag}
                          variant="row"
                        />
                      )}
                    </div>
                  </div>
                  <p className="text-[12px] text-[color:var(--color-foreground)]/85 leading-relaxed">
                    {f.reason}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Government formation scenarios */}
      {summary && summary.government_formation_scenarios.length > 0 && (
        <section className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
              Government formation
            </p>
            <h2 className="font-display text-2xl sm:text-3xl">
              Three scenarios, weighted
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {summary.government_formation_scenarios.map((sc, i) => {
              const accent =
                i === 0
                  ? "card-accent-green"
                  : i === 1
                    ? "card-accent-gold"
                    : "card-accent-red";
              return (
                <article
                  key={sc.label}
                  className={cn(
                    "card-elevated p-5 space-y-2 relative top-edge",
                    accent,
                  )}
                >
                  <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-[color:var(--color-accent-gold)]">
                    {sc.label}
                  </p>
                  <p className="text-sm leading-relaxed">{sc.description}</p>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Per-constituency predictions */}
      <section className="space-y-6">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
            Per constituency
          </p>
          <h2 className="font-display text-3xl sm:text-4xl">
            24 seats, top 3 candidates each
          </h2>
          <p className="text-sm text-[color:var(--color-muted-foreground)] max-w-3xl leading-relaxed">
            Every prediction below comes from the same model file. Rank 1 is
            the projected winner with an indicative vote count and margin
            chip. Each candidate carries the prose reasoning the analyst
            used — social-media signal plus on-the-ground reality. Click a
            seat header to open its full constituency profile.
          </p>
        </div>

        <div className="space-y-4">
          {grouped.map(([cz, list]) => {
            const winner = list[0];
            const winnerMeta = winner ? getParty(winner.party_id) : null;
            return (
              <article
                key={cz}
                className="card-elevated p-5 sm:p-6 space-y-4 relative top-edge"
                id={cz}
              >
                <header className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-0.5">
                    <Link
                      to={`/constituency/${cz}`}
                      className="font-mono font-semibold text-[color:var(--color-foreground)] hover:underline underline-offset-4"
                    >
                      {cz}
                    </Link>
                    <p className="font-display text-xl sm:text-2xl leading-tight">
                      {winner?.area_name ?? ""}
                    </p>
                  </div>
                  {winner && winnerMeta && (
                    <div
                      className="winner-chip shrink-0 max-w-full"
                      style={{
                        ["--winner-color" as string]: winnerMeta.color,
                      } as React.CSSProperties}
                      aria-label={`Projected winner ${winner.candidate_name}, ${winnerMeta.display}`}
                    >
                      <span
                        aria-hidden
                        className="winner-dot inline-block h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: winnerMeta.color }}
                      />
                      <img
                        src={winnerMeta.flag}
                        alt=""
                        width="20"
                        height="13"
                        className="h-3.5 w-5 object-cover rounded-sm ring-1 ring-[color:var(--color-border)] shrink-0"
                        loading="lazy"
                        decoding="async"
                      />
                      <span>Projected winner</span>
                      <span aria-hidden className="opacity-40">·</span>
                      <span className="normal-case tracking-tight text-[12px] font-semibold text-[color:var(--color-foreground)] truncate max-w-[160px]">
                        {winner.candidate_name}
                      </span>
                      <span aria-hidden className="opacity-40">·</span>
                      <span className="font-bold" style={{ color: winnerMeta.color }}>
                        {winnerMeta.shortDisplay}
                      </span>
                    </div>
                  )}
                </header>

                <ul className="space-y-3">
                  {list.map((r) => {
                    const meta = getParty(r.party_id);
                    const isWinner = r.rank === 1;
                    return (
                      <li
                        key={`${r.constituency_id}-${r.rank}`}
                        className={cn(
                          "rounded-lg border p-4 space-y-2",
                          isWinner
                            ? "border-[color:var(--color-accent-gold)]/40 bg-[color:var(--color-accent-gold-soft)]/15"
                            : "border-[color:var(--color-border)] bg-[color:var(--color-card)]/60",
                        )}
                      >
                        <div className="flex items-baseline justify-between gap-3 flex-wrap">
                          <div className="flex items-baseline gap-2 min-w-0">
                            <span className="font-mono text-[11px] tabular text-[color:var(--color-muted-foreground)] w-4">
                              {r.rank}
                            </span>
                            <span className="font-semibold text-sm sm:text-base">
                              {r.candidate_name}
                            </span>
                            <PartyBadge
                              party={meta.shortDisplay}
                              color={meta.color}
                              textOnColor={meta.textOnColor}
                              flag={meta.flag}
                              variant="row"
                            />
                            {r.pti_proxy && (
                              <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-[color:var(--color-accent-red)] border border-[color:var(--color-accent-red)]/40 bg-[color:var(--color-accent-red-soft)]/30 rounded-md px-1.5 py-0.5">
                                PTI-backed
                              </span>
                            )}
                          </div>
                          <div className="inline-flex items-center gap-2 shrink-0">
                            <span className="font-mono tabular text-sm font-semibold">
                              {r.predicted_votes_text}
                            </span>
                            {r.margin && (
                              <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-[color:var(--color-accent-gold)] border border-[color:var(--color-accent-gold)]/40 bg-[color:var(--color-accent-gold-soft)]/30 rounded-md px-1.5 py-0.5">
                                margin: {r.margin}
                              </span>
                            )}
                          </div>
                        </div>
                        {(r.social_media_sentiment || r.ground_reality) && (
                          <div className="grid gap-2 sm:grid-cols-2 pt-1">
                            {r.social_media_sentiment && (
                              <div className="space-y-1">
                                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[color:var(--color-muted-foreground)]">
                                  Social-media signal
                                </p>
                                <p className="text-[12px] text-[color:var(--color-foreground)]/85 leading-relaxed">
                                  {r.social_media_sentiment}
                                </p>
                              </div>
                            )}
                            {r.ground_reality && (
                              <div className="space-y-1">
                                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[color:var(--color-accent-gold)]">
                                  Ground reality
                                </p>
                                <p className="text-[12px] text-[color:var(--color-foreground)]/85 leading-relaxed">
                                  {r.ground_reality}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {cz === "GBA-24" && summary?.gba24_delay_note && (
                  <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-[color:var(--color-accent-red)]">
                    Note · {summary.gba24_delay_note}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* Methodology + disclaimer */}
      <section className="card-elevated card-accent-gold p-5 sm:p-6 space-y-3 relative top-edge">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-accent-gold)] font-bold">
          How to read this page
        </p>
        <p className="text-sm leading-relaxed">
          The model is a <strong>qualitative human-analyst</strong> framework
          (revision 2.0, 28 May 2026), not a machine-learning output. The
          weighting is: 30% ground organisation, 25% historical baseline, 20%
          structural factors, 20% candidate strength, 5% social-media signal.
          Confidence bands (High / Medium / Low) live alongside seat-level
          calls. See the full methodology and source list on the{" "}
          <Link
            to="/methodology"
            className="underline underline-offset-4 text-[color:var(--color-primary)]"
          >
            methodology page
          </Link>
          .
        </p>
        <p className="text-[12px] text-[color:var(--color-muted-foreground)] leading-relaxed">
          This is a published analytical view, not a prophecy. Predictions
          will be wrong on some seats; that is what confidence bands are
          for. The post-mortem after 7 June will compare every call against
          the ECGB result and publish accuracy honestly.
        </p>
      </section>
    </div>
  );
}
