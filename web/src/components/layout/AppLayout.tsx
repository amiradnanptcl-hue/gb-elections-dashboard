import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "Home", end: true },
  { to: "/records", label: "Records" },
  { to: "/map", label: "Map" },
  { to: "/anthems", label: "Anthems" },
  { to: "/methodology", label: "Methodology" },
  { to: "/about", label: "About" },
];

export function AppLayout() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className={cn(
          "sticky top-0 z-40 glass transition-shadow duration-300",
          scrolled
            ? "shadow-[0_1px_0_0_var(--color-border-strong)]"
            : "shadow-[0_1px_0_0_var(--color-border)]",
        )}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <NavLink to="/" className="group flex items-center gap-3 min-w-0">
            <span className="relative inline-flex shrink-0">
              <span
                aria-hidden
                className="absolute inset-0 -m-1 rounded-lg bg-[color:var(--color-accent-gold-soft)] opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100"
              />
              <img
                src="/logo.png"
                alt="PPP TEAM AI"
                width="44"
                height="44"
                className="relative h-11 w-11 rounded-full object-cover ring-1 ring-[color:var(--color-border)]"
                loading="eager"
                decoding="async"
              />
            </span>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold tracking-tight leading-none truncate">
                GB Elections Forecast 2026
              </span>
              <span className="hidden sm:block text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)] mt-1">
                PPP TEAM AI · Civic-tech
              </span>
            </div>
          </NavLink>
          <nav
            className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm max-w-full"
            aria-label="Primary"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "relative px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 font-semibold tracking-wide",
                    isActive
                      ? "text-[color:var(--color-foreground)]"
                      : "text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)]",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    {isActive && (
                      <span
                        aria-hidden
                        className="absolute inset-x-2 -bottom-[7px] h-px bg-gradient-to-r from-transparent via-[color:var(--color-accent-gold)] to-transparent"
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-12">
          <Outlet />
        </div>
      </main>

      <footer className="border-t mt-16 bg-[color:var(--color-surface)]/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[color:var(--color-muted-foreground)]">
          <div className="space-y-1">
            <p className="font-medium text-[color:var(--color-foreground)]">
              GB Elections Forecast 2026
            </p>
            <p>Public-records dashboard for the GB Legislative Assembly election, 7 June 2026. Data only, no forecast.</p>
          </div>
          <div className="space-y-1 sm:text-right">
            <p className="font-medium text-[color:var(--color-foreground)]">
              PPP TEAM AI · Belfast, Northern Ireland
            </p>
            <p>Founder: Syed Aamir Adnan. Code MIT · Data CC-BY 4.0.</p>
            <p>Not commissioned by, nor an official channel of, PPP or any other party.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
