"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { notificationService } from "@/core/http/notificationService";
import { usePartnerRentalVehicles } from "../api/rentalFleet.queries";
import {
  usePartnerRentalPricing,
  useSaveRentalPricing,
} from "../api/rentalPricing.queries";
import { RentalPricingForm } from "../components/RentalPricingForm";
import { RENTAL_VEHICLE_CATEGORY_LABELS } from "../api/rentalFleet.service";

export function PartnerRentalPricingPage() {
  const { data: fleet, isLoading: fleetLoading } = usePartnerRentalVehicles({ per_page: 200 });
  const vehicles = useMemo(() => fleet?.data ?? [], [fleet?.data]);
  const [vehicleId, setVehicleId] = useState<string>("");

  // Présélection du premier véhicule dès que la flotte est chargée.
  useEffect(() => {
    if (!vehicleId && vehicles.length > 0) setVehicleId(vehicles[0].id);
  }, [vehicles, vehicleId]);

  const { data: pricing, isLoading: pricingLoading } = usePartnerRentalPricing(vehicleId);
  const save = useSaveRentalPricing();

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader title="Tarifs & conditions" breadcrumb={["Partenaire", "Location", "Tarifs"]} />

      {fleetLoading ? (
        <p className="mt-6 text-sm text-muted">Chargement de la flotte…</p>
      ) : vehicles.length === 0 ? (
        <p className="mt-6 text-sm text-muted">
          Ajoutez d&apos;abord un véhicule à votre flotte pour configurer ses tarifs.
        </p>
      ) : (
        <>
          <div className="mb-6 mt-6 max-w-md">
            <label className="mb-1 block text-sm font-medium text-foreground">Véhicule</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {(v.label || v.plate || v.id) +
                    " — " +
                    (RENTAL_VEHICLE_CATEGORY_LABELS[v.category] ?? v.category)}
                </option>
              ))}
            </select>
          </div>

          {pricingLoading ? (
            <p className="text-sm text-muted">Chargement du barème…</p>
          ) : (
            <RentalPricingForm
              key={vehicleId}
              initial={pricing}
              isSaving={save.isPending}
              onSubmit={(data) =>
                save.mutate(
                  { vehicleId, data },
                  {
                    onSuccess: () => notificationService.success("Barème enregistré"),
                    onError: () => notificationService.error("Enregistrement impossible."),
                  }
                )
              }
            />
          )}
        </>
      )}
    </div>
  );
}
