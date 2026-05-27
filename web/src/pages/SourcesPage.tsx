import { Link } from "react-router-dom";

interface SourceItem {
  title: string;
  publisher: string;
  date?: string;
  url?: string;
  note?: string;
}

interface SourceGroup {
  heading: string;
  description?: string;
  items: SourceItem[];
}

const SOURCES: SourceGroup[] = [
  {
    heading: "Official ECGB / ECP",
    description:
      "Primary records published by the election commissions. These are the source of truth for symbol allocation, polling-day logistics and the registered-voter rolls.",
    items: [
      {
        title: "ECGB Form-33 · Allocated-symbols sheet (parties)",
        publisher: "Election Commission of Gilgit-Baltistan",
        date: "2026",
        url: "https://ecgb.gov.pk/storage/attachments/P60sv18v3lIzEcgBl3XooTUChhAKMXyqLj7h2FwZ.jpg",
      },
      {
        title: "ECGB · Independent candidate symbols sheet",
        publisher: "Election Commission of Gilgit-Baltistan",
        date: "2026",
        url: "https://ecgb.gov.pk/storage/attachments/ZiSvNKGXOagYqNitD3uchdaeAObLurOOvxOFoXuW.jpg",
        note: "Each independent receives an individual symbol from this sheet, not a shared icon.",
      },
      {
        title: "ECP · List of Allotted Symbols (13 January 2026)",
        publisher: "Election Commission of Pakistan",
        date: "2026-01-13",
        url: "https://ecp.gov.pk/storage/files/2/PF%20wing/13-1-2026/List%20of%20Allotted%20Symbols%2013-1-2026.pdf",
      },
      {
        title: "ECGB · General Elections (2009, 2015, 2020 results PDFs)",
        publisher: "Election Commission of Gilgit-Baltistan",
        url: "https://ecgb.gov.pk/pages/general-elections",
        note: "Used as cross-validation against the Wikipedia scrape.",
      },
    ],
  },
  {
    heading: "News and reporting",
    description:
      "Pakistani news outlets used to corroborate party-ticket announcements and candidate-field counts.",
    items: [
      {
        title: "Islamabad Post · 693-candidate count",
        publisher: "Islamabad Post",
        date: "May 2026",
        note: "Reports the total nomination-paper count and Gilgit-II as the most contested seat.",
      },
      {
        title: "Pamir Times · Candidate filing briefings",
        publisher: "Pamir Times",
        date: "May 2026",
        note: "Source for the 272 independents figure and the 645 men / 19 women split.",
      },
      {
        title: "Kashmir English · PML-N and PPP ticket announcements",
        publisher: "Kashmir English",
        date: "May 2026",
      },
      {
        title: "Click Pakistan · PTI 23-candidate slate",
        publisher: "Click Pakistan",
        date: "2026-05-11",
      },
      {
        title: "ARY News · IPP candidate briefing",
        publisher: "ARY News",
        date: "2026-04-23",
      },
      {
        title: "The News PK · Election Commission announcements",
        publisher: "The News",
        url: "https://www.thenews.com.pk",
      },
      {
        title: "Dawn · PPP demands election schedule",
        publisher: "Dawn",
        date: "2026-04-04",
      },
    ],
  },
  {
    heading: "Reference and historical context",
    description: "Background sources used in the cleaning and model pipelines.",
    items: [
      {
        title: "Wikipedia · 2020 Gilgit-Baltistan Assembly election",
        publisher: "Wikipedia",
        url: "https://en.wikipedia.org/wiki/2020_Gilgit-Baltistan_Assembly_election",
      },
      {
        title: "Wikipedia · 2026 Gilgit Baltistan Assembly election",
        publisher: "Wikipedia",
        url: "https://en.wikipedia.org/wiki/2026_Gilgit_Baltistan_Assembly_election",
      },
      {
        title: "Pakistan Bureau of Statistics · 2023 Census (district-level)",
        publisher: "PBS",
        url: "https://www.pbs.gov.pk",
      },
      {
        title: "FAFEN 2020 observation report",
        publisher: "Free and Fair Election Network",
        url: "https://anfrel.org/wp-content/uploads/2020/11/GBA-Elections-2020-FAFEN-Preliminiary-Observation-Report.pdf",
      },
    ],
  },
  {
    heading: "Public Meta / Instagram posts",
    description:
      "Surfaced via Meta's public search interface only. No private timelines or comments are scraped. For comment-level analysis the project would apply to Meta Content Library.",
    items: [
      {
        title: "PTI Official · 23-candidate slate",
        publisher: "Instagram · @ptiofficial",
        date: "2026-05-12",
        url: "https://www.instagram.com/p/DYOus1CDFiM/",
      },
      {
        title: "PML-N · candidate-slate post",
        publisher: "Instagram · @pmln",
        date: "2026-05-12",
        url: "https://www.instagram.com/p/DYPi6zgoYcj/",
      },
      {
        title: "ARY News · IPP briefing",
        publisher: "Instagram · @arynewsofficial",
        date: "2026-04-23",
        url: "https://www.instagram.com/p/DXekj9eCiCk/",
      },
      {
        title: "Pamir Times · 403 candidates incl. 272 independents",
        publisher: "Instagram · @pamirtimes",
        date: "2026-05-13",
        url: "https://www.instagram.com/p/DYSYTKHFroP/",
      },
      {
        title: "IMN · 7 June 2026 confirmation",
        publisher: "Instagram · IMN",
        date: "2026-04-11",
        url: "https://www.instagram.com/p/DW_VhaWjm_6/",
      },
      {
        title: "IMN · 24 January 2026 proposal (later revised)",
        publisher: "Instagram · IMN",
        date: "2025-11-27",
        url: "https://www.instagram.com/p/DRj_6fjlcpC/",
      },
      {
        title: "Dawn Today · PPP demands schedule",
        publisher: "Instagram · @dawn_today",
        date: "2026-04-04",
        url: "https://www.instagram.com/p/DWtGvKSDQkF/",
      },
    ],
  },
  {
    heading: "Internal research artefacts",
    description:
      "The compiled research pack lives in the repository so every figure on this site can be traced to a source file.",
    items: [
      {
        title: "docs/research_pack.md",
        publisher: "PPP TEAM AI · this project",
        note: "Consolidated reference document with cleaned data tables and provenance notes.",
      },
      {
        title: "data/raw/research/*.csv",
        publisher: "PPP TEAM AI · this project",
        note: "Structured extracts: polls, party tickets, candidate counts, election metadata, notable disqualifications.",
      },
      {
        title: "data/raw/research/parties_2026_symbols_official.json",
        publisher: "PPP TEAM AI · this project",
        note: "Mirror of the official ECGB Form-33 allocation, used to populate the dashboard's symbol map.",
      },
    ],
  },
];

export function SourcesPage() {
  return (
    <div className="space-y-10 max-w-4xl">
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
              Research and sources
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.05]">
            Where every number on this site comes from
          </h1>
          <p className="text-[color:var(--color-muted-foreground)] text-base sm:text-lg max-w-2xl leading-relaxed">
            Open dataset, transparent model, citeable inputs. Each figure on
            the home and methodology pages traces back to one of the sources
            below. The compiled research pack is committed in the repository
            so the trail stays reproducible.
          </p>
        </div>
      </header>

      <div className="space-y-10">
        {SOURCES.map((group) => (
          <section key={group.heading} className="space-y-4">
            <div className="space-y-1">
              <h2 className="font-display text-2xl sm:text-3xl">
                {group.heading}
              </h2>
              {group.description && (
                <p className="text-sm text-[color:var(--color-muted-foreground)] max-w-3xl">
                  {group.description}
                </p>
              )}
            </div>
            <ul className="space-y-2">
              {group.items.map((item, i) => (
                <li
                  key={`${group.heading}-${i}`}
                  className="card-elevated p-4 sm:p-5 flex flex-col gap-1.5"
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-medium">
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[color:var(--color-primary)] underline-offset-4 hover:underline"
                        >
                          {item.title} <span aria-hidden>↗</span>
                        </a>
                      ) : (
                        item.title
                      )}
                    </span>
                    <span className="text-xs text-[color:var(--color-muted-foreground)] font-mono tabular tracking-wide">
                      {item.publisher}
                      {item.date ? ` · ${item.date}` : ""}
                    </span>
                  </div>
                  {item.note && (
                    <p className="text-sm text-[color:var(--color-muted-foreground)]">
                      {item.note}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
