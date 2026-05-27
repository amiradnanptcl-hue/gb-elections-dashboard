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
  className?: string;
  short?: boolean;
}

export function PartyBadge({
  party,
  color,
  textOnColor,
  className,
}: PartyBadgeProps) {
  const text = textOnColor === "light" ? "text-white" : "text-slate-900";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        text,
        className,
      )}
      style={{ backgroundColor: color }}
    >
      {party}
    </span>
  );
}
