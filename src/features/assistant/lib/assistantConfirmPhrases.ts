/** Réponses courtes qui confirment l'action en attente dans le panneau assistant. */
export function isAssistantConfirmPhrase(text: string): boolean {
  const t = text.trim().toLowerCase();
  return /^(oui|ok|yes|go|d'accord|dac|confirme(r|z)?|valide(r|z)?|approuve(r|z)?|c'est bon|cest bon)$/i.test(
    t
  );
}

/** Réponses qui annulent l'action en attente. */
export function isAssistantCancelPhrase(text: string): boolean {
  const t = text.trim().toLowerCase();
  return /^(non|annule(r|z)?|cancel|stop|pas maintenant)$/i.test(t);
}
