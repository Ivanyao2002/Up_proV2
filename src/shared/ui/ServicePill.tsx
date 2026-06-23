import type { JSX } from "react";
import type { Trip } from "@/shared/types";
import { getServiceLabel } from "@/shared/lib/tripLabels";

type TripService = Trip["service"];

const STYLES: Record<TripService, string> = {
  taxi: "bg-navy/10 text-foreground",
  delivery: "bg-teal/15 text-teal-dark",
  rental: "bg-canvas text-muted border border-border",
  freight: "bg-amber-50 text-amber-800",
};

function IconTaxi({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-3h8l2 3h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />
      <circle cx="7.5" cy="17.5" r="2.5" /><circle cx="16.5" cy="17.5" r="2.5" />
      <path d="M5 9h14" />
    </svg>
  );
}

function IconDelivery({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9h11v10H3z" /><path d="M14 5h4l3 4v5h-7V5z" />
      <circle cx="6.5" cy="19.5" r="1.5" /><circle cx="18.5" cy="19.5" r="1.5" />
    </svg>
  );
}

function IconRental({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="10" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <circle cx="7.5" cy="17.5" r="2.5" /><circle cx="16.5" cy="17.5" r="2.5" />
    </svg>
  );
}

function IconFreight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" /><line x1="12" x2="12" y1="22" y2="12" />
    </svg>
  );
}

const ICONS: Record<TripService, ({ className }: { className?: string }) => JSX.Element> = {
  taxi: IconTaxi,
  delivery: IconDelivery,
  rental: IconRental,
  freight: IconFreight,
};

export function ServicePill({ service }: { service: TripService }) {
  const Icon = ICONS[service];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[service]}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {getServiceLabel(service)}
    </span>
  );
}
