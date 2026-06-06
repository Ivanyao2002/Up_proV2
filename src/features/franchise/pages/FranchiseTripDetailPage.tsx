"use client";

import { DetailPageSkeleton } from "@/shared/ui/skeletons";
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
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { getPaymentLabel } from "@/shared/lib/paymentLabels";
import { useFranchiseTripDetail } from "../api/trips.queries";
import { useTripDriverLiveLocation } from "@/features/ops/hooks/useTripDriverLiveLocation";

interface FranchiseTripDetailPageProps {
  tripId: string;
}

export function FranchiseTripDetailPage({ tripId }: FranchiseTripDetailPageProps) {
  const { data: trip, isLoading, isError } = useFranchiseTripDetail(tripId);
  const liveTracking = Boolean(
    trip && isTripLiveOnMap(trip.status) && trip.driver_id
  );
  const { location: driverLiveLocation, isRealtime } = useTripDriverLiveLocation({
    driverId: trip?.driver_id,
    initial: trip?.driver_location,
    enabled: liveTracking,
  });

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (isError || !trip) {
    return (
      <p className="text-sm text-red-600">
        Course introuvable.{" "}
        <Link href="/franchise/trips" className="text-teal underline">
          Retour
        </Link>
      </p>
    );
  }

  const timelineItems = tripTimelineToItems(trip.timeline, {
    driverLinkBase: "/franchise/drivers",
  });
  const showDriverOnMap = liveTracking && Boolean(driverLiveLocation);

  return (
    <div className="animate-fade-up mx-auto w-full max-w-6xl">
      <PageHeader
        title={trip.ref}
        breadcrumb={["Franchise", "Courses", trip.ref]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {trip.service && <ServicePill service={trip.service} />}
            <StatusPill status={trip.status} pulse={trip.status === "in_progress"} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <TripRoutePreview
            fromLabel={trip.from_label}
            toLabel={trip.to_label}
            fromCoords={trip.from_coords}
            toCoords={trip.to_coords}
            driverLocation={showDriverOnMap ? driverLiveLocation : undefined}
            driverLive={isRealtime}
          />

          <div className="rounded-card border border-border bg-surface p-6 shadow-card">
            <h2 className="text-sm font-semibold text-foreground">Suivi</h2>
            <div className="mt-4">
              <Timeline items={timelineItems} />
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
            {trip.partner_id != null && (
              <div className="rounded-card border border-border bg-surface p-5 shadow-card">
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
                  Partenaire
                </h3>
                <Link
                  href={`/franchise/partners/${trip.partner_id}`}
                  className="mt-2 block font-medium text-foreground hover:text-teal"
                >
                  {trip.partner_name ?? `Partenaire ${trip.partner_id}`}
                </Link>
              </div>
            )}
            <div className="rounded-card border border-border bg-surface p-5 shadow-card">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
                Chauffeur
              </h3>
              {trip.driver_name ? (
                <>
                  <Link
                    href={`/franchise/drivers/${trip.driver_id ?? ""}`}
                    className="mt-2 block font-medium text-foreground hover:text-teal"
                  >
                    {trip.driver_name}
                  </Link>
                  {trip.driver_phone && (
                    <p className="text-sm text-muted">{trip.driver_phone}</p>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm text-muted">En cours d&apos;assignation</p>
              )}
            </div>
            <TripAssignedVehicleCard
              trip={trip}
              driverLocation={driverLiveLocation}
              driverLive={isRealtime}
            />
          </div>

        </div>

        <aside className="space-y-4">
          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Montant
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-heading">
              {formatFCFA(trip.amount_fcfa)}
            </p>
            {trip.payment_method && (
              <p className="mt-2 text-sm text-muted">
                {getPaymentLabel(trip.payment_method)}
              </p>
            )}
          </div>

          <div className="rounded-card border border-border bg-surface p-5 shadow-card text-sm">
            <h3 className="font-semibold text-foreground">Détails</h3>
            <dl className="mt-3 space-y-2 text-muted">
              <div className="flex justify-between gap-2">
                <dt>Départ</dt>
                <dd className="max-w-[55%] text-right text-foreground">{trip.from_label}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Arrivée</dt>
                <dd className="max-w-[55%] text-right text-foreground">{trip.to_label}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Créée le</dt>
                <dd className="text-foreground">{formatDateTime(trip.created_at)}</dd>
              </div>
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

          <Link href="/franchise/trips">
            <Button variant="secondary" className="w-full">
              ← Retour aux courses
            </Button>
          </Link>
        </aside>
      </div>
    </div>
  );
}
