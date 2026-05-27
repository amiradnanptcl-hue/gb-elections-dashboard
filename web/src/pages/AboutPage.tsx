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

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Who</h2>
        <p>
          Syed Aamir Adnan. MSc AI in Business at Queen's University Belfast.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Why</h2>
        <p>
          No clean public version of the Gilgit-Baltistan Legislative Assembly
          election data has existed before, so the strongest contribution this
          project can make is the dataset. The forecast model and dashboard
          ride on top of it. A pre-registered, holdout-validated prediction
          with honest uncertainty is a better public service than yet another
          opinion piece.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Disclaimer</h2>
        <p>
          This is an academic and civic-technology forecast based on public
          data. It is not a prediction of certainty, not an instruction to
          vote, and not affiliated with any party, candidate, or media
          organisation.
        </p>
        <p>
          The dashboard freezes at 23:59 PKT on 6 June 2026. Until counts
          begin, the site will show <Badge variant="muted">Polling in progress</Badge>{" "}
          and the post-mortem accuracy report will replace the live forecast
          once results are in.
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
