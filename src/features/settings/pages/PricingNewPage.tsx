"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import {
  PricingForm,
  type PricingFormValues,
} from "../components/PricingForm";
import { useCreatePricingRule } from "../api/pricing.queries";
import {
  AbidjanZonesMap,
  type ZoneMapItem,
} from "@/features/network/components/AbidjanZonesMap";
import { useZonesMapOverview } from "@/features/network/api/zones.queries";

const INITIAL: PricingFormValues = {
  zone_id: null,
  zone_name: "",
  service: "taxi",
  base_fare_fcfa: 500,
  per_km_fcfa: 350,
  min_fare_fcfa: 1500,
  surge_multiplier: 1,
  status: "draft",
};

export function PricingNewPage() {
  const router = useRouter();
  const createPricing = useCreatePricingRule();
  const { data: mapData, isLoading: mapLoading } = useZonesMapOverview();
  const [values, setValues] = useState<PricingFormValues>(INITIAL);
  const [selectedZone, setSelectedZone] = useState<ZoneMapItem | null>(null);

  const zones = useMemo(() => mapData?.zones ?? [], [mapData?.zones]);

  const handleSelectZone = (zone: ZoneMapItem) => {
    setSelectedZone(zone);
    setValues((prev) => ({
      ...prev,
      zone_id: zone.id,
      zone_name: zone.name,
    }));
  };

  return (
    <div className="animate-fade-up mx-auto w-full max-w-3xl px-4 pb-10">
      <PageHeader
        title="Nouvelle grille tarifaire"
        breadcrumb={["Admin", "Paramètres", "Tarification", "Nouvelle"]}
      />

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-navy">
          Choisir une zone sur la carte
        </h2>
        {mapLoading ? (
          <div className="h-[min(380px,50vh)] animate-pulse rounded-card bg-border" />
        ) : (
          <AbidjanZonesMap
            mode="select"
            zones={zones}
            cityLabel={mapData?.city ?? "Abidjan"}
            selectedZoneId={selectedZone?.id ?? null}
            onSelectZone={handleSelectZone}
          />
        )}
      </section>

      <PricingForm
        values={values}
        selectedZone={selectedZone}
        onChange={setValues}
        isSubmitting={createPricing.isPending}
        onCancel={() => router.push("/admin/settings/pricing")}
        onSubmit={() => {
          createPricing.mutate(values, {
            onSuccess: () => router.push("/admin/settings/pricing"),
          });
        }}
      />
    </div>
  );
}
