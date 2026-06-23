"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/Button";
import { ModalPortal } from "@/shared/ui/ModalPortal";
import { useCreateGpsDevice, useUpdateGpsDevice } from "../api/gps.queries";
import type { GpsDevice } from "../api/gps.service";

interface PartnerGpsDeviceFormModalProps {
  open: boolean;
  device?: GpsDevice | null;
  onClose: () => void;
}

const inputClass =
  "mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2";

export function PartnerGpsDeviceFormModal({
  open,
  device,
  onClose,
}: PartnerGpsDeviceFormModalProps) {
  const isEdit = Boolean(device);
  const [imei, setImei] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [status, setStatus] = useState<GpsDevice["status"]>("offline");

  const create = useCreateGpsDevice();
  const update = useUpdateGpsDevice(device?.id ?? "");

  useEffect(() => {
    if (open) {
      setImei(device?.imei ?? "");
      setDeviceId(device?.device_id ?? "");
      setVehicleId(device?.vehicle_id ?? "");
      setStatus(device?.status ?? "offline");
    }
  }, [open, device]);

  if (!open) return null;

  const pending = create.isPending || update.isPending;
  const valid = isEdit ? true : imei.trim().length > 0;

  const handleSubmit = () => {
    if (!valid || pending) return;
    if (isEdit) {
      update.mutate(
        { vehicle_id: vehicleId.trim() || undefined, status },
        { onSuccess: onClose }
      );
    } else {
      create.mutate(
        {
          imei: imei.trim(),
          device_id: deviceId.trim() || undefined,
          vehicle_id: vehicleId.trim() || undefined,
        },
        { onSuccess: onClose }
      );
    }
  };

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-overlay animate-fade-up"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        className="relative w-full max-w-md rounded-card bg-surface p-6 shadow-card animate-fade-up"
      >
        <h2 className="text-lg font-semibold text-heading">
          {isEdit ? "Modifier la balise GPS" : "Ajouter une balise GPS"}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {isEdit
            ? "Mettez à jour l'assignation et le statut de la balise."
            : "Enregistrez une nouvelle balise GPS pour votre flotte."}
        </p>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-sm font-medium">IMEI</span>
            <input
              className={inputClass}
              value={imei}
              onChange={(e) => setImei(e.target.value)}
              disabled={isEdit}
              placeholder="868000000000000"
            />
          </label>

          {!isEdit && (
            <label className="block">
              <span className="text-sm font-medium">Identifiant device (optionnel)</span>
              <input
                className={inputClass}
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="GPS-001"
              />
            </label>
          )}

          <label className="block">
            <span className="text-sm font-medium">ID véhicule assigné (optionnel)</span>
            <input
              className={inputClass}
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              placeholder="UUID du véhicule"
            />
          </label>

          {isEdit && (
            <label className="block">
              <span className="text-sm font-medium">Statut</span>
              <select
                className={inputClass}
                value={status}
                onChange={(e) => setStatus(e.target.value as GpsDevice["status"])}
              >
                <option value="online">En ligne</option>
                <option value="offline">Hors ligne</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </label>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!valid || pending} onClick={handleSubmit}>
            {pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Ajouter"}
          </Button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
