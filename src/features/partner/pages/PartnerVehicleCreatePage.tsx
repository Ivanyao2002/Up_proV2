"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { notificationService } from "@/core/http/notificationService";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import { useCatalogCountryForPartner } from "@/shared/hooks/useCatalogCountryForPartner";
import { usePartnerProfile } from "../api/profile.queries";
import { useCreateVehicle } from "../api/vehicles.queries";
import {
  FleetPairCreateWizard,
  type PartnerFleetPairSubmitPayload,
} from "@/features/fleet/components/fleet-pair-wizard/FleetPairCreateWizard";

export function PartnerVehicleCreatePage() {
  const router = useRouter();
  const legacy = useLegacyPortalApi();
  const create = useCreateVehicle();
  const { data: profile } = usePartnerProfile();
  const { data: phoneCountry } = useCatalogCountryForPartner({
    cityLabel: profile?.city,
    enabled: !legacy && Boolean(profile?.city),
  });

  const handleSubmit = (payload: PartnerFleetPairSubmitPayload) => {
    const hasRegistration = payload.pieces.some((p) => p.type === "registration");

    create.mutate(payload, {
      onSuccess: (vehicle) => {
        if (vehicle.driver_name) {
          notificationService.success(
            `Chauffeur et véhicule créés — ${vehicle.driver_name} assigné`
          );
        } else if (payload.pieces.length === 0) {
          notificationService.info(
            "Binôme créé — pièces à ajouter sur la fiche véhicule"
          );
        } else if (hasRegistration) {
          notificationService.success(
            "Véhicule créé — pièces envoyées, validation en cours"
          );
        } else {
          notificationService.success(
            "Véhicule créé — pensez à ajouter la carte grise pour la validation"
          );
        }
        router.push(`/partner/fleet/${vehicle.id}`);
      },
      onError: () => {
        notificationService.error("Impossible de créer le véhicule");
      },
    });
  };

  return (
    <div className="animate-fade-up mx-auto max-w-6xl">
      <PageHeader
        title="Nouveau chauffeur et véhicule"
        breadcrumb={["Partenaire", "Flotte", "Nouveau binôme"]}
      />

      <FleetPairCreateWizard
        variant="partner"
        backHref="/partner/fleet"
        legacyPhone={legacy}
        phoneCountry={phoneCountry ?? null}
        isSubmitting={create.isPending}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
