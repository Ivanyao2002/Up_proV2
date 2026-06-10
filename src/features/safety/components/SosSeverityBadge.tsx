import { SOS_SEVERITY_LABELS } from "../lib/sosLabels";
import type { SosSeverity } from "../api/sos.types";

const SEVERITY_CLASS: Record<SosSeverity, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-sky-50 text-sky-800",
  high: "bg-amber-50 text-amber-800",
  critical: "bg-red-600 text-white shadow-sm",
};

interface SosSeverityBadgeProps {
  severity: SosSeverity;
}

export function SosSeverityBadge({ severity }: SosSeverityBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${SEVERITY_CLASS[severity]}`}
    >
      {SOS_SEVERITY_LABELS[severity]}
    </span>
  );
}
