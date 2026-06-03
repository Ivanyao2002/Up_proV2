"use client";

import {
  DRIVER_KYC_DOCUMENT_TYPES,
  type DriverDocumentFile,
  type DriverKycDocumentType,
} from "@/shared/types/driverDocuments";
import { resolveDriverDocumentPreview } from "@/shared/lib/documentPreview";
import { DocumentUploadRow } from "@/shared/ui/DocumentUploadRow";

export type { DriverDocumentFile };

interface VehicleCreateDriverDocumentsSectionProps {
  documents: DriverDocumentFile[];
  onChange: (documents: DriverDocumentFile[]) => void;
}

export function VehicleCreateDriverDocumentsSection({
  documents,
  onChange,
}: VehicleCreateDriverDocumentsSectionProps) {
  const setFile = (type: DriverKycDocumentType, file: File | null) => {
    const without = documents.filter((d) => d.type !== type);
    if (file) {
      onChange([...without, { type, file }]);
    } else {
      onChange(without);
    }
  };

  const getFile = (type: DriverKycDocumentType) =>
    documents.find((d) => d.type === type)?.file ?? null;

  return (
    <section className="rounded-card border border-border bg-surface p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">Documents du chauffeur</h2>
        <p className="mt-1 text-sm text-muted">
          Optionnel à la création. Sans document, le dossier reste en attente — vous pourrez les
          ajouter sur la fiche chauffeur.
        </p>
      </div>

      <ul className="space-y-4">
        {DRIVER_KYC_DOCUMENT_TYPES.map((meta) => (
          <DocumentUploadRow
            key={meta.type}
            label={meta.label}
            description={meta.description}
            requiredForApproval={meta.requiredForApproval}
            file={getFile(meta.type)}
            previewSrc={resolveDriverDocumentPreview(meta.type)}
            onSelect={(file) => setFile(meta.type, file)}
          />
        ))}
      </ul>
    </section>
  );
}
