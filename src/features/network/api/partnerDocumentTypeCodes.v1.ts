export const PARTNER_DOCUMENT_TYPE_CODES = {
  idFront: "ID_CARD_FRONT",
  idBack: "ID_CARD_BACK",
  businessRegistration: "BUSINESS_REGISTRATION",
} as const;

export type PartnerCreateDocumentSlot = keyof typeof PARTNER_DOCUMENT_TYPE_CODES;

export function mapPartnerCreateDocumentSlotToApiCode(
  slot: PartnerCreateDocumentSlot
): string {
  return PARTNER_DOCUMENT_TYPE_CODES[slot];
}
