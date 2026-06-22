/** GET /v1/drivers/:id — fiche chauffeur (viewer admin) */

import type { ApiAdminKycDocumentItem } from "./adminKyc.api.types";

export interface ApiV1DriverDetailResponse {
  status: string;
  generatedAt?: string;
  viewerRole?: string;
  driver: ApiV1DriverRecord;
  profile?: ApiV1DriverProfile | null;
  vehicle?: ApiV1DriverVehicle | null;
  vehicles?: ApiV1DriverVehicle[];
  location?: ApiV1DriverLocation | null;
  partner?: ApiV1DriverPartner | null;
  partnerName?: string | null;
  city?: ApiV1DriverCity | null;
  zoneName?: string | null;
  vehicleLabel?: string | null;
  performance?: ApiV1DriverPerformance | null;
  summary?: ApiV1DriverSummary | null;
  preferences?: Record<string, unknown> | null;
  serviceClasses?: unknown[];
  /** KYC-03 — documents embarqués (juin 2026) */
  kyc_documents?: ApiAdminKycDocumentItem[];
  kycDocuments?: ApiAdminKycDocumentItem[];
}

export interface ApiV1DriverRecord {
  id: string;
  user_id?: string;
  partner_id?: string | null;
  franchise_id?: string | null;
  city_id?: string | null;
  driver_code?: string | null;
  onboarding_status?: string;
  availability_status?: string;
  kyc_status?: string;
  approval_status?: string;
  ride_category_code?: string | null;
  wallet_id?: string | null;
  current_vehicle_id?: string | null;
  rating_avg?: number | null;
  rating_count?: number;
  cancellation_rate?: number | null;
  reliability_score?: number | null;
  total_completed_orders?: number;
  accepts_cash?: boolean;
  accepts_wallet?: boolean;
  last_online_at?: string | null;
  metadata?: Record<string, unknown>;
  bonus_week_start_dow?: number | null;
  bonusWeekStartDow?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface ApiV1DriverProfile {
  id?: string;
  displayName?: string;
  display_name?: string;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  avatarUrl?: string | null;
  photo_url?: string | null;
  phone?: string | null;
  email?: string | null;
  locale?: string;
  cityId?: string;
}

export interface ApiV1DriverVehicle {
  id?: string;
  plateNumber?: string | null;
  plate?: string | null;
  licensePlate?: string | null;
  license_plate?: string | null;
  model?: string | null;
  status?: string;
}

export interface ApiV1DriverLocation {
  latitude?: number;
  longitude?: number;
  heading?: number | null;
  speedKmh?: number | null;
  recordedAt?: string;
}

export interface ApiV1DriverPartner {
  id?: string;
  tradeName?: string;
  trade_name?: string;
  partnerType?: string;
  status?: string;
}

export interface ApiV1DriverCity {
  id?: string;
  name?: string;
  label?: string;
  slug?: string;
}

export interface ApiV1DriverPerformance {
  ratingAvg?: number;
  ratingCount?: number;
  cancellationRate?: number | null;
  reliabilityScore?: number | null;
  totalCompletedOrders?: number;
}

export interface ApiV1DriverSummary {
  driverCode?: string;
  name?: string;
  displayName?: string;
  phone?: string;
  rating?: number;
  ratingAvg?: number;
  vehicle?: {
    id?: string;
    model?: string | null;
    plate?: string | null;
    licensePlate?: string | null;
    license_plate?: string | null;
    brandCode?: string | null;
    colorCode?: string | null;
    categoryCode?: string | null;
    year?: number | null;
  } | null;
}
