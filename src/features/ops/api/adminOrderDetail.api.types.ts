/** GET /v1/admin/orders/:orderId — détail course admin (Swagger § 10 - Admin) */

import type { ApiLiveMapOrderBase } from "./liveMap.api.types";

export interface ApiAdminOrderEvent {
  id: string;
  service_type?: string;
  order_id?: string;
  actor_user_id?: string | null;
  event_type: string;
  old_status?: string | null;
  new_status?: string | null;
  payload?: Record<string, unknown>;
  created_at: string;
}

export interface ApiAdminOrderTimelineStep {
  status: string;
  at?: string | null;
  done?: boolean;
  current?: boolean;
}

export interface ApiAdminOrderTimeline {
  current?: string;
  steps?: ApiAdminOrderTimelineStep[];
  statusChain?: string[];
}

export interface ApiAdminOrderDispatchOffer {
  driverId?: string;
  userId?: string;
  offerId?: string;
  status?: string;
  ratingAvg?: number;
  distanceKm?: number;
  rideCategoryCode?: string;
}

export interface ApiAdminOrderDetailPayload {
  serviceType?: string;
  orderId?: string;
  ride?: ApiLiveMapOrderBase;
  ref?: string | null;
  clientName?: string | null;
  clientPhone?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  amountXof?: number | null;
  commissionXof?: number | null;
  driverEarningXof?: number | null;
  events?: ApiAdminOrderEvent[];
  timeline?: ApiAdminOrderTimeline;
  dispatch?: {
    orderId?: string;
    serviceType?: string;
    status?: string;
    dispatch?: {
      offers?: ApiAdminOrderDispatchOffer[];
      candidates?: ApiAdminOrderDispatchOffer[];
      status?: string;
    };
  };
  driver?: { id?: string; displayName?: string | null; phone?: string | null } | null;
  partnerName?: string | null;
  franchiseName?: string | null;
  driverSummary?: Record<string, unknown> | null;
  profile?: Record<string, unknown> | null;
  receipt?: Record<string, unknown> | null;
  tracking?: Record<string, unknown> | null;
  pricing?: Record<string, unknown> | null;
}

export interface ApiAdminOrderDetailResponse {
  status: string;
  generatedAt?: string;
  order: ApiAdminOrderDetailPayload;
}
