// Contenu du guide « Aide » affiché depuis l'icône d'aide du topbar support.
// Première version volontairement courte : à enrichir au fil des retours agents.

export type HelpSectionAccent = "teal" | "amber" | "red" | "blue" | "slate";

export const HELP_ACCENT_DOT: Record<HelpSectionAccent, string> = {
  teal:  "bg-teal",
  amber: "bg-amber-500",
  red:   "bg-red-500",
  blue:  "bg-blue-500",
  slate: "bg-slate-400",
};

export interface HelpSection {
  id: string;
  title: string;
  intro: string;
  points: string[];
  accent: HelpSectionAccent;
}

export const HELP_INTRO =
  "Repères rapides pour traiter les demandes entrantes. Ce guide évoluera ; signalez ce qui manque.";

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: "overview",
    title: "Vue d’ensemble",
    intro: "Le portail support centralise les demandes clients et franchises.",
    accent: "teal",
    points: [
      "La cloche regroupe les réclamations et les litiges entrants en temps réel.",
      "Chaque action (assignation, message, résolution) est tracée dans l’historique.",
      "Le badge en haut indique l’état de synchronisation temps réel.",
    ],
  },
  {
    id: "anomalies",
    title: "Anomalies récentes",
    intro: "Liste des derniers incidents détectés, du plus récent au plus ancien.",
    accent: "amber",
    points: [
      "La pastille de couleur reflète la sévérité (critique, élevée, modérée).",
      "Chaque ligne renvoie au détail concerné pour investigation.",
      "Sert de fil de surveillance — ce n’est pas une file à traiter une par une.",
    ],
  },
  {
    id: "reclamations",
    title: "Réclamations",
    intro: "Plaintes partagées entre agents. Cycle : ouverte → en cours → résolue/clôturée/escaladée.",
    accent: "blue",
    points: [
      "Une réclamation « ouverte » n’est assignée à personne : prenez-la pour passer « en cours ».",
      "Une fois assignée, seul l’agent propriétaire peut la faire évoluer.",
      "Résolvez, clôturez ou escaladez selon l’issue — ces états sont définitifs.",
    ],
  },
  {
    id: "litiges",
    title: "Litiges",
    intro: "Différends liés à une course (paiement, comportement, trajet, livraison…).",
    accent: "red",
    points: [
      "Assignez-vous le litige avant d’échanger avec le client.",
      "Catégorie et historique sont posés par le système ",
      "Escaladez si le dossier dépasse votre périmètre (remboursement, sanction).",
    ],
  },
  {
    id: "chat",
    title: "Chat & temps réel",
    intro: "Échanges en direct avec les franchises et les clients.",
    accent: "slate",
    points: [
      "Les nouveaux messages arrivent instantanément ; un son signale l’entrant.",
      "Les changements d’état se reflètent immédiatement (mise à jour optimiste).",
      "Si le badge passe au rouge, la reconnexion est automatique.",
    ],
  },
];
