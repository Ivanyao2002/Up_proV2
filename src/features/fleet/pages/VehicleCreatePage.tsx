"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { notificationService } from "@/core/http/notificationService";
import { usePartnersList } from "@/features/network/api/partners.queries";
import { useFranchiseDetail } from "@/features/network/api/franchiseDetail.queries";
import { usePartnerDetail } from "@/features/network/api/partnerDetail.queries";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import { useCatalogCountryForPartner } from "@/shared/hooks/useCatalogCountryForPartner";
import type { Partner, PartnerDetail } from "@/shared/types";
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
  const create = useCreateAdminVehicle();
  const legacy = useLegacyAdminApi();
  const adminLocked = Boolean(lockedPartnerId);
  const { data: lockedPartner, isLoading: partnerDetailLoading } = usePartnerDetail(
    lockedPartnerId ?? ""
  );

  const { data: partners } = usePartnersList({ per_page: 100 });
  const { data: categories, isLoading: categoriesLoading } = useVehicleCategoriesCatalog();
  const { data: brands, isLoading: brandsLoading } = useVehicleBrandsCatalog();
  const { data: colors, isLoading: colorsLoading } = useVehicleColorsCatalog();

  const selectedPartner = useMemo((): Partner | PartnerDetail | null => {
    if (adminLocked && lockedPartner) return lockedPartner;
    return null;
  }, [adminLocked, lockedPartner]);

  const franchiseIdForCountry = useMemo(() => {
    const fid = selectedPartner?.franchise_id;
    if (fid == null || fid === "—") return "";
    return String(fid);
  }, [selectedPartner?.franchise_id]);

  const { data: franchiseDetail } = useFranchiseDetail(franchiseIdForCountry);

  const { data: phoneCountry } = useCatalogCountryForPartner({
    franchiseCountryId: franchiseDetail?.country_id,
    cityId:
      selectedPartner && "city_id" in selectedPartner
        ? selectedPartner.city_id
        : undefined,
    cityLabel: selectedPartner?.city,
    enabled: !legacy && Boolean(selectedPartner),
  });

  const backHref = adminLocked && lockedPartnerId
    ? `/admin/network/partners/${lockedPartnerId}?tab=drivers`
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
        if (adminLocked && lockedPartnerId) {
          router.push(`/admin/network/partners/${lockedPartnerId}?tab=drivers`);
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
        variant="admin"
        lockedPartnerId={lockedPartnerId}
        backHref={backHref}
        legacyPhone={legacy}
        phoneCountry={phoneCountry ?? null}
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
