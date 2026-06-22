"use client";

import { KpiCard } from "@/shared/ui/KpiCard";
import { useDispatchCapacity } from "../api/dispatchConfig.queries";
import type { DispatchCountryCode } from "../api/dispatchConfig.api.types";

interface DispatchCapacityStripProps {
  countryCode: DispatchCountryCode;
}

export function DispatchCapacityStrip({ countryCode }: DispatchCapacityStripProps) {
  const { data, isLoading } = useDispatchCapacity(countryCode);

  if (isLoading && !data) {
    return (
      <div className="grid gap-5 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <KpiCard key={i} index={i} label="…" value="—" isLoading />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid gap-5 sm:grid-cols-3">
      <KpiCard
        index={0}
        label="Chauffeurs en ligne"
        value={String(data.onlineDrivers ?? 0)}
        hint="Disponibilité temps réel"
      />
      <KpiCard
        index={1}
        label="Éligibles dispatch"
        value={String(data.eligibleDrivers ?? 0)}
        hint="Passent les filtres de base"
      />
      <KpiCard
        index={2}
        label="Indexés GEO"
        value={String(data.indexedDrivers ?? 0)}
        hint="Présents dans Redis drivers:geo"
      />
    </div>
  );
}
