import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";
export type BadgeSize = "sm" | "md";

const TONE_STYLES: Record<BadgeTone, string> = {
  neutral: "bg-canvas text-muted",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

const SIZE_STYLES: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2.5 py-1 text-xs",
};

interface BadgeProps {
  tone?: BadgeTone;
  size?: BadgeSize;
  className?: string;
  children: ReactNode;
}

/** Badge sémantique — primitif de statut (libellé + ton). */
export function Badge({ tone = "neutral", size = "md", className, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${TONE_STYLES[tone]} ${SIZE_STYLES[size]}${className ? ` ${className}` : ""}`}
    >
      {children}
    </span>
  );
}
