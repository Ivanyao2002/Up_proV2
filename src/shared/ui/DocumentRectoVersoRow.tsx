"use client";

import { useEffect, useRef, useState } from "react";
import type { RectoVersoFiles } from "@/shared/types/documentUpload";
import { DocumentPreviewThumbnail } from "./DocumentPreviewThumbnail";

interface DocumentRectoVersoRowProps {
  label: string;
  description: string;
  requiredForApproval?: boolean;
  previewRecto: string;
  previewVerso?: string;
  value: RectoVersoFiles;
  onChange: (next: RectoVersoFiles) => void;
}

function SideUpload({
  sideLabel,
  file,
  previewSrc,
  onSelect,
}: {
  sideLabel: string;
  file: File | null;
  previewSrc: string;
  onSelect: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const thumbSrc = file ? (objectUrl ?? previewSrc) : previewSrc;

  return (
    <div className="flex flex-1 flex-col gap-2 rounded-lg border border-dashed border-border bg-canvas/50 p-3">
      <p className="text-xs font-medium text-muted">{sideLabel}</p>
      <DocumentPreviewThumbnail src={thumbSrc} alt={sideLabel} className="h-20 w-full" />
      {file && (
        <p className="truncate text-xs text-teal-dark">{file.name}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-surface-hover"
        >
          {file ? "Remplacer" : "Ajouter"}
        </button>
        {file && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground"
          >
            Retirer
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

export function DocumentRectoVersoRow({
  label,
  description,
  requiredForApproval,
  previewRecto,
  previewVerso,
  value,
  onChange,
}: DocumentRectoVersoRowProps) {
  const versoPreview = previewVerso ?? previewRecto;

  return (
    <li className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-4">
        <p className="text-sm font-medium text-foreground">
          {label}
          {requiredForApproval && (
            <span className="ml-1 text-xs font-normal text-amber-700">
              (requis pour validation)
            </span>
          )}
        </p>
        <p className="text-xs text-muted">{description}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <SideUpload
          sideLabel="Recto"
          file={value.recto}
          previewSrc={previewRecto}
          onSelect={(recto) => onChange({ ...value, recto })}
        />
        <SideUpload
          sideLabel="Verso"
          file={value.verso}
          previewSrc={versoPreview}
          onSelect={(verso) => onChange({ ...value, verso })}
        />
      </div>
    </li>
  );
}
