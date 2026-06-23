"use client";

import { useId } from "react";
import { Button } from "./Button";
import { ModalPortal } from "./ModalPortal";
import { useFocusTrap } from "@/shared/hooks/useFocusTrap";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "primary",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const titleId = useId();
  const dialogRef = useFocusTrap<HTMLDivElement>(open, onCancel);

  if (!open) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <button
          type="button"
          className="absolute inset-0 bg-overlay animate-fade-up"
          aria-label="Fermer"
          onClick={onCancel}
        />
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-card bg-surface p-6 shadow-card outline-none animate-fade-up sm:rounded-card"
        >
          <h2 id={titleId} className="text-lg font-semibold text-foreground">
            {title}
          </h2>
          <p className="mt-2 text-sm text-muted">{message}</p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button
              variant="primary"
              className={variant === "danger" ? "!bg-red-600 hover:!bg-red-700" : ""}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
