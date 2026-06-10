import type { WizardStep } from "@/shared/ui/WizardStepper";

export type WizardStepId = "mode" | "documents" | "extraction" | "review";

export type CreationMode = "ai" | "manual";

export const WIZARD_STEPS: WizardStep[] = [
  { id: "mode", label: "Méthode" },
  { id: "documents", label: "Documents" },
  { id: "extraction", label: "Analyse IA" },
  { id: "review", label: "Vérification" },
];

export function stepIdToIndex(id: WizardStepId): number {
  return WIZARD_STEPS.findIndex((s) => s.id === id);
}

/** Étapes affichées — la saisie manuelle saute l'analyse IA. */
export function getWizardStepsForMode(mode: CreationMode | null): WizardStep[] {
  if (mode === "manual") {
    return WIZARD_STEPS.filter((s) => s.id !== "extraction");
  }
  return WIZARD_STEPS;
}

export function getWizardStepIndex(
  stepId: WizardStepId,
  mode: CreationMode | null
): number {
  const steps = getWizardStepsForMode(mode);
  const index = steps.findIndex((s) => s.id === stepId);
  if (index >= 0) return index;
  if (stepId === "extraction" && mode === "manual") {
    return steps.findIndex((s) => s.id === "documents");
  }
  return stepIdToIndex(stepId);
}
