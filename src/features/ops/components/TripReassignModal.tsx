"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { useReassignCandidates, useReassignTrip } from "../api/tripDetail.queries";

interface TripReassignModalProps {
  tripId: string;
  tripRef: string;
  open: boolean;
  onClose: () => void;
}

export function TripReassignModal({
  tripId,
  tripRef,
  open,
  onClose,
}: TripReassignModalProps) {
  const [driverId, setDriverId] = useState<number | "">("");
  const { data, isLoading } = useReassignCandidates(tripId, open);
  const reassign = useReassignTrip(tripId);

  if (!open) return null;

  const candidates = data?.data ?? [];

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
        className="relative w-full max-w-md rounded-card bg-surface p-6 shadow-card"
      >
        <h2 className="text-lg font-semibold text-navy">Réassigner la course</h2>
        <p className="mt-1 text-sm text-muted">{tripRef}</p>

        <label className="mt-4 block">
          <span className="text-sm font-medium">Chauffeur disponible</span>
          <select
            value={driverId === "" ? "" : String(driverId)}
            onChange={(e) =>
              setDriverId(e.target.value ? Number(e.target.value) : "")
            }
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            disabled={isLoading}
          >
            <option value="">— Choisir —</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.vehicle}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            disabled={driverId === "" || reassign.isPending}
            onClick={() => {
              if (driverId === "") return;
              reassign.mutate(driverId, {
                onSuccess: () => {
                  onClose();
                  setDriverId("");
                },
              });
            }}
          >
            {reassign.isPending ? "Assignation…" : "Confirmer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
