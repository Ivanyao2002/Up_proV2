import type { MergedExtraction } from "@/features/fleet/lib/documentExtraction.types";
import { useAuthStore } from "@/core/auth/authStore";
import { withBasePath } from "@/shared/lib/basePath";

export interface OnboardingApiAssignment {
  fileIndex: number;
  fileName: string;
  slot: string;
  label: string;
}

export interface OnboardingApiResponse {
  id: string;
  partnerId?: string;
  merged: MergedExtraction;
  assignments: OnboardingApiAssignment[];
  summary: string[];
  warnings: string[];
  missingDocuments?: string[];
  partnerName?: string;
}

export async function processOnboardingFiles(
  files: File[],
  partnerQuery?: string
): Promise<OnboardingApiResponse> {
  const token = useAuthStore.getState().token;
  if (!token) {
    throw new Error("Session expirée — reconnectez-vous.");
  }

  const form = new FormData();
  for (const file of files) {
    form.append("files", file);
  }
  if (partnerQuery?.trim()) {
    form.append("partnerQuery", partnerQuery.trim());
  }

  const response = await fetch(withBasePath("/api/admin/assistant/onboarding"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const data = (await response.json()) as OnboardingApiResponse & { message?: string };

  if (!response.ok) {
    throw new Error(data.message ?? `Erreur ${response.status}`);
  }

  return data;
}
