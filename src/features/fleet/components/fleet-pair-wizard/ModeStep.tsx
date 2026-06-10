"use client";

import type { CreationMode } from "./wizardSteps";

interface ModeStepProps {
  onSelect: (mode: CreationMode) => void;
}

export function ModeStep({ onSelect }: ModeStepProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => onSelect("ai")}
        className="group rounded-card border-2 border-teal/30 bg-white p-6 text-left shadow-card transition hover:border-teal hover:shadow-md"
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-teal/15 text-lg">
          ✦
        </span>
        <h3 className="mt-4 text-base font-semibold text-heading">
          Aide à la saisie (IA)
        </h3>
        <p className="mt-2 text-sm text-muted">
          Scannez CNI, permis et carte grise (recto/verso). Les champs du formulaire
          seront préremplis pour vérification avant création.
        </p>
        <p className="mt-3 text-xs font-medium text-teal-dark">
          Recommandé · gain de temps
        </p>
      </button>

      <button
        type="button"
        onClick={() => onSelect("manual")}
        className="group rounded-card border border-border bg-surface p-6 text-left shadow-card transition hover:border-muted hover:shadow-md"
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-canvas text-lg border border-border">
          ✎
        </span>
        <h3 className="mt-4 text-base font-semibold text-heading">Saisie manuelle</h3>
        <p className="mt-2 text-sm text-muted">
          Téléversez d&apos;abord les pièces (CNI, permis, carte grise…), puis saisissez
          les informations chauffeur et véhicule — sans analyse automatique.
        </p>
        <p className="mt-3 text-xs font-medium text-muted">
          Sans analyse automatique
        </p>
      </button>
    </div>
  );
}
