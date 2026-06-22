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
  legal_form?: string | null;
  manager_first_name?: string | null;
  manager_last_name?: string | null;
  manager_display_name?: string | null;
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
  tradeName?: string;
  cityId: string;
  /** Login portail partenaire (canonique). */
  email: string;
  /** Mot de passe portail (min. 6 caractères). */
  password: string;
  /** Alias tolérés côté API — envoyés en plus pour compatibilité. */
  contactEmail?: string;
  contactPhone?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  /** Forme juridique : `INDIVIDUAL` | `COMPANY` (défaut API : INDIVIDUAL). */
  legalForm?: string;
  /** Gérant (personne morale uniquement) — ignoré côté API si INDIVIDUAL. */
  managerFirstName?: string;
  managerLastName?: string;
  partnerType?: string;
  commissionRate?: number;
  address?: string;
  status?: string;
}

export interface ApiPartnerUpdateBody {
  legalName: string;
  tradeName: string;
  cityId: string;
  contactEmail: string;
  contactPhone?: string;
  partnerType?: string;
  commissionRate?: number;
  address?: string;
  status?: string;
}

export interface ApiPartnerCreateResponse {
  status?: string;
  generatedAt?: string;
  partner?: ApiAdminPartnerItem;
  account?: {
    userId?: string;
    user_id?: string;
    loginEmail?: string;
    login_email?: string;
  };
  error?: { message?: string; code?: string };
}
