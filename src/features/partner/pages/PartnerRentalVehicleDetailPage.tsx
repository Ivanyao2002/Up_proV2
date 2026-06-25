"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import { formatDate, formatDateTime } from "@/shared/lib/format";
import { notificationService } from "@/core/http/notificationService";
import {
  usePartnerRentalVehicleDetail,
  useSetRentalVehicleStatus,
  useDeleteRentalVehicle,
} from "../api/rentalFleet.queries";
import {
  RENTAL_VEHICLE_CATEGORY_LABELS,
  RENTAL_VEHICLE_STATUS_CONFIG,
  RENTAL_VEHICLE_OPTION_LABELS,
  RENTAL_VEHICLE_DOC_LABELS,
  type RentalVehicleStatus,
} from "../api/rentalFleet.service";
import { isDocumentExpiringSoon } from "../lib/rentalFleetHelpers";

const STATUSES = Object.keys(RENTAL_VEHICLE_STATUS_CONFIG) as RentalVehicleStatus[];

export function PartnerRentalVehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: vehicle, isLoading, isError } = usePartnerRentalVehicleDetail(id!);
  const setStatus = useSetRentalVehicleStatus();
  const del = useDeleteRentalVehicle();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) {
    return (
      <DetailPageSkeleton title="Véhicule" breadcrumb={["Partenaire", "Location", "Flotte"]} />
    );
  }
  if (isError || !vehicle) {
    return <div className="p-6 text-red-600">Véhicule introuvable.</div>;
  }

  const cfg = RENTAL_VEHICLE_STATUS_CONFIG[vehicle.status];
  const title = vehicle.label || vehicle.plate || `Véhicule ${vehicle.id.slice(0, 6)}`;

  const onStatusChange = (status: RentalVehicleStatus) =>
    setStatus.mutate(
      { id: vehicle.id, status },
      {
        onSuccess: () => notificationService.success("Statut mis à jour"),
        onError: () => notificationService.error("Mise à jour impossible."),
      }
    );

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader
        title={title}
        breadcrumb={["Partenaire", "Location", "Flotte", title]}
        actions={
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${cfg.color}`}
          >
            {cfg.label}
          </span>
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Caractéristiques">
            <div className="grid grid-cols-2 gap-4">
              <Info label="Catégorie" value={RENTAL_VEHICLE_CATEGORY_LABELS[vehicle.category]} />
              <Info label="Immatriculation" value={vehicle.plate || "—"} />
              <Info label="Marque" value={vehicle.brand || "—"} />
              <Info label="Modèle" value={vehicle.model || "—"} />
              <Info label="Année" value={vehicle.year ? String(vehicle.year) : "—"} />
              <Info label="Places" value={vehicle.seats ? String(vehicle.seats) : "—"} />
              <Info
                label="Transmission"
                value={vehicle.transmission === "automatique" ? "Automatique" : "Manuelle"}
              />
            </div>
            {(vehicle.options?.length ?? 0) > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {vehicle.options!.map((o) => (
                  <span
                    key={o}
                    className="inline-flex items-center rounded-full bg-teal/10 px-2 py-1 text-xs font-medium text-teal"
                  >
                    {RENTAL_VEHICLE_OPTION_LABELS[o]}
                  </span>
                ))}
              </div>
            )}
          </Card>

          <Card title="Documents">
            {(vehicle.documents?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted">Aucun document renseigné.</p>
            ) : (
              <ul className="space-y-2">
                {vehicle.documents!.map((d) => {
                  const expiring = isDocumentExpiringSoon(d.expires_at);
                  return (
                    <li
                      key={d.type}
                      className="flex items-center justify-between border-b border-border pb-2 last:border-0"
                    >
                      <span className="text-sm">{RENTAL_VEHICLE_DOC_LABELS[d.type]}</span>
                      <span
                        className={`text-xs ${expiring ? "font-medium text-amber-600" : "text-muted"}`}
                      >
                        {d.expires_at ? `Expire le ${formatDate(d.expires_at)}` : "Sans échéance"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Statut d'exploitation">
            <select
              value={vehicle.status}
              onChange={(e) => onStatusChange(e.target.value as RentalVehicleStatus)}
              disabled={setStatus.isPending}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {RENTAL_VEHICLE_STATUS_CONFIG[s].label}
                </option>
              ))}
            </select>
          </Card>

          <Card title="Tarifs & disponibilités">
            <p className="mb-3 text-xs text-muted">
              {vehicle.has_pricing
                ? "Un barème est configuré pour ce véhicule."
                : "Aucun barème défini. Configurez les tarifs pour le rendre réservable."}
            </p>
            <div className="space-y-2">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => router.push("/partner/rental/pricing")}
              >
                Tarifs & conditions
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => router.push("/partner/rental/calendar")}
              >
                Calendrier & disponibilités
              </Button>
            </div>
          </Card>

          <Card title="Suivi">
            {vehicle.created_at && (
              <Info label="Ajouté le" value={formatDateTime(vehicle.created_at)} />
            )}
            <div className="mt-4 space-y-2">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => router.push("/partner/rental/fleet")}
              >
                Retour à la flotte
              </Button>
              <Button
                variant="secondary"
                className="w-full text-red-600"
                onClick={() => setConfirmDelete(true)}
              >
                Retirer de la flotte
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmModal
          open
          title="Retirer le véhicule"
          message={`Retirer ${title} de la flotte de location ?`}
          confirmLabel="Retirer"
          cancelLabel="Annuler"
          variant="danger"
          onConfirm={() => {
            del.mutate(vehicle.id, {
              onSuccess: () => {
                notificationService.success("Véhicule retiré");
                router.push("/partner/rental/fleet");
              },
              onError: () => notificationService.error("Suppression impossible."),
            });
            setConfirmDelete(false);
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-card">
      <h2 className="mb-4 text-sm font-semibold text-heading">{title}</h2>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}
