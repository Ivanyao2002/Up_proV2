"use client";

import type { ReactNode } from "react";
import type { Vehicle } from "@/shared/types";
import {
  inferVehicleKind,
  inferVehicleService,
  VEHICLE_KIND_LABELS,
  VEHICLE_SERVICE_LABELS,
} from "@/shared/lib/vehicleKind";
import { VehicleKindIcon } from "./VehicleKindIcon";
import { getVehicleCategoryLabel } from "@/shared/lib/vehicleLabels";

interface VehicleTypeBadgeProps {
  vehicle: Pick<
    Vehicle,
    "category" | "category_code" | "category_label" | "model" | "brand"
  >;
  /** Affiche la catégorie commerciale (code ou label API). */
  showCategory?: boolean;
  /** Affiche le chip corps (voiture / moto…) — désactivé si l’icône est déjà dans la cellule. */
  showKind?: boolean;
  /** Contenu du chip catégorie : libellé (« Economique », défaut) ou code (« ECO »). */
  categoryDisplay?: "label" | "code";
  className?: string;
}

function Chip({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "outline";
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
        variant === "outline"
          ? "border border-border bg-transparent text-muted"
          : "bg-surface-hover text-foreground"
      }`}
    >
      {children}
    </span>
  );
}

export function VehicleTypeBadge({
  vehicle,
  showCategory = true,
  showKind = true,
  categoryDisplay = "label",
  className = "",
}: VehicleTypeBadgeProps) {
  const kind = inferVehicleKind(vehicle);
  const service = inferVehicleService(vehicle.category);
  const categoryText =
    categoryDisplay === "code"
      ? vehicle.category_code?.trim() ||
        vehicle.category_label?.trim() ||
        getVehicleCategoryLabel(vehicle.category)
      : vehicle.category_label?.trim() ||
        vehicle.category_code?.trim() ||
        getVehicleCategoryLabel(vehicle.category);

  // Évite le doublon « Moto · MOTO » quand la catégorie répète le type de carrosserie.
  const showCategoryChip =
    showCategory &&
    Boolean(categoryText) &&
    categoryText.toLowerCase() !== VEHICLE_KIND_LABELS[kind].toLowerCase();

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {showKind && (
        <Chip>
          <VehicleKindIcon kind={kind} size={12} className="mr-1 shrink-0" />
          {VEHICLE_KIND_LABELS[kind]}
        </Chip>
      )}
      {service !== "other" && (
        <Chip variant={service === "taxi" ? "default" : "outline"}>
          {VEHICLE_SERVICE_LABELS[service]}
        </Chip>
      )}
      {showCategoryChip && (
        <Chip variant="outline">{categoryText}</Chip>
      )}
    </div>
  );
}
