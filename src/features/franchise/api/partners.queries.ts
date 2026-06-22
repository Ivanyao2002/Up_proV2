"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import { franchisePartnersService, type CreatePartnerPayload } from "./partners.service";
import type { ListParams } from "@/shared/types/listParams";

export const franchisePartnersKeys = {
  all: ["franchise", "partners"] as const,
  list: (filters?: ListParams) => [...franchisePartnersKeys.all, "list", filters] as const,
  detail: (id: string) => [...franchisePartnersKeys.all, "detail", id] as const,
  drivers: (id: string, filters?: ListParams) => [...franchisePartnersKeys.all, id, "drivers", filters] as const,
  orders: (id: string, filters?: ListParams) => [...franchisePartnersKeys.all, id, "orders", filters] as const,
  commissions: (id: string, filters?: ListParams) => [...franchisePartnersKeys.all, id, "commissions", filters] as const,
  vehicles: (id: string, filters?: ListParams) => [...franchisePartnersKeys.all, id, "vehicles", filters] as const,
};

export function useFranchisePartnersList(params?: ListParams) {
  return useQuery({
    queryKey: franchisePartnersKeys.list(params),
    queryFn: () => franchisePartnersService.list(params),
  });
}

export function useFranchisePartnerDetail(id: string) {
  return useQuery({
    queryKey: franchisePartnersKeys.detail(id),
    queryFn: () => franchisePartnersService.getById(id),
    enabled: Boolean(id),
  });
}

export function useFranchisePartnerDrivers(partnerId: string, params?: ListParams) {
  return useQuery({
    queryKey: franchisePartnersKeys.drivers(partnerId, params),
    queryFn: () => franchisePartnersService.getDrivers(partnerId, params),
    enabled: Boolean(partnerId),
  });
}

export function useFranchisePartnerOrders(partnerId: string, params?: ListParams) {
  return useQuery({
    queryKey: franchisePartnersKeys.orders(partnerId, params),
    queryFn: () => franchisePartnersService.getOrders(partnerId, params),
    enabled: Boolean(partnerId),
  });
}

export function useFranchisePartnerCommissions(partnerId: string, params?: ListParams) {
  return useQuery({
    queryKey: franchisePartnersKeys.commissions(partnerId, params),
    queryFn: () => franchisePartnersService.getCommissions(partnerId, params),
    enabled: Boolean(partnerId),
  });
}

export function useFranchisePartnerVehicles(partnerId: string, params?: ListParams) {
  return useQuery({
    queryKey: franchisePartnersKeys.vehicles(partnerId, params),
    queryFn: () => franchisePartnersService.getVehicles(partnerId, params),
    enabled: Boolean(partnerId),
  });
}

export function useCreateFranchisePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePartnerPayload) => franchisePartnersService.create(payload),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: franchisePartnersKeys.all });
      const login = data.portal_login_email;
      notificationService.success(
        login
          ? `Partenaire créé. Connexion portail : ${login}`
          : "Partenaire créé avec succès"
      );
    },
    onError: (error: Error) =>
      notificationService.error(
        error.message || "Création du partenaire impossible"
      ),
  });
}

export function useUpdateFranchisePartner(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CreatePartnerPayload>) => franchisePartnersService.update(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: franchisePartnersKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: franchisePartnersKeys.list() });
      notificationService.success("Partenaire mis à jour");
    },
  });
}

export function useDeleteFranchisePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => franchisePartnersService.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: franchisePartnersKeys.all });
      notificationService.success("Partenaire supprimé");
    },
  });
}

export function useActivateFranchisePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => franchisePartnersService.activate(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: franchisePartnersKeys.all });
      notificationService.success("Partenaire approuvé");
    },
    onError: () => notificationService.error("Impossible d'approuver le partenaire"),
  });
}

export function useSuspendFranchisePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => franchisePartnersService.suspend(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: franchisePartnersKeys.all });
      notificationService.success("Partenaire suspendu");
    },
    onError: () => notificationService.error("Impossible de suspendre le partenaire"),
  });
}
