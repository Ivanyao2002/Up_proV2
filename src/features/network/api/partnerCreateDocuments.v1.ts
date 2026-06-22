import { attachPartnerProfileDocument } from "@/features/fleet/api/kycDocumentUpload.v1.service";
import {
  EMPTY_RECTO_VERSO,
  type RectoVersoFiles,
} from "@/shared/types/documentUpload";
import {
  mapPartnerCreateDocumentSlotToApiCode,
  type PartnerCreateDocumentSlot,
} from "./partnerDocumentTypeCodes.v1";

export interface PartnerCreateDocumentsState {
  identity: RectoVersoFiles;
  rcc: File | null;
}

export const EMPTY_PARTNER_CREATE_DOCUMENTS: PartnerCreateDocumentsState = {
  identity: { ...EMPTY_RECTO_VERSO },
  rcc: null,
};

export function partnerCreateDocumentsComplete(
  documents: PartnerCreateDocumentsState
): boolean {
  return Boolean(documents.identity.recto && documents.identity.verso);
}

export interface PartnerCreateDocumentUpload {
  slot: PartnerCreateDocumentSlot;
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
      mapPartnerCreateDocumentSlotToApiCode(document.slot)
    );
  }
}

export function buildPartnerCreateDocumentUploads(
  documents: PartnerCreateDocumentsState
): PartnerCreateDocumentUpload[] {
  const uploads: PartnerCreateDocumentUpload[] = [];
  if (documents.identity.recto) {
    uploads.push({ slot: "idFront", file: documents.identity.recto });
  }
  if (documents.identity.verso) {
    uploads.push({ slot: "idBack", file: documents.identity.verso });
  }
  if (documents.rcc) {
    uploads.push({ slot: "businessRegistration", file: documents.rcc });
  }
  return uploads;
}
