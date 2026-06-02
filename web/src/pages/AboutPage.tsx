import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export function AboutPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">About</h1>
        <p className="text-[color:var(--color-muted-foreground)] mt-2">
          Why this project exists and who built it.
        </p>
      </div>

      <section className="space-y-5">
        <h2 className="text-xl font-semibold tracking-tight">Who</h2>
        <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-7">
          <img
            src="/about/syed.jpg"
            alt="Syed Aamir Adnan"
            width="160"
            height="160"
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border border-[color:var(--color-border)] shadow-[var(--shadow-md)] object-cover object-top shrink-0"
            loading="eager"
            decoding="async"
          />
          <div className="flex-1 min-w-0 -mt-1 sm:-mt-1.5 space-y-2.5">
            <p className="font-display text-3xl sm:text-4xl leading-[1.05] font-semibold">
              Syed Aamir Adnan
            </p>
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-accent-gold)]">
              Founder · PPP TEAM AI
            </p>
            <p className="text-sm sm:text-base text-[color:var(--color-muted-foreground)] leading-relaxed max-w-xl">
              MSc AI in Business, Queen's University Belfast. Based in
              Belfast, Northern Ireland.
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <a
                href="https://www.linkedin.com/in/sa-adnan/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn profile (opens in a new tab)"
                className="inline-flex items-center gap-2 font-medium text-[color:var(--color-foreground)] hover:text-[color:var(--color-primary)] transition-colors underline-offset-4 hover:underline"
              >
                <LinkedInIcon />
                linkedin.com/in/sa-adnan
              </a>
              <a
                href="https://wa.me/atoshi"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp (opens in a new tab)"
                className="inline-flex items-center gap-2 font-medium text-[color:var(--color-foreground)] hover:text-[color:var(--color-primary)] transition-colors underline-offset-4 hover:underline"
              >
                <WhatsAppIcon />
                wa.me/atoshi
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
            Portfolio
          </p>
          <h2 className="font-display text-3xl sm:text-4xl leading-tight">
            Roles and memberships
          </h2>
        </div>

        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          <RoleCard
            role="Advisor"
            org="Atoshi Blockchain"
            location="Hong Kong"
            note="Advisory remit on AI strategy and product."
            accent="gold"
            image="/about/atoshi.jpg"
            imageAlt="Atoshi Blockchain logo"
          />
          <RoleCard
            role="Advisor"
            org="Atomic Properties LLC"
            location="Dubai, United Arab Emirates"
            accent="gold"
            image="/about/atomic.jpg"
            imageAlt="Atomic Properties LLC logo"
          />
          <RoleCard
            role="Member"
            org="Dubai Real Estate Regulatory Agency"
            location="RERA · Dubai"
            accent="green"
            image="/about/rera.jpg"
            imageAlt="Dubai RERA logo"
          />
          <RoleCard
            role="Active Member"
            org="Queen's Student Managed Fund"
            location="QSMF · Queen's University Belfast"
            accent="green"
            image="/about/qsmf.jpg"
            imageAlt="Queen's Student Managed Fund logo"
          />
          <RoleCard
            role="Member"
            org="Queen's University Alumni Union"
            location="Belfast, Northern Ireland"
            accent="green"
            image="/about/alumni.jpg"
            imageAlt="Queen's University Alumni Union logo"
          />
          <RoleCard
            role="Founder"
            org="PPP TEAM AI"
            location="Belfast, Northern Ireland"
            accent="gold"
            image="/about/ppp-team-ai.png"
            imageAlt="PPP TEAM AI shield logo"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Why</h2>
        <p>
          No clean public version of the Gilgit-Baltistan Assembly
          election data has existed before, so the dataset itself is the
          strongest contribution this project can make. The dashboard is a
          viewer on top of that dataset; every figure is traceable to a
          source.
        </p>
        <p>
          As of revision 4.0 (29 May 2026) the site also publishes a
          four-stage quantitative seat-by-seat forecast for the 7 June
          2026 poll. Stage one anchors the prior to the Independent
          Survey 2026 ground-intelligence report. Stage two runs an
          in-house elastic-net logistic regression trained on the 72-row
          2009, 2015, and 2020 candidate-runs table, with Platt
          calibration and 1000-resample bootstrap confidence intervals.
          Stage three reconciles the regression output against the
          six-pillar KPI rubric (ground organisation 30 percent,
          historical baseline 20 percent, religious and sectarian
          dynamics 15 percent, structural factors 15 percent, candidate
          strength 15 percent, social-media signal 5 percent). Stage
          four cross-validates every seat call against a five-model LLM
          jury (GPT, Claude, Gemini, Llama, Mistral families) at
          temperature zero, with a three-of-five quorum required before
          a call is locked. Every per-seat verdict ships with the
          reasoning, the regression probability, and the jury vote
          attached on the{" "}
          <Link to="/predictions" className="underline underline-offset-4">
            /predictions
          </Link>{" "}
          page.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Affiliation</h2>
        <p>
          This is an individual project produced under the PPP TEAM AI brand.
          The author is openly sympathetic to the Pakistan People's Party
          (PPP). The project is not commissioned by, nor an official channel
          of, PPP or any other party, candidate, or media organisation.
        </p>
        <p>
          The dataset and pipeline code are published as open source so
          the analysis can be inspected, criticised, and reproduced
          independently of the author's political sympathies.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Disclaimer</h2>
        <p>
          This is an academic and civic-technology dashboard built on
          public records and a four-stage quantitative forecast pipeline
          (Independent Survey 2026 prior, in-house elastic-net
          regression, six-pillar KPI rubric, five-model LLM jury). It is
          not a prediction of certainty and not an instruction to vote.
          Every per-seat call is a reasoned reading of the available
          ground evidence as of 31 May 2026, carries an 80 percent
          bootstrap interval where the regression is the binding layer,
          will be wrong on some seats, and will be re-scored against the
          official ECGB result after the 7 June poll.
        </p>
        <p>
          The dashboard freezes at 23:59 PKT on 6 June 2026. Until counts
          begin, the site will show <Badge variant="muted">Polling in progress</Badge>{" "}
          and the post-mortem result tables will land once the ECGB publishes
          official counts.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Licences</h2>
        <p>Code is MIT. Data is CC-BY 4.0.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Contact</h2>
        <p>
          Feedback on the dataset or methodology:{" "}
          <a
            href="mailto:amiradnan.ptcl@gmail.com"
            className="text-[color:var(--color-primary)] underline"
          >
            amiradnan.ptcl@gmail.com
          </a>
        </p>
      </section>
    </div>
  );
}

interface RoleCardProps {
  role: string;
  org: string;
  location?: string;
  note?: string;
  accent?: "gold" | "green";
  className?: string;
  image?: string;
  imageAlt?: string;
}

function RoleCard({
  role,
  org,
  location,
  note,
  accent = "gold",
  className = "",
  image,
  imageAlt,
}: RoleCardProps) {
  const dot =
    accent === "gold"
      ? "bg-[color:var(--color-accent-gold)]"
      : "bg-[color:var(--color-primary)]";
  const labelColor =
    accent === "gold"
      ? "text-[color:var(--color-accent-gold)]"
      : "text-[color:var(--color-primary)]";
  const accentClass =
    accent === "gold" ? "card-accent-gold" : "card-accent-green";
  return (
    <article
      className={`card-elevated ${accentClass} relative overflow-hidden p-5 sm:p-6 space-y-3 top-edge ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          <span
            className={`text-[11px] font-bold uppercase tracking-[0.22em] ${labelColor}`}
          >
            {role}
          </span>
        </div>
        {image && (
          <img
            src={image}
            alt={imageAlt ?? ""}
            width="48"
            height="48"
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-md object-contain bg-white p-1 ring-1 ring-[color:var(--color-border)] shrink-0"
            loading="lazy"
            decoding="async"
          />
        )}
      </div>
      <h3 className="font-display text-xl sm:text-2xl leading-[1.15] font-semibold">
        {org}
      </h3>
      {location && (
        <p className="text-sm text-[color:var(--color-muted-foreground)] font-mono tabular tracking-wide">
          {location}
        </p>
      )}
      {note && (
        <p className="text-sm text-[color:var(--color-foreground)]/80 leading-relaxed">
          {note}
        </p>
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Brand icon glyphs                                                  */
/* Inline SVGs from the Simple Icons set so the marks render sharply  */
/* at any DPI without a network request. Both icons are sized to 18px */
/* so they sit flush with the surrounding 14px text baseline.         */
/* ------------------------------------------------------------------ */

function LinkedInIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden
      className="shrink-0"
      role="img"
    >
      <title>LinkedIn</title>
      <path
        fill="#0A66C2"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden
      className="shrink-0"
      role="img"
    >
      <title>WhatsApp</title>
      <path
        fill="#25D366"
        d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"
      />
    </svg>
  );
}
