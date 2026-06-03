import { apiClient } from "@/core/http/apiClient";
import type { Paginated } from "@/shared/types";

export interface PlatformIntegration {
  id: string;
  name: string;
  category: "payment" | "maps" | "messaging" | "monitoring";
  status: "connected" | "disconnected";
  last_sync_at: string | null;
}

export interface AuditLogEntry {
  id: string;
  at: string;
  actor_email: string;
  action: string;
  resource: string;
  detail: string;
}

export interface GeneralSettings {
  platform_name: string;
  support_email: string;
  default_city: string;
  default_currency: string;
  default_locale: string;
  min_app_version_driver: string;
  min_app_version_client: string;
  maintenance_mode: boolean;
  updated_at: string;
}

export const settingsExtendedService = {
  integrations: () =>
    apiClient.get<{ data: PlatformIntegration[] }>("/admin/settings/integrations"),

  toggleIntegration: (id: string, connected: boolean) =>
    apiClient.patch<PlatformIntegration>(`/admin/settings/integrations/${id}`, {
      status: connected ? "connected" : "disconnected",
    }),

  auditLog: () =>
    apiClient.get<Paginated<AuditLogEntry>>("/admin/settings/audit"),

  general: () => apiClient.get<GeneralSettings>("/admin/settings/general"),

  updateGeneral: (payload: Partial<GeneralSettings>) =>
    apiClient.put<GeneralSettings>("/admin/settings/general", payload),
};
