import { apiClient } from "@/core/http/apiClient";

export interface DocumentType {
  id: string;
  code: string;
  label: string;
  description?: string;
  category: "driver" | "vehicle" | "partner";
  required: boolean;
}

export const documentTypesService = {
  list: async (category?: string) => {
    const params = category ? `?category=${category}` : "";
    const res = await apiClient.get<DocumentType[]>(`/v1/catalog/document-types${params}`);
    return res;
  },
};
