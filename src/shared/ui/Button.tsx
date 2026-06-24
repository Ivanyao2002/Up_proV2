import { type ButtonHTMLAttributes } from "react";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Affiche un spinner, désactive le bouton et conserve sa largeur. */
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-teal text-white hover:bg-teal-dark active:scale-[0.98] shadow-sm focus-visible:ring-teal",
  secondary:
    "bg-surface text-foreground border border-border hover:bg-surface-hover active:scale-[0.98] focus-visible:ring-teal",
  ghost:
    "bg-transparent text-muted hover:text-foreground hover:bg-surface-hover focus-visible:ring-teal",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium outline-none transition-[transform,background-color,opacity,box-shadow,color] duration-150 focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}
