import type { ApiV1Pagination } from "@/core/api/v1Pagination";

/** GET /v1/admin/users */

export interface ApiAdminUserItem {
  id: string;
  fullName?: string | null;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  email?: string | null;
  tripsCount?: number | null;
  trips_count?: number | null;
  walletBalanceXof?: number | null;
  wallet_balance_xof?: number | null;
  userType?: string | null;
  user_type?: string | null;
  status?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  lastTripAt?: string | null;
  last_trip_at?: string | null;
}

export interface ApiAdminUsersResponse {
  status: string;
  generatedAt?: string;
  users?: ApiAdminUserItem[];
  items?: ApiAdminUserItem[];
  pagination?: ApiV1Pagination;
}

export interface ApiAdminUserProfile {
  id?: string;
  orders_completed_count?: number;
  client_cancellation_rate?: number | null;
  client_reliability_score?: number | null;
  status?: string | null;
}

export interface ApiAdminUserRecentOrder {
  id?: string;
  /** Live API — camelCase */
  orderReference?: string | null;
  amountXof?: number | null;
  createdAt?: string | null;
  pickupAddress?: string | null;
  dropoffAddress?: string | null;
  /** snake_case (legacy / docs) */
  order_reference?: string | null;
  pickup_address?: string | null;
  dropoff_address?: string | null;
  status?: string | null;
  final_price_xof?: number | null;
  estimated_price_xof?: number | null;
  created_at?: string | null;
}

export interface ApiAdminUserDetailResponse {
  status: string;
  generatedAt?: string;
  user?: ApiAdminUserItem;
  profile?: ApiAdminUserProfile;
  recentOrders?: ApiAdminUserRecentOrder[];
}
