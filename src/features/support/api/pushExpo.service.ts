import { apiClient } from "@/core/http/apiClient";

export interface PushConfigResponse {
  projectId?: string;
  accessToken?: string;
  expoToken?: string;
  enabled?: boolean;
}

export interface PushTestPayload {
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
}

export interface PushTestResponse {
  status: string;
  push?: {
    sent: boolean;
    providerRef?: string;
    notificationId?: string;
    reason?: string;
  };
}

export const pushExpoService = {
  getConfig: () => apiClient.get<PushConfigResponse>("/v1/notifications/push-config"),

  sendTest: (payload?: PushTestPayload) =>
    apiClient.post<PushTestResponse>("/v1/notifications/push/test", payload),
};
