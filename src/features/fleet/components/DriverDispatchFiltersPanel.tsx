"use client";

import type { ReactNode } from "react";
import { formatDateTime } from "@/shared/lib/format";
import { useDriverDispatchEligibility } from "../api/driverDispatchEligibility.queries";
import type { DriverDispatchFiltersView } from "../api/driverDispatchEligibility.mapper";

interface DriverDispatchFilterBadgesProps {
  driverId: string;
  className?: string;
}

function FilterBadge({
  label,
  tone,
}: {
  label: string;
  tone: "teal" | "indigo";
}) {
  const styles =
    tone === "teal"
      ? "bg-teal/15 text-teal-dark"
      : "bg-indigo-50 text-indigo-800";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles}`}
    >
      {label}
    </span>
  );
}

export function buildDispatchFilterBadges(
  data: DriverDispatchFiltersView | null | undefined
): { key: string; label: string; tone: "teal" | "indigo" }[] {
  if (!data) return [];

  const badges: { key: string; label: string; tone: "teal" | "indigo" }[] = [];

  if (data.exclusiveZoneActive) {
    badges.push({
      key: "exclusive-zone",
      label: data.exclusiveZoneLabel
        ? `Zone : ${data.exclusiveZoneLabel}`
        : "Zone exclusive",
      tone: "teal",
    });
  }

  if (data.headingHomeActive) {
    badges.push({
      key: "heading-home",
      label: data.homeZoneLabel
        ? `Retour → ${data.homeZoneLabel}`
        : "Retour domicile",
      tone: "indigo",
    });
  }

  return badges;
}

export function DriverDispatchFilterBadges({
  driverId,
  className = "",
}: DriverDispatchFilterBadgesProps) {
  const { data } = useDriverDispatchEligibility(driverId);
  const badges = buildDispatchFilterBadges(data);

  if (!badges.length) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {badges.map((badge) => (
        <FilterBadge key={badge.key} label={badge.label} tone={badge.tone} />
      ))}
    </div>
  );
}

interface DriverDispatchFiltersPanelProps {
  driverId: string;
  className?: string;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  if (value == null || value === "" || value === "—") return null;

  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right text-foreground">{value}</dd>
    </div>
  );
}

export function DriverDispatchFiltersPanel({
  driverId,
  className = "",
}: DriverDispatchFiltersPanelProps) {
  const { data, isLoading, isError } = useDriverDispatchEligibility(driverId);
  const badges = buildDispatchFilterBadges(data);
  const hasActiveFilters = badges.length > 0;
  const hasDetails =
    Boolean(data?.homeZoneLabel) ||
    Boolean(data?.homeLocationLabel) ||
    data?.distanceToHomeKm != null ||
    Boolean(data?.lastLocation) ||
    Boolean(data?.blockedZones.length) ||
    data?.maxDistanceKm != null ||
    Boolean(data?.headingHomeConfig);

  return (
    <div
      className={`rounded-card border border-border bg-surface p-5 shadow-card text-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground">Filtres dispatch</h3>
          <p className="mt-1 text-xs text-muted">
            Configurés par le chauffeur dans l&apos;app mobile.
          </p>
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="h-20 animate-pulse rounded-lg bg-navy/10" />
        ) : isError ? (
          <p className="text-xs text-amber-700">
            Impossible de charger l&apos;éligibilité dispatch pour ce chauffeur.
          </p>
        ) : !data ? (
          <p className="text-xs text-muted">
            Données dispatch non disponibles pour ce profil.
          </p>
        ) : (
          <div className="space-y-4">
            {hasActiveFilters ? (
              <div className="flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <FilterBadge
                    key={badge.key}
                    label={badge.label}
                    tone={badge.tone}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">Aucun filtre géographique actif.</p>
            )}

            {data.activeFilterLabels.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  Filtres actifs
                </p>
                <ul className="mt-2 space-y-1 text-xs text-foreground">
                  {data.activeFilterLabels.map((label) => (
                    <li key={label}>• {label}</li>
                  ))}
                </ul>
              </div>
            )}

            {hasDetails && (
              <dl className="space-y-2 border-t border-border pt-4">
                <DetailRow label="Domicile (zone)" value={data.homeZoneLabel} />
                <DetailRow
                  label="Point domicile"
                  value={data.homeLocationLabel}
                />
                <DetailRow
                  label="Rayon arrivée"
                  value={
                    data.homeRadiusKm != null ? `${data.homeRadiusKm} km` : null
                  }
                />
                <DetailRow
                  label="Distance au domicile"
                  value={
                    data.distanceToHomeKm != null
                      ? `${data.distanceToHomeKm.toFixed(1)} km`
                      : null
                  }
                />
                <DetailRow
                  label="Filtre dropoff (zone)"
                  value={data.checkDropoff ? "Oui" : null}
                />
                <DetailRow
                  label="Distance max pickup"
                  value={
                    data.maxDistanceKm != null
                      ? `${data.maxDistanceKm} km`
                      : null
                  }
                />
                <DetailRow
                  label="Zones bloquées"
                  value={
                    data.blockedZones.length
                      ? data.blockedZones.join(", ")
                      : null
                  }
                />
                <DetailRow
                  label="Éligible aux offres"
                  value={
                    data.eligibleForOffers == null
                      ? null
                      : data.eligibleForOffers
                        ? "Oui"
                        : "Non"
                  }
                />
                <DetailRow
                  label="Dernière position"
                  value={
                    data.lastLocation
                      ? [
                          data.lastLocation.zoneLabel,
                          `${data.lastLocation.lat.toFixed(4)}, ${data.lastLocation.lng.toFixed(4)}`,
                        ]
                          .filter(Boolean)
                          .join(" · ")
                      : null
                  }
                />
                <DetailRow
                  label="Position enregistrée"
                  value={
                    data.lastLocation?.recordedAt
                      ? formatDateTime(data.lastLocation.recordedAt)
                      : null
                  }
                />
                {data.headingHomeConfig && (
                  <>
                    <DetailRow
                      label="Gain min. vers domicile"
                      value={
                        data.headingHomeConfig.minProgressMeters != null
                          ? `${data.headingHomeConfig.minProgressMeters} m`
                          : null
                      }
                    />
                    <DetailRow
                      label="Détour max"
                      value={
                        data.headingHomeConfig.maxDetourKm != null
                          ? `${data.headingHomeConfig.maxDetourKm} km`
                          : null
                      }
                    />
                    <DetailRow
                      label="Couloir (V2)"
                      value={
                        data.headingHomeConfig.corridorWidthKm != null
                          ? `${data.headingHomeConfig.corridorWidthKm} km`
                          : null
                      }
                    />
                  </>
                )}
              </dl>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
