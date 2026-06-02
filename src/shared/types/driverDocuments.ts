/** Documents KYC chauffeur téléversables par le partenaire */
export type DriverKycDocumentType = "cni" | "license" | "selfie";

export interface DriverKycDocumentTypeMeta {
  type: DriverKycDocumentType;
  label: string;
  description: string;
  requiredForApproval?: boolean;
}

export const DRIVER_KYC_DOCUMENT_TYPES: DriverKycDocumentTypeMeta[] = [
  {
    type: "cni",
    label: "Carte nationale d'identité",
    description: "Recto-verso lisible",
    requiredForApproval: true,
  },
  {
    type: "license",
    label: "Permis de conduire",
    description: "Permis en cours de validité",
    requiredForApproval: true,
  },
  {
    type: "selfie",
    label: "Photo selfie",
    description: "Photo du visage pour vérification d'identité",
    requiredForApproval: true,
  },
];

export function getDriverKycDocumentLabel(type: DriverKycDocumentType): string {
  return DRIVER_KYC_DOCUMENT_TYPES.find((d) => d.type === type)?.label ?? type;
}

export type DriverDocumentFile = {
  type: DriverKycDocumentType;
  file: File;
};
