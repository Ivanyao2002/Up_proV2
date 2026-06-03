interface TripRoutePreviewProps {
  fromLabel: string;
  toLabel: string;
  fromCoords?: { lat: number; lng: number };
  toCoords?: { lat: number; lng: number };
}

export function TripRoutePreview({
  fromLabel,
  toLabel,
  fromCoords,
  toCoords,
}: TripRoutePreviewProps) {
  const hasCoords = fromCoords && toCoords;

  return (
    <div className="relative h-48 overflow-hidden rounded-card border border-border bg-map">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(64,81,137,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(64,81,137,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
        }}
      />
      {hasCoords ? (
        <svg className="absolute inset-0 h-full w-full" aria-hidden>
          <line
            x1="20%"
            y1="70%"
            x2="75%"
            y2="25%"
            stroke="#0ab39c"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
          <circle cx="20%" cy="70%" r="6" fill="#405189" />
          <circle cx="75%" cy="25%" r="6" fill="#0ab39c" />
        </svg>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-px w-2/3 bg-teal/50" />
        </div>
      )}
      <div className="absolute bottom-3 left-3 right-3 flex justify-between gap-2 text-[10px]">
        <span className="max-w-[45%] truncate rounded bg-surface/90 px-2 py-1 text-foreground shadow-sm">
          {fromLabel}
        </span>
        <span className="max-w-[45%] truncate rounded bg-surface/90 px-2 py-1 text-foreground shadow-sm">
          {toLabel}
        </span>
      </div>
    </div>
  );
}
