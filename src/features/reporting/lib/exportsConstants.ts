export const STATUS_LABEL: Record<string, string> = {
  queued:     "En attente",
  processing: "En cours",
  ready:      "Disponible",
  failed:     "Échoué",
  expired:    "Expiré",
};

export const STATUS_COLOR: Record<string, string> = {
  queued:     "text-muted",
  processing: "text-amber-600",
  ready:      "text-teal-dark",
  failed:     "text-red-600",
  expired:    "text-muted line-through",
};
