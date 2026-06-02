import type { VehicleApprovalStatus, VehicleCategory } from "@/shared/types";

export const VEHICLE_CATEGORY_LABELS: Record<VehicleCategory, string> = {
  taxi: "Taxi",
  delivery: "Livraison",
  van: "Utilitaire",
  premium: "Premium",
};

const VEHICLE_APPROVAL_LABELS: Record<VehicleApprovalStatus, string> = {
  draft: "Brouillon",
  pending: "En validation",
  approved: "Approuvé",
  rejected: "Rejeté",
};

export function getVehicleCategoryLabel(category: VehicleCategory): string {
  return VEHICLE_CATEGORY_LABELS[category];
}

export function getVehicleApprovalLabel(status: VehicleApprovalStatus): string {
  return VEHICLE_APPROVAL_LABELS[status];
}
