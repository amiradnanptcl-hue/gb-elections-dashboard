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

// Sourced from the team's PPP TEAM AI campaign output. The first two items
// are the flagship reels and render side-by-side inside the gold-accent
// showcase box; the remaining items render as a tile grid below. Numbers are
// display indexes only.
const ANTHEMS: Anthem[] = [
  {
    title: "Shaheedo K Khoon Ki Pechan Hai Bilawal",
    url: "https://www.facebook.com/watch/?ref=saved&v=2092690798798033",
    note: "Latest flagship anthem reel by PPP TEAM AI.",
  },
  {
    title: "Shair Ka Shikaar Teera Karay Ga",
    url: "https://www.facebook.com/reel/1376764577618071/?s=single_unit",
    note: "Flagship anthem reel by PPP TEAM AI.",
  },
  {
    title: "Just-released anthem",
    url: "https://www.facebook.com/share/r/18zUPSZWC1/",
    note: "Latest anthem from PPP TEAM AI, released 28 May 2026.",
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
    title: "Anthem · v.4985037495116120",
    url: "https://www.facebook.com/watch/?ref=saved&v=4985037495116120",
  },
];

/** Extract a stable Facebook ID for display in the small chip on each
 * showcase card. Supports three URL shapes used by the team's links:
 *   /reel/<id>            -> <id>
 *   /share/[rv]/<id>/     -> <id>
 *   /watch/?v=<id>        -> <id>
 * Falls back to the last non-empty path segment. */
function extractReelId(url: string): string {
  try {
    const u = new URL(url);
    const v = u.searchParams.get("v");
    if (v) return v;
    const path = u.pathname.replace(/\/$/, "");
    const segments = path.split("/").filter(Boolean);
    return segments[segments.length - 1] ?? "";
  } catch {
    // Defensive: malformed URL string. Fall back to the old behaviour.
    const path = url.split("?")[0].replace(/\/$/, "");
    const segments = path.split("/");
    return segments[segments.length - 1] ?? "";
  }
}

export function AnthemsPage() {
  const [showcase, newRelease, ...rest] = ANTHEMS;
  const showcasePair = [showcase, newRelease];

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
            2026 cycle. Every link opens the original YouTube video or
            Facebook reel in a new tab so the views accrue on the source
            platform.
          </p>
        </div>
      </header>

      {/* Featured anthem — single hero card above the showcase pair.
         Treated as the lead reel of the entire collection: full-width
         card, 16:9 YouTube thumbnail with play-button overlay on the
         left, editorial text panel on the right. */}
      <section className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-accent-gold)] font-bold">
            Featured anthem
          </p>
          <h2 className="font-display text-3xl">
            The headline reel of the cycle
          </h2>
        </div>
        <a
          href="https://www.youtube.com/watch?v=379eb8GqmJw"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Talha Anjum — Yeh Urta Nahi Chalta Teer Hai (opens on YouTube)"
          className="card-elevated card-accent-gold top-edge group block relative overflow-hidden"
        >
          <div className="grid sm:grid-cols-[1.15fr_1fr] gap-0">
            {/* Thumbnail panel */}
            <div className="relative aspect-video sm:aspect-auto overflow-hidden bg-black">
              <img
                src="https://img.youtube.com/vi/379eb8GqmJw/hqdefault.jpg"
                srcSet="https://img.youtube.com/vi/379eb8GqmJw/hqdefault.jpg 480w, https://img.youtube.com/vi/379eb8GqmJw/maxresdefault.jpg 1280w"
                sizes="(min-width: 640px) 60vw, 100vw"
                alt="Talha Anjum — Yeh Urta Nahi Chalta Teer Hai (YouTube thumbnail)"
                loading="eager"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
              {/* Bottom gradient for legibility */}
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/65 via-black/20 to-transparent pointer-events-none"
              />
              {/* Centred play button */}
              <span
                aria-hidden
                className="absolute inset-0 grid place-items-center pointer-events-none"
              >
                <span className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/95 text-[#FF0000] shadow-[0_8px_28px_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover:scale-110">
                  <svg
                    viewBox="0 0 24 24"
                    width="36"
                    height="36"
                    fill="currentColor"
                    aria-hidden
                  >
                    <polygon points="7,4 7,20 20,12" />
                  </svg>
                </span>
              </span>
              {/* YouTube badge top-left */}
              <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white bg-black/75 backdrop-blur-sm px-2 py-1 rounded-md">
                <YouTubeIcon />
                YouTube
              </span>
            </div>

            {/* Text panel */}
            <div className="p-6 sm:p-7 lg:p-8 flex flex-col gap-4 min-w-0">
              <div className="space-y-2 min-w-0">
                <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-accent-gold)] font-bold">
                  Featured · most-watched reel
                </p>
                <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-[color:var(--color-muted-foreground)]">
                  Talha Anjum
                </p>
                <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl leading-[1.1] break-words">
                  Yeh Urta Nahi Chalta Teer Hai
                </h3>
                <p className="text-sm text-[color:var(--color-muted-foreground)] leading-relaxed pt-1">
                  The headline reel of the PPP TEAM AI campaign output for
                  the 2026 cycle. Tap the play button to watch on YouTube.
                </p>
              </div>
              <div className="mt-auto flex items-center gap-2 text-sm font-semibold text-[color:var(--color-foreground)] group-hover:text-[color:var(--color-accent-gold)] transition-colors whitespace-nowrap">
                Watch on YouTube
                <span aria-hidden className="text-base transition-transform group-hover:translate-x-1">
                  ↗
                </span>
              </div>
            </div>
          </div>
        </a>
      </section>

      {/* Showcase: flagship reel + just-released anthem, side by side in one box. */}
      <section className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-accent-gold)] font-bold">
            Showcase
          </p>
          <h2 className="font-display text-3xl">
            Open the flagship reels
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {showcasePair.map((item, i) => {
            const isJustReleased = i === 1;
            return (
              <a
                key={item.url}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card-elevated card-accent-gold p-6 sm:p-7 flex flex-col gap-4 group block relative top-edge"
              >
                {isJustReleased && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--color-accent-gold)] bg-[color:var(--color-accent-gold-soft)]/40 px-2 py-0.5 rounded-md border border-[color:var(--color-accent-gold)]/40">
                    Just released
                  </span>
                )}
                <div className="space-y-2 min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-accent-gold)] font-bold">
                    Reel · {extractReelId(item.url)}
                  </p>
                  <p className="text-xl sm:text-2xl font-display leading-tight">
                    {item.title}
                  </p>
                  <p className="text-sm text-[color:var(--color-muted-foreground)]">
                    {item.note}
                  </p>
                </div>
                <div className="mt-auto flex items-center gap-2 text-sm font-semibold text-[color:var(--color-foreground)] group-hover:text-[color:var(--color-accent-gold)] transition-colors whitespace-nowrap">
                  Watch on Facebook
                  <span aria-hidden className="text-base transition-transform group-hover:translate-x-1">
                    ↗
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {/* Grid of remaining anthems */}
      <section className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
            All anthems
          </p>
          <h2 className="font-display text-2xl sm:text-3xl">
            {ANTHEMS.length + 1} reels in the playlist
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
                {String(idx + 3).padStart(2, "0")} · Facebook
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

/* ------------------------------------------------------------------ */
/* YouTube brand glyph (Simple Icons path), used inside the featured  */
/* anthem card's "YouTube" badge. Renders sharply at any DPI; no      */
/* extra network request.                                             */
/* ------------------------------------------------------------------ */
function YouTubeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      aria-hidden
      className="shrink-0"
      role="img"
    >
      <title>YouTube</title>
      <path
        fill="#FF0000"
        d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
      />
    </svg>
  );
}
