import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { Paginated, Vehicle, VehicleDetail } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export interface FranchiseVehicleFilters extends ListParams {
  status?: string;
  partner_id?: string | number;
  approval_status?: string;
}

export const franchiseVehiclesService = {
  list: async (params?: FranchiseVehicleFilters): Promise<Paginated<Vehicle>> => {
    const response = await apiClient.get<Paginated<Vehicle>>(
      `${LINKS.franchise.fleet.vehicles.list}${buildListQuery(params)}`
    );
    return response;
  },

  getById: async (id: string | number): Promise<VehicleDetail> => {
    const response = await apiClient.get<VehicleDetail>(
      LINKS.franchise.fleet.vehicles.byId(id)
    );
    return response;
  },

  approve: async (id: string | number, notes?: string): Promise<void> => {
    await apiClient.post(LINKS.franchise.fleet.vehicles.approve(id), {
      notes: notes || undefined,
    });
  },

  reject: async (id: string | number, reason?: string): Promise<void> => {
    await apiClient.post(LINKS.franchise.fleet.vehicles.reject(id), {
      reason: reason || undefined,
    });
  },
};
