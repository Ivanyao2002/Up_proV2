import type { ApiV1Pagination } from "@/core/api/v1Pagination";

export interface ApiV1VehicleItem {
  id: string;
  partner_id?: string | null;
  driver_id?: string | null;
  brand_id?: string | null;
  model_id?: string | null;
  color_id?: string | null;
  category_id?: string | null;
  plate_number?: string | null;
  vin?: string | null;
  manufacture_year?: number | null;
  seats_count?: number | null;
  max_weight_kg?: number | null;
  status?: string | null;
  approved_at?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  /** Champs inline enrichis par le backend (franchise + admin v2) */
  brandLabel?: string | null;
  modelLabel?: string | null;
  categoryCode?: string | null;
  partnerName?: string | null;
  partner_name?: string | null;
  label?: string | null;
  brand?: { id: string; code: string; label: string; hex?: string | null } | null;
  model?: { id: string; code: string; label: string; hex?: string | null } | null;
  color?: { id: string; code: string; label: string; hex?: string | null } | null;
  category?: { id: string; code: string; label: string; hex?: string | null } | null;
  partner?: { id: string; tradeName?: string | null; trade_name?: string | null } | null;
  driver?: {
    id: string;
    driverCode?: string | null;
    driver_code?: string | null;
    displayName?: string | null;
    profile?: { firstName?: string | null; lastName?: string | null; displayName?: string | null } | null;
    kycStatus?: string | null;
    kyc_status?: string | null;
    approvalStatus?: string | null;
    approval_status?: string | null;
    availabilityStatus?: string | null;
    availability_status?: string | null;
  } | null;
  driverSummary?: { hasAssignedDriver: boolean; driverId: string | null } | null;
  documentsSummary?: {
    requiredCount: number;
    uploadedCount: number;
    approvedCount: number;
    pendingCount: number;
    rejectedCount: number;
    missingCount: number;
    missingTypes: string[];
    isComplete: boolean;
    hasAnyDocument: boolean;
  } | null;
  complianceStatus?: string | null;
  documents?: Array<{
    id: string;
    subject_type?: string;
    subject_id?: string;
    document_type_code?: string | null;
    document_type_label?: string | null;
    document_side?: string | null;
    document_group?: string | null;
    file_url?: string | null;
    file_urls?: string[];
    file_download_url?: string | null;
    status?: string | null;
    expires_at?: string | null;
    submitted_at?: string | null;
    uploaded_at?: string | null;
    reviewed_by?: string | null;
    reviewed_at?: string | null;
    rejection_reason?: string | null;
    reviewed_by_name?: string | null;
    upload_id?: string | null;
  }> | null;
}

export interface ApiAdminVehiclesListResponse {
  status?: string;
  items?: ApiV1VehicleItem[];
  pagination?: ApiV1Pagination;
}

export interface ApiV1VehicleCreateBody {
  partnerId: string;
  categoryCode: string;
  brandCode: string;
  modelCode: string;
  colorCode: string;
  manufactureYear: number;
  plateNumber?: string;
  seatsCount?: number;
}

export interface ApiV1VehicleCreateResponse {
  status?: string;
  vehicle?: ApiV1VehicleItem;
}

export interface ApiCatalogVehicleCategory {
  id: string;
  code: string;
  label: string;
  active?: boolean;
}

export interface ApiCatalogVehicleBrand {
  id: string;
  code: string;
  label: string;
  active?: boolean;
}

export interface ApiCatalogVehicleModel {
  id: string;
  code: string;
  label: string;
  brand_id?: string;
  year_from?: number | null;
  year_to?: number | null;
  active?: boolean;
}

export interface ApiCatalogVehicleColor {
  id: string;
  code: string;
  label: string;
  hex?: string;
  active?: boolean;
}

export interface ApiCatalogListResponse<T> {
  status?: string;
  items?: T[];
}

export interface ApiCatalogBrandModelsResponse {
  status?: string;
  brand?: ApiCatalogVehicleBrand;
  items?: ApiCatalogVehicleModel[];
}
