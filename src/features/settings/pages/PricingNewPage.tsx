"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import {
  PricingForm,
  type PricingFormValues,
} from "../components/PricingForm";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import { useCreatePricingRule, usePricingList } from "../api/pricing.queries";
import {
  AbidjanZonesMap,
  type ZoneMapItem,
} from "@/features/network/components/AbidjanZonesMap";
import { useZonesMapOverview } from "@/features/network/api/zones.queries";

const INITIAL: PricingFormValues = {
  franchise_id: null,
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
};

export function PricingNewPage() {
  const router = useRouter();
  const legacy = useLegacyAdminApi();
  const createPricing = useCreatePricingRule();
  const { data: pricingMeta } = usePricingList({ per_page: 1 });
  const { data: mapData, isLoading: mapLoading } = useZonesMapOverview();
  const [values, setValues] = useState<PricingFormValues>(INITIAL);
  const [selectedZone, setSelectedZone] = useState<ZoneMapItem | null>(null);

  const franchiseOptions = pricingMeta?.filter_options?.franchises ?? [];

  const selectedFranchiseName = franchiseOptions.find(
    (f) => f.id === values.franchise_id
  )?.name;

  const zones = useMemo(() => {
    const all = mapData?.zones ?? [];
    if (!selectedFranchiseName) return [];
    return all.filter((z) => z.franchise_name === selectedFranchiseName);
  }, [mapData?.zones, selectedFranchiseName]);

  const handleSelectZone = (zone: ZoneMapItem) => {
    setSelectedZone(zone);
    setValues((prev) => ({
      ...prev,
      zone_id: zone.id,
      zone_name: zone.name,
    }));
  };

  const handleFranchiseChange = (next: PricingFormValues) => {
    if (next.franchise_id !== values.franchise_id) {
      setSelectedZone(null);
      setValues({ ...next, zone_id: null, zone_name: "" });
      return;
    }
    setValues(next);
  };

  return (
    <div className="animate-fade-up mx-auto w-full max-w-3xl px-4 pb-10">
      <PageHeader
        title="Nouvelle grille tarifaire"
        breadcrumb={["Admin", "Paramètres", "Tarification", "Nouvelle"]}
      />

      {!legacy && (
        <p className="mb-4 rounded-lg border border-teal/20 bg-teal/5 px-4 py-3 text-sm text-foreground">
          API v1 : création via <code className="text-xs">POST /v1/admin/pricing-rules</code>.
          La zone est optionnelle — renseignez le nom de règle et la catégorie.
        </p>
      )}

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-heading">
          {legacy ? "Choisir une zone sur la carte" : "Zone sur la carte (optionnel)"}
        </h2>
        {!values.franchise_id ? (
          <p className="rounded-lg border border-dashed border-border bg-canvas px-4 py-8 text-center text-sm text-muted">
            Sélectionnez d&apos;abord la franchise dans le formulaire ci-dessous.
          </p>
        ) : mapLoading ? (
          <div className="relative h-[min(380px,50vh)] overflow-hidden rounded-card border border-border bg-map shadow-card">
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-navy/8 to-teal/5" />
          </div>
        ) : zones.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-canvas px-4 py-8 text-center text-sm text-muted">
            Aucune zone cartographiée pour cette franchise.
          </p>
        ) : (
          <AbidjanZonesMap
            mode="select"
            zones={zones}
            cityLabel={mapData?.city ?? selectedFranchiseName ?? "Réseau"}
            selectedZoneId={selectedZone?.id ?? null}
            onSelectZone={handleSelectZone}
          />
        )}
      </section>

      <PricingForm
        values={values}
        selectedZone={selectedZone}
        franchiseOptions={franchiseOptions}
        requireZone={legacy}
        onChange={handleFranchiseChange}
        isSubmitting={createPricing.isPending}
        onCancel={() => router.push("/admin/settings/pricing")}
        onSubmit={() => {
          if (!values.franchise_id) return;
          const franchise = franchiseOptions.find(
            (f) => String(f.id) === String(values.franchise_id)
          );
          createPricing.mutate(
            {
              franchise_id: values.franchise_id,
              zone_name: values.zone_name,
              zone_id: values.zone_id,
              rule_name: values.rule_name,
              category_code: values.category_code,
              city_label: franchise?.city,
              service: values.service,
              base_fare_fcfa: values.base_fare_fcfa,
              per_km_fcfa: values.per_km_fcfa,
              min_fare_fcfa: values.min_fare_fcfa,
              waiting_per_minute_fcfa: values.waiting_per_minute_fcfa,
              cancellation_fee_fcfa: values.cancellation_fee_fcfa,
              surge_multiplier: values.surge_multiplier,
              status: values.status,
              effectiveFrom: values.effectiveFrom,
            },
            { onSuccess: () => router.push("/admin/settings/pricing") }
          );
        }}
      />
    </div>
  );
}
