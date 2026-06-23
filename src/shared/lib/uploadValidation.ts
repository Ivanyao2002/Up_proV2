/** Taille maximale autorisée pour un document téléversé (8 Mo). */
export const MAX_DOCUMENT_SIZE_BYTES = 8 * 1024 * 1024;

/** Types MIME acceptés pour les documents téléversés. */
export const ACCEPTED_DOCUMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;

/** Contrainte affichée à l'utilisateur sous les champs d'upload. */
export const DOCUMENT_UPLOAD_HINT = "JPG, PNG ou PDF, max 8 Mo";

export interface DocumentFileValidation {
  ok: boolean;
  error?: string;
}

/**
 * Valide un fichier de document (taille et type MIME).
 * Renvoie `{ ok: true }` si le fichier est accepté, sinon `{ ok: false, error }`
 * avec un message inline en français.
 */
export function validateDocumentFile(file: File): DocumentFileValidation {
  if (!(ACCEPTED_DOCUMENT_MIME_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: "Format non pris en charge. Utilisez un fichier JPG, PNG ou PDF." };
  }
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return { ok: false, error: "Fichier trop volumineux. La taille maximale est de 8 Mo." };
  }
  return { ok: true };
}
