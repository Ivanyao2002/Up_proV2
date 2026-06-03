import { KpiCard, KPI_DARK_VARIANTS } from "@/shared/ui/KpiCard";
import type { LiveMapData } from "@/shared/types";

interface LiveMapStatsBarProps {
  stats: LiveMapData["stats"];
  className?: string;
}

export function LiveMapStatsBar({ stats, className = "" }: LiveMapStatsBarProps) {
  const items = [
    {
      label: "En ligne",
      value: String(stats.drivers_online),
      hint: "chauffeurs disponibles",
    },
    {
      label: "En course",
      value: String(stats.drivers_on_trip),
      hint: "sur la carte",
    },
    {
      label: "Courses actives",
      value: String(stats.active_trips),
      hint: "en temps réel",
    },
    {
      label: "Attente moy.",
      value: `${stats.avg_wait_min} min`,
      hint: "matching",
    },
  ];

  return (
    <div
      className={`grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4 ${className}`}
      role="group"
      aria-label="Indicateurs carte live"
    >
      {items.map((item, index) => (
        <KpiCard
          key={item.label}
          compact
          variant={KPI_DARK_VARIANTS[index]}
          label={item.label}
          value={item.value}
          hint={item.hint}
        />
      ))}
    </div>
  );
}
