"use client";

import { useState } from "react";
import { ModalPortal } from "@/shared/ui/ModalPortal";
import { Button } from "@/shared/ui/Button";
import { RentalPhotoUploader } from "./RentalPhotoUploader";
import type { RentalCheckOutPayload } from "../api/rentalInspection.service";

const inputClass = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm";

/**
 * État des lieux de retour (check-out) — photos obligatoires (DB-RENT-13).
 * Les extras (retard, dépassement km, dommages) sont calculés côté serveur
 * et renvoyés après validation.
 */
export function RentalCheckOutModal({
  offerRef,
  isPending,
  onConfirm,
  onClose,
}: {
  offerRef?: string;
  isPending?: boolean;
  onConfirm: (data: RentalCheckOutPayload) => void;
  onClose: () => void;
}) {
  const [photos, setPhotos] = useState<File[]>([]);
  const [kmEnd, setKmEnd] = useState("");
  const [fuelEnd, setFuelEnd] = useState("100");
  const [damages, setDamages] = useState("");
  const [comment, setComment] = useState("");

  const valid = photos.length >= 1 && kmEnd !== "";

  const submit = () =>
    onConfirm({
      km_end: Number(kmEnd),
      fuel_end: Number(fuelEnd),
      damages: damages
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      comment: comment || undefined,
      photos: photos.map((f) => f.name),
    });

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-overlay" onClick={onClose} />
        <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-card bg-surface p-6 shadow-card">
          <h2 className="mb-1 text-lg font-semibold">Check-out (état de retour)</h2>
          {offerRef && <p className="mb-4 text-sm text-muted">{offerRef}</p>}

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Photos d&apos;état de retour *</label>
              <RentalPhotoUploader files={photos} onChange={setPhotos} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Kilométrage retour *</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={kmEnd}
                  onChange={(e) => setKmEnd(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Carburant (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className={inputClass}
                  value={fuelEnd}
                  onChange={(e) => setFuelEnd(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Dommages constatés</label>
              <textarea
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder="Un dommage par ligne…"
                value={damages}
                onChange={(e) => setDamages(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Commentaire</label>
              <textarea
                rows={2}
                className={`${inputClass} resize-none`}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          </div>

          <p className="mt-3 text-xs text-muted">
            Les extras éventuels (retard, dépassement km, dommages) seront calculés
            automatiquement et ajoutés à la facture finale.
          </p>

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={isPending}>
              Annuler
            </Button>
            <Button disabled={isPending || !valid} onClick={submit}>
              {isPending ? "En cours..." : "Valider le retour"}
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
