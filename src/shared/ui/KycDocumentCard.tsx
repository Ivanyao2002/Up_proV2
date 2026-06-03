"use client";

import { useRef } from "react";
import type { KycDocument } from "@/shared/types";
import { resolveKycPreviewUrl } from "@/shared/lib/documentPreview";
import { formatDateTime } from "@/shared/lib/format";
import { DocumentPreviewThumbnail } from "./DocumentPreviewThumbnail";
import { Button } from "./Button";

const STATUS_LABELS: Record<KycDocument["status"], string> = {
  pending: "En attente de validation",
  approved: "Validé",
  rejected: "Rejeté",
};

const STATUS_STYLES: Record<KycDocument["status"], string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-teal/15 text-teal-dark",
  rejected: "bg-red-50 text-red-600",
};

interface KycDocumentCardProps {
  document: KycDocument;
  canReview?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  canUpload?: boolean;
  onUpload?: (file: File) => void;
  uploadHint?: string;
}

export function KycDocumentCard({
  document,
  canReview,
  onApprove,
  onReject,
  canUpload,
  onUpload,
  uploadHint = "PDF ou image (JPG, PNG) · max 5 Mo",
}: KycDocumentCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasUpload = Boolean(document.uploaded_at);
  const needsUpload = canUpload && (document.status === "rejected" || !hasUpload);
  const previewUrl = resolveKycPreviewUrl(document);

  return (
    <div className="rounded-card border border-border bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-[#212529]">{document.label}</p>
          {hasUpload ? (
            <p className="mt-1 text-xs text-muted">
              Soumis le {formatDateTime(document.uploaded_at)}
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted">Document requis pour approbation</p>
          )}
        </div>
        {hasUpload && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[document.status]}`}
          >
            {STATUS_LABELS[document.status]}
          </span>
        )}
      </div>

      <div className="mt-4">
        {needsUpload ? (
          <div className="flex min-h-[7rem] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-canvas p-4">
            <p className="mb-3 text-center text-sm text-muted">
              Téléversez le document pour soumettre à validation.
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && onUpload) onUpload(file);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              className="!text-xs"
              onClick={() => inputRef.current?.click()}
            >
              Choisir un fichier
            </Button>
            <p className="mt-2 text-[10px] text-muted">{uploadHint}</p>
          </div>
        ) : hasUpload ? (
          <DocumentPreviewThumbnail
            src={previewUrl}
            alt={document.label}
            subtitle={`Soumis le ${formatDateTime(document.uploaded_at)}`}
          />
        ) : (
          <div className="flex min-h-[7rem] items-center justify-center rounded-lg border border-dashed border-border bg-canvas p-4">
            <svg
              className="h-10 w-10 text-muted/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {document.status_note && (
        <p className="mt-3 text-sm text-red-600">{document.status_note}</p>
      )}

      {document.status === "pending" && hasUpload && !canReview && (
        <p className="mt-3 text-sm text-amber-700">
          En cours de vérification par UpJunoo. Vous serez notifié par email.
        </p>
      )}

      {canReview && document.status === "pending" && (
        <div className="mt-4 flex gap-2">
          <Button className="flex-1 !py-2 !text-xs" onClick={onApprove}>
            Valider
          </Button>
          <Button
            variant="secondary"
            className="flex-1 !py-2 !text-xs"
            onClick={onReject}
          >
            Rejeter
          </Button>
        </div>
      )}
    </div>
  );
}
