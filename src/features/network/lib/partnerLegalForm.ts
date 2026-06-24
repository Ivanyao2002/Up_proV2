/** Forme juridique du partenaire — champ `legal_form` côté API (`INDIVIDUAL` | `COMPANY`). */
export const PARTNER_LEGAL_FORMS = ["INDIVIDUAL", "COMPANY"] as const;

export type PartnerLegalForm = (typeof PARTNER_LEGAL_FORMS)[number];

export const DEFAULT_PARTNER_LEGAL_FORM: PartnerLegalForm = "INDIVIDUAL";

export const PARTNER_LEGAL_FORM_OPTIONS: {
  value: PartnerLegalForm;
  label: string;
  hint: string;
}[] = [
  {
    value: "INDIVIDUAL",
    label: "Personne physique",
    hint: "Chauffeur indépendant — pièce d'identité seule",
  },
  {
    value: "COMPANY",
    label: "Personne morale (société)",
    hint: "Société avec gérant — registre de commerce, statuts, DFE + pièce du gérant",
  },
];

export function isPartnerLegalForm(value: string): value is PartnerLegalForm {
  return (PARTNER_LEGAL_FORMS as readonly string[]).includes(value);
}

export function normalizePartnerLegalForm(
  value?: string | null
): PartnerLegalForm | undefined {
  const key = value?.trim().toUpperCase();
  if (!key || !isPartnerLegalForm(key)) return undefined;
  return key;
}

export function formatPartnerLegalFormLabel(value?: string | null): string {
  const v = normalizePartnerLegalForm(value);
  if (v === "COMPANY") return "Personne morale";
  if (v === "INDIVIDUAL") return "Personne physique";
  return "—";
}
