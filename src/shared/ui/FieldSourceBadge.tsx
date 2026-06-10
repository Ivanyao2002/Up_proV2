import type { FieldSource } from "@/features/fleet/lib/documentExtraction.types";

const STYLES: Record<FieldSource, string> = {
  ai: "bg-teal/10 text-teal-dark",
  manual: "bg-canvas text-muted border border-border",
  empty: "hidden",
};

const LABELS: Record<FieldSource, string> = {
  ai: "Extrait IA",
  manual: "Saisi",
  empty: "",
};

export function FieldSourceBadge({ source }: { source: FieldSource }) {
  if (source === "empty") return null;
  return (
    <span
      className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${STYLES[source]}`}
    >
      {LABELS[source]}
    </span>
  );
}

export function fieldInputClass(source: FieldSource): string {
  if (source === "ai") {
    return "ring-2 ring-teal/25 border-teal/40";
  }
  return "";
}
