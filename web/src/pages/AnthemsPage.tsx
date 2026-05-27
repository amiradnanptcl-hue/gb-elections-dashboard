import { Link } from "react-router-dom";

interface Anthem {
  /** Display title shown on the card. Kept generic because Facebook does
   * not always expose a clean title per video to anyone who is not logged
   * in. The card therefore leans on the showcase image plus the host. */
  title: string;
  /** Facebook video URL provided by the team. Opens in a new tab. */
  url: string;
  /** Optional one-line note. Used to mark the showcase reel. */
  note?: string;
}

// Sourced from the team's PPP TEAM AI campaign output. The first item is the
// flagship reel and is rendered as a hero card; the remaining ten render as
// a tile grid below. Numbers are display indexes only.
const ANTHEMS: Anthem[] = [
  {
    title: "Showcase reel",
    url: "https://www.facebook.com/reel/1376764577618071/?s=single_unit",
    note: "Flagship anthem reel by PPP TEAM AI.",
  },
  {
    title: "Anthem · v.2479487155836107",
    url: "https://www.facebook.com/watch/?ref=saved&v=2479487155836107",
  },
  {
    title: "Anthem · v.981081954505596",
    url: "https://www.facebook.com/watch/?ref=saved&v=981081954505596",
  },
  {
    title: "Anthem · v.1652465215971622",
    url: "https://www.facebook.com/watch/?ref=saved&v=1652465215971622",
  },
  {
    title: "Anthem · share/v/1GsYqbvtGm",
    url: "https://www.facebook.com/share/v/1GsYqbvtGm/",
  },
  {
    title: "Anthem · share/r/1HyUyEiVkC",
    url: "https://www.facebook.com/share/r/1HyUyEiVkC/",
  },
  {
    title: "Reel · 751166554684809",
    url: "https://www.facebook.com/reel/751166554684809",
  },
  {
    title: "Anthem · share/v/1CfCcEpFXM",
    url: "https://www.facebook.com/share/v/1CfCcEpFXM/",
  },
  {
    title: "Reel · 1622355942325881",
    url: "https://www.facebook.com/reel/1622355942325881/?s=single_unit",
  },
  {
    title: "Reel · 1716535029532819",
    url: "https://www.facebook.com/reel/1716535029532819",
  },
  {
    title: "Reel · 1415561317276137",
    url: "https://www.facebook.com/reel/1415561317276137",
  },
  {
    title: "Anthem · share/r/1CjWWHaMHd",
    url: "https://www.facebook.com/share/r/1CjWWHaMHd/",
  },
  {
    title: "Reel · 1005586135538533",
    url: "https://www.facebook.com/reel/1005586135538533",
  },
];

export function AnthemsPage() {
  const [showcase, ...rest] = ANTHEMS;

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
              PPP TEAM AI · campaign output
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.05]">
            Party anthems
          </h1>
          <p className="text-[color:var(--color-muted-foreground)] text-base sm:text-lg max-w-2xl leading-relaxed">
            A collection of campaign anthems produced by PPP TEAM AI for the
            2026 cycle. Every link opens the original Facebook reel or video
            in a new tab so the views accrue on the source platform.
          </p>
        </div>
      </header>

      {/* Showcase reel */}
      <section className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-accent-gold)] font-bold">
            Showcase
          </p>
          <h2 className="font-display text-3xl">
            Open the flagship reel
          </h2>
        </div>
        <a
          href={showcase.url}
          target="_blank"
          rel="noopener noreferrer"
          className="card-elevated card-accent-gold p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group block"
        >
          <div className="space-y-2 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-accent-gold)] font-bold">
              Reel · 1376764577618071
            </p>
            <p className="text-xl sm:text-2xl font-display leading-tight">
              {showcase.title}
            </p>
            <p className="text-sm text-[color:var(--color-muted-foreground)] max-w-xl">
              {showcase.note}
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2 text-sm font-semibold text-[color:var(--color-foreground)] group-hover:text-[color:var(--color-accent-gold)] transition-colors whitespace-nowrap">
            Watch on Facebook
            <span aria-hidden className="text-base transition-transform group-hover:translate-x-1">
              ↗
            </span>
          </div>
        </a>
      </section>

      {/* Grid of remaining anthems */}
      <section className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
            All anthems
          </p>
          <h2 className="font-display text-2xl sm:text-3xl">
            {ANTHEMS.length} reels in the playlist
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((a, idx) => (
            <a
              key={a.url}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card-elevated p-4 space-y-2 group block"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
                {String(idx + 2).padStart(2, "0")} · Facebook
              </p>
              <p className="text-sm font-medium leading-snug break-words">
                {a.title}
              </p>
              <p className="text-[11px] text-[color:var(--color-muted-foreground)] inline-flex items-center gap-1 group-hover:text-[color:var(--color-foreground)] transition-colors">
                Watch on Facebook
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                  ↗
                </span>
              </p>
            </a>
          ))}
        </div>
      </section>

      <section className="card-elevated card-accent-gold p-5 sm:p-6 space-y-2 top-edge relative">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-accent-gold)] font-bold">
          Disclosure
        </p>
        <p className="text-sm text-[color:var(--color-foreground)] leading-relaxed">
          Anthem content is produced by PPP TEAM AI as creative output. It is
          not commissioned by, nor an official channel of, any political
          party. The dashboard simply mirrors the team's public Facebook
          uploads so visitors can find them in one place.
        </p>
      </section>
    </div>
  );
}
