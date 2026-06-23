"use client";

export interface WizardStep {
  id: string;
  label: string;
}

interface WizardStepperProps {
  steps: WizardStep[];
  currentIndex: number;
  className?: string;
  /** Appelé lors d'un clic sur une étape déjà validée (revenir en arrière). */
  onStepSelect?: (index: number) => void;
}

export function WizardStepper({
  steps,
  currentIndex,
  className = "",
  onStepSelect,
}: WizardStepperProps) {
  const currentStep = steps[currentIndex];
  return (
    <nav
      aria-label="Étapes"
      className={`rounded-card border border-border bg-surface p-4 shadow-card ${className}`}
    >
      <p className="sr-only" aria-live="polite">
        {currentStep
          ? `Étape ${currentIndex + 1} sur ${steps.length} : ${currentStep.label}`
          : ""}
      </p>
      <ol className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {steps.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          const canNavigate = done && Boolean(onStepSelect);
          const inner = (
            <div className="flex items-center gap-3 sm:w-full">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  active
                    ? "bg-teal text-white shadow-sm"
                    : done
                      ? "bg-teal/15 text-teal-dark"
                      : "bg-canvas text-muted border border-border"
                }`}
                aria-current={active ? "step" : undefined}
              >
                {done ? "✓" : index + 1}
              </span>
              <div className="min-w-0 sm:flex-1 sm:text-left">
                <p
                  className={`text-sm font-medium ${
                    active ? "text-heading" : done ? "text-foreground" : "text-muted"
                  }`}
                >
                  {step.label}
                </p>
                {active && (
                  <p className="text-xs text-teal-dark sm:mt-0.5">En cours</p>
                )}
              </div>
            </div>
          );
          return (
            <li
              key={step.id}
              className="flex flex-1 items-center gap-3 sm:flex-col sm:items-start sm:gap-2"
            >
              {canNavigate ? (
                <button
                  type="button"
                  onClick={() => onStepSelect?.(index)}
                  className="flex w-full items-center gap-3 rounded-lg outline-none ring-teal/30 focus-visible:ring-2"
                >
                  {inner}
                </button>
              ) : (
                inner
              )}
              {index < steps.length - 1 && (
                <div
                  className="hidden h-px flex-1 bg-border sm:mx-2 sm:block"
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
