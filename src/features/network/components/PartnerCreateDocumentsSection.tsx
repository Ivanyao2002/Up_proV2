"use client";

import {
  partnerCreateDocumentsComplete,
  type PartnerCreateDocumentsState,
} from "../api/partnerCreateDocuments.v1";
import type { PartnerLegalForm } from "@/features/network/lib/partnerLegalForm";
import {
  resolveDriverDocumentPreview,
  resolveVehicleDocumentPreview,
} from "@/shared/lib/documentPreview";
import { DocumentRectoVersoRow } from "@/shared/ui/DocumentRectoVersoRow";
import { DocumentUploadRow } from "@/shared/ui/DocumentUploadRow";

export type { PartnerCreateDocumentsState } from "../api/partnerCreateDocuments.v1";
export {
  EMPTY_PARTNER_CREATE_DOCUMENTS,
  partnerCreateDocumentsComplete,
} from "../api/partnerCreateDocuments.v1";

interface PartnerCreateDocumentsSectionProps {
  documents: PartnerCreateDocumentsState;
  onChange: (documents: PartnerCreateDocumentsState) => void;
  disabled?: boolean;
  /**
   * Forme juridique. `undefined` = mode panneau post-création
   * (pièce d'identité requise + RCC optionnel, sans statuts/DFE).
   */
  legalForm?: PartnerLegalForm;
}

export function PartnerCreateDocumentsSection({
  documents,
  onChange,
  disabled = false,
  legalForm,
}: PartnerCreateDocumentsSectionProps) {
  const isCompany = legalForm === "COMPANY";
  const isPanelMode = legalForm === undefined;
  const showRcc = isCompany || isPanelMode;
  const companyPreview = resolveVehicleDocumentPreview("registration");

  const identityTitle = isCompany ? "Pièce d'identité du gérant" : "Pièce d'identité";
  const identityHelp = isCompany
    ? "CNI, passeport ou document officiel du gérant — recto et verso obligatoires."
    : "CNI, passeport ou document officiel du partenaire — recto et verso obligatoires.";

  return (
    <fieldset disabled={disabled} className="space-y-6">
      <section className="rounded-card border border-border bg-surface p-5 shadow-card">
        <h2 className="text-sm font-semibold text-foreground">{identityTitle}</h2>
        <p className="mt-1 text-sm text-muted">{identityHelp}</p>
        <ul className="mt-4 space-y-4">
          <DocumentRectoVersoRow
            label={identityTitle}
            description="Recto et verso lisibles"
            requiredForApproval
            previewRecto={resolveDriverDocumentPreview("cni")}
            value={documents.identity}
            onChange={(identity) => onChange({ ...documents, identity })}
          />
        </ul>
      </section>

      {showRcc ? (
        <section className="rounded-card border border-border bg-surface p-5 shadow-card">
          <h2 className="text-sm font-semibold text-foreground">
            Registre de Commerce (RCCM)
            {isCompany ? null : (
              <span className="ml-2 text-xs font-normal text-muted">— optionnel</span>
            )}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Extrait du registre de commerce de la société.
          </p>
          <ul className="mt-4 space-y-4">
            <DocumentUploadRow
              label="Registre de commerce (RCCM)"
              description="Registre de commerce ou document légal équivalent"
              file={documents.businessRegistration}
              previewSrc={companyPreview}
              onSelect={(businessRegistration) =>
                onChange({ ...documents, businessRegistration })
              }
            />
          </ul>
        </section>
      ) : null}

      {isCompany ? (
        <>
          <section className="rounded-card border border-border bg-surface p-5 shadow-card">
            <h2 className="text-sm font-semibold text-foreground">
              Statuts de la société
            </h2>
            <p className="mt-1 text-sm text-muted">
              Statuts signés de la personne morale.
            </p>
            <ul className="mt-4 space-y-4">
              <DocumentUploadRow
                label="Statuts de la société"
                description="Document des statuts (PDF ou image)"
                file={documents.companyStatutes}
                previewSrc={companyPreview}
                onSelect={(companyStatutes) =>
                  onChange({ ...documents, companyStatutes })
                }
              />
            </ul>
          </section>

          <section className="rounded-card border border-border bg-surface p-5 shadow-card">
            <h2 className="text-sm font-semibold text-foreground">
              Déclaration Fiscale d&apos;Existence (DFE)
            </h2>
            <p className="mt-1 text-sm text-muted">
              Attestation fiscale d&apos;existence de la société.
            </p>
            <ul className="mt-4 space-y-4">
              <DocumentUploadRow
                label="Déclaration Fiscale d'Existence (DFE)"
                description="Document fiscal (PDF ou image)"
                file={documents.taxRegistration}
                previewSrc={companyPreview}
                onSelect={(taxRegistration) =>
                  onChange({ ...documents, taxRegistration })
                }
              />
            </ul>
          </section>
        </>
      ) : null}

      {!partnerCreateDocumentsComplete(documents, legalForm) ? (
        <p className="text-xs text-amber-600">
          {isCompany
            ? "Pour une société : pièce d'identité du gérant (recto + verso), registre de commerce, statuts et DFE sont obligatoires."
            : "Le recto et le verso de la pièce d'identité sont obligatoires pour créer le partenaire."}
        </p>
      ) : null}
    </fieldset>
  );
}
