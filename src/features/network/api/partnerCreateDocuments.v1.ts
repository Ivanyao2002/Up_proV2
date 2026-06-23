import { attachPartnerProfileDocument } from "@/features/fleet/api/kycDocumentUpload.v1.service";
import {
  EMPTY_RECTO_VERSO,
  type RectoVersoFiles,
} from "@/shared/types/documentUpload";
import {
  DEFAULT_PARTNER_LEGAL_FORM,
  type PartnerLegalForm,
} from "@/features/network/lib/partnerLegalForm";
import { PARTNER_DOCUMENT_TYPE_CODES } from "./partnerDocumentTypeCodes.v1";

export interface PartnerCreateDocumentsState {
  /** CNI du partenaire (personne physique) ou du gérant (personne morale). */
  identity: RectoVersoFiles;
  /** Registre de commerce (RCCM) — personne morale. */
  businessRegistration: File | null;
  /** Statuts de la société — personne morale. */
  companyStatutes: File | null;
  /** Déclaration Fiscale d'Existence (DFE) — personne morale. */
  taxRegistration: File | null;
}

export const EMPTY_PARTNER_CREATE_DOCUMENTS: PartnerCreateDocumentsState = {
  identity: { ...EMPTY_RECTO_VERSO },
  businessRegistration: null,
  companyStatutes: null,
  taxRegistration: null,
};

/**
 * Dossier complet pour la création :
 * - `INDIVIDUAL` : pièce d'identité (recto + verso).
 * - `COMPANY` : pièce du gérant (recto + verso) + registre de commerce + statuts + DFE.
 */
export function partnerCreateDocumentsComplete(
  documents: PartnerCreateDocumentsState,
  legalForm: PartnerLegalForm = DEFAULT_PARTNER_LEGAL_FORM
): boolean {
  const identityComplete = Boolean(
    documents.identity.recto && documents.identity.verso
  );
  if (legalForm !== "COMPANY") return identityComplete;
  return (
    identityComplete &&
    Boolean(documents.businessRegistration) &&
    Boolean(documents.companyStatutes) &&
    Boolean(documents.taxRegistration)
  );
}

export interface PartnerCreateDocumentUpload {
  documentTypeCode: string;
  file: File;
}

export async function uploadPartnerCreateDocuments(
  partnerId: string,
  documents: PartnerCreateDocumentUpload[]
): Promise<void> {
  for (const document of documents) {
    await attachPartnerProfileDocument(
      partnerId,
      document.file,
      document.documentTypeCode
    );
  }
}

/**
 * Construit la liste des uploads (code API + fichier) pour tous les fichiers fournis.
 * `legalForm` ne change que le code de la pièce d'identité : `ID_CARD_*` pour un
 * individu, `MANAGER_ID_CARD_*` pour le gérant d'une société. Les documents société
 * (RCC, statuts, DFE) sont envoyés dès qu'ils sont présents.
 */
export function buildPartnerCreateDocumentUploads(
  documents: PartnerCreateDocumentsState,
  legalForm: PartnerLegalForm = DEFAULT_PARTNER_LEGAL_FORM
): PartnerCreateDocumentUpload[] {
  const codes = PARTNER_DOCUMENT_TYPE_CODES;
  const isCompany = legalForm === "COMPANY";
  const idFrontCode = isCompany ? codes.managerIdFront : codes.idFront;
  const idBackCode = isCompany ? codes.managerIdBack : codes.idBack;

  const uploads: PartnerCreateDocumentUpload[] = [];
  if (documents.identity.recto) {
    uploads.push({ documentTypeCode: idFrontCode, file: documents.identity.recto });
  }
  if (documents.identity.verso) {
    uploads.push({ documentTypeCode: idBackCode, file: documents.identity.verso });
  }
  if (documents.businessRegistration) {
    uploads.push({
      documentTypeCode: codes.businessRegistration,
      file: documents.businessRegistration,
    });
  }
  if (documents.companyStatutes) {
    uploads.push({
      documentTypeCode: codes.companyStatutes,
      file: documents.companyStatutes,
    });
  }
  if (documents.taxRegistration) {
    uploads.push({
      documentTypeCode: codes.taxRegistration,
      file: documents.taxRegistration,
    });
  }
  return uploads;
}
