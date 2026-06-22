export const parseApiErrorMessage = (error) => {
  const err = error;

  if (!err) return "Erreur inconnue";

  if (
    err.status === "FETCH_ERROR" ||
    err === "Failed to fetch" ||
    err?.message.includes("Network Error")
  ) {
    return "Impossible de joindre le serveur.";
  }

  if (err.status === "PARSING_ERROR") {
    return "Erreur lors de la réponse du serveur.";
  }

  if (err.status === 403) {
    return "Vous n'avez pas les permissions nécéssaires pour exécuter cette action.";
  }

  if (
    err.status === 400 &&
    err.data &&
    typeof err.data === "object" &&
    "message" in err.data
  ) {
    return String(err.message);
  }

  if (err.status === 400 && err.message) {
    return err.message;
  }

  if (err.status === 400) {
    return "Les données fournies ne sont pas valides.";
  }

  if (err.status === 404) {
    return "Ressource introuvable.";
  }

  if (err.status === 500) {
    return "Le serveur a rencontré un problème, veuillez recommencer.";
  }

  // fallback si le backend renvoie un message
  if (
    typeof err.status === "number" &&
    err.data &&
    typeof err.data === "object" &&
    "message" in err.data
  ) {
    return String(err.message);
  }

  return "Une erreur inattendue est survenue.";
};

export const parseApiErrorTitle = (error) => {
  const err = error;

  if (typeof err.status === "number") {
    if (err.status === 401) return "Non autorisé";
    if (err.status === 403) return "Accès refusé";
    if (err.status === 404) return "Ressource introuvable";
    if (err.status === 400) return "Données invalides";
    if (err.status >= 500) return "Erreur serveur";
  }

  return "Erreur";
};
