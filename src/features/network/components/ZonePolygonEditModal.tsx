"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/Button";
import {
  AbidjanZonesMap,
  type ZoneMapItem,
} from "./AbidjanZonesMap";

interface ZonePolygonEditModalProps {
  open: boolean;
  zoneId: number;
  zoneName: string;
  initialRing: number[][];
  referenceZones: ZoneMapItem[];
  cityLabel?: string;
  onClose: () => void;
  onSave: (ring: number[][]) => void;
  isSaving?: boolean;
}

export function ZonePolygonEditModal({
  open,
  zoneName,
  initialRing,
  referenceZones,
  cityLabel = "Abidjan",
  onClose,
  onSave,
  isSaving,
}: ZonePolygonEditModalProps) {
  const [draftRing, setDraftRing] = useState<number[][]>([]);

  useEffect(() => {
    if (open) {
      const ring = initialRing;
      if (ring.length > 1 && ring[0][0] === ring[ring.length - 1][0]) {
        setDraftRing(ring.slice(0, -1));
      } else {
        setDraftRing(ring);
      }
    }
  }, [open, initialRing]);

  if (!open) return null;

  const others = referenceZones.filter((z) => z.name !== zoneName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-navy/40"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-card bg-surface shadow-card"
      >
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-navy">Modifier le polygone</h2>
          <p className="mt-1 text-sm text-muted">{zoneName}</p>
        </div>

        <div className="overflow-y-auto p-6">
          <AbidjanZonesMap
            mode="draw"
            zones={others}
            cityLabel={cityLabel}
            draftRing={draftRing}
            onDraftPoint={(lng, lat) =>
              setDraftRing((prev) => [...prev, [lng, lat]])
            }
            onUndoDraftPoint={() => setDraftRing((prev) => prev.slice(0, -1))}
            onClearDraft={() => setDraftRing([])}
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            disabled={draftRing.length < 3 || isSaving}
            onClick={() => onSave(draftRing)}
          >
            {isSaving ? "Enregistrement…" : "Enregistrer le polygone"}
          </Button>
        </div>
      </div>
    </div>
  );
}
