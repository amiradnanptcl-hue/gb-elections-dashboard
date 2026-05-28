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
            <p className="pt-1 text-sm">
              <a
                href="https://www.linkedin.com/in/sa-adnan/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[color:var(--color-primary)] font-medium underline-offset-4 hover:underline"
              >
                <span aria-hidden>↗</span>
                linkedin.com/in/sa-adnan
              </a>
            </p>
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
          election data has existed before, so the strongest contribution this
          project can make is the dataset itself. The dashboard is a viewer
          on top of that dataset — every figure is traceable to a source. We
          do not publish a forecast: a 72-row historical record was too thin
          to support honest per-seat predictions, and we chose data
          transparency over headline-friendly probabilities.
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
          This is an academic and civic-technology dashboard built on public
          records. It is not a prediction of certainty and not an instruction
          to vote.
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
