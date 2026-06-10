"use client";

import { useEffect, useRef } from "react";
import type { MergedExtraction } from "@/features/fleet/lib/documentExtraction.types";
import { runFullExtraction } from "@/features/fleet/lib/documentExtraction.service";
import { wizardFilesForExtraction } from "@/shared/types/documentUpload";
import type { WizardDocumentsState } from "./DocumentsStep";

const DOC_LABELS: Record<string, string> = {
  cni: "Carte d'identité",
  license: "Permis de conduire",
  registration: "Carte grise",
};

interface ExtractionStepProps {
  documents: WizardDocumentsState;
  onComplete: (result: MergedExtraction) => void;
  onSkip: () => void;
  onError: (message: string) => void;
}

export function ExtractionStep({
  documents,
  onComplete,
  onSkip,
  onError,
}: ExtractionStepProps) {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const groups = wizardFilesForExtraction({
      cni: documents.cni,
      license: documents.license,
      registration: documents.registration,
    });

    if (!groups.length) {
      onSkip();
      return;
    }

    void (async () => {
      try {
        const merged = await runFullExtraction(groups);
        const allFailed = merged.byDocument.every((d) => d.error);
        if (allFailed && merged.byDocument.length > 0) {
          onError(
            merged.warnings[0] ??
              "Impossible d'extraire les données — continuez en saisie manuelle."
          );
        }
        onComplete(merged);
      } catch {
        onError("Erreur réseau lors de l'analyse — vous pouvez saisir manuellement.");
      }
    })();
  }, [documents, onComplete, onSkip, onError]);

  const groups = wizardFilesForExtraction({
    cni: documents.cni,
    license: documents.license,
    registration: documents.registration,
  });

  return (
    <div className="rounded-card border border-border bg-surface p-8 shadow-card">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 h-12 w-12 animate-pulse rounded-full bg-teal/15 ring-4 ring-teal/10" />
        <h2 className="text-lg font-semibold text-heading">Analyse des documents</h2>
        <p className="mt-2 text-sm text-muted">
          Extraction des informations via IA… Cela peut prendre quelques secondes.
        </p>
        <ul className="mt-6 space-y-2 text-left text-sm">
          {groups.map((g) => (
            <li
              key={g.type}
              className="flex items-center gap-2 rounded-lg border border-border bg-canvas/50 px-3 py-2"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-teal" />
              <span className="text-foreground">{DOC_LABELS[g.type]}</span>
              <span className="ml-auto text-xs text-muted">
                {g.files.length} fichier{g.files.length > 1 ? "s" : ""}
              </span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onSkip}
          className="mt-8 text-sm font-medium text-muted underline-offset-2 hover:text-foreground hover:underline"
        >
          Ignorer l&apos;analyse et saisir manuellement
        </button>
      </div>
    </div>
  );
}
