"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Tabs } from "@/shared/ui/Tabs";
import { VehicleApprovalPill } from "@/shared/ui/VehicleApprovalPill";
import { KycDocumentCard } from "@/shared/ui/KycDocumentCard";
import { KpiCard } from "@/shared/ui/KpiCard";
import { Button } from "@/shared/ui/Button";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import { formatDateTime } from "@/shared/lib/format";
import {
  getVehicleApprovalLabel,
  getVehicleCategoryLabel,
} from "@/shared/lib/vehicleLabels";
import { useAdminVehicleDetail } from "../api/vehicleDetail.queries";
import { useDeleteAdminVehicle } from "../api/vehicles.queries";

interface AdminVehicleDetailPageProps {
  vehicleId: string;
  partnerId?: string;
}

export function AdminVehicleDetailPage({
  vehicleId,
  partnerId,
}: AdminVehicleDetailPageProps) {
  const router = useRouter();
  const [tab, setTab] = useState("documents");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { data: vehicle, isLoading, isError } = useAdminVehicleDetail(
    vehicleId,
    partnerId
  );
  const deleteVehicle = useDeleteAdminVehicle();

  if (isLoading) {
    return (
      <DetailPageSkeleton
        title="Véhicule"
        breadcrumb={["Admin", "Flotte", "Véhicules"]}
      />
    );
  }

  if (isError || !vehicle) {
    return (
      <p className="text-sm text-red-600">
        Véhicule introuvable.{" "}
        <Link href="/admin/fleet/vehicles" className="text-teal underline">
          Retour à la liste
        </Link>
      </p>
    );
  }

  const title = vehicle.label || `${vehicle.brand} ${vehicle.model}`.trim();

  return (
    <div className="animate-fade-up">
      <div className="page-sticky-header">
        <PageHeader
          title={title}
          breadcrumb={["Admin", "Flotte", "Véhicules", title]}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <VehicleApprovalPill status={vehicle.approval_status} />
              <Button
                variant="secondary"
                disabled={deleteVehicle.isPending}
                onClick={() => setConfirmDelete(true)}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                Supprimer
              </Button>
            </div>
          }
        />
        <p className="text-sm text-muted">
          {vehicle.plate || "Plaque à renseigner"} ·{" "}
          {vehicle.category_label ?? getVehicleCategoryLabel(vehicle.category)}
          {vehicle.partner_name && (
            <>
              {" · "}
              <Link
                href={`/admin/network/partners/${vehicle.partner_id}`}
                className="text-teal hover:underline"
              >
                {vehicle.partner_name}
              </Link>
            </>
          )}
        </p>
      </div>

      <div className="detail-page-grid">
        <div>
          <Tabs
            tabs={[
              { id: "documents", label: "Documents" },
              { id: "overview", label: "Aperçu" },
            ]}
            active={tab}
            onChange={setTab}
          />

          <div className="mt-6">
            {tab === "documents" && (
              <div className="space-y-4">
                {vehicle.documents.length > 0 ? (
                  vehicle.documents.map((doc) => (
                    <KycDocumentCard key={doc.id} document={doc} />
                  ))
                ) : (
                  <div className="rounded-card border border-dashed border-border bg-surface p-8 text-center shadow-card">
                    <p className="font-medium text-foreground">
                      Aucun document pour ce véhicule
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      Ce véhicule n&apos;a pas encore de carte grise, d&apos;assurance
                      ni d&apos;autre pièce déposée. Les documents soumis
                      apparaîtront ici avec aperçu et statut de validation.
                    </p>
                  </div>
                )}
              </div>
            )}

            {tab === "overview" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <KpiCard
                  label="Statut validation"
                  value={getVehicleApprovalLabel(vehicle.approval_status)}
                />
                <KpiCard label="Places" value={String(vehicle.seats || "—")} />
                <KpiCard
                  label="Année"
                  value={vehicle.year > 0 ? String(vehicle.year) : "—"}
                />
                <KpiCard label="Couleur" value={vehicle.color || "—"} />
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-card border border-border bg-surface p-5 shadow-card text-sm">
            <h3 className="font-semibold">Informations</h3>
            <dl className="mt-3 space-y-2 text-muted">
              <div className="flex justify-between gap-2">
                <dt>Marque</dt>
                <dd className="text-foreground">{vehicle.brand}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Modèle</dt>
                <dd className="text-foreground">{vehicle.model}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Plaque</dt>
                <dd className="text-foreground">{vehicle.plate || "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>VIN</dt>
                <dd className="text-foreground">{vehicle.vin || "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Créé le</dt>
                <dd className="text-foreground">
                  {formatDateTime(vehicle.created_at)}
                </dd>
              </div>
              {vehicle.updated_at && (
                <div className="flex justify-between gap-2">
                  <dt>Mis à jour</dt>
                  <dd className="text-foreground">
                    {formatDateTime(vehicle.updated_at)}
                  </dd>
                </div>
              )}
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

          <div className="rounded-card border border-border bg-surface p-5 shadow-card text-sm">
            <h3 className="font-semibold">Chauffeur assigné</h3>
            {vehicle.driver_id ? (
              <div className="mt-3 space-y-3">
                <p className="font-medium text-foreground">
                  {vehicle.driver_name ?? `Chauffeur ${String(vehicle.driver_id).slice(0, 8)}`}
                </p>
                <Link
                  href={`/admin/fleet/drivers/${vehicle.driver_id}`}
                  className="inline-block text-teal hover:underline"
                >
                  Voir la fiche chauffeur →
                </Link>
              </div>
            ) : (
              <p className="mt-3 text-muted">Aucun chauffeur assigné.</p>
            )}
          </div>

          {vehicle.approval_status === "approved" && (
            <p className="rounded-lg bg-teal/10 px-4 py-3 text-sm text-teal-dark">
              Véhicule validé — éligible aux courses.
            </p>
          )}
        </aside>
      </div>

      <ConfirmModal
        open={confirmDelete}
        title="Supprimer ce véhicule ?"
        message="Cette action est irréversible. Le véhicule et ses documents associés seront supprimés. Le chauffeur assigné ne sera pas supprimé."
        confirmLabel="Supprimer définitivement"
        variant="danger"
        onConfirm={() => {
          deleteVehicle.mutate(vehicleId, {
            onSuccess: () => router.push("/admin/fleet/vehicles"),
          });
          setConfirmDelete(false);
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
