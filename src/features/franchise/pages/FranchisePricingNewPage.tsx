"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import {
  PricingForm,
  type PricingFormValues,
} from "@/features/settings/components/PricingForm";
import {
  AbidjanZonesMap,
  type ZoneMapItem,
} from "@/features/network/components/AbidjanZonesMap";
import {
  useCreateFranchisePricing,
} from "../api/pricing.queries";
import { useAuthStore } from "@/core/auth/authStore";
import { useZonesMapOverviewByFranchise } from "@/features/network/api/zones.queries";

export function FranchisePricingNewPage() {
  const router = useRouter();
  const franchiseId = useAuthStore((s) => s.user?.franchise_id);
  const franchiseName = useAuthStore((s) => s.user?.franchise_name) ?? "Votre territoire";
  const { data: mapData, isLoading: mapLoading } = useZonesMapOverviewByFranchise();
  const createPricing = useCreateFranchisePricing();

  const [values, setValues] = useState<PricingFormValues>({
    franchise_id: franchiseId ?? null,
    franchise_name: franchiseName,
    zone_id: null,
    zone_name: "",
    rule_name: "",
    category_code: "ECO",
    service: "taxi",
    base_fare_fcfa: 500,
    per_km_fcfa: 350,
    min_fare_fcfa: 1500,
    surge_multiplier: 1,
    status: "draft",
  });

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
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader
          title="Nouvelle grille tarifaire"
          breadcrumb={["Franchise", "Tarification", "Nouvelle"]}
          actions={
            <Button
              variant="secondary"
              onClick={() => router.push("/franchise/pricing")}
            >
              ← Retour
            </Button>
          }
        />
        <p className="mt-1 text-sm text-muted">
          Créez une nouvelle grille tarifaire pour {franchiseName}
        </p>
      </div>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-heading">
          Choisir une zone sur la carte
        </h2>
        {mapLoading ? (
          <div className="relative h-[min(380px,50vh)] overflow-hidden rounded-card border border-border bg-map shadow-card">
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-navy/8 to-teal/5" />
          </div>
        ) : zones.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-canvas px-4 py-8 text-center text-sm text-muted">
            Aucune zone cartographiée pour votre territoire.
          </p>
        ) : (
          <AbidjanZonesMap
            mode="select"
            zones={zones}
            hotZones={mapData?.hotZones ?? []}
            cityLabel={mapData?.city ?? franchiseName}
            selectedZoneId={selectedZone?.id ?? null}
            onSelectZone={handleSelectZone}
          />
        )}
      </section>

      <PricingForm
        hideFranchise
        requireZone
        mode="create"
        values={values}
        selectedZone={selectedZone}
        onChange={setValues}
        isSubmitting={createPricing.isPending}
        onCancel={() => router.push("/franchise/pricing")}
        onSubmit={() => {
          createPricing.mutate(
            {
              zone_name: values.zone_name,
              zone_id: values.zone_id,
              rule_name: values.rule_name,
              category_code: values.category_code,
              service: values.service,
              base_fare_fcfa: values.base_fare_fcfa,
              per_km_fcfa: values.per_km_fcfa,
              min_fare_fcfa: values.min_fare_fcfa,
              surge_multiplier: values.surge_multiplier,
              status: values.status,
            },
            { onSuccess: () => router.push("/franchise/pricing") }
          );
        }}
      />
    </div>
  );
}
