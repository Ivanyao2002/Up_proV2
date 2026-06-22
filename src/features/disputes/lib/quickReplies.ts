/**
 * Réponses prédéfinies cliquables dans la conversation d'un litige.
 * Litiges = uniquement des messages client (pas de note interne ni justificatif).
 */
export interface DisputeQuickReply {
  label: string;
  text: string;
}

export const DISPUTE_QUICK_REPLIES: DisputeQuickReply[] = [
  {
    label: "Accusé de réception",
    text: "Bonjour, nous avons bien reçu votre litige et nous le traitons en priorité. Nous revenons vers vous dans les plus brefs délais.",
  },
  {
    label: "Demande de précisions",
    text: "Afin de traiter votre litige au mieux, pourriez-vous nous préciser la date, l'heure et le montant concernés ?",
  },
  {
    label: "Vérification en cours",
    text: "Votre dossier est en cours de vérification auprès du service concerné. Merci de votre patience, nous revenons vers vous très vite.",
  },
  {
    label: "Demander une preuve",
    text: "Pour faire avancer votre dossier, merci de nous transmettre un justificatif (capture d'écran, reçu ou photo) en lien avec votre litige.",
  },
  {
    label: "Excuses",
    text: "Nous sommes sincèrement désolés pour la gêne occasionnée. Nous mettons tout en œuvre pour résoudre votre litige rapidement.",
  },
  {
    label: "Clôture",
    text: "Merci de nous avoir signalé ce problème. Votre litige a été traité — n'hésitez pas à nous recontacter si besoin.",
  },
];
