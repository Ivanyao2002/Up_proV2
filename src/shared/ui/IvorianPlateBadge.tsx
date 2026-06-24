"use client";

import { parseIvorianPlate, normalizePlateRaw } from "@/shared/lib/ivorianPlate";

const CI_BLUE = "#003DA5";
const CI_ORANGE = "#F77F00";

interface IvorianPlateBadgeProps {
  plate: string;
  size?: "sm" | "md";
  className?: string;
}

export function IvorianPlateBadge({
  plate,
  size = "sm",
  className = "",
}: IvorianPlateBadgeProps) {
  const parsed = parseIvorianPlate(plate);
  const raw = normalizePlateRaw(plate);

  if (!raw) {
    return <span className="text-muted">—</span>;
  }

  const height = size === "sm" ? "h-7" : "h-9";
  const textSize = size === "sm" ? "text-[11px]" : "text-sm";
  const bandWidth = size === "sm" ? "w-4" : "w-5";
  const minWidth = size === "sm" ? "min-w-[7.5rem]" : "min-w-[9.5rem]";

  if (!parsed) {
    return (
      <span
        className={`inline-flex items-center rounded border border-border bg-surface px-2 font-mono font-semibold text-foreground ${height} ${textSize} ${className}`}
      >
        {raw}
      </span>
    );
  }

  if (parsed.variant === "siv") {
    // Plaque SIV ivoirienne : fond blanc, texte noir, bande bleue « CI / 01 » à DROITE
    // uniquement (pas de bande gauche, contrairement aux plaques UE).
    return (
      <span
        className={`inline-flex overflow-hidden rounded border border-[#c5c5c5] bg-white font-bold text-black shadow-sm ${height} ${minWidth} ${className}`}
        title={parsed.display}
      >
        <span
          className={`flex min-w-0 flex-1 items-center justify-center pl-2 tracking-wide ${textSize}`}
        >
          {`${parsed.letters1}-${parsed.numbers}-${parsed.letters2}`}
        </span>
        <span
          className={`${bandWidth} relative flex shrink-0 flex-col items-center justify-between py-0.5 text-[7px] font-bold leading-none text-white`}
          style={{ backgroundColor: CI_BLUE }}
          aria-hidden
        >
          <span>CI</span>
          <span>{parsed.region ?? "01"}</span>
        </span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex overflow-hidden rounded border border-[#002d7a] font-bold text-white shadow-sm ${height} ${minWidth} ${className}`}
      title={parsed.display}
    >
      <span
        className={`flex min-w-0 flex-1 items-center justify-center whitespace-nowrap tracking-wide ${textSize}`}
        style={{ backgroundColor: CI_BLUE }}
      >
        {parsed.display}
      </span>
      <span
        className={`${bandWidth} flex shrink-0 flex-col items-center justify-between py-0.5 text-[7px] font-bold leading-none text-white`}
        style={{ backgroundColor: CI_ORANGE }}
        aria-hidden
      >
        <span className="h-2 w-2 rounded-full border border-white/60" />
        <span>CI</span>
      </span>
    </span>
  );
}
