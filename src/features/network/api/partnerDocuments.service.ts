import { partnerProfileService } from "@/features/partner/api/profile.service";
import { attachPartnerProfileDocument } from "@/features/fleet/api/kycDocumentUpload.v1.service";
import {
  fetchAdminKycDocuments,
  kycService,
} from "@/features/fleet/api/kyc.service";
import type { ApiAdminKycDocumentItem } from "@/features/fleet/api/adminKyc.api.types";
import {
  dedupeApiKycItems,
  dedupeKycDocumentsBySlot,
  mapApiKycItemToKycDocument,
  mapApiKycItemsForPartner,
} from "@/features/fleet/api/kycDocument.mapper";
import type { KycDocument } from "@/shared/types";
import {
  uploadPartnerCreateDocuments,
  buildPartnerCreateDocumentUploads,
  type PartnerCreateDocumentsState,
} from "./partnerCreateDocuments.v1";
import { mapPartnerDocumentsToKyc } from "./partnerDocuments.mapper";
import type { PartnerDocument } from "@/features/partner/api/profile.service";

function mergePartnerKycDocumentItems(
  partnerId: string,
  kycItems: ApiAdminKycDocumentItem[],
  partnerDocs: ApiAdminKycDocumentItem[]
): KycDocument[] {
  const merged = dedupeApiKycItems([...kycItems, ...partnerDocs]).filter(
    (item) => !item.subject_id || item.subject_id === partnerId
  );

  const mapped = merged.map((item) => mapApiKycItemToKycDocument(item));
  return dedupeKycDocumentsBySlot(mapped);
}

export const partnerDocumentsService = {
  listKycDocuments: async (partnerId: string): Promise<KycDocument[]> => {
    let kycError: unknown;
    let partnerError: unknown;
    let kycItems: ApiAdminKycDocumentItem[] = [];
    let partnerDocs: ApiAdminKycDocumentItem[] = [];

    try {
      kycItems = await fetchAdminKycDocuments({
        subject_id: partnerId,
        subject_type: "PARTNER",
      });
    } catch (error) {
      kycError = error;
    }

    try {
      const raw = await partnerProfileService.listDocuments(partnerId);
      partnerDocs = raw as unknown as ApiAdminKycDocumentItem[];
    } catch (error) {
      partnerError = error;
    }

    if (!kycItems.length && !partnerDocs.length) {
      throw partnerError ?? kycError ?? new Error("Documents partenaire introuvables.");
    }

    if (kycItems.length && partnerDocs.length) {
      return mergePartnerKycDocumentItems(partnerId, kycItems, partnerDocs);
    }

    if (kycItems.length) {
      return mapApiKycItemsForPartner(kycItems, partnerId);
    }

    return dedupeKycDocumentsBySlot(
      mapPartnerDocumentsToKyc(partnerDocs as unknown as PartnerDocument[])
    );
  },

  uploadDocuments: async (
    partnerId: string,
    documents: PartnerCreateDocumentsState
  ): Promise<void> => {
    const uploads = buildPartnerCreateDocumentUploads(documents);
    await uploadPartnerCreateDocuments(partnerId, uploads);
  },

  uploadSingleDocument: async (
    partnerId: string,
    file: File,
    documentTypeCode: string,
    replaceDocumentId?: string
  ): Promise<void> => {
    await attachPartnerProfileDocument(
      partnerId,
      file,
      documentTypeCode,
      replaceDocumentId ? { replaceDocumentId } : undefined
    );
  },

  approveDocument: (documentId: string) =>
    kycService.approveDocument(documentId),

  rejectDocument: (documentId: string, reason: string) =>
    kycService.rejectDocument(documentId, reason),
};
