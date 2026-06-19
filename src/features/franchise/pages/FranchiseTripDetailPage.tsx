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
import { formatDateTime } from "@/shared/lib/format";
import { TripFinancePanel } from "@/shared/finance/TripFinancePanel";
import { DetailPageSkeleton } from "@/shared/ui/skeletons";
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
    return (
      <DetailPageSkeleton
        title="Course"
        breadcrumb={["Franchise", "Opération", "Courses"]}
        showSidebar={false}
        kpiCount={3}
      />
    );
  }

  if (isError || !trip) {
    return (
      <p className="text-sm text-red-600">
        Course introuvable.{" "}
        <Link href="/franchise/ops/trips" className="text-teal underline">
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
    <div className="animate-fade-up">
      <div className="page-sticky-header">
        <PageHeader
          title={trip.ref}
          breadcrumb={["Franchise", "Opération", "Courses", trip.ref]}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {trip.service && <ServicePill service={trip.service} />}
              <StatusPill status={trip.status} pulse={trip.status === "in_progress"} />
            </div>
          }
        />
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
                <p className="mt-2 text-sm text-muted">Non assigné</p>
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
          <TripFinancePanel trip={trip} />

          <div className="rounded-card border border-border bg-surface p-5 shadow-card text-sm">
            <h3 className="font-semibold text-foreground">Contexte</h3>
            <dl className="mt-3 space-y-2 text-muted">
              {trip.zone_name && (
                <div className="flex justify-between gap-2">
                  <dt>Zone</dt>
                  <dd className="text-foreground">{trip.zone_name}</dd>
                </div>
              )}
              {trip.partner_name && (
                <div className="flex justify-between gap-2">
                  <dt>Partenaire</dt>
                  <dd className="text-foreground">{trip.partner_name}</dd>
                </div>
              )}
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

          <Link href="/franchise/ops/trips" className="block">
            <Button variant="secondary" className="w-full">
              ← Retour aux courses
            </Button>
          </Link>
        </aside>
      </div>
    </div>
  );
}
