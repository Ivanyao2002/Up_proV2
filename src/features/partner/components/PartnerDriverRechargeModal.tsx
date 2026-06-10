"use client";

import { useMemo } from "react";
import { DriverRechargeModal } from "@/shared/wallet/DriverRechargeModal";
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
  const { data: driversData, isLoading: driversLoading } = usePartnerDriversList({
    page: 1,
    per_page: 100,
    account_status: "approved",
  });
  const recharge = usePartnerDriverRecharge();

  const drivers = useMemo(
    () =>
      (driversData?.data ?? []).map((d) => ({
        id: String(d.id),
        label: `${d.first_name} ${d.last_name} · ${d.zone}`,
      })),
    [driversData?.data]
  );

  return (
    <DriverRechargeModal
      open={open}
      availableFcfa={availableFcfa}
      drivers={drivers}
      driversLoading={driversLoading}
      isSubmitting={recharge.isPending}
      description={`Le montant est crédité sur le portefeuille mobile du chauffeur dans l'application. Disponible : ${availableFcfa.toLocaleString("fr-FR")} FCFA`}
      onClose={onClose}
      onSubmit={(payload) => {
        recharge.mutate(payload, {
          onSuccess: () => onClose(),
        });
      }}
    />
  );
}
