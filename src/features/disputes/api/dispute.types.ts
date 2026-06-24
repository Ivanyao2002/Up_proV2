export type DisputeStatus = "open" | "in_progress" | "resolved" | "closed" | "escalated";

export type DisputeCategory =
  | "payment"    // double débit, surcoût, remboursement
  | "behavior"   // comportement chauffeur
  | "service"    // trajet, annulation, attente
  | "logistics"  // colis, livraison
  | "app"        // bug application
  | "other";

export interface Dispute {
  id: string;
  subject: string;
  description?: string;
  category: DisputeCategory;
  status: DisputeStatus;
  reporter_name: string;
  reporter_phone?: string;
  trip_id?: string;
  trip_ref?: string;
  assigned_to?: string | null;
  assigned_to_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DisputeMessage {
  id: string;
  sender: "agent" | "user" | "system" | "ai";
  sender_name: string;
  content: string;
  /** Assistant IA — score de confiance 0–1 (présent si sender = "ai") */
  ai_confidence?: number;
  /** Assistant IA — IDs des sources utilisées (traçabilité RAG) */
  ai_sources?: string[];
  created_at: string;
}

export interface DisputeDetail extends Dispute {
  messages: DisputeMessage[];
}

export interface DisputeListResponse {
  data: Dispute[];
  meta: {
    total: number;
    current_page: number;
    per_page: number;
    last_page: number;
  };
  facets?: {
    status?: Record<string, number>;
  };
}

export interface CreateDisputePayload {
  category: DisputeCategory;
  subject: string;
  description?: string;
  trip_id?: string;
}
