import type { TicketPriority } from "../api/support.api.contract";

const STYLES: Record<TicketPriority, string> = {
  high  : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  normal: "bg-canvas text-foreground",
  low   : "bg-canvas text-muted",
};

const LABELS: Record<TicketPriority, string> = {
  high  : "Haute",
  normal: "Normale",
  low   : "Basse",
};

interface Props {
  priority : TicketPriority;
  className?: string;
}

export function TicketPriorityBadge({ priority, className = "" }: Props) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[priority]} ${className}`}
    >
      {LABELS[priority]}
    </span>
  );
}
