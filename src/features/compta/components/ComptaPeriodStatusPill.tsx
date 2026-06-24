import { Badge, type BadgeTone } from "@/shared/ui/Badge";

function resolvePeriodStatus(status: string): { label: string; tone: BadgeTone } {
  const key = status.toLowerCase();
  if (key === "open") {
    return { label: "Ouverte", tone: "success" };
  }
  if (key === "closed") {
    return { label: "Clôturée", tone: "neutral" };
  }
  if (key === "locked") {
    return { label: "Verrouillée", tone: "info" };
  }
  return {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    tone: "neutral",
  };
}

export function formatPeriodType(type?: string): string {
  if (!type) return "—";
  const key = type.toLowerCase();
  if (key === "daily" || key === "day") return "Journalière";
  if (key === "monthly" || key === "month") return "Mensuelle";
  return type;
}

export function ComptaPeriodStatusPill({ status }: { status: string }) {
  const { label, tone } = resolvePeriodStatus(status);
  return <Badge tone={tone}>{label}</Badge>;
}
