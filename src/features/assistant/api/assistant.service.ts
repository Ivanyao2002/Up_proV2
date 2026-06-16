import type {
  AssistantApiResponse,
  AssistantChatMessage,
  AssistantConfirmation,
  AssistantConfirmationPayload,
  AssistantExecuteType,
  AssistantBriefingAlert,
} from "@/features/assistant/types";
import type { AssistantPageContext } from "@/features/assistant/lib/assistantPageContext";
import { useAuthStore } from "@/core/auth/authStore";
import { withBasePath } from "@/shared/lib/basePath";

export interface AssistantBriefing {
  greeting: string;
  alerts: AssistantBriefingAlert[];
}

export async function sendAssistantMessage(
  messages: AssistantChatMessage[],
  context?: AssistantPageContext
): Promise<AssistantApiResponse> {
  const token = useAuthStore.getState().token;
  if (!token) {
    throw new Error("Session expirée — reconnectez-vous.");
  }

  const response = await fetch(withBasePath("/api/admin/assistant"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages, context }),
  });

  const data = (await response.json()) as AssistantApiResponse & {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(data.message ?? `Erreur ${response.status}`);
  }

  return data;
}

export async function fetchAssistantBriefing(): Promise<AssistantBriefing> {
  const token = useAuthStore.getState().token;
  if (!token) {
    throw new Error("Session expirée — reconnectez-vous.");
  }

  const response = await fetch(withBasePath("/api/admin/assistant/briefing"), {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = (await response.json()) as AssistantBriefing & { message?: string };
  if (!response.ok) {
    throw new Error(data.message ?? `Erreur ${response.status}`);
  }

  return data;
}

export async function executeAssistantConfirmation(
  executeType: AssistantExecuteType,
  payload: AssistantConfirmationPayload
): Promise<{ ok: boolean; message: string }> {
  const token = useAuthStore.getState().token;
  if (!token) {
    throw new Error("Session expirée — reconnectez-vous.");
  }

  const response = await fetch(withBasePath("/api/admin/assistant/execute"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ type: executeType, ...payload }),
  });

  const data = (await response.json()) as { ok?: boolean; message?: string };
  if (!response.ok) {
    throw new Error(data.message ?? `Erreur ${response.status}`);
  }

  return { ok: data.ok ?? true, message: data.message ?? "Action effectuée." };
}

export type { AssistantConfirmation, AssistantPageContext };
