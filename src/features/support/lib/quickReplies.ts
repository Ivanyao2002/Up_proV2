import type { ComposeTab } from "../components/AgentComposeArea";

/**
 * Réponses prédéfinies cliquables dans la zone de composition.
 * `tab` indique l'action déclenchée : "reply" (message client) par défaut,
 * "justification" pour une demande de pièce justificative.
 */
export interface QuickReply {
  label: string;
  text: string;
  tab?: ComposeTab;
}

export const QUICK_REPLIES: QuickReply[] = [
  {
    label: "Accusé de réception",
    text: "Bonjour, nous avons bien reçu votre réclamation et nous la traitons en priorité. Nous revenons vers vous dans les plus brefs délais.",
  },
  {
    label: "Demande de précisions",
    text: "Afin de traiter votre demande au mieux, pourriez-vous nous préciser la date, l'heure et le montant concernés ?",
  },
  {
    label: "Demander un justificatif",
    text: "Pour faire avancer votre dossier, merci de nous transmettre un justificatif (capture d'écran, reçu ou photo) en lien avec votre réclamation.",
    tab: "justification",
  },
  {
    label: "En cours de traitement",
    text: "Votre dossier est en cours de vérification auprès du service concerné. Merci de votre patience, nous revenons vers vous très vite.",
  },
  {
    label: "Excuses",
    text: "Nous sommes sincèrement désolés pour la gêne occasionnée. Nous mettons tout en œuvre pour résoudre votre problème rapidement.",
  },
  {
    label: "Clôture",
    text: "Merci de nous avoir signalé ce problème. Votre demande a été traitée — n'hésitez pas à nous recontacter si besoin.",
  },
];
