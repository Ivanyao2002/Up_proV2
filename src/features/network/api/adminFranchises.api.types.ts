  import type { ApiV1Pagination } from "@/core/api/v1Pagination";
import type { ApiLiveMapOrderBase } from "@/features/ops/api/liveMap.api.types";
import type { ApiAdminPartnerItem } from "./adminPartners.api.types";

export interface ApiV1FranchiseItem {
  id: string;
  code?: string | null;
  name?: string | null;
  legal_name?: string | null;
  currency?: string | null;
  timezone?: string | null;
  status?: string | null;
  support_email?: string | null;
  support_phone?: string | null;
  country_id?: string | null;
  operating_country_id?: string | null;
  city?: string | null;
  cityLabel?: string | null;
  partnersCount?: number;
  driversCount?: number;
  zonesCount?: number;
  revenueMonthXof?: number;
  created_at?: string | null;
  updated_at?: string | null;
  metadata?: {
    cityId?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    createdFrom?: string | null;
    [key: string]: unknown;
  } | null;
}

export interface ApiAdminFranchisesListResponse {
  status: string;
  generatedAt?: string;
  items?: ApiV1FranchiseItem[];
  pagination?: ApiV1Pagination;
}

export interface ApiV1FranchiseDetailResponse {
  status: string;
  generatedAt?: string;
  franchise: ApiV1FranchiseItem;
}

export interface ApiV1FranchisePartnersResponse {
  status: string;
  items?: ApiAdminPartnerItem[];
  pagination?: ApiV1Pagination;
}

export interface ApiV1DriverFilterOptions {
  franchises?: { id: string; name: string; city?: string; cityLabel?: string }[];
  partners?: { id: string; name: string; franchiseId?: string }[];
  cities?: { id: string; name: string; slug: string; countryId: string }[];
  complianceStatuses?: { value: string; label: string }[];
  documentTypes?: { code: string; label: string }[];
}

export interface ApiV1FranchiseDriversResponse {
  status: string;
  items?: { id: string }[];
  pagination?: ApiV1Pagination;
  filterOptions?: ApiV1DriverFilterOptions;
}

export interface ApiV1FranchiseRevenueResponse {
  status: string;
  revenue?: {
    totalXof?: number;
    ordersCount?: number;
  };
}

/** GET /v1/franchises/{id}/orders */
export interface ApiV1FranchiseOrdersResponse {
  status?: string;
  generatedAt?: string;
  orders?: ApiLiveMapOrderBase[];
  pagination?: ApiV1Pagination;
}

export interface ApiDashboardFranchiseOption {
  id: string;
  name?: string | null;
  city?: string | null;
}

export interface ApiAdminFranchiseCreateBody {
  name: string;
  cityId: string;
  contactEmail: string;
  contactPhone: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
  status?: string;
  countryCode?: string;
}

export interface ApiAdminFranchiseCreateResponse {
  status?: string;
  franchiseId?: string;
  franchise?: ApiV1FranchiseItem;
  memberId?: string;
  portalLoginEmail?: string;
  error?: { message?: string; code?: string };
}

export interface ApiAdminFranchiseUpdateBody {
  name: string;
  cityId: string;
  contactEmail: string;
  contactPhone: string;
  status?: string;
}
