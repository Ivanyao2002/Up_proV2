import type { TicketStatus } from "../api/support.api.contract";

const STYLES: Record<TicketStatus, string> = {
  open       : "bg-navy/10 text-foreground",
  in_progress: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  resolved   : "bg-teal/15 text-teal-dark",
  closed     : "bg-canvas text-muted",
  escalated  : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
};

const LABELS: Record<TicketStatus, string> = {
  open       : "Ouvert",
  in_progress: "En cours",
  resolved   : "Résolu",
  closed     : "Clôturé",
  escalated  : "Escaladé",
};

interface Props {
  status   : TicketStatus;
  className?: string;
}

export function TicketStatusBadge({ status, className = "" }: Props) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]} ${className}`}
    >
      {LABELS[status]}
    </span>
  );
}
