"use client";

import { useMemo, useState } from "react";
import { formatFCFA } from "@/shared/lib/format";

export interface WeeklyFluxPoint {
  day: string;
  revenue: number;
  trips?: number;
}

interface WeeklyRevenueChartProps {
  title?: string;
  data: WeeklyFluxPoint[];
  emptyMessage?: string;
  className?: string;
}

const GRID_LINES = [0.25, 0.5, 0.75];

export function WeeklyRevenueChart({
  title = "Flux 7 jours",
  data,
  emptyMessage = "Aucune donnée disponible",
  className = "",
}: WeeklyRevenueChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const max = useMemo(
    () => Math.max(...data.map((x) => x.revenue), 1),
    [data]
  );

  const peakIndex = useMemo(() => {
    if (data.length === 0) return -1;
    return data.reduce(
      (best, point, index) => (point.revenue > data[best].revenue ? index : best),
      0
    );
  }, [data]);

  const hasData = data.length > 0;
  const hasRevenue = data.some((point) => point.revenue > 0);

  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface shadow-card ${className}`}
    >
      <div className="flex shrink-0 items-start justify-between gap-3 px-6 pt-5 pb-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {hasRevenue && (
            <p className="mt-0.5 text-[11px] text-muted">
              Revenus sur les 7 derniers jours
            </p>
          )}
        </div>
        {hasRevenue && (
          <div className="shrink-0 rounded-full border border-border/80 bg-canvas/60 px-2.5 py-1 text-[11px] tabular-nums text-muted backdrop-blur-sm">
            Pic{" "}
            <span className="font-semibold text-foreground">{formatFCFA(max)}</span>
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="flex min-h-[300px] flex-1 items-center justify-center px-6 pb-6">
          <p className="text-sm text-muted">{emptyMessage}</p>
        </div>
      ) : (
        <div className="relative min-h-[300px] flex-1 px-3 pb-2 sm:px-5">
          <div
            className="pointer-events-none absolute inset-x-3 bottom-8 top-3 sm:inset-x-5"
            aria-hidden
          >
            {GRID_LINES.map((pct) => (
              <div
                key={pct}
                className="absolute left-0 right-0 border-t border-dashed border-border/50"
                style={{ bottom: `${pct * 100}%` }}
              />
            ))}
          </div>

          <div className="relative h-full min-h-[300px]">
            {data.map((point, index) => {
              const heightPercent = (point.revenue / max) * 100;
              const barWidth = 100 / data.length;
              const leftPos = index * barWidth;
              const isHovered = hoveredIndex === index;
              const isPeak = index === peakIndex && point.revenue > 0;
              const hasBar = point.revenue > 0;

              return (
                <div
                  key={point.day}
                  className="absolute bottom-0"
                  style={{
                    left: `${leftPos}%`,
                    width: `${barWidth}%`,
                    height: "100%",
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div className="flex h-full flex-col items-center justify-end px-1.5 sm:px-2.5">
                    {isHovered && (
                      <div className="absolute bottom-full z-20 mb-2 min-w-[148px] -translate-x-1/2 rounded-xl border border-border bg-surface p-3 shadow-[0_8px_30px_rgba(15,23,42,0.12)] left-1/2">
                        <div className="mb-1.5 text-xs font-semibold text-foreground">
                          {point.day}
                        </div>
                        <div className="text-xs text-muted">
                          Revenus{" "}
                          <span className="font-semibold tabular-nums text-foreground">
                            {formatFCFA(point.revenue)}
                          </span>
                        </div>
                        {point.trips != null && (
                          <div className="mt-0.5 text-xs text-muted">
                            Courses{" "}
                            <span className="font-semibold tabular-nums text-foreground">
                              {point.trips}
                            </span>
                          </div>
                        )}
                        <div className="absolute left-1/2 top-full -mt-1 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-border bg-surface" />
                      </div>
                    )}

                    <div
                      className="relative flex w-full flex-col items-center justify-end"
                      style={{ height: "calc(100% - 28px)" }}
                    >
                      {isPeak && hasBar && (
                        <span
                          className={`absolute z-10 h-2 w-2 rounded-full bg-teal shadow-[0_0_0_3px_rgba(20,184,166,0.25)] transition-opacity ${
                            isHovered ? "opacity-100" : "opacity-80"
                          }`}
                          style={{
                            bottom: `calc(${Math.max(heightPercent * 0.88, 5)}% + 6px)`,
                          }}
                        />
                      )}

                      <div
                        className={`relative w-full rounded-t-lg transition-all duration-300 ease-out ${
                          hasBar
                            ? isHovered || isPeak
                              ? "bg-teal shadow-[0_-4px_16px_rgba(20,184,166,0.2)]"
                              : "bg-navy shadow-[0_2px_8px_rgba(30,42,69,0.15)]"
                            : "bg-slate-200/70 dark:bg-slate-700/50"
                        } ${isHovered ? "scale-x-[1.04]" : ""}`}
                        style={{
                          height: hasBar
                            ? `${Math.max(heightPercent * 0.88, 5)}%`
                            : "3px",
                          transitionDelay: `${index * 40}ms`,
                        }}
                      />
                    </div>

                    <span
                      className={`shrink-0 pt-2 pb-1 text-[11px] leading-none transition-colors ${
                        isHovered || isPeak
                          ? "font-semibold text-foreground"
                          : "text-muted"
                      }`}
                    >
                      {point.day}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
