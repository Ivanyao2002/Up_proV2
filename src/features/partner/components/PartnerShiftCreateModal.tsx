"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { ModalPortal } from "@/shared/ui/ModalPortal";
import { useCreatePartnerShift } from "../api/shifts.queries";

interface PartnerShiftCreateModalProps {
  onClose: () => void;
}

const DAY_OPTIONS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

export function PartnerShiftCreateModal({ onClose }: PartnerShiftCreateModalProps) {
  const create = useCreatePartnerShift();
  const [form, setForm] = useState({
    driver_name: "",
    vehicle_label: "",
    day_label: DAY_OPTIONS[0],
    start_time: "08:00",
    end_time: "18:00",
    status: "active" as "active" | "draft",
  });

  const valid =
    form.driver_name.trim() && form.day_label.trim() && form.start_time && form.end_time;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    create.mutate(
      {
        driver_name: form.driver_name.trim(),
        vehicle_label: form.vehicle_label.trim(),
        day_label: form.day_label,
        start_time: form.start_time,
        end_time: form.end_time,
        status: form.status,
      },
      { onSuccess: onClose }
    );
  };

  const inputClass =
    "mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-teal";

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <button
          type="button"
          className="absolute inset-0 bg-overlay animate-fade-up"
          aria-label="Fermer"
          onClick={onClose}
        />
        <div className="relative w-full max-w-md rounded-card bg-surface p-6 shadow-card animate-fade-up">
          <h2 className="text-lg font-semibold text-heading">Nouveau shift</h2>
          <p className="mt-1 text-sm text-muted">
            Planifiez un créneau de travail pour un chauffeur.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">Chauffeur</label>
              <input
                className={inputClass}
                value={form.driver_name}
                onChange={(e) => setForm((s) => ({ ...s, driver_name: e.target.value }))}
                placeholder="Nom du chauffeur"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Véhicule</label>
              <input
                className={inputClass}
                value={form.vehicle_label}
                onChange={(e) => setForm((s) => ({ ...s, vehicle_label: e.target.value }))}
                placeholder="Immatriculation / libellé"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Jour</label>
              <select
                className={inputClass}
                value={form.day_label}
                onChange={(e) => setForm((s) => ({ ...s, day_label: e.target.value }))}
              >
                {DAY_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground">Début</label>
                <input
                  type="time"
                  className={inputClass}
                  value={form.start_time}
                  onChange={(e) => setForm((s) => ({ ...s, start_time: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Fin</label>
                <input
                  type="time"
                  className={inputClass}
                  value={form.end_time}
                  onChange={(e) => setForm((s) => ({ ...s, end_time: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Statut</label>
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) =>
                  setForm((s) => ({ ...s, status: e.target.value as "active" | "draft" }))
                }
              >
                <option value="active">Actif</option>
                <option value="draft">Brouillon</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" type="button" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={!valid || create.isPending}>
                {create.isPending ? "Création…" : "Créer le shift"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
