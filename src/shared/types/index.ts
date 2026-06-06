export type Scope = "platform" | "franchise" | "owner";

export type PortalRole = "admin" | "partner" | "franchise" | "dispatch";

export interface User {
  id: string | number;
  name: string;
  email: string;
  role: PortalRole;
  scope: Scope;
  franchise_id?: number | string;
  owner_id?: number | string;
  /** Comptes dispatch — zones autorisées */
  zone_ids?: number[];
  zone_names?: string[];
  permissions: string[];
}

export interface AuthSession {
  token: string;
  /** `session.refresh_token` du login v1 — renouvellement via POST /v1/auth/refresh */
  refreshToken?: string | null;
  user: User;
}

export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

export type TripStatus =
  | "requested"
  | "matching"
  | "assigned"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Trip {
  id: string;
  ref: string;
  service: "taxi" | "delivery" | "rental" | "freight";
  from_label: string;
  to_label: string;
  client_name: string;
  driver_name?: string;
  amount_fcfa: number;
  status: TripStatus;
  payment_method: "cash" | "wallet" | "card" | "orange_money";
  created_at: string;
  franchise_id?: number | string;
  franchise_name?: string;
  partner_id?: number | string;
  partner_name?: string;
}

export type TripsScopeFilterOptions = NonNullable<LiveMapData["filter_options"]>;

export interface TripsListResponse extends Paginated<Trip> {
  filter_options: TripsScopeFilterOptions;
}

export type TripMatchingOutcome = "declined" | "no_response" | "accepted";

export interface TripMatchingDriver {
  driver_id: string | number;
  driver_name: string;
  outcome: TripMatchingOutcome;
  /** Raison affichée si refus ou pas de réponse */
  reason?: string;
}

export interface TripTimelineEvent {
  id: string;
  type: TripStatus | "matching";
  label: string;
  description?: string;
  at: string;
  /** Chauffeurs contactés pendant la recherche (détail par nom + issue) */
  matching_drivers?: TripMatchingDriver[];
}

export interface TripDriverLocation {
  lat: number;
  lng: number;
  heading?: number;
  speed_kmh?: number;
  recorded_at?: string;
}

export interface TripDetail extends Trip {
  from_coords?: { lat: number; lng: number };
  to_coords?: { lat: number; lng: number };
  client_phone?: string;
  driver_id?: string | number;
  driver_phone?: string;
  vehicle_id?: string;
  vehicle_label?: string;
  vehicle_plate?: string;
  driver_location?: TripDriverLocation;
  commission_fcfa: number;
  driver_earning_fcfa: number;
  zone_name?: string;
  franchise_name?: string;
  estimated_arrival_at?: string;
  timeline: TripTimelineEvent[];
}

export interface Franchise {
  id: number;
  name: string;
  city: string;
  status: "active" | "pending" | "suspended";
  partners_count: number;
  drivers_count: number;
  zones_count: number;
  revenue_month_fcfa: number;
}

export interface Partner {
  id: number | string;
  name: string;
  franchise_name: string;
  franchise_id: number | string;
  city: string;
  drivers_count: number;
  status: "active" | "pending" | "suspended";
  contact_email: string;
  contact_phone: string;
}

export type TransactionType =
  | "trip_payment"
  | "commission"
  | "withdrawal"
  | "refund"
  | "payout";

export type TransactionStatus = "completed" | "pending" | "failed";

export interface Transaction {
  id: string;
  type: TransactionType;
  label: string;
  entity_type: string;
  entity_ref: string;
  amount_fcfa: number;
  direction: "credit" | "debit";
  status: TransactionStatus;
  payment_method: Trip["payment_method"];
  franchise_name: string;
  created_at: string;
}

export interface TransactionsResponse extends Paginated<Transaction> {
  summary: {
    volume_today_fcfa: number;
    credits_today_fcfa: number;
    debits_today_fcfa: number;
  };
}

export type WithdrawalStatus = "pending" | "approved" | "rejected";

export interface Withdrawal {
  id: string;
  owner_name: string;
  owner_id: number | string | null;
  driver_id?: number;
  franchise_name: string;
  amount_fcfa: number;
  method: "orange_money" | "bank_transfer" | "wallet";
  account_label: string;
  status: WithdrawalStatus;
  requested_at: string;
  processed_at?: string;
  wallet_balance_fcfa: number;
}

export interface WithdrawalsResponse extends Paginated<Withdrawal> {
  summary: {
    pending_count: number;
    pending_amount_fcfa: number;
  };
}

export interface FranchiseDetail extends Franchise {
  contact_email: string;
  contact_phone: string;
  created_at: string;
  stats: {
    partners_count: number;
    drivers_count: number;
    zones_count: number;
    trips_month: number;
    revenue_month_fcfa: number;
    commission_month_fcfa: number;
  };
  partners: { id: number; name: string; drivers_count: number; status: string }[];
  zones: {
    id: number | string;
    name: string;
    type: Zone["type"];
    drivers_active: number;
  }[];
  recent_transactions: {
    id: string;
    label: string;
    amount_fcfa: number;
    created_at: string;
  }[];
}

export interface PartnerDetail extends Partner {
  address: string;
  created_at: string;
  stats: {
    drivers_count: number;
    drivers_online: number;
    trips_month: number;
    revenue_month_fcfa: number;
    wallet_balance_fcfa: number;
    pending_withdrawal_fcfa: number;
  };
  drivers: {
    id: number;
    name: string;
    availability: Driver["availability"];
    rating: number;
  }[];
  recent_trips: {
    id: string;
    ref: string;
    amount_fcfa: number;
    status: TripStatus;
    created_at: string;
  }[];
}

export interface ZoneDetail extends Zone {
  franchise_id: number | string;
  status: "active" | "inactive";
  center_lng?: number;
  center_lat?: number;
  stats: {
    drivers_active: number;
    drivers_total: number;
    trips_24h: number;
    trips_month: number;
    revenue_month_fcfa: number;
    avg_fare_fcfa: number;
  };
  polygon_geojson?: {
    type: "Polygon";
    coordinates: number[][][];
  };
  surge_rules: { label: string; multiplier: number; hours: string }[];
  partners_in_zone: { id: number; name: string; drivers_count: number }[];
}

export interface Driver {
  id: string | number;
  first_name: string;
  last_name: string;
  phone: string;
  rating: number;
  zone: string;
  owner_name?: string;
  vehicle_label?: string;
  account_status: "pending" | "approved" | "suspended" | "banned";
  availability: "offline" | "online" | "on_trip" | "paused";
  franchise_id?: number | string;
  owner_id?: number | string;
}

export type KycDocumentStatus = "pending" | "approved" | "rejected";

export interface KycDocument {
  id: string;
  type: "cni" | "license" | "registration" | "selfie";
  label: string;
  status: KycDocumentStatus;
  status_note?: string;
  uploaded_at: string;
  reviewed_at: string | null;
  preview_url?: string;
}

export interface DriverTimelineEvent {
  id: string;
  type:
    | "registered"
    | "kyc"
    | "approved"
    | "suspended"
    | "trip"
    | "trip_offer_declined"
    | "trip_offer_accepted";
  label: string;
  description?: string;
  at: string;
  trip_id?: string;
  trip_ref?: string;
}

export interface DriverDetail extends Driver {
  driver_code?: string;
  email?: string;
  owner_id?: number | string;
  registered_at: string;
  approved_at: string | null;
  stats: {
    trips_total: number;
    trips_completed: number;
    trips_cancelled: number;
    acceptance_rate_pct: number;
    wallet_balance_fcfa: number;
  };
  timeline: DriverTimelineEvent[];
  kyc_documents: KycDocument[];
}

export interface KycQueueItem {
  driver_id: number | string;
  first_name: string;
  last_name: string;
  phone: string;
  zone: string;
  owner_name: string;
  documents_pending: number;
  documents_rejected: number;
  submitted_at: string;
  waiting_hours: number;
}

export interface Zone {
  id: number | string;
  name: string;
  city: string;
  franchise_name: string;
  type: "standard" | "surge" | "airport";
  drivers_active: number;
  surge_multiplier?: number;
}

export type TripService = Trip["service"];

export interface LiveMapActiveTrip {
  id: string;
  ref: string;
  from_label: string;
  to_label: string;
  status: string;
  status_label: string;
  amount_fcfa?: number;
  client_name?: string;
  driver_id?: string;
}

export interface LiveMapOrderMarker {
  id: string;
  order_id: string;
  lat: number;
  lng: number;
  kind: "pickup" | "dropoff";
  status: string;
  status_label: string;
  label: string;
  ref: string;
  driver_id?: string;
  amount_fcfa?: number;
}

/** Segments pickup → dropoff pour tracés Mapbox */
export interface LiveMapTripRoute {
  order_id: string;
  ref: string;
  status_label: string;
  coordinates: [number, number][];
}

export interface LiveMapDriver {
  id: string | number;
  name: string;
  lat: number;
  lng: number;
  /** Cap véhicule (degrés) — temps réel socket */
  heading?: number;
  speed_kmh?: number;
  availability: Driver["availability"];
  vehicle: string;
  franchise_id?: number | string;
  franchise_name?: string;
  partner_id?: number | string;
  partner_name?: string;
  zone_name?: string;
  /** Course en cours liée (chauffeur en course) */
  active_trip?: LiveMapActiveTrip;
}

export type LiveMapScope = "global" | "franchise" | "partner";

export interface LiveMapFilterFranchise {
  id: number | string;
  name: string;
  city: string;
}

export interface LiveMapFilterPartner {
  id: number | string;
  name: string;
  franchise_id: number | string;
  franchise_name: string;
  city: string;
}

export interface DispatchDriverCandidate {
  id: number;
  name: string;
  vehicle: string;
  availability: Driver["availability"];
  rating: number;
  distance_km: number;
  eta_min: number;
  lat: number;
  lng: number;
}

export interface DispatchQueueItem {
  trip: Trip;
  from_coords: { lat: number; lng: number };
  to_coords?: { lat: number; lng: number };
  zone_name?: string;
  waiting_min: number;
  candidates: DispatchDriverCandidate[];
}

export interface DispatchConsoleData {
  stats: {
    queue_size: number;
    online_nearby: number;
    avg_wait_min: number;
  };
  queue: DispatchQueueItem[];
  map: Pick<LiveMapData, "bounds" | "zone_name" | "city">;
  filter_options?: TripsScopeFilterOptions;
  active_filter?: {
    franchise_id: number | null;
    partner_id: number | null;
  };
}

export interface RolePermissionGroup {
  module: string;
  permissions: { key: string; label: string; enabled: boolean }[];
}

export interface AdminRole {
  id: number;
  name: string;
  slug: string;
  description: string;
  users_count: number;
  is_system: boolean;
  permission_groups: RolePermissionGroup[];
}

export interface FranchiseTerritoryZone {
  id: number;
  name: string;
  type: Zone["type"];
  drivers_active: number;
  partners_count: number;
  polygon_geojson?: ZoneDetail["polygon_geojson"];
}

export interface FranchiseTerritory {
  franchise_name: string;
  city: string;
  stats: {
    zones_count: number;
    partners_count: number;
    drivers_count: number;
    area_km2: number;
  };
  zones: FranchiseTerritoryZone[];
}

export interface PricingRule {
  id: number;
  franchise_id: number;
  franchise_name: string;
  zone_name: string;
  service: Trip["service"];
  base_fare_fcfa: number;
  per_km_fcfa: number;
  min_fare_fcfa: number;
  surge_multiplier: number;
  status: "active" | "draft";
}

export interface LiveMapData {
  zone_name: string;
  city: string;
  scope?: LiveMapScope;
  stats: {
    drivers_online: number;
    drivers_on_trip: number;
    active_trips: number;
    avg_wait_min: number;
  };
  bounds: {
    lat_min: number;
    lat_max: number;
    lng_min: number;
    lng_max: number;
  };
  drivers: LiveMapDriver[];
  /** Points commandes (pickup / dropoff) — affichés sur Mapbox */
  order_markers?: LiveMapOrderMarker[];
  /** Tracés course (pickup → dropoff) */
  trip_routes?: LiveMapTripRoute[];
  filter_options?: {
    franchises: LiveMapFilterFranchise[];
    partners: LiveMapFilterPartner[];
  };
  active_filter?: {
    franchise_id: number | null;
    partner_id: number | null;
  };
  /** Résumé par franchise (vue mondiale) */
  franchise_summary?: {
    franchise_id: number;
    franchise_name: string;
    drivers_visible: number;
    drivers_active: number;
  }[];
  /** Config Socket.IO (meta.realtime) — absent en mode mock legacy */
  realtime?: LiveMapRealtimeConfig | null;
}

/** Zone chaude — GET /v1/geo/hot-zones (carte live) */
export interface LiveMapHotZone {
  id: string;
  name: string;
  lng: number;
  lat: number;
  heatLevel: number;
  surge?: number;
  franchise_id?: string | null;
  city?: string;
}

/** meta.realtime — GET /v1/admin/live-map */
export interface LiveMapRealtimeConfig {
  transport?: string;
  url: string;
  room?: string;
  event: string;
  batchIntervalMs?: number;
  joinPayload?: { room: string };
  clientOptions?: {
    reconnection?: boolean;
    reconnectionAttempts?: number | null;
    reconnectionDelay?: number;
    reconnectionDelayMax?: number;
    timeout?: number;
    transports?: ("websocket" | "polling")[];
  };
}

export interface DashboardPartnerKpi {
  fleet_name: string;
  trips_today: number;
  trips_completed_today: number;
  trips_cancelled_today: number;
  drivers_total: number;
  drivers_online: number;
  drivers_pending_kyc: number;
  revenue_today_fcfa: number;
  revenue_trend_pct: number;
  wallet_balance_fcfa: number;
  pending_withdrawal_fcfa: number;
  chart_flux: { day: string; revenue: number; trips: number }[];
  recent_trips: Pick<
    Trip,
    "id" | "ref" | "from_label" | "to_label" | "driver_name" | "amount_fcfa" | "status" | "created_at"
  >[];
}

export type VehicleApprovalStatus = "draft" | "pending" | "approved" | "rejected";

export type VehicleCategory = "taxi" | "delivery" | "van" | "premium";

export interface Vehicle {
  id: number;
  label: string;
  plate: string;
  category: VehicleCategory;
  year: number;
  color: string;
  driver_name?: string | null;
  approval_status: VehicleApprovalStatus;
  created_at: string;
}

export interface VehicleDetail extends Vehicle {
  brand: string;
  model: string;
  seats: number;
  owner_id: number;
  registration_document: KycDocument;
  approved_at?: string | null;
}

export interface PartnerProfile {
  id: number;
  company_name: string;
  legal_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  franchise_name: string;
  rccm: string;
  status: "active" | "pending" | "suspended";
  notification_email: string;
  created_at: string;
}

export interface PartnerWallet {
  balance_fcfa: number;
  pending_withdrawal_fcfa: number;
  available_fcfa: number;
  last_withdrawal?: {
    id: string;
    amount_fcfa: number;
    status: string;
    processed_at: string;
  };
  recent_movements: {
    id: string;
    label: string;
    amount_fcfa: number;
    direction: "credit" | "debit";
    created_at: string;
  }[];
}

/** Transfert partenaire → solde app mobile chauffeur */
export type PartnerDriverTransferStatus = "completed" | "pending" | "failed";

export interface PartnerDriverTransfer {
  id: string;
  ref: string;
  driver_id: string | number;
  driver_name: string;
  driver_phone: string;
  amount_fcfa: number;
  status: PartnerDriverTransferStatus;
  /** Crédité sur le wallet mobile chauffeur */
  mobile_wallet_credited: boolean;
  note?: string;
  created_at: string;
}

export interface PartnerDriverRechargeStats {
  total_spent_fcfa: number;
  transfers_count: number;
  month_spent_fcfa: number;
  month_transfers_count: number;
  last_transfer_at?: string;
}

/** Recharge portefeuille partenaire — vue franchise */
export interface FranchisePartnerTransfer {
  id: string;
  ref: string;
  partner_id: number;
  partner_name: string;
  amount_fcfa: number;
  status: PartnerDriverTransferStatus;
  note?: string;
  created_at: string;
}

/** Recharge chauffeur — vue plateforme (admin) */
export interface PlatformDriverTransfer extends PartnerDriverTransfer {
  owner_name: string;
  source: "partner" | "franchise";
}

export interface PlatformDriverRechargeStats extends PartnerDriverRechargeStats {
  partners_count: number;
  franchises_count: number;
}

export type DispatcherStatus = "active" | "suspended";

export interface DispatcherPermissions {
  assign_trips: boolean;
  view_live_map: boolean;
}

export interface DispatcherAccount {
  id: number;
  name: string;
  email: string;
  phone: string;
  franchise_id?: number;
  franchise_name?: string;
  zone_ids: Array<number | string>;
  zone_names?: string[];
  status: DispatcherStatus;
  last_login_at?: string | null;
}

export interface DispatcherAccountDetail extends DispatcherAccount {
  shift_label?: string;
  permissions: DispatcherPermissions;
}

export type DispatchPriorityMode = "distance" | "rating" | "balanced";

export interface DispatchRules {
  match_radius_km: number;
  assign_timeout_sec: number;
  max_queue_size: number;
  priority_mode: DispatchPriorityMode;
  auto_reassign: boolean;
  active_zone_ids: Array<number | string>;
  updated_at: string;
}

export interface DashboardAdminFranchiseOption {
  id: number | string;
  name: string;
  city: string;
}

export interface DashboardAdminAlert {
  code: string;
  severity: "info" | "warning" | "critical";
  count: number;
  label: string;
  href: string;
}

export interface DashboardAdminKpi {
  selected_franchise_id: number | null;
  franchise_options: DashboardAdminFranchiseOption[];
  net_profit_today_fcfa: number;
  net_profit_trend_pct: number;
  /** Nombre total de courses du jour (terminées + annulées + en cours) */
  trips_today: number;
  trips_today_trend_pct: number;
  trips_completed_today: number;
  trips_in_progress_today: number;
  trips_cancelled_today: number;
  drivers_approved: number;
  drivers_total: number;
  drivers_pending_kyc: number;
  users_registered: number;
  /** Clients distincts ayant passé au moins une commande aujourd'hui */
  clients_ordered_today: number;
  chart_flux: { day: string; revenue: number; commission: number }[];
  recent_trips: Trip[];
  active_zone: {
    franchise_id: number;
    franchise_name: string;
    partner_id: number;
    partner_name: string;
    zone_id: number;
    zone_name: string;
    city: string;
    trips_24h: number;
    drivers_online: number;
  };
  franchise_activity: {
    franchise_id: number;
    franchise_name: string;
    city: string;
    drivers_online: number;
    trips_24h: number;
    top_partner_name: string;
    top_zone_name: string;
  }[];
  /** Alertes opérationnelles (API v1 — `dashboard.alerts`) */
  alerts?: DashboardAdminAlert[];
}

export type FinanceAlertSeverity = "info" | "warning" | "critical";

export interface AdminFinanceDashboard {
  selected_franchise_id: number | null;
  franchise_options: DashboardAdminFranchiseOption[];
  gmv_today_fcfa: number;
  gmv_today_trend_pct: number;
  gmv_month_fcfa: number;
  gmv_month_trend_pct: number;
  net_margin_month_fcfa: number;
  net_margin_trend_pct: number;
  commissions_month_fcfa: number;
  commissions_trend_pct: number;
  platform_treasury_fcfa: number;
  withdrawals_pending_fcfa: number;
  withdrawals_pending_count: number;
  avg_trip_fcfa: number;
  collection_rate_pct: number;
  reconciliation_gap_fcfa: number;
  reconciliation_items_open: number;
  driver_wallets_total_fcfa: number;
  partner_wallets_total_fcfa: number;
  client_wallets_total_fcfa: number;
  take_rate_pct: number;
  chart_weekly: {
    day: string;
    gmv: number;
    commissions: number;
    payouts: number;
  }[];
  by_franchise: {
    franchise_id: number;
    franchise_name: string;
    city: string;
    gmv_month_fcfa: number;
    margin_fcfa: number;
    share_pct: number;
  }[];
  payment_mix: {
    method: string;
    label: string;
    amount_fcfa: number;
    share_pct: number;
  }[];
  alerts: {
    id: string;
    severity: FinanceAlertSeverity;
    title: string;
    description: string;
    href?: string;
  }[];
  recent_movements: {
    id: string;
    label: string;
    amount_fcfa: number;
    direction: "credit" | "debit";
    category: string;
    created_at: string;
  }[];
}
