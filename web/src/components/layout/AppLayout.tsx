import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "Home", end: true },
  { to: "/records", label: "Records" },
  { to: "/predictions", label: "2026 Predictions" },
  { to: "/map", label: "Map" },
  { to: "/anthems", label: "Anthems" },
  { to: "/methodology", label: "Methodology" },
  { to: "/about", label: "About" },
];

export function AppLayout() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile drawer on route change so a tap on a nav item never
  // leaves the menu open over the new page.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll while the drawer is open and ESC to close.
  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

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
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Brand */}
          <NavLink
            to="/"
            className="group flex items-center gap-3 min-w-0 shrink"
          >
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
                className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-full object-cover ring-1 ring-[color:var(--color-border)]"
                loading="eager"
                decoding="async"
              />
            </span>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold tracking-tight leading-none truncate text-sm sm:text-base">
                GB Elections Forecast 2026
              </span>
              <span className="hidden sm:block text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)] mt-1">
                PPP TEAM AI · Civic-tech
              </span>
            </div>
          </NavLink>

          {/* Desktop nav — visible at lg breakpoint and up.
             7 nav items wrap badly under lg, so collapse to hamburger there. */}
          <nav
            className="hidden lg:flex items-center gap-x-1 text-sm shrink-0"
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

          {/* Mobile + tablet hamburger trigger */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-md border border-[color:var(--color-border-strong)] bg-[color:var(--color-card)] hover:bg-[color:var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent-gold)] transition-colors shrink-0"
          >
            {mobileOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>

        {/* Mobile drawer — full-width sheet that slides down under the
           glass header. Uses the same glass background so the layout
           reads as a single floating header that's just expanded. */}
        <div
          id="mobile-nav-drawer"
          className={cn(
            "lg:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-out border-t",
            mobileOpen
              ? "max-h-[80vh] opacity-100 border-[color:var(--color-border-strong)]"
              : "max-h-0 opacity-0 border-transparent",
          )}
        >
          <nav
            className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex flex-col"
            aria-label="Primary mobile"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "relative flex items-center justify-between gap-3 px-3 py-3 rounded-lg transition-colors font-semibold tracking-wide text-base",
                    isActive
                      ? "bg-[color:var(--color-accent-gold-soft)]/35 text-[color:var(--color-foreground)]"
                      : "text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)] hover:bg-[color:var(--color-muted)]/60",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{item.label}</span>
                    <span
                      aria-hidden
                      className={cn(
                        "text-[color:var(--color-accent-gold)] transition-opacity",
                        isActive ? "opacity-100" : "opacity-40",
                      )}
                    >
                      →
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Backdrop when the mobile drawer is open. Sits below the header
         but above the page content so a tap outside dismisses the menu. */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm cursor-default"
          tabIndex={-1}
        />
      )}

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
            <p>Public-records dashboard for the GB Assembly election, 7 June 2026. Data only, no forecast.</p>
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

function HamburgerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="h-5 w-5"
      aria-hidden
    >
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="h-5 w-5"
      aria-hidden
    >
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}
