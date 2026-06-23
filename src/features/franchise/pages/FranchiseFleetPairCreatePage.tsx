"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { notificationService } from "@/core/http/notificationService";
import { useFranchisePartnersList } from "../api/partners.queries";
import { useCreateFranchiseVehicle } from "../api/franchiseVehicles.queries";
import {
  FleetPairCreateWizard,
  type AdminFleetPairSubmitPayload,
} from "@/features/fleet/components/fleet-pair-wizard/FleetPairCreateWizard";
import {
  useVehicleBrandsCatalog,
  useVehicleCategoriesCatalog,
  useVehicleColorsCatalog,
} from "@/features/fleet/api/vehicles.queries";

interface FranchiseFleetPairCreatePageProps {
  lockedPartnerId?: string;
}

export function FranchiseFleetPairCreatePage({ lockedPartnerId }: FranchiseFleetPairCreatePageProps = {}) {
  const router = useRouter();
  const create = useCreateFranchiseVehicle();

  const { data: partners } = useFranchisePartnersList({ per_page: 100 });
  const { data: categories, isLoading: categoriesLoading } = useVehicleCategoriesCatalog();
  const { data: brands, isLoading: brandsLoading } = useVehicleBrandsCatalog();
  const { data: colors, isLoading: colorsLoading } = useVehicleColorsCatalog();

  const backHref = "/franchise/fleet/vehicles";
  const backLabel = "← Retour à la liste";

  const handleSubmit = (payload: AdminFleetPairSubmitPayload) => {
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
            "Binôme créé — pièces enregistrées, validation en cours"
          );
        } else {
          notificationService.success(
            "Binôme créé — pensez à ajouter la carte grise pour la validation"
          );
        }
        router.push("/franchise/fleet/vehicles");
      },
    });
  };

  return (
    <div className="animate-fade-up mx-auto max-w-6xl">
      <PageHeader
        title="Nouveau chauffeur et véhicule"
        breadcrumb={["Franchise", "Flotte", "Véhicules", "Nouveau"]}
      />

      <p className="mb-6 text-sm">
        <Link href={backHref} className="text-teal hover:underline">
          {backLabel}
        </Link>
      </p>

      <FleetPairCreateWizard
        key="franchise-manual"
        variant="admin"
        lockedPartnerId={lockedPartnerId}
        backHref={backHref}
        legacyPhone={false}
        partners={partners?.data ?? []}
        partnerDetailLoading={false}
        lockedPartner={null}
        categories={categories ?? []}
        brands={brands ?? []}
        colors={colors ?? []}
        catalogLoading={categoriesLoading || brandsLoading || colorsLoading}
        isSubmitting={create.isPending}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
