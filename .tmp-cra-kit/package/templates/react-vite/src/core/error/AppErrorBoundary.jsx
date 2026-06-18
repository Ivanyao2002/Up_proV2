import PropTypes from "prop-types";
import { ErrorBoundary } from "react-error-boundary";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── ErrorFallback ────────────────────────────────────────────────────────────

export const ErrorFallback = ({ error }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-75 p-8 text-center">
      {/* Icône */}
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-5">
        <span className="text-red-500 text-3xl font-bold">
          <X />
        </span>
      </div>

      {/* Titre */}
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        Une erreur est survenue
      </h2>
      <p className="text-sm text-muted-foreground mb-5">
        Veuillez actualiser la page ou contacter votre administrateur si elle
        persiste.
      </p>

      {/* Message d'erreur technique */}
      {error?.message && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-50 border border-red-200 text-red-600 text-xs max-w-md w-full mb-6">
          <span className="break-all">{error.message}</span>
        </div>
      )}

      {/* Bouton */}
      <Button
        variant="default"
        onClick={() => globalThis.location.reload()}
        className="gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Actualiser la page
      </Button>
    </div>
  );
};

ErrorFallback.propTypes = {
  error: PropTypes.object,
};

// ─── AppErrorWrapper ──────────────────────────────────────────────────────────

export const AppErrorWrapper = ({ children }) => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // reset de l'état global si nécessaire
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

AppErrorWrapper.propTypes = {
  children: PropTypes.node,
};
