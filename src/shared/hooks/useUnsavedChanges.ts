"use client";

import { useEffect } from "react";

/**
 * Avertit l'utilisateur avant de quitter la page (fermeture / rechargement)
 * lorsqu'il existe des modifications non enregistrées.
 *
 * @param dirty `true` lorsque le formulaire contient des changements non sauvegardés.
 */
export function useUnsavedChanges(dirty: boolean): void {
  useEffect(() => {
    if (!dirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Requis par certains navigateurs pour déclencher la confirmation native.
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);
}
