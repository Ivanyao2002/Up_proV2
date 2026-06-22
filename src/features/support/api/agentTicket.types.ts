export type AgentTicketStatus = "open" | "in_progress" | "resolved" | "closed" | "escalated";
export type AgentTicketPriority = "low" | "normal" | "high";
export type AgentMessageType = "message" | "internal_note" | "justification_request" | "system";
export type AgentSanctionType = "warning" | "surveillance" | "quality_points" | "suspension";
export type AgentApplicableSanctionType = Extract<
  AgentSanctionType,
  "warning" | "surveillance"
>;
/** Réduction en % | Réduction fixe FCFA | Prochain service offert */
export type AgentCompensationType = "percentage_discount" | "fixed_discount" | "free_service";
/** Qui soumet la réclamation */
export type AgentReporterType = "client" | "driver" | "deliverer" | "partner";

/** Catégorie choisie par le déclarant lors de la soumission */
export type AgentTicketCategory =
  | "payment"    // double débit, surcoût, remboursement
  | "behavior"   // chauffeur agressif, conduite dangereuse
  | "service"    // annulation, attente excessive, introuvable
  | "logistics"  // colis endommagé, livraison non effectuée
  | "app"        // bug application, problème technique
  | "other";

export interface AgentTicketMessage {
  id: string;
  sender: "agent" | "user" | "system";
  sender_name: string;
  content: string;
  type: AgentMessageType;
  created_at: string;
}

export interface AgentSanction {
  id: string;
  type: AgentSanctionType;
  reason: string;
  applied_at: string;
  applied_by: string;
}

export interface AgentCompensation {
  id: string;
  type: AgentCompensationType;
  discount_value?: number;  // % pour percentage_discount, FCFA pour fixed_discount
  promo_code: string;       // code généré, appliqué sur la prochaine commande
  expires_at?: string;      // date limite d'utilisation (ISO 8601)
  cancelled_at?: string;    // présent si annulé
  created_at: string;
  created_by: string;
}

export interface AgentTicketDetail {
  id: string;
  subject: string;
  category: AgentTicketCategory | null;
  priority: AgentTicketPriority;
  status: AgentTicketStatus;
  reporter_name: string;
  reporter_type: AgentReporterType;
  franchise_name: string;
  trip_ref?: string;
  trip_id?: string;
  assigned_to_id: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  messages: AgentTicketMessage[];
  sanctions: AgentSanction[];
  compensations: AgentCompensation[];
}

export type TripStatus = "completed" | "cancelled" | "in_progress";

export interface TripSummaryData {
  trip_id: string;
  ref: string;
  status: TripStatus;
  from_address: string;
  to_address: string;
  distance_km: number;
  duration_min: number;
  amount_fcfa: number;
  driver_name: string;
  started_at: string;
  ended_at: string | null;
  anomaly_flagged: boolean;
  anomaly_count: number;
}

export interface ApplySanctionPayload {
  type: AgentApplicableSanctionType;
  reason: string;
}

export interface ApplyCompensationPayload {
  type: AgentCompensationType;
  discount_value?: number;  // requis pour percentage_discount et fixed_discount
  expires_at?: string;      // ISO 8601 — date limite optionnelle
}
