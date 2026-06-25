"use client";

import { useState } from "react";
import { ModalPortal } from "@/shared/ui/ModalPortal";
import { Button } from "@/shared/ui/Button";
import { RentalPhotoUploader } from "./RentalPhotoUploader";
import type { RentalCheckInPayload } from "../api/rentalInspection.service";

const inputClass = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm";

/** État des lieux de départ (check-in) — photos obligatoires (DB-RENT-13). */
export function RentalCheckInModal({
  offerRef,
  isPending,
  onConfirm,
  onClose,
}: {
  offerRef?: string;
  isPending?: boolean;
  onConfirm: (data: RentalCheckInPayload) => void;
  onClose: () => void;
}) {
  const [photos, setPhotos] = useState<File[]>([]);
  const [kmStart, setKmStart] = useState("");
  const [fuelStart, setFuelStart] = useState("100");
  const [accessories, setAccessories] = useState("");
  const [comment, setComment] = useState("");
  const [signature, setSignature] = useState(false);

  const valid = photos.length >= 1 && kmStart !== "";

  const submit = () =>
    onConfirm({
      km_start: Number(kmStart),
      fuel_start: Number(fuelStart),
      accessories: accessories
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      comment: comment || undefined,
      signature,
      photos: photos.map((f) => f.name),
    });

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-overlay" onClick={onClose} />
        <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-card bg-surface p-6 shadow-card">
          <h2 className="mb-1 text-lg font-semibold">Check-in (état de départ)</h2>
          {offerRef && <p className="mb-4 text-sm text-muted">{offerRef}</p>}

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Photos d&apos;état de départ *</label>
              <RentalPhotoUploader files={photos} onChange={setPhotos} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Kilométrage départ *</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={kmStart}
                  onChange={(e) => setKmStart(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Carburant (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className={inputClass}
                  value={fuelStart}
                  onChange={(e) => setFuelStart(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Accessoires remis</label>
              <input
                className={inputClass}
                placeholder="Roue de secours, GPS, … (séparés par des virgules)"
                value={accessories}
                onChange={(e) => setAccessories(e.target.value)}
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
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={signature}
                onChange={(e) => setSignature(e.target.checked)}
              />
              Signature / validation du client recueillie
            </label>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={isPending}>
              Annuler
            </Button>
            <Button disabled={isPending || !valid} onClick={submit}>
              {isPending ? "En cours..." : "Valider la prise en charge"}
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
