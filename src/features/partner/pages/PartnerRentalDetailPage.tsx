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
  useRescheduleRentalOffer,
} from "../api/rental.queries";
import {
  useRentalCheckIn,
  useRentalCheckOut,
  useRentalClose,
  usePartnerRentalDocuments,
} from "../api/rentalInspection.queries";
import { RENTAL_DOCUMENT_LABELS } from "../api/rentalInspection.service";
import { usePartnerRentalVehicles } from "../api/rentalFleet.queries";
import { usePartnerDriversList } from "../api/drivers.queries";
import {
  RENTAL_STATUS_CONFIG,
  RENTAL_STATUS_FLOW,
  rentalNextActions,
  type RentalStatus,
  type RentalAction,
} from "../lib/rentalStatus";
import { RentalRejectModal } from "../components/RentalRejectModal";
import { RentalRescheduleModal } from "../components/RentalRescheduleModal";
import { RentalCheckInModal } from "../components/RentalCheckInModal";
import { RentalCheckOutModal } from "../components/RentalCheckOutModal";
import { RentalDepositPanel } from "../components/RentalDepositPanel";
import { RentalIncidentModal } from "../components/RentalIncidentModal";
import { useCreateRentalIncident } from "../api/rentalIncident.queries";
import { RENTAL_VEHICLE_CATEGORY_LABELS } from "../api/rentalFleet.service";

const RESCHEDULABLE: RentalStatus[] = ["awaiting_confirmation", "confirmed", "ready"];

export function PartnerRentalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: offer, isLoading, isError } = usePartnerRentalOfferDetail(id!);
  const update = useUpdateRentalOffer();
  const reschedule = useRescheduleRentalOffer();
  const del = useDeleteRentalOffer();
  const checkIn = useRentalCheckIn();
  const checkOut = useRentalCheckOut();
  const close = useRentalClose();
  const incident = useCreateRentalIncident();

  const [confirmStatus, setConfirmStatus] = useState<{ to: RentalStatus; label: string } | null>(
    null
  );
  const [reasonModal, setReasonModal] = useState<"reject" | "cancel" | null>(null);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showCheckOut, setShowCheckOut] = useState(false);
  const [showIncident, setShowIncident] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");

  const { data: fleetData } = usePartnerRentalVehicles({ per_page: 200 });
  const { data: driversData } = usePartnerDriversList({ per_page: 200 });
  const { data: documents } = usePartnerRentalDocuments(id);

  if (isLoading) {
    return <DetailPageSkeleton title="Réservation" breadcrumb={["Partenaire", "Location"]} />;
  }
  if (isError || !offer) {
    return <div className="p-6 text-red-600">Réservation introuvable.</div>;
  }

  const cfg = RENTAL_STATUS_CONFIG[offer.status];
  const actions = rentalNextActions(offer.status);
  const vehicles = fleetData?.data ?? [];
  const drivers = driversData?.data ?? [];

  const applyStatus = (to: RentalStatus, reason?: string) =>
    update.mutate(
      {
        id: offer.id,
        data: reason
          ? { status: to, rejection_reason: reason, cancellation_reason: reason }
          : { status: to },
      },
      {
        onSuccess: () => notificationService.success("Réservation mise à jour"),
        onError: () => notificationService.error("Action impossible."),
      }
    );

  const onAction = (a: RentalAction) => {
    if (a.requiresReason) {
      setReasonModal(a.kind === "reject" ? "reject" : "cancel");
      return;
    }
    switch (a.kind) {
      case "check_in":
        setShowCheckIn(true);
        return;
      case "check_out":
        setShowCheckOut(true);
        return;
      case "close":
        close.mutate(
          { offerId: offer.id },
          {
            onSuccess: () => notificationService.success("Réservation clôturée — facture générée"),
            onError: () => notificationService.error("Clôture impossible."),
          }
        );
        return;
      default:
        setConfirmStatus({ to: a.to, label: a.label });
    }
  };

  const saveAssignment = () =>
    update.mutate(
      {
        id: offer.id,
        data: {
          rental_vehicle_id: vehicleId || offer.rental_vehicle_id,
          driver_id: driverId || offer.driver_id,
        },
      },
      {
        onSuccess: () => notificationService.success("Affectation enregistrée"),
        onError: () => notificationService.error("Affectation impossible."),
      }
    );

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
            {RESCHEDULABLE.includes(offer.status) && (
              <Button variant="secondary" onClick={() => setShowReschedule(true)}>
                Replanifier
              </Button>
            )}
            {actions.map((a) => (
              <Button
                key={a.kind}
                variant={a.variant === "primary" ? "primary" : "secondary"}
                className={a.variant === "danger" ? "text-red-600" : undefined}
                onClick={() => onAction(a)}
              >
                {a.label}
              </Button>
            ))}
          </div>
        }
      />

      {/* Timeline statuts */}
      <div className="mt-6 overflow-x-auto">
        <ol className="flex min-w-max items-center gap-2 text-xs">
          {RENTAL_STATUS_FLOW.map((s, i) => {
            const reached =
              RENTAL_STATUS_FLOW.indexOf(offer.status) >= i &&
              RENTAL_STATUS_FLOW.includes(offer.status);
            const isCurrent = offer.status === s;
            return (
              <li key={s} className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 ${
                    isCurrent
                      ? "bg-teal text-white"
                      : reached
                        ? "bg-teal/15 text-teal"
                        : "bg-muted/10 text-muted"
                  }`}
                >
                  {RENTAL_STATUS_CONFIG[s].label}
                </span>
                {i < RENTAL_STATUS_FLOW.length - 1 && <span className="text-muted">→</span>}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Période de location">
            <div className="grid grid-cols-2 gap-4">
              <Info label="Prise en charge" value={formatDateTime(offer.pickup_date)} />
              <Info label="Retour" value={formatDateTime(offer.return_date)} />
              <Info label="Lieu de prise en charge" value={offer.pickup_location} />
              <Info label="Lieu de retour" value={offer.return_location || offer.pickup_location} />
            </div>
          </Card>

          <Card title="Affectation">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-foreground">Véhicule (flotte location)</span>
                <select
                  value={vehicleId || offer.rental_vehicle_id || ""}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                >
                  <option value="">{offer.vehicle_label ?? "Non assigné"}</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {(v.label || v.plate || v.id) +
                        " — " +
                        (RENTAL_VEHICLE_CATEGORY_LABELS[v.category] ?? v.category)}
                    </option>
                  ))}
                </select>
              </label>
              {offer.with_driver && (
                <label className="block">
                  <span className="text-sm font-medium text-foreground">Chauffeur</span>
                  <select
                    value={driverId || offer.driver_id || ""}
                    onChange={(e) => setDriverId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                  >
                    <option value="">{offer.driver_name ?? "Aucun"}</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={String(d.id)}>
                        {`${d.first_name ?? ""} ${d.last_name ?? ""}`.trim() || String(d.id)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
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

          {(offer.check_in_at || offer.check_out_at) && (
            <Card title="États des lieux">
              <div className="grid grid-cols-2 gap-4">
                {offer.check_in_at && (
                  <>
                    <Info label="Check-in" value={formatDateTime(offer.check_in_at)} />
                    <Info
                      label="Km / carburant départ"
                      value={`${offer.km_start ?? "—"} km · ${offer.fuel_start ?? "—"}%`}
                    />
                  </>
                )}
                {offer.check_out_at && (
                  <>
                    <Info label="Check-out" value={formatDateTime(offer.check_out_at)} />
                    <Info
                      label="Km / carburant retour"
                      value={`${offer.km_end ?? "—"} km · ${offer.fuel_end ?? "—"}%`}
                    />
                  </>
                )}
              </div>
              {(offer.damages?.length ?? 0) > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-muted">Dommages</p>
                  <ul className="list-inside list-disc text-sm text-foreground">
                    {offer.damages!.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
              {offer.extras && (
                <div className="mt-3 space-y-1 border-t border-border pt-3">
                  {offer.extras.late_fcfa ? (
                    <Row label="Retard" value={formatFCFA(offer.extras.late_fcfa)} />
                  ) : null}
                  {offer.extras.km_extra_fcfa ? (
                    <Row label="Dépassement km" value={formatFCFA(offer.extras.km_extra_fcfa)} />
                  ) : null}
                  {offer.extras.damages_fcfa ? (
                    <Row label="Dommages" value={formatFCFA(offer.extras.damages_fcfa)} />
                  ) : null}
                  <Row label="Total extras" value={formatFCFA(offer.extras.total_fcfa)} strong />
                </div>
              )}
            </Card>
          )}

          {offer.notes && (
            <Card title="Notes">
              <p className="text-sm text-foreground">{offer.notes}</p>
            </Card>
          )}
          {(offer.rejection_reason || offer.cancellation_reason) && (
            <Card title="Motif">
              <p className="text-sm text-red-600">
                {offer.rejection_reason || offer.cancellation_reason}
              </p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Tarification">
            <div className="space-y-3">
              {offer.base_price_fcfa != null && (
                <Row label="Base" value={formatFCFA(offer.base_price_fcfa)} />
              )}
              {offer.options_total_fcfa ? (
                <Row label="Options" value={formatFCFA(offer.options_total_fcfa)} />
              ) : null}
              {offer.extras_total_fcfa ? (
                <Row label="Extras" value={formatFCFA(offer.extras_total_fcfa)} />
              ) : null}
              <Row label="Prix total" value={formatFCFA(offer.price_fcfa)} strong />
            </div>
          </Card>

          {offer.deposit_fcfa != null && offer.deposit_fcfa > 0 && (
            <RentalDepositPanel offer={offer} />
          )}

          {(documents?.length ?? 0) > 0 && (
            <Card title="Documents">
              <ul className="space-y-2">
                {documents!.map((d, i) => (
                  <li key={i} className="flex items-center justify-between gap-2">
                    <span className="text-sm">{d.label || RENTAL_DOCUMENT_LABELS[d.kind]}</span>
                    {d.url ? (
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-teal hover:underline"
                      >
                        Télécharger
                      </a>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

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

          {(offer.status === "active" || offer.status === "return_due") && (
            <Card title="Suivi GPS">
              <p className="mb-3 text-xs text-muted">
                Localisation disponible pendant la période de location active.
              </p>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => router.push("/partner/map")}
              >
                Ouvrir la carte live
              </Button>
            </Card>
          )}

          <Card title="Suivi">
            <div className="space-y-2">
              <Info label="Créée le" value={formatDateTime(offer.created_at)} />
              <Info label="Référence" value={offer.ref} />
            </div>
            <div className="mt-4 space-y-2">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setShowIncident(true)}
              >
                Signaler un incident
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => router.push("/partner/rental")}
              >
                Retour à la liste
              </Button>
              <Button
                variant="secondary"
                className="w-full text-red-600"
                onClick={() => setConfirmDelete(true)}
              >
                Supprimer la réservation
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {confirmStatus && (
        <ConfirmModal
          open
          title={`${confirmStatus.label} la réservation`}
          message={`Confirmer l'action « ${confirmStatus.label} » sur ${offer.ref} ?`}
          confirmLabel={confirmStatus.label}
          cancelLabel="Annuler"
          onConfirm={() => {
            applyStatus(confirmStatus.to);
            setConfirmStatus(null);
          }}
          onCancel={() => setConfirmStatus(null)}
        />
      )}

      {reasonModal && (
        <RentalRejectModal
          offerRef={offer.ref}
          variant={reasonModal}
          isPending={update.isPending}
          onConfirm={(reason) => {
            applyStatus("cancelled", reason);
            setReasonModal(null);
          }}
          onClose={() => setReasonModal(null)}
        />
      )}

      {showCheckIn && (
        <RentalCheckInModal
          offerRef={offer.ref}
          isPending={checkIn.isPending}
          onConfirm={(data) =>
            checkIn.mutate(
              { offerId: offer.id, data },
              {
                onSuccess: () => {
                  notificationService.success("Prise en charge enregistrée");
                  setShowCheckIn(false);
                },
                onError: () => notificationService.error("Check-in impossible."),
              }
            )
          }
          onClose={() => setShowCheckIn(false)}
        />
      )}

      {showCheckOut && (
        <RentalCheckOutModal
          offerRef={offer.ref}
          isPending={checkOut.isPending}
          onConfirm={(data) =>
            checkOut.mutate(
              { offerId: offer.id, data },
              {
                onSuccess: (res) => {
                  const total = res?.extras?.total_fcfa;
                  notificationService.success(
                    total != null
                      ? `Retour enregistré — extras ${formatFCFA(total)}`
                      : "Retour enregistré"
                  );
                  setShowCheckOut(false);
                },
                onError: () => notificationService.error("Check-out impossible."),
              }
            )
          }
          onClose={() => setShowCheckOut(false)}
        />
      )}

      {showIncident && (
        <RentalIncidentModal
          offerRef={offer.ref}
          isPending={incident.isPending}
          onConfirm={(data) =>
            incident.mutate(
              { offerId: offer.id, data },
              {
                onSuccess: () => {
                  notificationService.success("Incident signalé — ticket ouvert");
                  setShowIncident(false);
                },
                onError: () => notificationService.error("Signalement impossible."),
              }
            )
          }
          onClose={() => setShowIncident(false)}
        />
      )}

      {showReschedule && (
        <RentalRescheduleModal
          offerRef={offer.ref}
          defaultPickup={offer.pickup_date}
          defaultReturn={offer.return_date}
          isPending={reschedule.isPending}
          onConfirm={(data) =>
            reschedule.mutate(
              { id: offer.id, data },
              {
                onSuccess: () => {
                  notificationService.success("Créneau proposé");
                  setShowReschedule(false);
                },
                onError: () => notificationService.error("Replanification impossible."),
              }
            )
          }
          onClose={() => setShowReschedule(false)}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          open
          title="Supprimer la réservation"
          message={`Supprimer définitivement la réservation ${offer.ref} ?`}
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
          variant="danger"
          onConfirm={() => {
            del.mutate(offer.id, {
              onSuccess: () => {
                notificationService.success("Réservation supprimée");
                router.push("/partner/rental");
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

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-sm text-muted">{label}</span>
      <span className={strong ? "text-sm font-semibold text-teal" : "text-sm text-foreground"}>
        {value}
      </span>
    </div>
  );
}
