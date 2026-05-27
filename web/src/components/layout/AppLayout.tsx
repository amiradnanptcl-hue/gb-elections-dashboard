import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "Home", end: true },
  { to: "/map", label: "Map" },
  { to: "/methodology", label: "Methodology" },
  { to: "/about", label: "About" },
];

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <NavLink to="/" className="flex items-center gap-2 min-w-0">
            <span
              className="inline-block h-6 w-6 rounded-sm bg-[color:var(--color-primary)] shrink-0"
              aria-hidden
            />
            <span className="font-semibold tracking-tight truncate">
              GB Forecast 2026
            </span>
          </NavLink>
          <nav
            className="flex items-center gap-0.5 text-sm overflow-x-auto -mx-1 px-1 max-w-full"
            aria-label="Primary"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0",
                    isActive
                      ? "bg-[color:var(--color-muted)] text-[color:var(--color-foreground)]"
                      : "text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)]",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
          <Outlet />
        </div>
      </main>

      <footer className="border-t mt-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[color:var(--color-muted-foreground)]">
          <p>
            Public reference forecast for the Gilgit-Baltistan Legislative
            Assembly election, 7 June 2026.
          </p>
          <p>
            Code MIT, data CC-BY 4.0. Not affiliated with any party or
            candidate.
          </p>
        </div>
      </footer>
    </div>
  );
}
