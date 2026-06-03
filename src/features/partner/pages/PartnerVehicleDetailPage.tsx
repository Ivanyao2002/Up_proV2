"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { VehicleApprovalPill } from "@/shared/ui/VehicleApprovalPill";
import { KycDocumentCard } from "@/shared/ui/KycDocumentCard";
import { getVehicleCategoryLabel } from "@/shared/lib/vehicleLabels";
import { formatDateTime } from "@/shared/lib/format";
import {
  usePartnerVehicleDetail,
  useUploadVehicleRegistration,
} from "../api/vehicles.queries";

interface PartnerVehicleDetailPageProps {
  vehicleId: string;
}

export function PartnerVehicleDetailPage({ vehicleId }: PartnerVehicleDetailPageProps) {
  const { data: vehicle, isLoading, isError } = usePartnerVehicleDetail(vehicleId);
  const uploadRegistration = useUploadVehicleRegistration(vehicleId);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-card bg-border" />;
  }

  if (isError || !vehicle) {
    return (
      <p className="text-sm text-red-600">
        Véhicule introuvable.{" "}
        <Link href="/partner/fleet" className="text-teal underline">
          Retour
        </Link>
      </p>
    );
  }

  const doc = vehicle.registration_document;
  const canUpload =
    vehicle.approval_status === "draft" ||
    vehicle.approval_status === "rejected" ||
    doc.status === "rejected" ||
    !doc.uploaded_at;

  const title = `${vehicle.brand} ${vehicle.model}`;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={title}
        breadcrumb={["Partenaire", "Véhicules", title]}
        actions={<VehicleApprovalPill status={vehicle.approval_status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="rounded-card border border-border bg-surface p-6 shadow-card">
          <h2 className="text-sm font-semibold">Carte grise</h2>
          <p className="mt-1 text-sm text-muted">
            Le véhicule n&apos;est approuvé qu&apos;après validation de la carte grise par
            UpJunoo. En cas de rejet, corrigez le document et soumettez à nouveau.
          </p>
          <div className="mt-4">
            <KycDocumentCard
              document={vehicle.registration_document}
              canUpload={canUpload}
              onUpload={() => uploadRegistration.mutate()}
            />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-card border border-border bg-surface p-5 shadow-card text-sm">
            <h3 className="font-semibold">Informations</h3>
            <dl className="mt-3 space-y-2 text-muted">
              <div className="flex justify-between gap-2">
                <dt>Plaque</dt>
                <dd className="text-foreground">{vehicle.plate || "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Catégorie</dt>
                <dd className="text-foreground">
                  {getVehicleCategoryLabel(vehicle.category)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Année · Couleur</dt>
                <dd className="text-foreground">
                  {vehicle.year} · {vehicle.color}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Places</dt>
                <dd className="text-foreground">{vehicle.seats}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Chauffeur</dt>
                <dd className="text-foreground">{vehicle.driver_name ?? "Non assigné"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Créé le</dt>
                <dd className="text-foreground">{formatDateTime(vehicle.created_at)}</dd>
              </div>
              {vehicle.approved_at && (
                <div className="flex justify-between gap-2">
                  <dt>Approuvé le</dt>
                  <dd className="text-teal-dark">
                    {formatDateTime(vehicle.approved_at)}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {vehicle.approval_status === "approved" && (
            <p className="rounded-lg bg-teal/10 px-4 py-3 text-sm text-teal-dark">
              Ce véhicule peut être assigné à un chauffeur et prendre des courses.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
