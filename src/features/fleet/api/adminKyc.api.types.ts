/** GET /v1/admin/kyc/documents */

export interface ApiAdminKycDocumentItem {
  id: string;
  subject_type?: string;
  subject_id?: string;
  document_type_code?: string;
  document_type_label?: string | null;
  file_url?: string | null;
  file_download_url?: string | null;
  file_urls?: string[];
  file_id?: string | null;
  status?: string;
  submitted_at?: string;
  uploaded_at?: string;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ApiAdminKycDocumentsResponse {
  status: string;
  generatedAt?: string;
  items?: ApiAdminKycDocumentItem[];
}

/** GET /v1/admin/kyc/queue — 1 ligne / chauffeur */
export interface ApiAdminKycQueueItem {
  driverId: string;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  zoneName?: string | null;
  partnerName?: string | null;
  documentsPending?: number;
  documentsRejected?: number;
  submittedAt?: string | null;
  waitingHours?: number;
}

export interface ApiAdminKycQueueResponse {
  status: string;
  generatedAt?: string;
  items?: ApiAdminKycQueueItem[];
  pagination?: import("@/core/api/v1Pagination").ApiV1Pagination;
}
