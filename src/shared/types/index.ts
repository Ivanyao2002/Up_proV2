export type Scope = "platform" | "franchise" | "owner";

export type PortalRole = "admin" | "partner" | "franchise" | "dispatch";

export interface User {
  id: number;
  name: string;
  email: string;
  role: PortalRole;
  scope: Scope;
  franchise_id?: number;
  owner_id?: number;
  permissions: string[];
}

export interface AuthSession {
  token: string;
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
}

export interface TripTimelineEvent {
  id: string;
  type: TripStatus | "matching";
  label: string;
  description?: string;
  at: string;
}

export interface TripDetail extends Trip {
  from_coords?: { lat: number; lng: number };
  to_coords?: { lat: number; lng: number };
  client_phone?: string;
  driver_id?: number;
  driver_phone?: string;
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
  id: number;
  name: string;
  franchise_name: string;
  franchise_id: number;
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
  owner_id: number | null;
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
  zones: { id: number; name: string; type: Zone["type"]; drivers_active: number }[];
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
  franchise_id: number;
  status: "active" | "inactive";
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
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  rating: number;
  zone: string;
  owner_name?: string;
  vehicle_label?: string;
  account_status: "pending" | "approved" | "suspended" | "banned";
  availability: "offline" | "online" | "on_trip" | "paused";
  franchise_id?: number;
  owner_id?: number;
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
  type: "registered" | "kyc" | "approved" | "suspended" | "trip";
  label: string;
  description?: string;
  at: string;
}

export interface DriverDetail extends Driver {
  email?: string;
  owner_id?: number;
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
  driver_id: number;
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
  id: number;
  name: string;
  city: string;
  franchise_name: string;
  type: "standard" | "surge" | "airport";
  drivers_active: number;
  surge_multiplier?: number;
}

export type TripService = Trip["service"];

export interface LiveMapDriver {
  id: number;
  name: string;
  lat: number;
  lng: number;
  availability: Driver["availability"];
  vehicle: string;
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
  zone_ids: number[];
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
  active_zone_ids: number[];
  updated_at: string;
}

export interface DashboardAdminKpi {
  net_profit_today_fcfa: number;
  net_profit_trend_pct: number;
  trips_completed_today: number;
  trips_cancelled_today: number;
  drivers_approved: number;
  drivers_pending_kyc: number;
  users_registered: number;
  chart_flux: { day: string; revenue: number; commission: number }[];
  recent_trips: Trip[];
  active_zone: { name: string; trips_24h: number; drivers_online: number };
}
