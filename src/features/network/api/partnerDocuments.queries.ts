"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import type { PartnerCreateDocumentsState } from "./partnerCreateDocuments.v1";
import { partnerDocumentsService } from "./partnerDocuments.service";

export const partnerDocumentsKeys = {
  all: ["partner-documents"] as const,
  list: (partnerId: string) => [...partnerDocumentsKeys.all, partnerId] as const,
};

export function usePartnerKycDocuments(partnerId: string) {
  return useQuery({
    queryKey: partnerDocumentsKeys.list(partnerId),
    queryFn: () => partnerDocumentsService.listKycDocuments(partnerId),
    enabled: Boolean(partnerId),
  });
}

export function useUploadPartnerKycDocuments(partnerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (documents: PartnerCreateDocumentsState) =>
      partnerDocumentsService.uploadDocuments(partnerId, documents),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnerDocumentsKeys.list(partnerId) });
      notificationService.success("Documents envoyés — validation en cours");
    },
    onError: (error: Error) => {
      notificationService.error(error.message || "Échec de l'envoi des documents");
    },
  });
}

export function useUploadPartnerKycDocument(partnerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      documentTypeCode,
      replaceDocumentId,
    }: {
      file: File;
      documentTypeCode: string;
      replaceDocumentId?: string;
    }) =>
      partnerDocumentsService.uploadSingleDocument(
        partnerId,
        file,
        documentTypeCode,
        replaceDocumentId
      ),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: partnerDocumentsKeys.list(partnerId) });
      notificationService.success(
        variables.replaceDocumentId
          ? "Nouvelle version enregistrée — validation en cours"
          : "Document envoyé — validation en cours"
      );
    },
    onError: () => {
      notificationService.error("Échec de l'envoi du document");
    },
  });
}

export function useApprovePartnerDocument(partnerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) =>
      partnerDocumentsService.approveDocument(documentId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnerDocumentsKeys.list(partnerId) });
    },
  });
}

export function useRejectPartnerDocument(partnerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      documentId,
      reason,
    }: {
      documentId: string;
      reason: string;
    }) => partnerDocumentsService.rejectDocument(documentId, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnerDocumentsKeys.list(partnerId) });
    },
  });
}
