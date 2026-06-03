"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { formatFCFA } from "@/shared/lib/format";
import { usePartnerDriversList } from "../api/drivers.queries";
import { usePartnerDriverRecharge } from "../api/wallet.queries";

interface PartnerDriverRechargeModalProps {
  open: boolean;
  availableFcfa: number;
  onClose: () => void;
}

export function PartnerDriverRechargeModal({
  open,
  availableFcfa,
  onClose,
}: PartnerDriverRechargeModalProps) {
  const [driverId, setDriverId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const { data: driversData, isLoading: driversLoading } = usePartnerDriversList({
    page: 1,
    per_page: 100,
    account_status: "approved",
  });
  const recharge = usePartnerDriverRecharge();

  if (!open) return null;

  const drivers = driversData?.data ?? [];
  const parsedAmount = Number(amount.replace(/\s/g, ""));
  const parsedDriverId = Number(driverId);
  const valid =
    parsedDriverId > 0 &&
    parsedAmount >= 1000 &&
    parsedAmount <= availableFcfa;

  return (
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
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-card bg-surface p-6 shadow-card"
      >
        <h2 className="text-lg font-semibold text-heading">
          Recharger un chauffeur
        </h2>
        <p className="mt-1 text-sm text-muted">
          Le montant est crédité sur le portefeuille mobile du chauffeur dans
          l&apos;application. Disponible : {formatFCFA(availableFcfa)}
        </p>

        <label className="mt-4 block">
          <span className="text-sm font-medium">Chauffeur</span>
          <select
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            disabled={driversLoading}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          >
            <option value="">Sélectionner…</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.first_name} {d.last_name} · {d.zone}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-medium">Montant (FCFA)</span>
          <input
            type="number"
            min={1000}
            max={availableFcfa}
            step={500}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            placeholder="Ex. 25000"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-medium">Note (optionnel)</span>
          <input
            type="text"
            maxLength={120}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            placeholder="Ex. Prime, avance carburant…"
          />
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            disabled={!valid || recharge.isPending}
            onClick={() => {
              if (!valid) return;
              recharge.mutate(
                {
                  driver_id: parsedDriverId,
                  amount_fcfa: parsedAmount,
                  note: note.trim() || undefined,
                },
                {
                  onSuccess: () => {
                    setDriverId("");
                    setAmount("");
                    setNote("");
                    onClose();
                  },
                }
              );
            }}
          >
            {recharge.isPending ? "Transfert…" : "Transférer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
