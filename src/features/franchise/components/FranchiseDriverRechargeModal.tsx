"use client";

import { useMemo } from "react";
import { DriverRechargeModal } from "@/shared/wallet/DriverRechargeModal";
import { useFranchiseDriversList } from "../api/drivers.queries";
import { useFranchiseDriverRecharge } from "../api/finance.queries";

interface FranchiseDriverRechargeModalProps {
  open: boolean;
  availableFcfa: number;
  onClose: () => void;
}

export function FranchiseDriverRechargeModal({
  open,
  availableFcfa,
  onClose,
}: FranchiseDriverRechargeModalProps) {
  const { data: driversData, isLoading: driversLoading } = useFranchiseDriversList({
    page: 1,
    per_page: 100,
    account_status: "approved",
  });
  const recharge = useFranchiseDriverRecharge();

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
      onClose={onClose}
      onSubmit={(payload) => {
        recharge.mutate(payload, {
          onSuccess: () => onClose(),
        });
      }}
    />
  );
}
