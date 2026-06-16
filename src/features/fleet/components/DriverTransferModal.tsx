"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/shared/ui/Button";
import { ModalPortal } from "@/shared/ui/ModalPortal";
import { partnersService } from "@/features/network/api/partners.service";
import { partnersKeys } from "@/features/network/api/partners.keys";
import { franchisePartnersService } from "@/features/franchise/api/partners.service";
import { franchisePartnersKeys } from "@/features/franchise/api/partners.queries";
import type { Partner } from "@/shared/types";

export interface DriverTransferModalProps {
  open: boolean;
  onClose: () => void;
  driverName: string;
  sourcePartnerId: string;
  sourcePartnerName?: string;
  vehicleLabel?: string | null;
  /** Admin : tous les partenaires. Franchise : même franchise uniquement. */
  scope: "admin" | "franchise";
  franchiseId?: string | number | null;
  isSubmitting?: boolean;
  onSubmit: (payload: { targetPartnerId: string; reason?: string }) => void;
}

function filterTargetPartners(
  partners: Partner[],
  sourcePartnerId: string,
  scope: "admin" | "franchise",
  franchiseId?: string | number | null
): Partner[] {
  const source = String(sourcePartnerId);
  return partners.filter((partner) => {
    if (String(partner.id) === source) return false;
    if (partner.status === "suspended") return false;
    if (scope === "franchise" && franchiseId != null) {
      return String(partner.franchise_id) === String(franchiseId);
    }
    return true;
  });
}

export function DriverTransferModal({
  open,
  onClose,
  driverName,
  sourcePartnerId,
  sourcePartnerName,
  vehicleLabel,
  scope,
  franchiseId,
  isSubmitting = false,
  onSubmit,
}: DriverTransferModalProps) {
  const [targetPartnerId, setTargetPartnerId] = useState("");
  const [reason, setReason] = useState("");

  const listParams = { page: 1, per_page: 200 };

  const adminPartners = useQuery({
    queryKey: partnersKeys.list(listParams),
    queryFn: () => partnersService.listAdmin(listParams),
    enabled: open && scope === "admin",
  });
  const franchisePartners = useQuery({
    queryKey: franchisePartnersKeys.list(listParams),
    queryFn: () => franchisePartnersService.list(listParams),
    enabled: open && scope === "franchise",
  });

  const partnersQuery = scope === "admin" ? adminPartners : franchisePartners;

  const targetPartners = useMemo(
    () =>
      filterTargetPartners(
        partnersQuery.data?.data ?? [],
        sourcePartnerId,
        scope,
        franchiseId
      ),
    [partnersQuery.data?.data, sourcePartnerId, scope, franchiseId]
  );

  useEffect(() => {
    if (!open) {
      setTargetPartnerId("");
      setReason("");
    }
  }, [open]);

  if (!open) return null;

  const selectedPartner = targetPartners.find(
    (p) => String(p.id) === targetPartnerId
  );

  return (
    <ModalPortal>
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
          className="relative w-full max-w-lg rounded-card bg-surface p-6 shadow-card"
        >
          <h2 className="text-lg font-semibold text-heading">
            Transférer le chauffeur
          </h2>
          <p className="mt-1 text-sm text-muted">
            Déplace <span className="font-medium text-foreground">{driverName}</span>
            {vehicleLabel ? (
              <>
                {" "}
                et son véhicule <span className="font-medium">{vehicleLabel}</span>
              </>
            ) : (
              " et son(ses) véhicule(s) rattaché(s)"
            )}{" "}
            vers un autre partenaire.
          </p>

          <dl className="mt-4 space-y-2 rounded-lg border border-border bg-canvas/60 px-4 py-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Partenaire actuel</dt>
              <dd className="text-right font-medium text-foreground">
                {sourcePartnerName ?? sourcePartnerId}
              </dd>
            </div>
            {scope === "franchise" && (
              <div className="text-xs text-muted">
                Transfert limité aux partenaires de votre franchise.
              </div>
            )}
          </dl>

          <label className="mt-4 block">
            <span className="text-sm font-medium">Nouveau partenaire</span>
            <select
              value={targetPartnerId}
              onChange={(e) => setTargetPartnerId(e.target.value)}
              disabled={partnersQuery.isLoading || isSubmitting}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            >
              <option value="">Sélectionner…</option>
              {targetPartners.map((partner) => (
                <option key={String(partner.id)} value={String(partner.id)}>
                  {partner.name} · {partner.city}
                </option>
              ))}
            </select>
          </label>

          {targetPartners.length === 0 && !partnersQuery.isLoading && (
            <p className="mt-2 text-sm text-amber-700">
              Aucun autre partenaire éligible pour ce transfert.
            </p>
          )}

          {selectedPartner && (
            <p className="mt-2 text-xs text-muted">
              Franchise : {selectedPartner.franchise_name || "—"}
            </p>
          )}

          <label className="mt-4 block">
            <span className="text-sm font-medium">Motif (optionnel)</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              placeholder="Ex. changement de flotte, regroupement partenaire…"
              className="mt-1 w-full resize-none rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            />
          </label>

          <p className="mt-3 text-xs text-muted">
            Le chauffeur sera mis hors ligne et retiré du dispatch. Les véhicules
            liés suivront automatiquement.
          </p>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button
              disabled={
                !targetPartnerId || isSubmitting || targetPartners.length === 0
              }
              onClick={() =>
                onSubmit({
                  targetPartnerId,
                  reason: reason.trim() || undefined,
                })
              }
            >
              {isSubmitting ? "Transfert…" : "Confirmer le transfert"}
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
