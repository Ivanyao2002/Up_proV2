/** Types de pièces véhicule téléversables par le partenaire */
export type VehicleDocumentType = "registration" | "insurance" | "technical_inspection";

export interface VehicleDocumentTypeMeta {
  type: VehicleDocumentType;
  label: string;
  description: string;
  requiredForApproval?: boolean;
}

export const VEHICLE_DOCUMENT_TYPES: VehicleDocumentTypeMeta[] = [
  {
    type: "registration",
    label: "Carte grise",
    description: "Obligatoire pour l'approbation du véhicule",
    requiredForApproval: true,
  },
  {
    type: "insurance",
    label: "Assurance",
    description: "Attestation d'assurance en cours de validité",
  },
  {
    type: "technical_inspection",
    label: "Visite technique",
    description: "Certificat de visite technique (si applicable)",
  },
];

export function getVehicleDocumentLabel(type: VehicleDocumentType): string {
  return VEHICLE_DOCUMENT_TYPES.find((d) => d.type === type)?.label ?? type;
}
