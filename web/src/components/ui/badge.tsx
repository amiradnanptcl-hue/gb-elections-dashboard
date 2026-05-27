import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "muted";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantClass =
    variant === "outline"
      ? "border border-[color:var(--color-border)]"
      : variant === "muted"
        ? "bg-[color:var(--color-muted)] text-[color:var(--color-muted-foreground)]"
        : "bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)]";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClass,
        className,
      )}
      {...props}
    />
  );
}

export interface PartyBadgeProps {
  party: string;
  color: string;
  textOnColor: "light" | "dark";
  flag?: string;
  className?: string;
  /** "chip" = small inline pill (default). "row" = flag-on-left, label-right, news ticker style. */
  variant?: "chip" | "row";
}

export function PartyBadge({
  party,
  color,
  textOnColor,
  flag,
  className,
  variant = "chip",
}: PartyBadgeProps) {
  if (variant === "row" && flag) {
    return (
      <span className={cn("party-badge", className)}>
        <img
          src={flag}
          alt=""
          width="28"
          height="18"
          className="party-flag"
          loading="lazy"
          decoding="async"
        />
        <span>{party}</span>
      </span>
    );
  }

  const text = textOnColor === "light" ? "text-white" : "text-slate-900";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        text,
        className,
      )}
      style={{ backgroundColor: color }}
    >
      {flag && (
        <img
          src={flag}
          alt=""
          width="16"
          height="11"
          className="h-3 w-[18px] object-cover rounded-sm shrink-0"
          loading="lazy"
          decoding="async"
        />
      )}
      <span>{party}</span>
    </span>
  );
}
