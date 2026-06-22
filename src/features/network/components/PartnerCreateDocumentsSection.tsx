"use client";

import {
  partnerCreateDocumentsComplete,
  type PartnerCreateDocumentsState,
} from "../api/partnerCreateDocuments.v1";
import { resolveDriverDocumentPreview, resolveVehicleDocumentPreview } from "@/shared/lib/documentPreview";
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
}

export function PartnerCreateDocumentsSection({
  documents,
  onChange,
  disabled = false,
}: PartnerCreateDocumentsSectionProps) {
  return (
    <fieldset disabled={disabled} className="space-y-6">
      <section className="rounded-card border border-border bg-surface p-5 shadow-card">
        <h2 className="text-sm font-semibold text-foreground">Pièce d&apos;identité</h2>
        <p className="mt-1 text-sm text-muted">
          CNI, passeport ou document officiel du gérant — recto et verso obligatoires.
        </p>
        <ul className="mt-4 space-y-4">
          <DocumentRectoVersoRow
            label="Pièce d'identité du gérant"
            description="Recto et verso lisibles"
            requiredForApproval
            previewRecto={resolveDriverDocumentPreview("cni")}
            value={documents.identity}
            onChange={(identity) => onChange({ ...documents, identity })}
          />
        </ul>
      </section>

      <section className="rounded-card border border-border bg-surface p-5 shadow-card">
        <h2 className="text-sm font-semibold text-foreground">
          Registre de Commerce (RCC)
          <span className="ml-2 text-xs font-normal text-muted">— optionnel</span>
        </h2>
        <p className="mt-1 text-sm text-muted">Extrait RCC ou équivalent si applicable.</p>
        <ul className="mt-4 space-y-4">
          <DocumentUploadRow
            label="Document RCC"
            description="Registre de commerce ou document légal équivalent"
            file={documents.rcc}
            previewSrc={resolveVehicleDocumentPreview("registration")}
            onSelect={(rcc) => onChange({ ...documents, rcc })}
          />
        </ul>
      </section>

      {!partnerCreateDocumentsComplete(documents) ? (
        <p className="text-xs text-amber-600">
          Le recto et le verso de la pièce d&apos;identité sont obligatoires pour créer le
          partenaire.
        </p>
      ) : null}
    </fieldset>
  );
}
