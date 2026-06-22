import { apiClient } from "@/core/http/apiClient";
import { ApiError } from "@/core/http/errorHandler";
import { LINKS } from "@/core/api/links";
import { uploadKycFile, type KycUploadReference } from "@/features/fleet/api/kycDocumentUpload.v1.service";

export interface PartnerDocumentUpload {
  file: File;
  documentTypeCode: string;
  description?: string;
}

/**
 * Upload un document pour un partenaire franchise en utilisant le flux signed-url
 * Selon la spécification PARTENAIRE-PERSONNE-PHYSIQUE-MORALE.md §4.5
 */
export async function uploadPartnerDocument(
  file: File,
  documentTypeCode: string
): Promise<KycUploadReference> {
  try {
    return await uploadKycFile(file, documentTypeCode);
  } catch (error) {
    throw new Error(`Échec de l'upload du document ${documentTypeCode}: ${error}`);
  }
}

/**
 * Enregistre un document uploadé sur un partenaire.
 * Route: POST /v1/partners/{partnerId}/documents (§7 — accessible à la franchise propriétaire).
 * La route imbriquée /v1/franchises/:id/partners/:id/documents n'existe pas (404).
 */
export async function attachPartnerDocument(
  partnerId: string,
  reference: KycUploadReference,
  documentTypeCode: string
): Promise<void> {
  const { uploadId } = reference;
  const endpoint = LINKS.partner.profile.documents.create(partnerId);
  // Corps documenté (§4.5) : { uploadId, document_type_code }. Repli camelCase par tolérance.
  const bodies: Record<string, string>[] = [
    { uploadId, document_type_code: documentTypeCode },
    { uploadId, documentTypeCode },
  ];

  let lastError: unknown;
  for (const body of bodies) {
    try {
      await apiClient.post(endpoint, body);
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(
    `Échec de l'attachement du document ${documentTypeCode}: ${lastError}`
  );
}

/**
 * Workflow complet: upload + attachement pour un partenaire
 */
export async function uploadAndAttachPartnerDocument(
  partnerId: string,
  file: File,
  documentTypeCode: string
): Promise<void> {
  const reference = await uploadPartnerDocument(file, documentTypeCode);
  await attachPartnerDocument(partnerId, reference, documentTypeCode);
}

/**
 * Upload multiple documents pour un partenaire (pour les personnes morales)
 */
export async function uploadPartnerDocuments(
  partnerId: string,
  documents: PartnerDocumentUpload[]
): Promise<void> {
  const uploadPromises = documents.map(({ file, documentTypeCode }) =>
    uploadAndAttachPartnerDocument(partnerId, file, documentTypeCode)
  );

  try {
    await Promise.all(uploadPromises);
  } catch (error) {
    throw new Error(`Échec de l'upload des documents: ${error}`);
  }
}

/**
 * Types de documents requis pour les personnes morales (selon §3 du document)
 */
export const PARTNER_COMPANY_DOCUMENT_TYPES = {
  BUSINESS_REGISTRATION: "BUSINESS_REGISTRATION", // RCCM
  COMPANY_STATUTES: "COMPANY_STATUTES", // Statuts
  TAX_REGISTRATION_DFE: "TAX_REGISTRATION_DFE", // DFE
  MANAGER_ID_CARD: "MANAGER_ID_CARD", // Pièce gérant
} as const;

export type PartnerCompanyDocumentType = keyof typeof PARTNER_COMPANY_DOCUMENT_TYPES;

/**
 * Fonction utilitaire pour obtenir les codes des documents requis
 */
export function getRequiredDocumentTypes(legalForm: "INDIVIDUAL" | "COMPANY"): string[] {
  if (legalForm === "INDIVIDUAL") {
    return [];
  }
  
  return Object.values(PARTNER_COMPANY_DOCUMENT_TYPES);
}
