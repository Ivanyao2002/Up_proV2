"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/Button";
import { ModalPortal } from "@/shared/ui/ModalPortal";
import { FILTER_CONTROL_CLASS } from "@/shared/ui/filterControlStyles";
import type { DriverDetail } from "@/shared/types";
import type { CreateDriverPayload } from "../api/drivers.service";

interface PartnerDriverEditModalProps {
  open: boolean;
  driver: DriverDetail;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (data: CreateDriverPayload) => void;
}

export function PartnerDriverEditModal({
  open,
  driver,
  isSaving = false,
  onClose,
  onSave,
}: PartnerDriverEditModalProps) {
  const [form, setForm] = useState<CreateDriverPayload>({
    first_name: "",
    last_name: "",
    phone: "",
    zone: "",
    email: "",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      first_name: driver.first_name ?? "",
      last_name: driver.last_name ?? "",
      phone: driver.phone ?? "",
      zone: driver.zone ?? "",
      email: driver.email ?? "",
    });
  }, [open, driver]);

  if (!open) return null;

  const update = (patch: Partial<CreateDriverPayload>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <button
          type="button"
          className="absolute inset-0 bg-overlay"
          aria-label="Fermer"
          onClick={onClose}
        />
        <div
          role="dialog"
          aria-modal
          className="relative w-full max-w-lg rounded-card border border-border bg-surface p-6 shadow-card"
        >
          <h2 className="text-lg font-semibold text-foreground">Modifier le chauffeur</h2>
          <p className="mt-1 text-sm text-muted">
            Mettez à jour les informations de contact et la zone d&apos;activité.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block text-xs font-medium text-muted">Prénom</span>
              <input
                value={form.first_name}
                onChange={(e) => update({ first_name: e.target.value })}
                className={`${FILTER_CONTROL_CLASS} w-full`}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-xs font-medium text-muted">Nom</span>
              <input
                value={form.last_name}
                onChange={(e) => update({ last_name: e.target.value })}
                className={`${FILTER_CONTROL_CLASS} w-full`}
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-muted">Téléphone</span>
              <input
                value={form.phone}
                onChange={(e) => update({ phone: e.target.value })}
                className={`${FILTER_CONTROL_CLASS} w-full`}
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-muted">E-mail</span>
              <input
                type="email"
                value={form.email ?? ""}
                onChange={(e) => update({ email: e.target.value })}
                className={`${FILTER_CONTROL_CLASS} w-full`}
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-muted">Zone</span>
              <input
                value={form.zone}
                onChange={(e) => update({ zone: e.target.value })}
                className={`${FILTER_CONTROL_CLASS} w-full`}
              />
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={isSaving}>
              Annuler
            </Button>
            <Button
              onClick={() => onSave(form)}
              disabled={isSaving || !form.first_name.trim() || !form.phone.trim()}
            >
              {isSaving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
