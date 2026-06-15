import type { ApiV1Pagination } from "@/core/api/v1Pagination";

/** GET /v1/admin/partners */

export interface ApiAdminPartnerStats {
  partner_type?: string | null;
  revenue_xof?: number | null;
  trips_count?: number | null;
  wallet_balance_xof?: number | null;
  vehicles_count?: number | null;
  drivers_count?: number | null;
}

export interface ApiAdminPartnerItem {
  id: string;
  franchise_id?: string | null;
  legal_name?: string | null;
  trade_name?: string | null;
  name?: string | null;
  franchiseName?: string | null;
  cityLabel?: string | null;
  driversCount?: number | null;
  partner_type?: string | null;
  city_id?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  commission_rate?: number | null;
  address?: string | null;
  wallet_id?: string | null;
  owner_user_id?: string | null;
  registration_number?: string | null;
  tax_id?: string | null;
  vehicles_count?: number | null;
  vehiclesCount?: number | null;
  status?: string | null;
  metadata?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  stats?: ApiAdminPartnerStats;
  created_at?: string;
  updated_at?: string;
}

export interface ApiAdminPartnersResponse {
  status: string;
  generatedAt?: string;
  items?: ApiAdminPartnerItem[];
  pagination?: ApiV1Pagination;
}

/** POST /v1/partners */
export interface ApiPartnerCreateBody {
  franchiseId: string;
  legalName: string;
  tradeName: string;
  cityId: string;
  contactEmail: string;
  contactPhone?: string;
  partnerType?: string;
  address?: string;
  status?: string;
}

export interface ApiPartnerCreateResponse {
  status?: string;
  generatedAt?: string;
  partner?: ApiAdminPartnerItem;
  error?: { message?: string; code?: string };
}

/** PATCH /v1/partners/{id} */
export interface ApiPartnerUpdateBody {
  legalName: string;
  tradeName: string;
  cityId: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  status?: string;
}
