"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { VehicleApprovalPill } from "@/shared/ui/VehicleApprovalPill";
import { KycDocumentCard } from "@/shared/ui/KycDocumentCard";
import { formatDateTime } from "@/shared/lib/format";
import { IvorianPlateBadge } from "@/shared/ui/IvorianPlateBadge";
import { VehicleTypeBadge } from "@/shared/ui/VehicleTypeBadge";
import {
  usePartnerVehicleDetail,
  useUploadVehicleRegistration,
} from "../api/vehicles.queries";
import { usePartnerDriversList } from "../api/drivers.queries";
import { partnerVehiclesService } from "../api/vehicles.service";
import { partnerVehiclesKeys } from "../api/vehicles.queries";
import { notificationService } from "@/core/http/notificationService";

interface PartnerVehicleDetailPageProps {
  vehicleId: string;
}

export function PartnerVehicleDetailPage({ vehicleId }: PartnerVehicleDetailPageProps) {
  const { data: vehicle, isLoading, isError } = usePartnerVehicleDetail(vehicleId);
  const uploadRegistration = useUploadVehicleRegistration(vehicleId);
  const { data: driversData } = usePartnerDriversList();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const qc = useQueryClient();

  const assignDriverMutation = useMutation({
    mutationFn: ({
      driverId,
      firstName,
      lastName,
    }: {
      driverId: string;
      firstName: string;
      lastName: string;
    }) =>
      partnerVehiclesService.assignDriver(vehicleId, {
        id: driverId,
        first_name: firstName,
        last_name: lastName,
      }),
    onSuccess: () => {
      notificationService.success("Chauffeur assigné avec succès");
      setShowAssignModal(false);
      setSelectedDriverId(null);
      void qc.invalidateQueries({ queryKey: partnerVehiclesKeys.detail(vehicleId) });
    },
    onError: () => {
      notificationService.error("Échec de l'assignation du chauffeur");
    },
  });

  if (isLoading) {
    return <DetailPageSkeleton />;
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
              uploadHint="PDF ou image (JPG, PNG) · max 5 Mo"
              onUpload={(file) => {
                uploadRegistration.mutate(file, {
                  onError: () =>
                    notificationService.error("Échec de l'envoi de la carte grise"),
                });
              }}
            />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-card border border-border bg-surface p-5 shadow-card text-sm">
            <h3 className="font-semibold">Informations</h3>
            <dl className="mt-3 space-y-2 text-muted">
              <div className="flex flex-col gap-2">
                <dt>Plaque</dt>
                <dd>
                  {vehicle.plate ? (
                    <IvorianPlateBadge plate={vehicle.plate} size="md" />
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div className="flex flex-col gap-2">
                <dt>Type & service</dt>
                <dd>
                  <VehicleTypeBadge vehicle={vehicle} />
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

          {vehicle.approval_status === "approved" && !vehicle.driver_name && (
            <div className="rounded-lg bg-teal/10 px-4 py-3">
              <p className="text-sm text-teal-dark">
                Ce véhicule peut être assigné à un chauffeur et prendre des courses.
              </p>
              <button
                onClick={() => setShowAssignModal(true)}
                className="mt-2 inline-flex items-center rounded-md bg-teal px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-dark"
              >
                Assigner un chauffeur
              </button>
            </div>
          )}

          {/* Modal d'assignation */}
          {showAssignModal && (
            <AssignDriverModal
              vehicleId={vehicleId}
              drivers={driversData?.data ?? []}
              onClose={() => {
                setShowAssignModal(false);
                setSelectedDriverId(null);
              }}
              onAssign={(driverId) => {
                const driver = driversData?.data.find((d) => String(d.id) === driverId);
                if (!driver) return;
                assignDriverMutation.mutate({
                  driverId,
                  firstName: driver.first_name ?? "",
                  lastName: driver.last_name ?? "",
                });
              }}
              isAssigning={assignDriverMutation.isPending}
              selectedDriverId={selectedDriverId}
              onSelectDriver={setSelectedDriverId}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

interface AssignDriverModalProps {
  vehicleId: string;
  drivers: Array<{
    id: number | string;
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    driver_code?: string | null;
  }>;
  onClose: () => void;
  onAssign: (driverId: string) => void;
  isAssigning: boolean;
  selectedDriverId: string | null;
  onSelectDriver: (id: string | null) => void;
}

function AssignDriverModal({
  drivers,
  onClose,
  onAssign,
  isAssigning,
  selectedDriverId,
  onSelectDriver,
}: AssignDriverModalProps) {
  const availableDrivers = drivers.filter(
    (d) => d.first_name || d.last_name || d.phone
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-card border border-border bg-surface p-6 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-heading">Assigner un chauffeur</h3>
        <p className="mt-1 text-sm text-muted">
          Sélectionnez un chauffeur à assigner à ce véhicule.
        </p>

        <div className="mt-4 max-h-64 overflow-y-auto space-y-2">
          {availableDrivers.length === 0 ? (
            <p className="text-sm text-muted">Aucun chauffeur disponible.</p>
          ) : (
            availableDrivers.map((driver) => {
              const name =
                `${driver.first_name ?? ""} ${driver.last_name ?? ""}`.trim() ||
                "Chauffeur sans nom";
              const isSelected = selectedDriverId === String(driver.id);

              return (
                <button
                  key={driver.id}
                  onClick={() => onSelectDriver(String(driver.id))}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    isSelected
                      ? "border-teal bg-teal/10"
                      : "border-border hover:bg-surface-hover"
                  }`}
                >
                  <p className="font-medium text-foreground">{name}</p>
                  {driver.phone && (
                    <p className="text-sm text-muted">{driver.phone}</p>
                  )}
                  {driver.driver_code && (
                    <p className="text-xs text-muted">Code: {driver.driver_code}</p>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-surface-hover"
          >
            Annuler
          </button>
          <button
            onClick={() => selectedDriverId && onAssign(selectedDriverId)}
            disabled={!selectedDriverId || isAssigning}
            className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAssigning ? "Assignation..." : "Assigner"}
          </button>
        </div>
      </div>
    </div>
  );
}
