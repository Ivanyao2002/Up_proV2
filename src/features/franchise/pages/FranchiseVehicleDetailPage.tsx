"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { KpiCard } from "@/shared/ui/KpiCard";
import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import { VehicleApprovalPill } from "@/shared/ui/VehicleApprovalPill";
import { formatDateTime } from "@/shared/lib/format";
import {
  getVehicleApprovalLabel,
  getVehicleCategoryLabel,
} from "@/shared/lib/vehicleLabels";
import {
  useFranchiseVehicleApprove,
  useFranchiseVehicleDetail,
  useFranchiseVehicleReject,
} from "../api/franchiseVehicles.queries";

interface FranchiseVehicleDetailPageProps {
  vehicleId: string;
}

export function FranchiseVehicleDetailPage({
  vehicleId,
}: FranchiseVehicleDetailPageProps) {
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [notes, setNotes] = useState("");

  const { data: vehicle, isLoading, isError } = useFranchiseVehicleDetail(vehicleId);
  const approve = useFranchiseVehicleApprove();
  const reject = useFranchiseVehicleReject();

  if (isLoading) {
    return (
      <DetailPageSkeleton
        title="Détail véhicule"
        breadcrumb={["Franchise", "Flotte", "Véhicules"]}
      />
    );
  }

  if (isError || !vehicle) {
    return (
      <p className="text-sm text-red-600">
        Véhicule introuvable.{" "}
        <Link href="/franchise/fleet/vehicles" className="text-teal underline">
          Retour à la liste
        </Link>
      </p>
    );
  }

  const canApprove = vehicle.approval_status === "pending" || vehicle.approval_status === "rejected";
  const canReject = vehicle.approval_status === "pending" || vehicle.approval_status === "approved";

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={vehicle.label}
        breadcrumb={["Franchise", "Flotte", "Véhicules", vehicle.label]}
        actions={
          <div className="flex flex-wrap gap-2">
            {canApprove && (
              <Button onClick={() => setShowApprove(true)}>Approuver</Button>
            )}
            {canReject && (
              <Button variant="secondary" onClick={() => setShowReject(true)}>
                Rejeter
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <KpiCard
              label="Statut"
              value={getVehicleApprovalLabel(vehicle.approval_status)}
              compact
              index={0}
            />
            <KpiCard
              label="Catégorie"
              value={
                vehicle.category_label ?? getVehicleCategoryLabel(vehicle.category)
              }
              compact
              index={1}
            />
            <KpiCard
              label="Année"
              value={vehicle.year > 0 ? String(vehicle.year) : "—"}
              compact
              index={0}
            />
            <KpiCard
              label="Couleur"
              value={vehicle.color || "—"}
              compact
              index={1}
            />
          </div>

          <section className="rounded-card border border-border bg-surface p-5 shadow-card">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Informations véhicule
            </h3>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Plaque</dt>
                <dd className="font-medium">{vehicle.plate || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Marque</dt>
                <dd className="font-medium">{vehicle.brand || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Modèle</dt>
                <dd className="font-medium">{vehicle.model || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Places</dt>
                <dd className="font-medium">{vehicle.seats || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Créé le</dt>
                <dd className="font-medium">{formatDateTime(vehicle.created_at)}</dd>
              </div>
            </dl>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Appartenance
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Partenaire</dt>
                <dd className="font-medium">
                  {vehicle.partner_id ? (
                    <Link
                      href={`/franchise/partners/${vehicle.partner_id}`}
                      className="text-teal hover:underline"
                    >
                      {vehicle.partner_name || vehicle.partner_id}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              {/* Note: driver_id not available in VehicleDetail type */}
            </dl>
          </div>

          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Validation
            </h3>
            <div className="flex items-center gap-2">
              <VehicleApprovalPill status={vehicle.approval_status} />
            </div>
            {/* Note: approval_notes not available in VehicleDetail type */}
          </div>
        </aside>
      </div>

      {/* Modal Approuver */}
      {showApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-card border border-border bg-surface p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Approuver le véhicule
            </h3>
            <p className="mb-4 text-sm text-muted">
              Confirmez l&apos;approbation de ce véhicule pour la mise en service.
            </p>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-foreground">
                Notes (optionnel)
              </label>
              <textarea
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm"
                rows={3}
                placeholder="Commentaires sur l'approbation..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowApprove(false)}>
                Annuler
              </Button>
              <Button
                onClick={() => {
                  approve.mutate({ id: vehicleId, notes });
                  setShowApprove(false);
                  setNotes("");
                }}
                disabled={approve.isPending}
              >
                {approve.isPending ? "En cours…" : "Approuver"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rejeter */}
      {showReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-card border border-border bg-surface p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Rejeter le véhicule
            </h3>
            <p className="mb-4 text-sm text-muted">
              Indiquez la raison du rejet. Le partenaire sera notifié.
            </p>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-foreground">
                Raison (optionnel)
              </label>
              <textarea
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm"
                rows={3}
                placeholder="Raison du rejet..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowReject(false)}>
                Annuler
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  reject.mutate({ id: vehicleId, reason: notes });
                  setShowReject(false);
                  setNotes("");
                }}
                disabled={reject.isPending}
              >
                {reject.isPending ? "En cours…" : "Rejeter"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
