"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DriverRechargeModal } from "@/shared/wallet/DriverRechargeModal";
import { Button } from "@/shared/ui/Button";
import { formatFCFA } from "@/shared/lib/format";
import { usePartnersList } from "@/features/network/api/partners.queries";
import {
  fetchPartnerDriversForRecharge,
  fetchPartnerWalletAvailableFcfa,
} from "../api/adminDriverRecharge.service";
import { useAdminDriverRecharge } from "../api/driverTransfers.queries";

interface AdminDriverRechargeModalProps {
  open: boolean;
  onClose: () => void;
}

export function AdminDriverRechargeModal({
  open,
  onClose,
}: AdminDriverRechargeModalProps) {
  const [partnerId, setPartnerId] = useState("");
  const recharge = useAdminDriverRecharge();

  const { data: partnersData, isLoading: partnersLoading } = usePartnersList({
    page: 1,
    per_page: 100,
  });

  const { data: walletAvailable = 0, isLoading: walletLoading } = useQuery({
    queryKey: ["admin", "partner-wallet", partnerId],
    queryFn: () => fetchPartnerWalletAvailableFcfa(partnerId),
    enabled: open && Boolean(partnerId),
  });

  const { data: driversData, isLoading: driversLoading } = useQuery({
    queryKey: ["admin", "partner-drivers-recharge", partnerId],
    queryFn: () => fetchPartnerDriversForRecharge(partnerId),
    enabled: open && Boolean(partnerId),
  });

  useEffect(() => {
    if (!open) setPartnerId("");
  }, [open]);

  const drivers = useMemo(
    () =>
      (driversData?.data ?? []).map((d) => ({
        id: String(d.id),
        label: `${d.first_name} ${d.last_name} · ${d.zone}`,
      })),
    [driversData?.data]
  );

  if (!open) return null;

  if (!partnerId) {
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
          className="relative w-full max-w-md rounded-card bg-surface p-6 shadow-card"
        >
          <h2 className="text-lg font-semibold text-heading">
            Nouvelle recharge chauffeur
          </h2>
          <p className="mt-1 text-sm text-muted">
            Sélectionnez le partenaire dont le portefeuille financera la
            recharge (route API partenaire).
          </p>
          <label className="mt-4 block">
            <span className="text-sm font-medium">Partenaire</span>
            <select
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              disabled={partnersLoading}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            >
              <option value="">Sélectionner…</option>
              {(partnersData?.data ?? []).map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name} · {p.city}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Annuler
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DriverRechargeModal
      open
      availableFcfa={walletAvailable}
      drivers={drivers}
      driversLoading={driversLoading || walletLoading}
      isSubmitting={recharge.isPending}
      description={`Recharge via le portefeuille partenaire sélectionné. Disponible : ${
        walletLoading ? "…" : formatFCFA(walletAvailable)
      }`}
      onClose={onClose}
      onSubmit={(payload) => {
        recharge.mutate(
          { partnerId, ...payload },
          { onSuccess: () => onClose() }
        );
      }}
    />
  );
}
