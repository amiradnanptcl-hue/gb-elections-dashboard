import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="py-20 text-center space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight">Not found</h1>
      <p className="text-[color:var(--color-muted-foreground)]">
        We could not find that page.
      </p>
      <Link to="/" className="text-[color:var(--color-primary)] underline">
        Back home
      </Link>
    </div>
  );
}
