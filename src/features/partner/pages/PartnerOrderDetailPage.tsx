"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { StatusPill } from "@/shared/ui/StatusPill";
import { ServicePill } from "@/shared/ui/ServicePill";
import { Timeline } from "@/shared/ui/Timeline";
import { tripTimelineToItems } from "@/shared/lib/tripTimeline";
import { Button } from "@/shared/ui/Button";
import { TripRoutePreview } from "@/features/ops/components/TripRoutePreview";
import { TripAssignedVehicleCard } from "@/features/ops/components/TripAssignedVehicleCard";
import { isTripLiveOnMap } from "@/shared/lib/tripDriver";
import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import { formatDateTime } from "@/shared/lib/format";
import { getPaymentLabel } from "@/shared/lib/paymentLabels";
import { TripFinancePanel } from "@/shared/finance/TripFinancePanel";
import { useTripDriverLiveLocation } from "@/features/ops/hooks/useTripDriverLiveLocation";
import { usePartnerOrderDetail } from "../api/orders.queries";

interface Props {
  orderId: string;
}

function formatPaymentStatus(status?: string | null): string {
  if (!status?.trim()) return "—";
  const key = status.toLowerCase();
  if (key === "pending") return "En attente";
  if (key === "paid" || key === "completed") return "Payé";
  if (key === "failed") return "Échoué";
  if (key === "refunded") return "Remboursé";
  return status;
}

export function PartnerOrderDetailPage({ orderId }: Props) {
  const { data: trip, isLoading, isError } = usePartnerOrderDetail(orderId);
  const liveTracking = Boolean(
    trip && isTripLiveOnMap(trip.status) && trip.driver_id
  );
  const { location: driverLiveLocation, isRealtime } = useTripDriverLiveLocation({
    driverId: trip?.driver_id,
    initial: trip?.driver_location,
    enabled: liveTracking,
  });

  if (isLoading) {
    return (
      <DetailPageSkeleton
        title="Course"
        breadcrumb={["Partenaire", "Courses"]}
        showSidebar={false}
        kpiCount={3}
      />
    );
  }

  if (isError || !trip) {
    return (
      <p className="text-sm text-red-600">
        Course introuvable.{" "}
        <Link href="/partner/orders" className="text-teal underline">
          Retour
        </Link>
      </p>
    );
  }

  const timelineItems = tripTimelineToItems(trip.timeline, {
    driverLinkBase: "/partner/drivers",
  });
  const showDriverOnMap = liveTracking && Boolean(driverLiveLocation);
  const vehicleDetailHref = trip.vehicle_id
    ? `/partner/fleet/${trip.vehicle_id}`
    : null;

  return (
    <div className="animate-fade-up mx-auto w-full max-w-6xl">
      <div className="page-sticky-header">
        <PageHeader
          title={trip.ref}
          breadcrumb={["Partenaire", "Courses", trip.ref]}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <ServicePill service={trip.service} />
              <StatusPill status={trip.status} pulse={trip.status === "in_progress"} />
            </div>
          }
        />
        <p className="mt-1 text-sm text-muted">
          {trip.client_name} · {trip.from_label} → {trip.to_label}
        </p>
      </div>

      <div className="detail-page-grid">
        <div className="space-y-6">
          <TripRoutePreview
            fromLabel={trip.from_label}
            toLabel={trip.to_label}
            fromCoords={trip.from_coords}
            toCoords={trip.to_coords}
            driverLocation={showDriverOnMap ? driverLiveLocation : undefined}
            driverLive={isRealtime}
            vehicleIconUrl={trip.vehicle_icon_url}
          />

          <div className="rounded-card border border-border bg-surface p-6 shadow-card">
            <h2 className="text-sm font-semibold text-foreground">Suivi</h2>
            <div className="mt-4">
              {timelineItems.length > 0 ? (
                <Timeline items={timelineItems} />
              ) : (
                <p className="text-sm text-muted">Aucun événement de suivi disponible.</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-card border border-border bg-surface p-5 shadow-card">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
                Client
              </h3>
              <p className="mt-2 font-medium text-foreground">{trip.client_name}</p>
              {trip.client_phone && (
                <p className="text-sm text-muted">{trip.client_phone}</p>
              )}
            </div>

            <div className="rounded-card border border-border bg-surface p-5 shadow-card">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
                Chauffeur
              </h3>
              {trip.driver_name ? (
                <>
                  <Link
                    href={`/partner/drivers/${trip.driver_id ?? ""}`}
                    className="mt-2 block font-medium text-foreground hover:text-teal"
                  >
                    {trip.driver_name}
                  </Link>
                  {trip.driver_phone && (
                    <p className="text-sm text-muted">{trip.driver_phone}</p>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm text-muted">Non assigné</p>
              )}
            </div>

            <TripAssignedVehicleCard
              trip={trip}
              driverLocation={driverLiveLocation}
              driverLive={isRealtime}
              vehicleDetailHref={vehicleDetailHref}
              ignoreStatusCheck
            />
          </div>

          {trip.notes && (
            <div className="rounded-card border border-border bg-surface p-5 shadow-card">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
                Notes
              </h3>
              <p className="mt-2 text-sm text-foreground">{trip.notes}</p>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <TripFinancePanel trip={trip} />

          <div className="rounded-card border border-border bg-surface p-5 shadow-card text-sm">
            <h3 className="font-semibold text-foreground">Détails</h3>
            <dl className="mt-3 space-y-2 text-muted">
              <div className="flex justify-between gap-2">
                <dt>Référence</dt>
                <dd className="font-mono text-xs text-foreground">{trip.ref}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Statut</dt>
                <dd className="text-foreground">
                  <StatusPill status={trip.status} />
                </dd>
              </div>
              {trip.category_code && (
                <div className="flex justify-between gap-2">
                  <dt>Catégorie</dt>
                  <dd className="text-foreground">{trip.category_code}</dd>
                </div>
              )}
              {trip.zone_name && (
                <div className="flex justify-between gap-2">
                  <dt>Zone</dt>
                  <dd className="text-foreground">{trip.zone_name}</dd>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <dt>Paiement</dt>
                <dd className="text-foreground">{getPaymentLabel(trip.payment_method)}</dd>
              </div>
              {trip.payment_status && (
                <div className="flex justify-between gap-2">
                  <dt>Statut paiement</dt>
                  <dd className="text-foreground">
                    {formatPaymentStatus(trip.payment_status)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <dt>Créée le</dt>
                <dd className="text-foreground">{formatDateTime(trip.created_at)}</dd>
              </div>
              {trip.completed_at && (
                <div className="flex justify-between gap-2">
                  <dt>Terminée le</dt>
                  <dd className="text-foreground">{formatDateTime(trip.completed_at)}</dd>
                </div>
              )}
              {trip.cancelled_at && (
                <div className="flex justify-between gap-2">
                  <dt>Annulée le</dt>
                  <dd className="text-foreground">{formatDateTime(trip.cancelled_at)}</dd>
                </div>
              )}
              {trip.estimated_arrival_at && (
                <div className="flex justify-between gap-2">
                  <dt>Arrivée estimée</dt>
                  <dd className="text-foreground">
                    {formatDateTime(trip.estimated_arrival_at)}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <Link href="/partner/orders">
            <Button variant="secondary" className="w-full">
              ← Retour aux courses
            </Button>
          </Link>
        </aside>
      </div>
    </div>
  );
}
