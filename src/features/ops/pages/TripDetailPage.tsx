"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { StatusPill } from "@/shared/ui/StatusPill";
import { ServicePill } from "@/shared/ui/ServicePill";
import { Timeline } from "@/shared/ui/Timeline";
import { tripTimelineToItems } from "@/shared/lib/tripTimeline";
import { Button } from "@/shared/ui/Button";
import { TripRoutePreview } from "../components/TripRoutePreview";
import { TripAssignedVehicleCard } from "../components/TripAssignedVehicleCard";
import { TripReassignModal } from "../components/TripReassignModal";
import { isTripLiveOnMap } from "@/shared/lib/tripDriver";
import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import { useTripDetail } from "../api/tripDetail.queries";
import { useTripDriverLiveLocation } from "../hooks/useTripDriverLiveLocation";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { getPaymentLabel } from "@/shared/lib/paymentLabels";
interface TripDetailPageProps {
  tripId: string;
}

export function TripDetailPage({ tripId }: TripDetailPageProps) {
  const [reassignOpen, setReassignOpen] = useState(false);
  const { data: trip, isLoading, isError } = useTripDetail(tripId);
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
        breadcrumb={["Admin", "Opérations", "Courses"]}
        showSidebar={false}
        kpiCount={3}
      />
    );
  }

  if (isError || !trip) {
    return (
      <p className="text-sm text-red-600">
        Course introuvable.{" "}
        <Link href="/admin/ops/trips" className="text-teal underline">
          Retour
        </Link>
      </p>
    );
  }

  const timelineItems = tripTimelineToItems(trip.timeline);
  const showDriverOnMap = liveTracking && Boolean(driverLiveLocation);

  const canCancel = ["requested", "matching", "assigned", "in_progress"].includes(
    trip.status
  );

  return (
    <div className="animate-fade-up">
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader
          title={trip.ref}
          breadcrumb={["Admin", "Opérations", "Courses", trip.ref]}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <ServicePill service={trip.service} />
              <StatusPill status={trip.status} pulse={trip.status === "in_progress"} />
              {canCancel && (
                <Button variant="secondary" className="!text-xs">
                  Annuler la course
                </Button>
              )}
            </div>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
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
            <div className="rounded-card border border-border bg-surface p-5 shadow-card">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
                Chauffeur
              </h3>
              {trip.driver_name ? (
                <>
                  <Link
                    href={`/admin/fleet/drivers/${trip.driver_id ?? ""}`}
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
          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Montant course
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-heading">
              {formatFCFA(trip.amount_fcfa)}
            </p>
            <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-muted">
                <dt>Commission plateforme</dt>
                <dd className="tabular-nums text-foreground">
                  {formatFCFA(trip.commission_fcfa)}
                </dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>Gain chauffeur</dt>
                <dd className="tabular-nums font-medium text-teal-dark">
                  {formatFCFA(trip.driver_earning_fcfa)}
                </dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>Paiement</dt>
                <dd className="text-foreground">{getPaymentLabel(trip.payment_method)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-card border border-border bg-surface p-5 shadow-card text-sm">
            <h3 className="font-semibold text-foreground">Contexte</h3>
            <dl className="mt-3 space-y-2 text-muted">
              {trip.zone_name && (
                <div className="flex justify-between gap-2">
                  <dt>Zone</dt>
                  <dd className="text-foreground">{trip.zone_name}</dd>
                </div>
              )}
              {trip.franchise_name && (
                <div className="flex justify-between gap-2">
                  <dt>Franchise</dt>
                  <dd className="text-foreground">{trip.franchise_name}</dd>
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

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setReassignOpen(true)}
            disabled={trip.status === "completed" || trip.status === "cancelled"}
          >
            Réassigner le chauffeur
          </Button>
          <Link href={`/admin/ops/trips/${tripId}/forensic`} className="block">
            <Button variant="ghost" className="w-full !text-xs">
              Forensic GPS
            </Button>
          </Link>
        </aside>
      </div>

      <TripReassignModal
        tripId={tripId}
        tripRef={trip.ref}
        open={reassignOpen}
        onClose={() => setReassignOpen(false)}
      />
    </div>
  );
}
