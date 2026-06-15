"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { notificationService } from "@/core/http/notificationService";
import { usePartnersList } from "@/features/network/api/partners.queries";
import { usePartnerDetail } from "@/features/network/api/partnerDetail.queries";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import {
  FleetPairCreateWizard,
  type AdminFleetPairSubmitPayload,
} from "../components/fleet-pair-wizard/FleetPairCreateWizard";
import {
  useCreateAdminVehicle,
  useVehicleBrandsCatalog,
  useVehicleCategoriesCatalog,
  useVehicleColorsCatalog,
} from "../api/vehicles.queries";

interface VehicleCreatePageProps {
  lockedPartnerId?: string;
}

export function VehicleCreatePage({ lockedPartnerId }: VehicleCreatePageProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assistantOnboardingId = searchParams.get("onboarding") ?? undefined;
  const queryPartnerId = searchParams.get("partnerId") ?? undefined;
  const effectiveLockedPartnerId = lockedPartnerId ?? queryPartnerId;
  const create = useCreateAdminVehicle();
  const legacy = useLegacyAdminApi();
  const adminLocked = Boolean(effectiveLockedPartnerId);
  const { data: lockedPartner, isLoading: partnerDetailLoading } = usePartnerDetail(
    effectiveLockedPartnerId ?? ""
  );

  const { data: partners } = usePartnersList({ per_page: 100 });
  const { data: categories, isLoading: categoriesLoading } = useVehicleCategoriesCatalog();
  const { data: brands, isLoading: brandsLoading } = useVehicleBrandsCatalog();
  const { data: colors, isLoading: colorsLoading } = useVehicleColorsCatalog();

  const backHref = adminLocked && effectiveLockedPartnerId
    ? `/admin/network/partners/${effectiveLockedPartnerId}?tab=drivers`
    : "/admin/fleet/vehicles";
  const backLabel = adminLocked ? "← Retour au partenaire" : "← Retour à la liste";

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
        if (adminLocked && effectiveLockedPartnerId) {
          router.push(`/admin/network/partners/${effectiveLockedPartnerId}?tab=drivers`);
        } else {
          router.push("/admin/fleet/vehicles");
        }
      },
    });
  };

  return (
    <div className="animate-fade-up mx-auto max-w-6xl">
      <PageHeader
        title={adminLocked ? "Nouveau chauffeur et véhicule" : "Nouveau véhicule et chauffeur"}
        breadcrumb={
          adminLocked
            ? ["Admin", "Réseau", "Partenaire", "Nouveau binôme"]
            : ["Admin", "Flotte", "Véhicules", "Nouveau"]
        }
      />

      <p className="mb-6 text-sm">
        <Link href={backHref} className="text-teal hover:underline">
          {backLabel}
        </Link>
      </p>

      <FleetPairCreateWizard
        key={assistantOnboardingId ?? "manual"}
        variant="admin"
        lockedPartnerId={effectiveLockedPartnerId}
        assistantOnboardingId={assistantOnboardingId}
        backHref={backHref}
        legacyPhone={legacy}
        partners={partners?.data ?? []}
        partnerDetailLoading={partnerDetailLoading}
        lockedPartner={lockedPartner ?? null}
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
