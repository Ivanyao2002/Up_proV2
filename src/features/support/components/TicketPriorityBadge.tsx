import type { AgentTicketPriority } from "../api/agentTicket.types";

const STYLES: Record<AgentTicketPriority, string> = {
  high  : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  normal: "bg-canvas text-foreground",
  low   : "bg-canvas text-muted",
};

const LABELS: Record<AgentTicketPriority, string> = {
  high  : "Haute",
  normal: "Normale",
  low   : "Basse",
};

interface Props {
  priority : AgentTicketPriority;
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
