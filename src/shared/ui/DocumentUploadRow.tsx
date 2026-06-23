"use client";

import { useEffect, useRef, useState } from "react";
import { DocumentPreviewThumbnail } from "./DocumentPreviewThumbnail";
import { DOCUMENT_UPLOAD_HINT, validateDocumentFile } from "@/shared/lib/uploadValidation";

interface DocumentUploadRowProps {
  label: string;
  description: string;
  requiredForApproval?: boolean;
  file: File | null;
  previewSrc: string;
  onSelect: (file: File | null) => void;
}

export function DocumentUploadRow({
  label,
  description,
  requiredForApproval,
  file,
  previewSrc,
  onSelect,
}: DocumentUploadRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = (picked: File | null) => {
    if (picked) {
      const result = validateDocumentFile(picked);
      if (!result.ok) {
        setError(result.error ?? "Fichier invalide.");
        return;
      }
    }
    setError(null);
    onSelect(picked);
  };

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const isPdf = file?.type === "application/pdf" || file?.name.toLowerCase().endsWith(".pdf");
  const thumbSrc = file ? (objectUrl ?? previewSrc) : previewSrc;

  return (
    <li className="rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            {label}
            {requiredForApproval && (
              <span className="ml-1 text-xs font-normal text-amber-700">
                (requis pour validation)
              </span>
            )}
          </p>
          <p className="text-xs text-muted">{description}</p>
          <p className="text-xs text-muted">{DOCUMENT_UPLOAD_HINT}</p>
          {file && (
            <p className="mt-1 truncate text-xs text-teal-dark">{file.name}</p>
          )}
          {error && (
            <p className="mt-1 text-xs text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            className="hidden"
            onChange={(e) => {
              handleSelect(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover"
          >
            {file ? "Remplacer" : "Choisir un fichier"}
          </button>
          {file && (
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className="rounded-lg px-3 py-2 text-xs text-muted hover:text-red-600"
            >
              Retirer
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 max-w-xs">
        <DocumentPreviewThumbnail
          src={thumbSrc}
          alt={label}
          isPdf={Boolean(file && isPdf)}
          subtitle={file ? file.name : "Aperçu type de document"}
          allowPreview={Boolean(file)}
          onPickFile={() => inputRef.current?.click()}
          pickLabel={file ? "Cliquer pour remplacer" : "Cliquer pour choisir une image"}
        />
      </div>
    </li>
  );
}
