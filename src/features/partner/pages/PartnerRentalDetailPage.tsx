"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { notificationService } from "@/core/http/notificationService";
import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import {
  usePartnerRentalOfferDetail,
  useUpdateRentalOffer,
  useDeleteRentalOffer,
} from "../api/rental.queries";
import { usePartnerVehiclesList } from "../api/vehicles.queries";
import { usePartnerDriversList } from "../api/drivers.queries";
import type { RentalOfferStatus } from "../api/rental.service";

const STATUS_CONFIG: Record<RentalOfferStatus, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Confirmée", color: "bg-blue-100 text-blue-700" },
  rejected: { label: "Refusée", color: "bg-red-100 text-red-700" },
  active: { label: "En cours", color: "bg-green-100 text-green-700" },
  completed: { label: "Terminée", color: "bg-gray-100 text-gray-700" },
  cancelled: { label: "Annulée", color: "bg-red-100 text-red-700" },
};

export function PartnerRentalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: offer, isLoading, isError } = usePartnerRentalOfferDetail(id!);
  const update = useUpdateRentalOffer();
  const del = useDeleteRentalOffer();
  const [confirmAction, setConfirmAction] = useState<{ type: string; status?: RentalOfferStatus } | null>(null);
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");

  const { data: vehiclesData } = usePartnerVehiclesList("approved", { per_page: 200 });
  const { data: driversData } = usePartnerDriversList({ per_page: 200 });

  if (isLoading) {
    return <DetailPageSkeleton title="Réservation" breadcrumb={["Partenaire", "Location"]} />;
  }
  if (isError || !offer) {
    return <div className="p-6 text-red-600">Réservation introuvable.</div>;
  }

  const cfg = STATUS_CONFIG[offer.status];

  const runStatus = (status: RentalOfferStatus, msg: string) =>
    update.mutate(
      { id: offer.id, data: { status } },
      {
        onSuccess: () => notificationService.success(msg),
        onError: () => notificationService.error("Action impossible."),
      }
    );

  const saveAssignment = () => {
    update.mutate(
      {
        id: offer.id,
        data: {
          vehicle_id: vehicleId || offer.vehicle_id,
          driver_id: driverId || offer.driver_id,
        },
      },
      {
        onSuccess: () => notificationService.success("Affectation enregistrée"),
        onError: () => notificationService.error("Affectation impossible."),
      }
    );
  };

  const vehicles = vehiclesData?.data ?? [];
  const drivers = driversData?.data ?? [];

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader
        title={`Location ${offer.ref}`}
        breadcrumb={["Partenaire", "Location", offer.ref]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${cfg.color}`}>
              {cfg.label}
            </span>
            {offer.status === "pending" && (
              <>
                <Button onClick={() => setConfirmAction({ type: "Confirmer", status: "confirmed" })}>
                  Confirmer
                </Button>
                <Button variant="secondary" onClick={() => setConfirmAction({ type: "Refuser", status: "rejected" })}>
                  Refuser
                </Button>
              </>
            )}
            {offer.status === "confirmed" && (
              <Button onClick={() => setConfirmAction({ type: "Démarrer (check-in)", status: "active" })}>
                Check-in
              </Button>
            )}
            {offer.status === "active" && (
              <Button variant="secondary" onClick={() => setConfirmAction({ type: "Clôturer (check-out)", status: "completed" })}>
                Check-out
              </Button>
            )}
            {["pending", "confirmed", "active"].includes(offer.status) && (
              <Button variant="secondary" className="text-red-600" onClick={() => setConfirmAction({ type: "Annuler", status: "cancelled" })}>
                Annuler
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mt-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Période */}
          <Card title="Période de location">
            <div className="grid grid-cols-2 gap-4">
              <Info label="Prise en charge" value={formatDateTime(offer.pickup_date)} />
              <Info label="Retour" value={formatDateTime(offer.return_date)} />
              <Info label="Lieu de prise en charge" value={offer.pickup_location} />
              <Info label="Lieu de retour" value={offer.return_location || offer.pickup_location} />
            </div>
          </Card>

          {/* Affectation */}
          <Card title="Véhicule & chauffeur">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-foreground">Véhicule</span>
                <select
                  value={vehicleId || offer.vehicle_id || ""}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                >
                  <option value="">{offer.vehicle_label ?? "Non assigné"}</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={String(v.id)}>
                      {v.label || v.plate || String(v.id)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-foreground">Chauffeur</span>
                <select
                  value={driverId || offer.driver_id || ""}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                >
                  <option value="">{offer.driver_name ?? "Aucun (auto-location)"}</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={String(d.id)}>
                      {`${d.first_name ?? ""} ${d.last_name ?? ""}`.trim() || String(d.id)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-4">
              <Button
                variant="secondary"
                disabled={update.isPending || (!vehicleId && !driverId)}
                onClick={saveAssignment}
              >
                Enregistrer l&apos;affectation
              </Button>
            </div>
          </Card>

          {offer.notes && (
            <Card title="Notes">
              <p className="text-sm text-foreground">{offer.notes}</p>
            </Card>
          )}
          {offer.rejection_reason && (
            <Card title="Motif de refus">
              <p className="text-sm text-red-600">{offer.rejection_reason}</p>
            </Card>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          <Card title="Tarification">
            <div className="space-y-3">
              <Row label="Prix total" value={formatFCFA(offer.price_fcfa)} strong />
              {offer.deposit_fcfa != null && offer.deposit_fcfa > 0 && (
                <Row label="Caution" value={formatFCFA(offer.deposit_fcfa)} />
              )}
            </div>
          </Card>

          <Card title="Client">
            <div className="space-y-2">
              <Info label="Nom" value={offer.client_name || "—"} />
              {offer.client_phone && (
                <div>
                  <p className="text-xs text-muted">Téléphone</p>
                  <a href={`tel:${offer.client_phone}`} className="text-sm text-teal hover:underline">
                    {offer.client_phone}
                  </a>
                </div>
              )}
            </div>
          </Card>

          <Card title="Suivi">
            <div className="space-y-2">
              <Info label="Créée le" value={formatDateTime(offer.created_at)} />
              <Info label="Référence" value={offer.ref} />
            </div>
            <div className="mt-4 space-y-2">
              <Button variant="secondary" className="w-full" onClick={() => router.push("/partner/rental")}>
                Retour à la liste
              </Button>
              <Button
                variant="secondary"
                className="w-full text-red-600"
                onClick={() => setConfirmAction({ type: "Supprimer" })}
              >
                Supprimer la réservation
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {confirmAction && (
        <ConfirmModal
          open
          title={`${confirmAction.type} la réservation`}
          message={`Voulez-vous ${confirmAction.type.toLowerCase()} la réservation ${offer.ref} ?`}
          confirmLabel={confirmAction.type}
          cancelLabel="Annuler"
          variant={["Refuser", "Annuler", "Supprimer"].includes(confirmAction.type) ? "danger" : "primary"}
          onConfirm={() => {
            if (confirmAction.type === "Supprimer") {
              del.mutate(offer.id, {
                onSuccess: () => {
                  notificationService.success("Réservation supprimée");
                  router.push("/partner/rental");
                },
                onError: () => notificationService.error("Suppression impossible."),
              });
            } else if (confirmAction.status) {
              runStatus(confirmAction.status, `Réservation ${confirmAction.type.toLowerCase()}e`);
            }
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-card">
      <h2 className="text-sm font-semibold text-heading mb-4">{title}</h2>
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

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-sm text-muted">{label}</span>
      <span className={strong ? "text-sm font-semibold text-teal" : "text-sm text-foreground"}>{value}</span>
    </div>
  );
}
