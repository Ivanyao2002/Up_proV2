"use client";

import { useEffect, useState } from "react";
import { Button } from "./Button";
import { ModalPortal } from "./ModalPortal";

interface RejectReasonModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  placeholder?: string;
  defaultReason?: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function RejectReasonModal({
  open,
  title,
  message,
  confirmLabel = "Rejeter",
  cancelLabel = "Annuler",
  placeholder = "Motif du rejet (obligatoire)",
  defaultReason = "",
  onConfirm,
  onCancel,
}: RejectReasonModalProps) {
  const [reason, setReason] = useState(defaultReason);

  useEffect(() => {
    if (open) setReason(defaultReason);
  }, [open, defaultReason]);

  if (!open) return null;

  const trimmed = reason.trim();

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-overlay animate-fade-up"
        aria-label="Fermer"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal
        className="relative w-full max-w-md rounded-card bg-surface p-6 shadow-card animate-fade-up"
      >
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-muted">{message}</p>
        <textarea
          className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
          rows={3}
          value={reason}
          placeholder={placeholder}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            className="!bg-red-600 hover:!bg-red-700"
            disabled={!trimmed}
            onClick={() => onConfirm(trimmed)}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
