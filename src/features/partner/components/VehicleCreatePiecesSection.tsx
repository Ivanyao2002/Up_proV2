"use client";

import {
  VEHICLE_DOCUMENT_TYPES,
  type VehicleDocumentType,
} from "@/shared/types/vehicleDocuments";
import { resolveVehicleDocumentPreview } from "@/shared/lib/documentPreview";
import { DocumentUploadRow } from "@/shared/ui/DocumentUploadRow";

export type VehiclePieceFile = {
  type: VehicleDocumentType;
  file: File;
};

interface VehicleCreatePiecesSectionProps {
  pieces: VehiclePieceFile[];
  onChange: (pieces: VehiclePieceFile[]) => void;
}

export function VehicleCreatePiecesSection({
  pieces,
  onChange,
}: VehicleCreatePiecesSectionProps) {
  const setFile = (type: VehicleDocumentType, file: File | null) => {
    const without = pieces.filter((p) => p.type !== type);
    if (file) {
      onChange([...without, { type, file }]);
    } else {
      onChange(without);
    }
  };

  const getFile = (type: VehicleDocumentType) =>
    pieces.find((p) => p.type === type)?.file ?? null;

  return (
    <section className="rounded-card border border-border bg-surface p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">Pièces jointes</h2>
        <p className="mt-1 text-sm text-muted">
          Optionnel à la création. Sans pièce, le véhicule est enregistré en brouillon — vous
          pourrez les ajouter ensuite sur la fiche véhicule. La{" "}
          <strong className="font-medium text-foreground">carte grise</strong> est nécessaire pour
          l&apos;approbation.
        </p>
      </div>

      <ul className="space-y-4">
        {VEHICLE_DOCUMENT_TYPES.map((meta) => (
          <DocumentUploadRow
            key={meta.type}
            label={meta.label}
            description={meta.description}
            requiredForApproval={meta.requiredForApproval}
            file={getFile(meta.type)}
            previewSrc={resolveVehicleDocumentPreview(meta.type)}
            onSelect={(file) => setFile(meta.type, file)}
          />
        ))}
      </ul>
    </section>
  );
}
