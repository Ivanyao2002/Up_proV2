"use client";

import { useQuery } from "@tanstack/react-query";
import { documentTypesService } from "./documentTypes.service";

export const documentTypesKeys = {
  all: ["catalog", "document-types"] as const,
  list: (category?: string) =>
    [...documentTypesKeys.all, "list", category] as const,
};

export function useDocumentTypes(category?: string) {
  return useQuery({
    queryKey: documentTypesKeys.list(category),
    queryFn: () => documentTypesService.list(category),
  });
}
