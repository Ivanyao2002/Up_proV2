interface TripRouteAddressesPanelProps {
  fromLabel: string;
  toLabel: string;
}

export function TripRouteAddressesPanel({
  fromLabel,
  toLabel,
}: TripRouteAddressesPanelProps) {
  return (
    <div className="rounded-card border border-border bg-surface p-5 shadow-card">
      <h2 className="text-sm font-semibold text-foreground">Itinéraire</h2>
      <div className="mt-4 space-y-4">
        <div className="flex gap-3">
          <span
            className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-navy ring-4 ring-navy/15"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Prise en charge
            </p>
            <p className="mt-1 text-sm font-medium leading-snug text-foreground">
              {fromLabel}
            </p>
          </div>
        </div>
        <div className="mx-1 h-6 w-px bg-border" aria-hidden />
        <div className="flex gap-3">
          <span
            className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-teal ring-4 ring-teal/15"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Destination
            </p>
            <p className="mt-1 text-sm font-medium leading-snug text-foreground">
              {toLabel}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
