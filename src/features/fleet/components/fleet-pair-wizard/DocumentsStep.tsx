"use client";

import {
  EMPTY_RECTO_VERSO,
  type RectoVersoFiles,
} from "@/shared/types/documentUpload";
import { DocumentRectoVersoRow } from "@/shared/ui/DocumentRectoVersoRow";
import { DocumentUploadRow } from "@/shared/ui/DocumentUploadRow";
import {
  resolveDriverDocumentPreview,
  resolveVehicleDocumentPreview,
} from "@/shared/lib/documentPreview";

export interface WizardDocumentsState {
  cni: RectoVersoFiles;
  license: RectoVersoFiles;
  registration: RectoVersoFiles;
  selfie: File | null;
  insurance: File | null;
  technicalInspection: File | null;
}

export const EMPTY_WIZARD_DOCUMENTS: WizardDocumentsState = {
  cni: { ...EMPTY_RECTO_VERSO },
  license: { ...EMPTY_RECTO_VERSO },
  registration: { ...EMPTY_RECTO_VERSO },
  selfie: null,
  insurance: null,
  technicalInspection: null,
};

interface DocumentsStepProps {
  value: WizardDocumentsState;
  onChange: (next: WizardDocumentsState) => void;
  /** `ai` = préparation extraction · `manual` = envoi des pièces sans IA */
  intent?: "ai" | "manual";
}

export function DocumentsStep({
  value,
  onChange,
  intent = "ai",
}: DocumentsStepProps) {
  const isManual = intent === "manual";

  return (
    <div className="space-y-6">
      <section className="rounded-card border border-border bg-surface p-5 shadow-card">
        <h2 className="text-sm font-semibold text-heading">Identité chauffeur</h2>
        <p className="mt-1 text-sm text-muted">
          {isManual
            ? "Ajoutez les pièces du chauffeur — elles seront jointes au dossier à la création."
            : "Recto et verso recommandés pour une extraction fiable. Vous pourrez ignorer l'analyse et saisir à la main."}
        </p>
        <ul className="mt-4 space-y-4">
          <DocumentRectoVersoRow
            label="Carte nationale d'identité"
            description="Recto et verso lisibles"
            requiredForApproval
            previewRecto={resolveDriverDocumentPreview("cni")}
            value={value.cni}
            onChange={(cni) => onChange({ ...value, cni })}
          />
          <DocumentRectoVersoRow
            label="Permis de conduire"
            description="Permis en cours de validité"
            requiredForApproval
            previewRecto={resolveDriverDocumentPreview("license")}
            value={value.license}
            onChange={(license) => onChange({ ...value, license })}
          />
          <DocumentUploadRow
            label="Photo selfie"
            description="Visage du chauffeur — pas d'extraction automatique"
            requiredForApproval
            file={value.selfie}
            previewSrc={resolveDriverDocumentPreview("selfie")}
            onSelect={(selfie) => onChange({ ...value, selfie })}
          />
        </ul>
      </section>

      <section className="rounded-card border border-border bg-surface p-5 shadow-card">
        <h2 className="text-sm font-semibold text-heading">Véhicule</h2>
        <p className="mt-1 text-sm text-muted">
          {isManual
            ? "Carte grise, assurance et visite technique — fichiers envoyés avec le véhicule."
            : "La carte grise alimente plaque, marque et modèle. Le verso est optionnel."}
        </p>
        <ul className="mt-4 space-y-4">
          <DocumentRectoVersoRow
            label="Carte grise"
            description="Certificat d'immatriculation"
            requiredForApproval
            previewRecto={resolveVehicleDocumentPreview("registration")}
            value={value.registration}
            onChange={(registration) => onChange({ ...value, registration })}
          />
          <DocumentUploadRow
            label="Assurance"
            description="Attestation en cours de validité"
            file={value.insurance}
            previewSrc={resolveVehicleDocumentPreview("insurance")}
            onSelect={(insurance) => onChange({ ...value, insurance })}
          />
          <DocumentUploadRow
            label="Visite technique"
            description="Si applicable"
            file={value.technicalInspection}
            previewSrc={resolveVehicleDocumentPreview("technical_inspection")}
            onSelect={(technicalInspection) =>
              onChange({ ...value, technicalInspection })
            }
          />
        </ul>
      </section>
    </div>
  );
}
