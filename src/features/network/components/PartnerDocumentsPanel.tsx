"use client";

import { useMemo, useState } from "react";
import { Button } from "@/shared/ui/Button";
import { KycDocumentCard } from "@/shared/ui/KycDocumentCard";
import { KycDocumentGroupCard } from "@/shared/ui/KycDocumentGroupCard";
import { RejectReasonModal } from "@/shared/ui/RejectReasonModal";
import { organizeDriverKycDocuments } from "@/features/fleet/api/kycDocument.mapper";
import {
  EMPTY_PARTNER_CREATE_DOCUMENTS,
  partnerCreateDocumentsComplete,
  PartnerCreateDocumentsSection,
  type PartnerCreateDocumentsState,
} from "./PartnerCreateDocumentsSection";
import {
  mergeExpectedPartnerKycSlots,
  partnerIdentityDocumentsComplete,
  resolvePartnerDocumentTypeCode,
} from "../api/partnerDocuments.mapper";
import {
  useApprovePartnerDocument,
  usePartnerKycDocuments,
  useRejectPartnerDocument,
  useUploadPartnerKycDocument,
  useUploadPartnerKycDocuments,
} from "../api/partnerDocuments.queries";

function canUploadDocument(document: {
  id: string;
  status: string;
  uploaded_at: string;
}): boolean {
  if (document.id.startsWith("slot-")) return false;
  if (document.status === "approved") return false;
  return document.status === "pending" || document.status === "rejected" || !document.uploaded_at;
}

export interface PartnerDocumentsPanelProps {
  partnerId: string;
  /** Permet le dépôt (portail partenaire, admin/franchise pour compléter le dossier). */
  canUpload?: boolean;
  /** Permet valider / rejeter (admin, franchise). */
  canReview?: boolean;
  /**
   * "admin" (défaut) : fusionne route admin KYC + route partenaire.
   * "partner" : route partenaire uniquement (portail partenaire — évite le 403 admin).
   */
  scope?: "admin" | "partner";
}

export function PartnerDocumentsPanel({
  partnerId,
  canUpload = false,
  canReview = false,
  scope = "admin",
}: PartnerDocumentsPanelProps) {
  const { data: documents = [], isLoading, isError } = usePartnerKycDocuments(partnerId, scope);
  const uploadBatch = useUploadPartnerKycDocuments(partnerId);
  const uploadSingle = useUploadPartnerKycDocument(partnerId);
  const approveDoc = useApprovePartnerDocument(partnerId);
  const rejectDoc = useRejectPartnerDocument(partnerId);

  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [pendingUpload, setPendingUpload] =
    useState<PartnerCreateDocumentsState>(EMPTY_PARTNER_CREATE_DOCUMENTS);

  const displayDocuments = useMemo(
    () => mergeExpectedPartnerKycSlots(documents, { showMissingSlots: canUpload }),
    [documents, canUpload]
  );
  const displayItems = useMemo(
    () => organizeDriverKycDocuments(displayDocuments),
    [displayDocuments]
  );

  const identityComplete = partnerIdentityDocumentsComplete(documents);
  const showBulkUpload =
    canUpload && !identityComplete && !uploadBatch.isPending;

  const pendingCount = documents.filter((doc) => doc.status === "pending" && doc.uploaded_at).length;
  const approvedCount = documents.filter((doc) => doc.status === "approved").length;
  const rejectedCount = documents.filter((doc) => doc.status === "rejected").length;

  if (isLoading) {
    return (
      <div className="rounded-card border border-border bg-surface p-8 text-center text-sm text-muted">
        Chargement des documents…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-card border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
        Impossible de charger les documents du partenaire.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {documents.length === 0 && canUpload ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-medium">Dossier incomplet</p>
          <p className="mt-1 text-xs">
            Ce partenaire n&apos;a pas encore déposé sa pièce d&apos;identité. Utilisez le
            formulaire ci-dessous pour soumettre les documents.
          </p>
        </div>
      ) : null}

      {documents.length > 0 ? (
        <div className="rounded-lg border border-border bg-canvas/40 px-4 py-3 text-sm text-muted">
          {approvedCount} validé(s) · {pendingCount} en attente · {rejectedCount} refusé(s)
        </div>
      ) : null}

      {displayItems.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {displayItems.map((item) =>
            item.kind === "group" ? (
              <div key={item.groupId} className="sm:col-span-2">
                <KycDocumentGroupCard
                  label={item.label}
                  documents={item.documents}
                  canReview={canReview}
                  canUpload={canUpload}
                  onApprove={(documentId) => approveDoc.mutate(documentId)}
                  onReject={(documentId) => setRejectTarget(documentId)}
                  onUpload={(document, file) => {
                    uploadSingle.mutate({
                      file,
                      documentTypeCode: resolvePartnerDocumentTypeCode(document),
                      replaceDocumentId:
                        document.uploaded_at && !document.id.startsWith("slot-")
                          ? document.id
                          : undefined,
                    });
                  }}
                />
              </div>
            ) : (
              <KycDocumentCard
                key={item.document.id}
                document={item.document}
                canReview={
                  canReview &&
                  item.document.status === "pending" &&
                  Boolean(item.document.uploaded_at) &&
                  !item.document.id.startsWith("slot-")
                }
                onApprove={() => approveDoc.mutate(item.document.id)}
                onReject={() => setRejectTarget(item.document.id)}
                canUpload={canUpload && canUploadDocument(item.document)}
                uploadHint="PDF ou image · max 5 Mo"
                onUpload={(file) => {
                  uploadSingle.mutate({
                    file,
                    documentTypeCode: resolvePartnerDocumentTypeCode(item.document),
                    replaceDocumentId:
                      item.document.uploaded_at &&
                      !item.document.id.startsWith("slot-")
                        ? item.document.id
                        : undefined,
                  });
                }}
              />
            )
          )}
        </div>
      ) : (
        <div className="rounded-card border border-dashed border-border bg-surface p-8 text-center shadow-card">
          <p className="font-medium text-foreground">Aucun document</p>
          <p className="mt-2 text-sm text-muted">
            Les pièces déposées apparaîtront ici avec aperçu et statut de validation.
          </p>
        </div>
      )}

      {showBulkUpload ? (
        <div className="space-y-4 rounded-card border border-border bg-surface p-5 shadow-card">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Déposer les documents</h3>
            <p className="mt-1 text-sm text-muted">
              Recto et verso de la pièce d&apos;identité obligatoires. Le RCC est optionnel.
            </p>
          </div>
          <PartnerCreateDocumentsSection
            documents={pendingUpload}
            onChange={setPendingUpload}
            disabled={uploadBatch.isPending}
          />
          <div className="flex justify-end">
            <Button
              type="button"
              disabled={
                uploadBatch.isPending || !partnerCreateDocumentsComplete(pendingUpload)
              }
              onClick={() => {
                uploadBatch.mutate(pendingUpload, {
                  onSuccess: () => setPendingUpload(EMPTY_PARTNER_CREATE_DOCUMENTS),
                });
              }}
            >
              {uploadBatch.isPending ? "Envoi…" : "Envoyer les documents"}
            </Button>
          </div>
        </div>
      ) : null}

      <RejectReasonModal
        open={rejectTarget !== null}
        title="Rejeter ce document ?"
        message="Indiquez le motif du rejet. Le partenaire pourra soumettre un nouveau document."
        confirmLabel="Rejeter le document"
        onConfirm={(reason) => {
          if (rejectTarget) {
            rejectDoc.mutate({ documentId: rejectTarget, reason });
          }
          setRejectTarget(null);
        }}
        onCancel={() => setRejectTarget(null)}
      />
    </div>
  );
}
