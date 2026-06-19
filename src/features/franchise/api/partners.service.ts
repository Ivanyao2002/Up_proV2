import { apiClient } from "@/core/http/apiClient";
import {
  fetchNetworkLookups,
  resolveCityIdByLabel,
} from "@/core/api/catalogLookup.service";
import { resolveFranchiseId } from "@/core/api/franchiseContext.service";
import { LINKS, appendQuery, createUrl } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import type { ApiAdminDriverItem } from "@/features/fleet/api/adminDrivers.api.types";
import { mapAdminDriverItemToListDriver } from "@/features/fleet/api/adminDrivers.mapper";
import type { ApiV1FranchisePartnersResponse } from "@/features/network/api/adminFranchises.api.types";
import type { ApiPartnerCreateResponse } from "@/features/network/api/adminPartners.api.types";
import {
  mapAdminPartnerItemToPartner,
  mapAdminPartnersToPaginated,
} from "@/features/network/api/adminPartners.mapper";
import type { ApiAdminVehiclesListResponse } from "@/features/fleet/api/adminVehicles.api.types";
import { mapAdminVehiclesToPaginated } from "@/features/fleet/api/adminVehicles.mapper";
import type { Driver, Paginated, Partner, Trip, Vehicle } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import {
  mapFranchiseOrdersToTripsList,
  type ApiFranchiseOrdersResponse,
} from "./franchisePortal.mapper";

export interface FranchisePartner extends Partner {
  revenue_month_fcfa?: number;
}

export interface FranchisePartnerDetail extends FranchisePartner {
  legal_name: string;
  address: string | null;
  created_at: string;
  vehicles_count: number;
  trips_count: number;
  wallet_balance_fcfa: number;
  commission_rate: number | null;
  partner_type: string | null;
  registration_number: string | null;
  tax_id: string | null;
}

export interface CreatePartnerPayload {
  name: string;
  trade_name?: string;
  legal_name?: string;
  contact_email: string;
  password: string;
  contact_phone: string;
  city: string;
  address?: string;
  commission_rate?: number;
}

export interface FranchisePartnerCreateResult extends FranchisePartnerDetail {
  portal_login_email?: string;
}

export interface PartnerCommission {
  id: string;
  trip_ref: string;
  trip_id: string;
  amount_fcfa: number;
  rate_pct: number;
  driver_name?: string;
  created_at: string;
  status: "paid" | "pending" | "cancelled";
}

interface V1PartnerDriversResponse {
  status?: string;
  items?: ApiAdminDriverItem[];
  drivers?: ApiAdminDriverItem[];
  pagination?: { total?: number; page?: number; per_page?: number; total_pages?: number };
}

interface V1PartnerCommissionsResponse {
  status?: string;
  items?: PartnerCommission[];
  commissions?: PartnerCommission[];
  pagination?: { total?: number; page?: number; per_page?: number; total_pages?: number };
  stats?: {
    total_fcfa: number;
    avg_rate_pct: number;
    count: number;
  };
}

export const franchisePartnersService = {
  list: async (params?: ListParams): Promise<Paginated<FranchisePartner>> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<Paginated<FranchisePartner>>(
        `${LINKS.franchise.partners.list}${buildListQuery(params)}`
      );
    }

    const franchiseId = await resolveFranchiseId();
    const [response, lookups] = await Promise.all([
      apiClient.get<ApiV1FranchisePartnersResponse>(
        appendQuery(
          LINKS.franchise.v1.partners(franchiseId),
          buildV1ListQuery(params)
        )
      ),
      fetchNetworkLookups().catch(() => ({
        cityById: new Map<string, string>(),
        franchiseNameById: new Map<string, string>(),
      })),
    ]);

    return mapAdminPartnersToPaginated(
      response.items ?? [],
      params,
      response.pagination,
      lookups
    ) as Paginated<FranchisePartner>;
  },

  getById: async (id: string): Promise<FranchisePartnerDetail> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<FranchisePartnerDetail>(
        `${LINKS.franchise.partners.getById(id)}`
      );
    }

    const franchiseId = await resolveFranchiseId();
    const response = await apiClient.get<{
      status: string;
      partner: Parameters<typeof mapAdminPartnerItemToPartner>[0];
      stats?: { revenue_xof?: number; trips_count?: number; wallet_balance_xof?: number; vehicles_count?: number; drivers_count?: number };
    }>(LINKS.franchise.v1.partnerById(franchiseId, id));
    const p = response.partner;
    // stats can come from response.stats or partner.stats
    const stats = response.stats ?? p.stats ?? {};
    const base = mapAdminPartnerItemToPartner(p);
    return {
      ...base,
      drivers_count: stats.drivers_count ?? base.drivers_count ?? 0,
      legal_name: p.legal_name?.trim() || p.trade_name?.trim() || base.name,
      address: p.address?.trim() || null,
      created_at: p.created_at ?? new Date().toISOString(),
      vehicles_count: stats.vehicles_count ?? p.vehicles_count ?? p.vehiclesCount ?? 0,
      revenue_month_fcfa: stats.revenue_xof ?? 0,
      trips_count: stats.trips_count ?? 0,
      wallet_balance_fcfa: stats.wallet_balance_xof ?? 0,
      commission_rate: p.commission_rate ?? null,
      partner_type: p.partner_type ?? null,
      registration_number: p.registration_number ?? null,
      tax_id: p.tax_id ?? null,
    };
  },

  update: async (id: string, payload: Partial<CreatePartnerPayload>): Promise<FranchisePartnerDetail> => {
    const franchiseId = await resolveFranchiseId();
    const response = await apiClient.patch<{ status: string; partner: Parameters<typeof mapAdminPartnerItemToPartner>[0] }>(
      LINKS.franchise.v1.partnerById(franchiseId, id),
      payload
    );
    const p = response.partner;
    const base = mapAdminPartnerItemToPartner(p);
    return {
      ...base,
      legal_name: p.legal_name?.trim() || p.trade_name?.trim() || base.name,
      address: p.address?.trim() || null,
      created_at: p.created_at ?? new Date().toISOString(),
      vehicles_count: p.vehicles_count ?? p.vehiclesCount ?? 0,
      trips_count: 0,
      wallet_balance_fcfa: 0,
      commission_rate: p.commission_rate ?? null,
      partner_type: p.partner_type ?? null,
      registration_number: p.registration_number ?? null,
      tax_id: p.tax_id ?? null,
    };
  },

  delete: async (id: string): Promise<void> => {
    const franchiseId = await resolveFranchiseId();
    await apiClient.delete(`${LINKS.franchise.v1.partnerById(franchiseId, id)}`);
  },

  create: async (payload: CreatePartnerPayload): Promise<FranchisePartnerCreateResult> => {
    if (useLegacyPortalApi()) {
      const franchiseId = await resolveFranchiseId();
      const response = await apiClient.post<{
        status: string;
        partner: Parameters<typeof mapAdminPartnerItemToPartner>[0];
      }>(LINKS.franchise.v1.createPartner(franchiseId), payload);
      const p = response.partner;
      const base = mapAdminPartnerItemToPartner(p);
      return {
        ...base,
        legal_name: payload.legal_name?.trim() || payload.name,
        address: payload.address?.trim() || null,
        created_at: p.created_at ?? new Date().toISOString(),
        vehicles_count: 0,
        trips_count: 0,
        wallet_balance_fcfa: 0,
        commission_rate: null,
        partner_type: null,
        registration_number: null,
        tax_id: null,
      };
    }

    const franchiseId = await resolveFranchiseId();
    const cityId = await resolveCityIdByLabel(payload.city);
    if (!cityId) {
      throw new Error("Sélectionnez une ville du catalogue.");
    }

    const legalName = (payload.legal_name?.trim() || payload.name).trim();
    const tradeName = (payload.trade_name?.trim() || payload.name).trim();
    const email = payload.contact_email.trim();

    const response = await apiClient.post<ApiPartnerCreateResponse>(
      LINKS.v1.partners.create,
      {
        franchiseId,
        legalName,
        tradeName,
        cityId,
        email,
        password: payload.password,
        contactEmail: email,
        ...(payload.contact_phone.trim()
          ? {
              contactPhone: payload.contact_phone.trim(),
              phone: payload.contact_phone.trim(),
            }
          : {}),
        ...(payload.address?.trim() ? { address: payload.address.trim() } : {}),
        ...(payload.commission_rate != null && !Number.isNaN(payload.commission_rate)
          ? { commissionRate: payload.commission_rate }
          : {}),
      }
    );

    if (!response.partner?.id) {
      throw new Error(
        response.error?.message ?? "Création partenaire sans identifiant en réponse."
      );
    }

    const p = response.partner;
    const base = mapAdminPartnerItemToPartner(p);
    const portalLoginEmail =
      response.account?.loginEmail ?? response.account?.login_email ?? email;

    return {
      ...base,
      legal_name: legalName,
      address: payload.address?.trim() || null,
      created_at: p.created_at ?? new Date().toISOString(),
      vehicles_count: 0,
      trips_count: 0,
      wallet_balance_fcfa: 0,
      commission_rate: null,
      partner_type: null,
      registration_number: null,
      tax_id: null,
      portal_login_email: portalLoginEmail,
    };
  },

  getDrivers: async (partnerId: string, params?: ListParams): Promise<Paginated<Driver>> => {
    const franchiseId = await resolveFranchiseId();
    const res = await apiClient.get<V1PartnerDriversResponse>(
      appendQuery(LINKS.franchise.v1.partnerDrivers(franchiseId, partnerId), buildV1ListQuery(params))
    );
    const raw = res.items ?? res.drivers ?? [];
    const data = raw.map(mapAdminDriverItemToListDriver);
    return {
      data,
      meta: {
        total: res.pagination?.total ?? data.length,
        current_page: res.pagination?.page ?? 1,
        per_page: res.pagination?.per_page ?? 20,
        last_page: res.pagination?.total_pages ?? 1,
      },
    };
  },

  getVehicles: async (partnerId: string, params?: ListParams): Promise<Paginated<Vehicle>> => {
    const res = await apiClient.get<ApiAdminVehiclesListResponse>(
      appendQuery(LINKS.v1.partners.vehicles(partnerId), buildV1ListQuery(params))
    );
    const items = res.items ?? [];
    return mapAdminVehiclesToPaginated(items, params, res.pagination);
  },

  getOrders: async (partnerId: string, params?: ListParams): Promise<{ data: Trip[]; meta: Paginated<Trip>["meta"] }> => {
    const franchiseId = await resolveFranchiseId();
    const res = await apiClient.get<ApiFranchiseOrdersResponse>(
      appendQuery(LINKS.franchise.v1.partnerOrders(franchiseId, partnerId), buildV1ListQuery(params))
    );
    const mapped = mapFranchiseOrdersToTripsList(res, params, undefined);
    return { data: mapped.data ?? [], meta: mapped.meta };
  },

  getCommissions: async (partnerId: string, params?: ListParams): Promise<{
    data: PartnerCommission[];
    meta: Paginated<PartnerCommission>["meta"];
    stats?: V1PartnerCommissionsResponse["stats"];
  }> => {
    const franchiseId = await resolveFranchiseId();
    const res = await apiClient.get<V1PartnerCommissionsResponse>(
      appendQuery(LINKS.franchise.v1.partnerCommissions(franchiseId, partnerId), buildV1ListQuery(params))
    );
    const items = res.items ?? res.commissions ?? [];
    const rawAvgRate = res.stats?.avg_rate_pct ?? 0;
    const avgRatePct = rawAvgRate > 100 ? rawAvgRate / 100 : rawAvgRate;
    return {
      data: items,
      meta: {
        total: res.pagination?.total ?? items.length,
        current_page: res.pagination?.page ?? 1,
        per_page: res.pagination?.per_page ?? 20,
        last_page: res.pagination?.total_pages ?? 1,
      },
      stats: res.stats ? { ...res.stats, avg_rate_pct: avgRatePct } : undefined,
    };
  },
};
