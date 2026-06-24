import type { Zone } from "@/shared/types";
import { Badge, type BadgeTone } from "./Badge";

const MAP: Record<Zone["type"], { label: string; tone: BadgeTone }> = {
  standard: { label: "Standard", tone: "neutral" },
  surge: { label: "Surge", tone: "success" },
  airport: { label: "Aéroport", tone: "info" },
};

export function ZoneTypePill({ type }: { type: Zone["type"] }) {
  const { label, tone } = MAP[type];
  return <Badge tone={tone}>{label}</Badge>;
}
