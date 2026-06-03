"use client";

interface ChartFluxProps {
  data: { day: string; revenue: number; commission: number }[];
}

export function ChartFlux({ data }: ChartFluxProps) {
  const max = Math.max(...data.flatMap((d) => [d.revenue, d.commission]), 1);

  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-card">
      <h2 className="text-sm font-semibold text-foreground">Flux hebdomadaire</h2>
      <p className="text-xs text-muted">Revenus vs commissions</p>
      <div className="mt-6 flex h-48 items-end justify-between gap-2">
        {data.map((point, i) => (
          <div key={point.day} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-end justify-center gap-0.5 h-40">
              <div
                className="w-2 rounded-t bg-navy transition-all duration-600 ease-out"
                style={{
                  height: `${(point.revenue / max) * 100}%`,
                  transitionDelay: `${i * 40}ms`,
                }}
                title={`Revenus ${point.revenue}`}
              />
              <div
                className="w-2 rounded-t bg-teal/80 transition-all duration-600 ease-out"
                style={{
                  height: `${(point.commission / max) * 100}%`,
                  transitionDelay: `${i * 40 + 20}ms`,
                }}
                title={`Commission ${point.commission}`}
              />
            </div>
            <span className="text-[10px] text-muted">{point.day}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-navy" /> Revenus
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-teal" /> Commissions
        </span>
      </div>
    </div>
  );
}
