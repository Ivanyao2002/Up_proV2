import type { ReactNode } from "react";

export function TicketDetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
