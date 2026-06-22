import type { KycDocument, KycDocumentStatus } from "@/shared/types";
import type { PartnerDocument } from "@/features/partner/api/profile.service";
import type { ApiAdminKycDocumentItem } from "@/features/fleet/api/adminKyc.api.types";
import { mapApiKycItemToKycDocument } from "@/features/fleet/api/kycDocument.mapper";
import { PARTNER_DOCUMENT_TYPE_CODES } from "./partnerDocumentTypeCodes.v1";

const PARTNER_DOC_LABELS: Record<string, string> = {
  ID_CARD_FRONT: "Pièce d'identité (recto)",
  ID_CARD_BACK: "Pièce d'identité (verso)",
  BUSINESS_REGISTRATION: "Registre de commerce (RCC)",
};

function mapPartnerDocStatus(status?: string): KycDocumentStatus {
  const key = String(status ?? "pending").toLowerCase();
  if (key === "approved") return "approved";
  if (key === "rejected") return "rejected";
  return "pending";
}

function resolvePartnerDocMeta(type: string): {
  document_type_code: string;
  document_group?: string;
  document_side?: string;
  label: string;
  kycType: KycDocument["type"];
} {
  const code = type.trim().toUpperCase().replace(/-/g, "_");
  if (code === "ID_CARD_FRONT") {
    return {
      document_type_code: code,
      document_group: "ID_CARD",
      document_side: "FRONT",
      label: PARTNER_DOC_LABELS.ID_CARD_FRONT,
      kycType: "cni",
    };
  }
  if (code === "ID_CARD_BACK") {
    return {
      document_type_code: code,
      document_group: "ID_CARD",
      document_side: "BACK",
      label: PARTNER_DOC_LABELS.ID_CARD_BACK,
      kycType: "cni",
    };
  }
  if (code === "BUSINESS_REGISTRATION" || code === "RCCM") {
    return {
      document_type_code: code === "RCCM" ? "BUSINESS_REGISTRATION" : code,
      label: PARTNER_DOC_LABELS.BUSINESS_REGISTRATION,
      kycType: "registration",
    };
  }
  return {
    document_type_code: code,
    label: type.replace(/_/g, " "),
    kycType: "registration",
  };
}

export function mapPartnerDocumentToKyc(doc: PartnerDocument): KycDocument {
  const apiDoc = doc as PartnerDocument & Partial<ApiAdminKycDocumentItem>;
  if (apiDoc.document_type_code?.trim()) {
    return mapApiKycItemToKycDocument(apiDoc as ApiAdminKycDocumentItem);
  }

  const typeCode = doc.type?.trim() ?? "";
  const meta = resolvePartnerDocMeta(typeCode || "UNKNOWN");
  return {
    id: doc.id,
    type: meta.kycType,
    label: doc.label?.trim() || meta.label,
    status: mapPartnerDocStatus(doc.status),
    uploaded_at: doc.created_at ?? "",
    reviewed_at: null,
    preview_url: doc.url,
    document_type_code: meta.document_type_code,
    document_group: meta.document_group,
    document_side: meta.document_side,
  };
}

export function mapPartnerDocumentsToKyc(documents: PartnerDocument[]): KycDocument[] {
  return documents.map(mapPartnerDocumentToKyc);
}

const EXPECTED_PARTNER_SLOTS: Array<{
  id: string;
  document_type_code: string;
  document_group: string;
  document_side: string;
  type: KycDocument["type"];
  label: string;
}> = [
  {
    id: "slot-id-front",
    document_type_code: PARTNER_DOCUMENT_TYPE_CODES.idFront,
    document_group: "ID_CARD",
    document_side: "FRONT",
    type: "cni",
    label: PARTNER_DOC_LABELS.ID_CARD_FRONT,
  },
  {
    id: "slot-id-back",
    document_type_code: PARTNER_DOCUMENT_TYPE_CODES.idBack,
    document_group: "ID_CARD",
    document_side: "BACK",
    type: "cni",
    label: PARTNER_DOC_LABELS.ID_CARD_BACK,
  },
];

function hasPartnerDocumentSlot(
  documents: KycDocument[],
  slot: (typeof EXPECTED_PARTNER_SLOTS)[number]
): boolean {
  return documents.some(
    (doc) =>
      doc.document_type_code?.toUpperCase() === slot.document_type_code ||
      (doc.document_group === slot.document_group &&
        doc.document_side === slot.document_side &&
        Boolean(doc.uploaded_at))
  );
}

/** Affiche les emplacements CNI manquants pour permettre le dépôt. */
export function mergeExpectedPartnerKycSlots(
  documents: KycDocument[],
  options?: { showMissingSlots?: boolean }
): KycDocument[] {
  if (!options?.showMissingSlots) return documents;

  const merged = [...documents];
  for (const slot of EXPECTED_PARTNER_SLOTS) {
    if (!hasPartnerDocumentSlot(merged, slot)) {
      merged.push({
        id: slot.id,
        type: slot.type,
        label: slot.label,
        status: "pending",
        uploaded_at: "",
        reviewed_at: null,
        document_type_code: slot.document_type_code,
        document_group: slot.document_group,
        document_side: slot.document_side,
      });
    }
  }

  return merged.sort((a, b) => {
    const order = ["ID_CARD", "BUSINESS_REGISTRATION"] as const;
    const groupA = a.document_group ?? "";
    const groupB = b.document_group ?? "";
    const groupDiff =
      order.indexOf(groupA as (typeof order)[number]) -
      order.indexOf(groupB as (typeof order)[number]);
    if (groupDiff !== 0) return groupDiff;
    const sideOrder = { FRONT: 0, BACK: 1 };
    const sideA = a.document_side ?? "";
    const sideB = b.document_side ?? "";
    return (sideOrder[sideA as keyof typeof sideOrder] ?? 2) -
      (sideOrder[sideB as keyof typeof sideOrder] ?? 2);
  });
}

export function partnerIdentityDocumentsComplete(documents: KycDocument[]): boolean {
  const front = documents.find(
    (doc) =>
      doc.document_type_code === PARTNER_DOCUMENT_TYPE_CODES.idFront ||
      (doc.document_group === "ID_CARD" && doc.document_side === "FRONT")
  );
  const back = documents.find(
    (doc) =>
      doc.document_type_code === PARTNER_DOCUMENT_TYPE_CODES.idBack ||
      (doc.document_group === "ID_CARD" && doc.document_side === "BACK")
  );
  return Boolean(front?.uploaded_at && back?.uploaded_at);
}

export function resolvePartnerDocumentTypeCode(document: KycDocument): string {
  if (document.document_type_code?.trim()) {
    return document.document_type_code.trim().toUpperCase();
  }
  if (document.document_group === "ID_CARD") {
    if (document.document_side === "BACK") return PARTNER_DOCUMENT_TYPE_CODES.idBack;
    return PARTNER_DOCUMENT_TYPE_CODES.idFront;
  }
  return PARTNER_DOCUMENT_TYPE_CODES.businessRegistration;
}
