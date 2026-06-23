/**
 * Politique de mot de passe partagée — alignée sur l'exigence la plus stricte
 * des portails (création staff). Évite les divergences (6 vs 8) entre formulaires.
 */
export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_MIN_MESSAGE = `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`;
