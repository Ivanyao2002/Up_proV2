import { mapV1PaginationToMeta } from "@/core/api/v1Pagination";
import type { ApiV1Pagination } from "@/core/api/v1Pagination";
import type { DispatcherAccount, DispatcherAccountDetail, Paginated } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import { paginateClientList } from "@/shared/lib/clientList";

export interface ApiDispatcherItem {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  franchise_id?: string;
  franchise_name?: string;
  zone_ids?: Array<string | number>;
  zone_names?: string[];
  status?: string;
  last_login_at?: string | null;
  shift_label?: string;
  permissions?: {
    assign_trips?: boolean;
    view_live_map?: boolean;
    cancel_trip?: boolean;
    override_dispatch?: boolean;
    adjust_surge?: boolean;
  };
}

export interface ApiDispatchersListResponse {
  status?: string;
  items?: ApiDispatcherItem[];
  dispatchers?: ApiDispatcherItem[];
  pagination?: ApiV1Pagination;
}

function mapDispatcherStatus(value?: string | null): DispatcherAccount["status"] {
  return String(value ?? "active").toLowerCase() === "suspended" ? "suspended" : "active";
}

export function mapDispatcherItem(item: ApiDispatcherItem): DispatcherAccount {
  return {
    id: item.id as unknown as number,
    name: item.name ?? "—",
    email: item.email ?? "—",
    phone: item.phone ?? "—",
    franchise_id: item.franchise_id as unknown as number,
    franchise_name: item.franchise_name,
    zone_ids: item.zone_ids ?? [],
    zone_names: item.zone_names,
    status: mapDispatcherStatus(item.status),
    last_login_at: item.last_login_at ?? null,
  };
}

export function mapDispatcherDetail(item: ApiDispatcherItem): DispatcherAccountDetail {
  return {
    ...mapDispatcherItem(item),
    shift_label: item.shift_label,
    permissions: {
      assign_trips: item.permissions?.assign_trips ?? true,
      view_live_map: item.permissions?.view_live_map ?? true,
      cancel_trip: item.permissions?.cancel_trip ?? false,
      override_dispatch: item.permissions?.override_dispatch ?? false,
      adjust_surge: item.permissions?.adjust_surge ?? false,
    },
  };
}

export function mapDispatchersListResponse(
  response: ApiDispatchersListResponse,
  params?: ListParams
): Paginated<DispatcherAccount> {
  const items = response.items ?? response.dispatchers ?? [];
  const mapped = items.map(mapDispatcherItem);
  if (response.pagination) {
    return {
      data: mapped,
      meta: mapV1PaginationToMeta(response.pagination, params),
    };
  }
  return paginateClientList(mapped, params);
}
