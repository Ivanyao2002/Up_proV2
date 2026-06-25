"use client";

import { useState } from "react";
import { ModalPortal } from "@/shared/ui/ModalPortal";
import { Button } from "@/shared/ui/Button";
import { RentalPhotoUploader } from "./RentalPhotoUploader";
import {
  RENTAL_INCIDENT_TYPE_LABELS,
  type CreateRentalIncidentPayload,
  type RentalIncidentType,
} from "../api/rentalIncident.service";

const inputClass = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm";
const TYPES = Object.keys(RENTAL_INCIDENT_TYPE_LABELS) as RentalIncidentType[];

/** Déclaration d'incident → ouverture ticket automatique (DB-RENT-18). */
export function RentalIncidentModal({
  offerRef,
  isPending,
  onConfirm,
  onClose,
}: {
  offerRef?: string;
  isPending?: boolean;
  onConfirm: (data: CreateRentalIncidentPayload) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<RentalIncidentType>("dommage");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);

  const valid = description.trim().length > 0;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-overlay" onClick={onClose} />
        <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-card bg-surface p-6 shadow-card">
          <h2 className="mb-1 text-lg font-semibold">Signaler un incident</h2>
          {offerRef && <p className="mb-4 text-sm text-muted">{offerRef}</p>}

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Type</label>
              <select
                className={inputClass}
                value={type}
                onChange={(e) => setType(e.target.value as RentalIncidentType)}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {RENTAL_INCIDENT_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Description *</label>
              <textarea
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder="Décrivez l'incident…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Pièces jointes</label>
              <RentalPhotoUploader files={attachments} onChange={setAttachments} min={0} />
            </div>
          </div>

          <p className="mt-3 text-xs text-muted">
            Un ticket de support sera ouvert automatiquement pour le suivi.
          </p>

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={isPending}>
              Annuler
            </Button>
            <Button
              disabled={isPending || !valid}
              onClick={() =>
                onConfirm({
                  type,
                  description: description.trim(),
                  attachments: attachments.map((f) => f.name),
                })
              }
            >
              {isPending ? "Envoi..." : "Signaler"}
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
