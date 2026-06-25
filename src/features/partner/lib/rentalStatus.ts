/**
 * Modèle de statuts LOCATION (portail Partenaire / Loueur).
 *
 * Source : cahier des charges Tome 1 §5 « Statuts Location » + demande backend
 * DB-RENT-04. Le cahier liste 11 libellés en regroupant « Annulée / Remboursée » ;
 * on distingue ici `cancelled` et `refunded` (12 états canoniques) pour une
 * machine à états sans ambiguïté.
 *
 * ⚠️ La validation des transitions est faite **côté serveur** (offre §4.2) ;
 * `ALLOWED_TRANSITIONS` ne sert qu'à guider l'UI (actions proposées au loueur).
 */

export type RentalStatus =
  | "draft" // Brouillon
  | "awaiting_payment" // En attente paiement
  | "awaiting_confirmation" // En attente confirmation partenaire
  | "confirmed" // Confirmée
  | "ready" // Prête (retrait/livraison)
  | "active" // En cours (location active)
  | "return_due" // Retour prévu
  | "to_close" // À clôturer (check-out en attente validation)
  | "completed" // Clôturée
  | "cancelled" // Annulée
  | "refunded" // Remboursée
  | "blocked"; // Bloquée (litige)

export interface RentalStatusMeta {
  label: string;
  /** Classes Tailwind badge (fond + texte), alignées sur les pages existantes. */
  color: string;
}

export const RENTAL_STATUS_CONFIG: Record<RentalStatus, RentalStatusMeta> = {
  draft: { label: "Brouillon", color: "bg-gray-100 text-gray-600" },
  awaiting_payment: { label: "En attente paiement", color: "bg-amber-100 text-amber-700" },
  awaiting_confirmation: { label: "À confirmer", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Confirmée", color: "bg-blue-100 text-blue-700" },
  ready: { label: "Prête", color: "bg-indigo-100 text-indigo-700" },
  active: { label: "En cours", color: "bg-green-100 text-green-700" },
  return_due: { label: "Retour prévu", color: "bg-teal-100 text-teal-700" },
  to_close: { label: "À clôturer", color: "bg-orange-100 text-orange-700" },
  completed: { label: "Clôturée", color: "bg-gray-100 text-gray-700" },
  cancelled: { label: "Annulée", color: "bg-red-100 text-red-700" },
  refunded: { label: "Remboursée", color: "bg-rose-100 text-rose-700" },
  blocked: { label: "Bloquée (litige)", color: "bg-red-100 text-red-700" },
};

/** Ordre d'avancement « heureux » pour l'affichage d'une timeline. */
export const RENTAL_STATUS_FLOW: RentalStatus[] = [
  "draft",
  "awaiting_payment",
  "awaiting_confirmation",
  "confirmed",
  "ready",
  "active",
  "return_due",
  "to_close",
  "completed",
];

/**
 * Transitions autorisées (guidage UI). `blocked` est atteignable depuis tout
 * état actif via l'ouverture d'un litige ; on ne le liste pas partout pour
 * garder la table lisible — l'UI litige gère ce cas séparément.
 */
export const RENTAL_ALLOWED_TRANSITIONS: Record<RentalStatus, RentalStatus[]> = {
  draft: ["awaiting_payment", "cancelled"],
  awaiting_payment: ["awaiting_confirmation", "confirmed", "cancelled"],
  awaiting_confirmation: ["confirmed", "cancelled"], // cancelled = refus motivé
  confirmed: ["ready", "cancelled"],
  ready: ["active", "cancelled"],
  active: ["return_due", "to_close", "blocked"],
  return_due: ["to_close", "blocked"],
  to_close: ["completed", "blocked"],
  completed: ["refunded"],
  cancelled: ["refunded"],
  refunded: [],
  blocked: ["to_close", "completed", "refunded"],
};

export function canTransition(from: RentalStatus, to: RentalStatus): boolean {
  return RENTAL_ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Statuts considérés comme « terminaux » (plus d'action métier). */
export function isTerminalRentalStatus(status: RentalStatus): boolean {
  return RENTAL_ALLOWED_TRANSITIONS[status]?.length === 0;
}

export type RentalActionKind =
  | "confirm"
  | "reject"
  | "ready"
  | "check_in"
  | "check_out"
  | "close"
  | "cancel"
  | "refund";

export interface RentalAction {
  kind: RentalActionKind;
  label: string;
  /** Statut cible après l'action (informatif ; la transition réelle est serveur). */
  to: RentalStatus;
  variant: "primary" | "secondary" | "danger";
  /** Un motif est obligatoire (refus / annulation) — cf. DB-RENT-05. */
  requiresReason?: boolean;
}

/**
 * Actions proposées au LOUEUR pour un statut donné (portail Partenaire).
 * Consommé par la liste (file de traitement) et le détail réservation.
 */
export function rentalNextActions(status: RentalStatus): RentalAction[] {
  switch (status) {
    case "awaiting_confirmation":
      return [
        { kind: "confirm", label: "Confirmer", to: "confirmed", variant: "primary" },
        { kind: "reject", label: "Refuser", to: "cancelled", variant: "danger", requiresReason: true },
      ];
    case "confirmed":
      return [
        { kind: "ready", label: "Marquer prête", to: "ready", variant: "primary" },
        { kind: "cancel", label: "Annuler", to: "cancelled", variant: "danger", requiresReason: true },
      ];
    case "ready":
      return [
        { kind: "check_in", label: "Check-in", to: "active", variant: "primary" },
        { kind: "cancel", label: "Annuler", to: "cancelled", variant: "danger", requiresReason: true },
      ];
    case "active":
    case "return_due":
      return [{ kind: "check_out", label: "Check-out", to: "to_close", variant: "primary" }];
    case "to_close":
      return [{ kind: "close", label: "Clôturer", to: "completed", variant: "primary" }];
    case "completed":
      return [{ kind: "refund", label: "Rembourser", to: "refunded", variant: "secondary" }];
    case "blocked":
      return [{ kind: "close", label: "Clôturer", to: "completed", variant: "secondary" }];
    default:
      return [];
  }
}
