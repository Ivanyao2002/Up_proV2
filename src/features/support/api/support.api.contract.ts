/**
 * Contrat HTTP du module Support.
 *
 * Base URL       : /v1/support
 * Authentification: Bearer token
 * Rôles autorisés : support, admin
 * Format          : application/json
 * Dates           : ISO 8601 UTC, par exemple 2026-06-20T10:45:00Z
 *
 * Les noms de champs et les valeurs d'enum doivent être renvoyés exactement
 * comme définis ici. Les listes utilisent toujours Paginated<T>.
 */

export type TicketStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "closed"
  | "escalated";

export type TicketPriority = "low" | "normal" | "high";

export type TicketCategory =
  | "payment"
  | "behavior"
  | "service"
  | "logistics"
  | "app"
  | "other";

export type ReporterType = "client" | "driver" | "deliverer" | "partner";

export type ChatParticipantType =
  | ReporterType
  | "franchise"
  | "support_agent"
  | "admin";

export type MessageType =
  | "message"
  | "internal_note"
  | "justification_request"
  | "system";

export type SanctionType =
  | "warning"
  | "surveillance"
  | "quality_points"
  | "suspension";

export type AgentSanctionType = Extract<
  SanctionType,
  "warning" | "surveillance"
>;

export type CompensationType =
  | "percentage_discount"
  | "fixed_discount"
  | "free_service";

export interface PaginationMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiSuccess {
  ok: true;
}

export interface ApiError {
  message: string;
  code: SupportErrorCode;
  errors?: Record<string, string[]>;
}

export interface TicketListQuery {
  page?: number;
  per_page?: number;
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  reporter_type?: ReporterType;
  /** Catégorie de réclamation (payment, behavior, service, logistics, app, other). */
  category?: TicketCategory;
}

export interface TicketListItem {
  id: string;
  subject: string;
  category?: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  reporter_name: string;
  reporter_type: ReporterType;
  franchise_name: string;
  assigned_to_id: string | null;
  assigned_to: string | null;
  trip_ref?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Compteurs par statut sur l'ensemble filtré (search + reporter_type + category
 * appliqués, MAIS pas le filtre status lui-même). Alimente les onglets de la liste.
 */
export interface TicketStatusFacets {
  all: number;
  open: number;
  in_progress: number;
  resolved: number;
}

export interface TicketsListResponse extends Paginated<TicketListItem> {
  facets?: { status: TicketStatusFacets };
}

export interface TicketMessage {
  id: string;
  sender: "agent" | "user" | "system";
  sender_name: string;
  content: string;
  type: MessageType;
  created_at: string;
}

export interface TicketSanction {
  id: string;
  type: SanctionType;
  reason: string;
  applied_at: string;
  applied_by: string;
}

export interface TicketCompensation {
  id: string;
  type: CompensationType;
  discount_value?: number;
  promo_code: string;
  created_at: string;
  created_by: string;
}

export interface TicketDetail extends TicketListItem {
  category: TicketCategory;
  trip_id?: string;
  messages: TicketMessage[];
  sanctions: TicketSanction[];
  compensations: TicketCompensation[];
}

export interface SendMessageRequest {
  content: string;
  type: Exclude<MessageType, "system">;
}

export interface ApplySanctionRequest {
  type: AgentSanctionType;
  reason: string;
}

export interface ApplyCompensationRequest {
  type: CompensationType;
  discount_value?: number;
}

export interface TicketTransitionRequest {
  note?: string;
}

export interface AssignTicketResponse extends ApiSuccess {
  assigned_to_id: string;
  assigned_to: string;
}

export interface TicketUpdatedSocketPayload {
  ticketId: string;
  status: TicketStatus;
  assignedToId: string | null;
  assignedToName: string | null;
  updatedAt: string;
}

export type TripStatus = "completed" | "cancelled" | "in_progress";

export interface TripSummary {
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

export interface ChatListQuery {
  page?: number;
  per_page?: number;
  search?: string;
  status?: "open" | "closed";
  participant_type?: Exclude<ChatParticipantType, "support_agent" | "admin">;
}

export interface SupportChat {
  id: string;
  participant_name: string;
  participant_id: string;
  participant_type: Exclude<
    ChatParticipantType,
    "support_agent" | "admin"
  >;
  franchise_id?: string | null;
  franchise_city?: string | null;
  ticket_id?: string | null;
  assigned_agent_id?: string | null;
  assigned_agent_name?: string | null;
  subject?: string;
  last_message_preview: string;
  unread_count: number;
  status: "open" | "closed";
  updated_at: string;
}

export type ChatAttachmentType = "image" | "pdf" | "document";

export interface ChatAttachment {
  id: string;
  url: string;
  type: ChatAttachmentType;
  filename: string;
  size_bytes: number;
}

export interface SupportChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: ChatParticipantType | "system";
  author: string;
  role: "reporter" | "agent" | "system";
  body: string;
  at: string;
  attachment?: ChatAttachment;
}

export interface SupportChatDetail extends SupportChat {
  messages: SupportChatMessage[];
}

export interface SendChatMessageRequest {
  body: string;
  /** ID retourné par POST /v1/support/chat/:id/attachments. */
  attachment_id?: string;
}

export interface ChatMessageSocketPayload {
  conversationId: string;
  conversationType: "support_chat" | "ticket";
  message: SupportChatMessage | TicketMessage;
}

export interface ChatConversationUpdatedSocketPayload {
  conversationId: string;
  status: SupportChat["status"];
  unread_count: number;
  assigned_agent_id?: string | null;
  updated_at: string;
}

export type AuditSeverity = "info" | "warning" | "critical";

export type AuditCategory =
  | "ticket"
  | "compensation"
  | "sanction"
  | "escalation"
  | "chat"
  | "auth";

export interface SupportAuditMetadata {
  sanction_type?: SanctionType;
  compensation_type?: CompensationType;
  discount_value?: number;
  promo_code?: string;
  message_type?: Exclude<MessageType, "system">;
  transition_note?: string;
}

/**
 * `category` représente le type d'action auditée. Cette valeur est déterminée
 * par le backend au moment où l'action métier est exécutée :
 *
 * - ticket      : assignation, message, note, résolution ou clôture ;
 * - compensation: geste commercial ;
 * - sanction    : sanction appliquée ;
 * - escalation  : escalade vers Administration/Central ;
 * - chat        : message d'une conversation support ;
 * - auth        : connexion ou déconnexion d'un agent.
 *
 * Le frontend et l'utilisateur ne fournissent jamais cette valeur lors de la
 * création d'un événement d'audit.
 */
export interface AuditListQuery {
  page?: number;
  per_page?: number;
  search?: string;
  severity?: AuditSeverity;
  /** Catégorie d'audit — filtre par type d'action (ticket, sanction, compensation…). */
  category?: AuditCategory;
  action?: SupportAuditAction;
  resource_type?: "ticket";
  date_from?: string;
  date_to?: string;
}

export interface SupportAuditEvent {
  id: string;
  at: string;
  actor_email: string;
  actor_name: string;
  action: SupportAuditAction;
  category: AuditCategory;
  severity: AuditSeverity;
  resource_id?: string;
  resource_label?: string;
  detail: string;
  metadata?: SupportAuditMetadata;
}

export interface SupportDashboardStats {
  open_tickets: number;
  in_progress_tickets: number;
  escalated_tickets: number;
  resolved_today: number;
  active_chat_conversations: number;
  anomalies_today: number;
}

export interface SupportDashboardRecent {
  recent_tickets: TicketListItem[];
  recent_anomalies: SupportAuditEvent[];
}

/**
 * Règles métier obligatoires :
 *
 * - `open` signifie non assigné. Une assignation passe le ticket à `in_progress`.
 * - Tous les agents support autorisés voient la même file de réclamations.
 * - Le premier agent qui assigne un ticket en devient le propriétaire.
 * - L'assignation doit être atomique. Deux assignations concurrentes ne peuvent
 *   jamais réussir ; la seconde reçoit TICKET_ALREADY_ASSIGNED.
 * - Seul l'agent propriétaire peut répondre, ajouter une note, demander un
 *   justificatif, sanctionner, compenser, résoudre, clôturer ou escalader.
 * - Les autres agents conservent un accès en lecture au ticket et voient le nom
 *   de l'agent propriétaire.
 * - `resolved`, `closed` et `escalated` sont des états terminaux pour l'agent.
 * - Toute mutation doit être transactionnelle et créer une entrée d'audit.
 * - Un message `internal_note` n'est jamais visible par le plaignant.
 * - Un message `justification_request` doit notifier le plaignant.
 * - Le chat accepte les participants client, driver, deliverer, partner et
 *   franchise. Le support voit ces conversations selon son périmètre.
 * - L'écriture d'un message passe par HTTP. Socket.IO diffuse uniquement un
 *   message déjà validé et persisté par le backend.
 * - La cible d'une sanction est la personne mise en cause par le ticket ou la
 *   course associée, jamais automatiquement le plaignant.
 * - Le backend doit refuser une sanction si la cible ne peut pas être déterminée.
 * - Un agent support peut appliquer uniquement `warning` et `surveillance`.
 * - `quality_points` et `suspension` exigent un rôle admin. L'agent support
 *   doit escalader la réclamation pour demander l'une de ces sanctions.
 * - Une compensation est destinée au plaignant et génère toujours un code promo.
 */
export const SUPPORT_BUSINESS_RULES = {
  terminal_ticket_statuses: ["resolved", "closed", "escalated"],
  message_content_length: { min: 1, max: 4000 },
  sanction_reason_length: { min: 10 },
  percentage_discount_range: { min: 1, max: 100 },
  fixed_discount_min_fcfa: 1,
  default_page: 1,
  default_per_page: 25,
  max_per_page: 100,
} as const;

/**
 * GET /v1/support/tickets
 *
 * Réponse : TicketsListResponse (Paginated<TicketListItem> + facets.status)
 *
 * Filtres : status, priority, reporter_type, category (cumulables).
 * `search` recherche au minimum dans : id, subject, reporter_name,
 * franchise_name, trip_ref, reporter_type ET category.
 *
 * `facets.status` = compteurs par statut calculés sur l'ensemble filtré par
 * search + reporter_type + category, MAIS avant application du filtre `status`
 * (sinon l'onglet actif vaudrait toujours son propre total). Clés :
 * all / open / in_progress / resolved. Facultatif : si absent, le front masque
 * les compteurs.
 *
 * Tri attendu : priorité haute en premier, puis updated_at décroissant.
 * Une liste vide renvoie 200 avec data: [].
 */
export const LIST_TICKETS = {
  method: "GET",
  path: "/v1/support/tickets",
  query: {} as TicketListQuery,
  response: {} as TicketsListResponse,
} as const;

/**
 * GET /v1/support/tickets/:id
 *
 * Réponse : TicketDetail
 * Erreurs : TICKET_NOT_FOUND, TICKET_ACCESS_DENIED
 *
 * Les messages sont triés par created_at croissant.
 */
export const GET_TICKET_DETAIL = {
  method: "GET",
  path: "/v1/support/tickets/:id",
  response: {} as TicketDetail,
} as const;

/**
 * POST /v1/support/tickets/:id/assign
 *
 * Le corps est vide. L'agent est identifié par le token.
 * L'opération doit être atomique pour éviter une double assignation.
 *
 * Réponse : AssignTicketResponse
 * Erreurs : TICKET_NOT_FOUND, TICKET_ACCESS_DENIED,
 * TICKET_ALREADY_ASSIGNED, TICKET_TERMINAL
 */
export const ASSIGN_TICKET = {
  method: "POST",
  path: "/v1/support/tickets/:id/assign",
  response: {} as AssignTicketResponse,
} as const;

/**
 * POST /v1/support/tickets/:id/messages
 *
 * Body     : SendMessageRequest
 * Réponse  : TicketMessage
 * Erreurs  : TICKET_NOT_FOUND, TICKET_ACCESS_DENIED,
 * TICKET_NOT_ASSIGNED, TICKET_TERMINAL, MESSAGE_CONTENT_INVALID
 */
export const SEND_TICKET_MESSAGE = {
  method: "POST",
  path: "/v1/support/tickets/:id/messages",
  body: {} as SendMessageRequest,
  response: {} as TicketMessage,
} as const;

/**
 * POST /v1/support/tickets/:id/sanctions
 *
 * Body    : ApplySanctionRequest
 * Réponse : TicketSanction
 * Erreurs : TICKET_NOT_FOUND, TICKET_ACCESS_DENIED,
 * TICKET_NOT_ASSIGNED, TICKET_TERMINAL, SANCTION_REASON_INVALID,
 * SANCTION_TARGET_NOT_FOUND
 *
 * Effets attendus :
 * - warning        : notification de la cible ;
 * - surveillance   : signalement du profil ;
 *
 * `quality_points` et `suspension` ne sont pas acceptés sur cet endpoint pour
 * un agent support. Le backend répond SANCTION_NOT_ALLOWED.
 */
export const APPLY_TICKET_SANCTION = {
  method: "POST",
  path: "/v1/support/tickets/:id/sanctions",
  body: {} as ApplySanctionRequest,
  response: {} as TicketSanction,
} as const;

/**
 * POST /v1/support/tickets/:id/compensations
 *
 * Body    : ApplyCompensationRequest
 * Réponse : TicketCompensation
 * Erreurs : TICKET_NOT_FOUND, TICKET_ACCESS_DENIED,
 * TICKET_NOT_ASSIGNED, TICKET_TERMINAL, COMPENSATION_VALUE_INVALID,
 * PROMO_CODE_GENERATION_FAILED
 *
 * `discount_value` est requis pour percentage_discount et fixed_discount.
 * Il doit être absent pour free_service.
 */
export const APPLY_TICKET_COMPENSATION = {
  method: "POST",
  path: "/v1/support/tickets/:id/compensations",
  body: {} as ApplyCompensationRequest,
  response: {} as TicketCompensation,
} as const;

/**
 * PATCH /v1/support/tickets/:id/resolve
 *
 * Utilisé lorsque la demande a été traitée avec succès.
 * Body : TicketTransitionRequest
 * Réponse : ApiSuccess
 */
export const RESOLVE_TICKET = {
  method: "PATCH",
  path: "/v1/support/tickets/:id/resolve",
  body: {} as TicketTransitionRequest,
  response: {} as ApiSuccess,
} as const;

/**
 * PATCH /v1/support/tickets/:id/close
 *
 * Utilisé pour un ticket invalide, en doublon ou sans action nécessaire.
 * Body : TicketTransitionRequest
 * Réponse : ApiSuccess
 */
export const CLOSE_TICKET = {
  method: "PATCH",
  path: "/v1/support/tickets/:id/close",
  body: {} as TicketTransitionRequest,
  response: {} as ApiSuccess,
} as const;

/**
 * POST /v1/support/tickets/:id/escalate
 *
 * Passe le ticket à `escalated`, ajoute un message système et notifie
 * l'équipe Administration/Central.
 *
 * Body : TicketTransitionRequest
 * Réponse : ApiSuccess
 */
export const ESCALATE_TICKET = {
  method: "POST",
  path: "/v1/support/tickets/:id/escalate",
  body: {} as TicketTransitionRequest,
  response: {} as ApiSuccess,
} as const;

/**
 * GET /v1/support/trips/:id/summary
 *
 * Réponse : TripSummary
 * Erreurs : TRIP_NOT_FOUND, TICKET_ACCESS_DENIED
 */
export const GET_TRIP_SUMMARY = {
  method: "GET",
  path: "/v1/support/trips/:id/summary",
  response: {} as TripSummary,
} as const;

/**
 * GET /v1/support/chat
 *
 * Réponse : Paginated<SupportChat>
 * Tri attendu : updated_at décroissant.
 *
 * Cette file regroupe les conversations des clients, chauffeurs, livreurs,
 * partenaires et franchises. `participant_type` permet de les filtrer.
 */
export const LIST_SUPPORT_CHATS = {
  method: "GET",
  path: "/v1/support/chat",
  query: {} as ChatListQuery,
  response: {} as Paginated<SupportChat>,
} as const;

/**
 * GET /v1/support/chat/:id
 *
 * Réponse : SupportChatDetail
 * Erreurs : CHAT_NOT_FOUND, CHAT_ACCESS_DENIED
 *
 * L'ouverture marque la conversation comme lue pour l'agent courant.
 */
export const GET_SUPPORT_CHAT = {
  method: "GET",
  path: "/v1/support/chat/:id",
  response: {} as SupportChatDetail,
} as const;

/**
 * POST /v1/support/chat/:id/messages
 *
 * Body : SendChatMessageRequest
 * Réponse : SupportChatMessage
 * Erreurs : CHAT_NOT_FOUND, CHAT_ACCESS_DENIED,
 * CHAT_CLOSED, MESSAGE_CONTENT_INVALID
 *
 * `body` et `attachment_id` sont optionnels mais au moins l'un des deux
 * doit être présent, sinon le backend répond MESSAGE_CONTENT_INVALID.
 */
export const SEND_SUPPORT_CHAT_MESSAGE = {
  method: "POST",
  path: "/v1/support/chat/:id/messages",
  body: {} as SendChatMessageRequest,
  response: {} as SupportChatMessage,
} as const;

/**
 * PATCH /v1/support/chat/:id/close
 *
 * Clôture la conversation. Le participant ne peut plus envoyer de messages.
 * L'agent peut toujours consulter l'historique.
 *
 * Corps : vide
 * Réponse : ApiSuccess
 * Erreurs : CHAT_NOT_FOUND, CHAT_ACCESS_DENIED, CHAT_ALREADY_CLOSED
 */
export const CLOSE_SUPPORT_CHAT = {
  method: "PATCH",
  path: "/v1/support/chat/:id/close",
  response: {} as ApiSuccess,
} as const;

/**
 * POST /v1/support/chat/:id/attachments
 *
 * Upload d'un fichier avant envoi du message.
 * Content-Type : multipart/form-data, champ `file`.
 * Types autorisés : image/jpeg, image/png, image/webp, image/gif, application/pdf.
 * Taille max : 10 Mo.
 *
 * Réponse : ChatAttachment (contient l'id à passer dans SendChatMessageRequest)
 * Erreurs : CHAT_NOT_FOUND, CHAT_CLOSED,
 * CHAT_ATTACHMENT_TOO_LARGE, CHAT_ATTACHMENT_TYPE_NOT_ALLOWED
 */
export const UPLOAD_CHAT_ATTACHMENT = {
  method: "POST",
  path: "/v1/support/chat/:id/attachments",
  response: {} as ChatAttachment,
} as const;

/**
 * Les différents portails utilisent la même conversation et la même table de
 * messages côté backend. Seuls les chemins et les règles d'accès diffèrent :
 *
 * - agent support :
 *   GET  /v1/support/chat
 *   GET  /v1/support/chat/:id
 *   POST /v1/support/chat/:id/messages
 *
 * - franchise :
 *   GET  /v1/franchise/support/chat
 *   GET  /v1/franchise/support/chat/:id
 *   POST /v1/franchise/support/chat/:id/messages
 *
 * - client, chauffeur, livreur :
 *   GET  /v1/chat/conversations
 *   GET  /v1/chat/conversations/:id/messages
 *   POST /v1/chat/conversations/:id/messages
 *
 * - partenaire :
 *   les routes du portail partenaire doivent déléguer au même service de chat.
 *
 * Chaque utilisateur ne voit que ses conversations. Une franchise ne voit que
 * les conversations de son périmètre. Un agent support voit la file autorisée
 * par ses permissions. Les identifiants du participant et de l'expéditeur
 * viennent toujours du token, jamais d'un champ libre envoyé par le client.
 */
export const SUPPORT_CHAT_HTTP_SURFACES = {
  support_agent: "/v1/support/chat",
  franchise: "/v1/franchise/support/chat",
  user: "/v1/chat/conversations",
  partner: "/v1/partners/:partnerId/support/chat",
} as const;

/**
 * Protocole Socket.IO du chat support.
 *
 * URL       : même origine que l'API
 * Transport : websocket avec fallback polling
 * Auth      : io(url, { auth: { token } })
 *
 * À la connexion, le backend valide le token puis rattache automatiquement
 * la socket aux rooms autorisées :
 * - user:{userId} pour chaque utilisateur, franchise ou agent connecté ;
 * - support:queue pour les agents support autorisés à recevoir la file ;
 * - conversation:{conversationId} seulement si l'utilisateur participe à
 *   cette conversation ou si l'agent a le droit de la consulter.
 *
 * Compatibilité frontend actuelle :
 * le client émet `join` avec son userId après connexion. Le backend doit
 * vérifier que cette valeur correspond au token. Une tentative de rejoindre
 * un autre userId produit `join_denied`.
 *
 * Flux d'envoi :
 * 1. l'émetteur appelle l'endpoint HTTP de création du message ;
 * 2. le backend vérifie les droits et persiste le message ;
 * 3. le backend répond avec SupportChatMessage ;
 * 4. après commit, il émet `chat:message` aux participants concernés.
 *
 * Les messages d'un ticket suivent le même mécanisme. Pour
 * POST /v1/support/tickets/:id/messages, `conversationId` vaut l'id du ticket
 * et `conversationType` vaut `ticket`.
 *
 * Le frontend ne doit pas persister un message directement par Socket.IO.
 *
 * Après chaque assignation ou mutation d'un ticket, le backend émet
 * `ticket:updated` dans `support:queue` et dans `conversation:{ticketId}`.
 * Cela permet à tous les agents de voir immédiatement le propriétaire, le
 * statut et la dernière mise à jour sans recharger la page.
 */
export const SUPPORT_CHAT_SOCKET = {
  client_events: {
    join: {
      payload: {} as string,
    },
  },
  server_events: {
    "chat:message": {
      payload: {} as ChatMessageSocketPayload,
    },
    "chat:conversation_updated": {
      payload: {} as ChatConversationUpdatedSocketPayload,
    },
    "ticket:updated": {
      payload: {} as TicketUpdatedSocketPayload,
    },
    join_denied: {
      payload: {} as { message: string },
    },
  },
} as const;

/**
 * GET /v1/support/dashboard/stats
 *
 * Réponse : SupportDashboardStats
 * `anomalies_today` compte les événements warning et critical depuis minuit.
 */
export const GET_SUPPORT_DASHBOARD_STATS = {
  method: "GET",
  path: "/v1/support/dashboard/stats",
  response: {} as SupportDashboardStats,
} as const;

/**
 * GET /v1/support/dashboard/recent
 *
 * Réponse : SupportDashboardRecent
 * - recent_tickets : au maximum 5 tickets open ou in_progress ;
 * - recent_anomalies : au maximum 3 événements warning ou critical.
 */
export const GET_SUPPORT_DASHBOARD_RECENT = {
  method: "GET",
  path: "/v1/support/dashboard/recent",
  response: {} as SupportDashboardRecent,
} as const;

/**
 * GET /v1/support/audit-log
 *
 * Réponse : Paginated<SupportAuditEvent>
 * Tri attendu : at décroissant.
 *
 * Le journal est append-only : aucun endpoint de modification ou suppression.
 * `date_from` et `date_to` utilisent le format YYYY-MM-DD.
 * `search` recherche dans l'acteur, l'action, le détail et la ressource.
 * `category` filtre par catégorie d'audit (ticket, compensation, sanction, escalation, chat, auth).
 * `action` filtre l'action métier exacte (plus précis que category).
 * `resource_type=ticket` limite le résultat aux actions liées aux réclamations.
 */
export const LIST_SUPPORT_AUDIT_LOG = {
  method: "GET",
  path: "/v1/support/audit-log",
  query: {} as AuditListQuery,
  response: {} as Paginated<SupportAuditEvent>,
} as const;

export const SUPPORT_ERROR_CODES = {
  TICKET_NOT_FOUND: 404,
  TICKET_ACCESS_DENIED: 403,
  TICKET_ALREADY_ASSIGNED: 409,
  TICKET_NOT_ASSIGNED: 409,
  TICKET_TERMINAL: 409,
  MESSAGE_CONTENT_INVALID: 422,
  SANCTION_REASON_INVALID: 422,
  SANCTION_TARGET_NOT_FOUND: 422,
  SANCTION_NOT_ALLOWED: 403,
  COMPENSATION_VALUE_INVALID: 422,
  PROMO_CODE_GENERATION_FAILED: 503,
  TRIP_NOT_FOUND: 404,
  CHAT_NOT_FOUND: 404,
  CHAT_ACCESS_DENIED: 403,
  CHAT_CLOSED: 409,
  CHAT_ALREADY_CLOSED: 409,
  CHAT_ATTACHMENT_TOO_LARGE: 413,
  CHAT_ATTACHMENT_TYPE_NOT_ALLOWED: 415,
} as const;

export type SupportErrorCode = keyof typeof SUPPORT_ERROR_CODES;

/**
 * Actions minimales à écrire dans le journal d'audit.
 * Le champ `action` d'un SupportAuditEvent utilise l'une de ces valeurs.
 */
export const SUPPORT_AUDIT_ACTIONS = [
  "ticket.assigned",
  "ticket.message_sent",
  "ticket.note_added",
  "ticket.justification_requested",
  "ticket.resolved",
  "ticket.closed",
  "ticket.escalated",
  "sanction.applied",
  "compensation.applied",
  "chat.message_sent",
] as const;

export type SupportAuditAction = (typeof SUPPORT_AUDIT_ACTIONS)[number];

/**
 * Le niveau est calculé par le backend, jamais envoyé par le frontend.
 *
 * info :
 * - prise en charge, réponse, note, justificatif, résolution, clôture ;
 * - avertissement.
 *
 * warning :
 * - escalade, geste commercial, mise sous surveillance, retrait de points.
 *
 * critical :
 * - suspension de compte.
 *
 * `metadata` contient le sous-type structuré utilisé par l'interface. Le champ
 * `detail` reste une description lisible et ne sert pas à calculer le niveau.
 */
export const SUPPORT_AUDIT_SEVERITY_RULES = {
  info: [
    "ticket.assigned",
    "ticket.message_sent",
    "ticket.note_added",
    "ticket.justification_requested",
    "ticket.resolved",
    "ticket.closed",
    "sanction.warning",
  ],
  warning: [
    "ticket.escalated",
    "compensation.applied",
    "sanction.surveillance",
    "sanction.quality_points",
  ],
  critical: ["sanction.suspension"],
} as const;
