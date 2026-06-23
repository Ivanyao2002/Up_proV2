export const PARTNER_DOCUMENT_TYPE_CODES = {
  // Personne physique — pièce d'identité du partenaire
  idFront: "ID_CARD_FRONT",
  idBack: "ID_CARD_BACK",
  // Personne morale — pièce d'identité du gérant
  // ⚠️ À CONFIRMER avec le backend : le contrat nomme le type `MANAGER_ID_CARD`
  // mais la codebase sépare toujours recto/verso (cf. ID_CARD_FRONT/BACK). Si le
  // backend attend un code unique `MANAGER_ID_CARD`, ajuster ces 2 lignes uniquement.
  managerIdFront: "MANAGER_ID_CARD_FRONT",
  managerIdBack: "MANAGER_ID_CARD_BACK",
  // Personne morale — documents société
  businessRegistration: "BUSINESS_REGISTRATION",
  companyStatutes: "COMPANY_STATUTES",
  taxRegistration: "TAX_REGISTRATION_DFE",
} as const;

export type PartnerCreateDocumentSlot = keyof typeof PARTNER_DOCUMENT_TYPE_CODES;

export function mapPartnerCreateDocumentSlotToApiCode(
  slot: PartnerCreateDocumentSlot
): string {
  return PARTNER_DOCUMENT_TYPE_CODES[slot];
}
