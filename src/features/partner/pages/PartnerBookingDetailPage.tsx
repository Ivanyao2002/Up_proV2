"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { StatusPill } from "@/shared/ui/StatusPill";
import { ServicePill } from "@/shared/ui/ServicePill";
import { Timeline, type TimelineItem } from "@/shared/ui/Timeline";
import { Button } from "@/shared/ui/Button";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { TripRoutePreview } from "@/features/ops/components/TripRoutePreview";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { getPaymentLabel } from "@/shared/lib/paymentLabels";
import type { TripTimelineEvent } from "@/shared/types";
import { usePartnerBookingDetail, useCancelPartnerBooking } from "../api/bookings.queries";

function timelineVariant(
  type: TripTimelineEvent["type"]
): TimelineItem["variant"] {
  if (type === "completed" || type === "in_progress") return "success";
  if (type === "cancelled") return "muted";
  if (type === "matching" || type === "requested") return "warning";
  return "default";
}

interface PartnerBookingDetailPageProps {
  bookingId: string;
}

export function PartnerBookingDetailPage({ bookingId }: PartnerBookingDetailPageProps) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const { data: booking, isLoading, isError } = usePartnerBookingDetail(bookingId);
  const cancelBooking = useCancelPartnerBooking(bookingId);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-card bg-border" />;
  }

  if (isError || !booking) {
    return (
      <p className="text-sm text-red-600">
        Réservation introuvable.{" "}
        <Link href="/partner/bookings" className="text-teal underline">
          Retour
        </Link>
      </p>
    );
  }

  const timelineItems: TimelineItem[] = booking.timeline.map((e) => ({
    id: e.id,
    label: e.label,
    description: e.description,
    at: e.at,
    variant: timelineVariant(e.type),
  }));

  const canCancel = ["requested", "matching", "assigned"].includes(booking.status);

  return (
    <div className="animate-fade-up mx-auto w-full max-w-6xl">
      <PageHeader
        title={booking.ref}
        breadcrumb={["Partenaire", "Réservations", booking.ref]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {booking.service && <ServicePill service={booking.service} />}
            <StatusPill status={booking.status} pulse={booking.status === "in_progress"} />
            {canCancel && (
              <Button
                variant="secondary"
                className="!text-xs"
                disabled={cancelBooking.isPending}
                onClick={() => setConfirmCancel(true)}
              >
                Annuler
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <TripRoutePreview
            fromLabel={booking.from_label}
            toLabel={booking.to_label}
            fromCoords={{ lat: booking.from_lat, lng: booking.from_lng }}
            toCoords={{ lat: booking.to_lat, lng: booking.to_lng }}
          />

          <div className="rounded-card border border-border bg-surface p-6 shadow-card">
            <h2 className="text-sm font-semibold text-foreground">Suivi</h2>
            <div className="mt-4">
              <Timeline items={timelineItems} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-card border border-border bg-surface p-5 shadow-card">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
                Client
              </h3>
              <p className="mt-2 font-medium text-foreground">{booking.client_name}</p>
              {booking.client_phone && (
                <p className="text-sm text-muted">{booking.client_phone}</p>
              )}
            </div>
            <div className="rounded-card border border-border bg-surface p-5 shadow-card">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
                Chauffeur
              </h3>
              {booking.driver_name ? (
                <>
                  <Link
                    href={`/partner/drivers/${booking.driver_id ?? ""}`}
                    className="mt-2 block font-medium text-foreground hover:text-teal"
                  >
                    {booking.driver_name}
                  </Link>
                  {booking.driver_phone && (
                    <p className="text-sm text-muted">{booking.driver_phone}</p>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm text-muted">En cours d&apos;assignation</p>
              )}
            </div>
          </div>

          {booking.notes && (
            <div className="rounded-card border border-border bg-surface p-5 shadow-card">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
                Notes
              </h3>
              <p className="mt-2 text-sm text-foreground">{booking.notes}</p>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Montant
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-heading">
              {formatFCFA(booking.amount_fcfa)}
            </p>
            {booking.payment_method && (
              <p className="mt-2 text-sm text-muted">
                {getPaymentLabel(booking.payment_method)}
              </p>
            )}
          </div>

          <div className="rounded-card border border-border bg-surface p-5 shadow-card text-sm">
            <h3 className="font-semibold text-foreground">Détails</h3>
            <dl className="mt-3 space-y-2 text-muted">
              <div className="flex justify-between gap-2">
                <dt>Départ</dt>
                <dd className="max-w-[55%] text-right text-foreground">{booking.from_label}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Arrivée</dt>
                <dd className="max-w-[55%] text-right text-foreground">{booking.to_label}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Créée le</dt>
                <dd className="text-foreground">{formatDateTime(booking.created_at)}</dd>
              </div>
              {booking.estimated_arrival_at && (
                <div className="flex justify-between gap-2">
                  <dt>Arrivée estimée</dt>
                  <dd className="text-foreground">
                    {formatDateTime(booking.estimated_arrival_at)}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <Link href="/partner/bookings">
            <Button variant="secondary" className="w-full">
              ← Retour aux réservations
            </Button>
          </Link>
        </aside>
      </div>

      <ConfirmModal
        open={confirmCancel}
        title="Annuler cette réservation ?"
        message="La course sera retirée de la file d'attente. Cette action est irréversible."
        confirmLabel="Annuler la réservation"
        variant="danger"
        onConfirm={() => {
          cancelBooking.mutate(undefined, { onSuccess: () => setConfirmCancel(false) });
        }}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
}
