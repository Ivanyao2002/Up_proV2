import { Button } from "./Button";

interface ErrorStateProps {
  /** Titre court de l'erreur */
  title?: string;
  /** Message contextualisé décrivant l'erreur */
  message?: string;
  /** Si fourni, affiche un bouton « Réessayer » */
  onRetry?: () => void;
  /** Libellé du bouton de réessai */
  retryLabel?: string;
}

export function ErrorState({
  title = "Une erreur est survenue",
  message = "Impossible de charger les données. Veuillez réessayer.",
  onRetry,
  retryLabel = "Réessayer",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-card border border-dashed border-red-300 bg-red-50/50 px-8 py-16 text-center dark:border-red-500/40 dark:bg-red-500/5"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-red-300 text-xl font-semibold text-red-600 dark:border-red-500/50 dark:text-red-400">
        !
      </div>
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      {message && (
        <p className="mt-2 max-w-sm text-sm text-muted">{message}</p>
      )}
      {onRetry && (
        <Button variant="secondary" className="mt-6" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
