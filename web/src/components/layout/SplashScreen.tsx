import { useEffect, useState } from "react";

const TOTAL_MS = 3500;
const FADE_OUT_MS = 600;
const SESSION_KEY = "gb_splash_seen_v1";

export function SplashScreen() {
  // Show on first paint of the session only. Re-renders on route change do
  // not retrigger it because we read sessionStorage synchronously.
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    if (window.sessionStorage.getItem(SESSION_KEY)) return false;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      window.sessionStorage.setItem(SESSION_KEY, "1");
      return false;
    }
    return true;
  });
  const [fading, setFading] = useState<boolean>(false);

  useEffect(() => {
    if (!visible) return;
    const fadeAt = window.setTimeout(() => setFading(true), TOTAL_MS - FADE_OUT_MS);
    const removeAt = window.setTimeout(() => {
      window.sessionStorage.setItem(SESSION_KEY, "1");
      setVisible(false);
    }, TOTAL_MS);
    return () => {
      window.clearTimeout(fadeAt);
      window.clearTimeout(removeAt);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      role="presentation"
      aria-hidden="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[color:var(--color-background)] splash-backdrop"
      style={{
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_OUT_MS}ms ease-out`,
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      <div className="splash-stage relative flex flex-col items-center gap-7 px-6 text-center">
        <span aria-hidden className="splash-glow" />
        <img
          src="/splash.png"
          alt="PPP TEAM AI"
          width="280"
          height="280"
          className="splash-logo h-44 w-44 sm:h-60 sm:w-60 object-contain rounded-xl relative"
          decoding="async"
        />
        <div className="splash-mark flex items-center gap-3 sm:gap-4">
          <span className="h-px w-10 bg-[color:var(--color-accent-gold)]" />
          <span className="splash-title text-sm sm:text-base font-semibold uppercase tracking-[0.22em] text-[color:var(--color-foreground)]">
            GB Elections 2026
          </span>
          <span className="h-px w-10 bg-[color:var(--color-accent-gold)]" />
        </div>
        <div className="splash-sub text-xs sm:text-sm font-medium uppercase tracking-[0.24em] text-[color:var(--color-foreground)]/85">
          PPP TEAM AI · Civic-tech data archive
        </div>
      </div>
      <style>{`
        .splash-backdrop {
          background-image:
            radial-gradient(700px 500px at 80% 10%, oklch(0.40 0.18 27 / 0.20), transparent 60%),
            radial-gradient(700px 500px at 20% 90%, oklch(0.40 0.18 152 / 0.18), transparent 60%);
        }
        @keyframes splashLogoIn {
          0%   { opacity: 0; transform: scale(0.82); }
          60%  { opacity: 1; transform: scale(1.03); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes splashMarkIn {
          0%   { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashGlowPulse {
          0%   { opacity: 0; transform: scale(0.8); }
          60%  { opacity: 1; transform: scale(1.0); }
          100% { opacity: 0.7; transform: scale(1.05); }
        }
        .splash-title,
        .splash-sub {
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
        }
        .splash-logo {
          animation: splashLogoIn 950ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
          box-shadow: 0 18px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px oklch(0.80 0.13 85 / 0.25);
        }
        .splash-mark {
          animation: splashMarkIn 900ms 380ms ease-out both;
        }
        .splash-sub {
          animation: splashMarkIn 900ms 580ms ease-out both;
        }
        .splash-glow {
          position: absolute;
          inset: -40px;
          margin: auto;
          width: 360px;
          height: 360px;
          border-radius: 50%;
          background: radial-gradient(circle, oklch(0.62 0.20 27 / 0.40), oklch(0.66 0.16 152 / 0.20) 45%, transparent 70%);
          filter: blur(40px);
          animation: splashGlowPulse 1400ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
          z-index: 0;
        }
      `}</style>
    </div>
  );
}
