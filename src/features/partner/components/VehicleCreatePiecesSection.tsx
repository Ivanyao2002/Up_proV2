"use client";

import { useRef } from "react";
import {
  VEHICLE_DOCUMENT_TYPES,
  type VehicleDocumentType,
} from "@/shared/types/vehicleDocuments";

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
  const inputRefs = useRef<Partial<Record<VehicleDocumentType, HTMLInputElement | null>>>(
    {}
  );

  const setFile = (type: VehicleDocumentType, file: File | null) => {
    const without = pieces.filter((p) => p.type !== type);
    if (file) {
      onChange([...without, { type, file }]);
    } else {
      onChange(without);
    }
  };

  const getFile = (type: VehicleDocumentType) =>
    pieces.find((p) => p.type === type)?.file;

  return (
    <section className="rounded-card border border-border bg-surface p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-[#212529]">Pièces jointes</h2>
        <p className="mt-1 text-sm text-muted">
          Optionnel à la création. Sans pièce, le véhicule est enregistré en brouillon — vous
          pourrez les ajouter ensuite sur la fiche véhicule. La{" "}
          <strong className="font-medium text-navy">carte grise</strong> est nécessaire pour
          l&apos;approbation.
        </p>
      </div>

      <ul className="space-y-4">
        {VEHICLE_DOCUMENT_TYPES.map((meta) => {
          const selected = getFile(meta.type);
          return (
            <li
              key={meta.type}
              className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#212529]">
                  {meta.label}
                  {meta.requiredForApproval && (
                    <span className="ml-1 text-xs font-normal text-amber-700">
                      (requis pour validation)
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted">{meta.description}</p>
                {selected && (
                  <p className="mt-1 truncate text-xs text-teal-dark">{selected.name}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <input
                  ref={(el) => {
                    inputRefs.current[meta.type] = el;
                  }}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setFile(meta.type, file);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => inputRefs.current[meta.type]?.click()}
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-navy transition-colors hover:bg-canvas"
                >
                  {selected ? "Remplacer" : "Choisir un fichier"}
                </button>
                {selected && (
                  <button
                    type="button"
                    onClick={() => setFile(meta.type, null)}
                    className="rounded-lg px-3 py-2 text-xs text-muted hover:text-red-600"
                  >
                    Retirer
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
