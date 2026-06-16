"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/shared/ui/Button";
import { ModalPortal } from "@/shared/ui/ModalPortal";
import { partnersService } from "@/features/network/api/partners.service";
import { partnersKeys } from "@/features/network/api/partners.keys";
import { franchisePartnersService } from "@/features/franchise/api/partners.service";
import { franchisePartnersKeys } from "@/features/franchise/api/partners.queries";
import {
  prepareBulkDriverTransfers,
  resolveDriverSourcePartnerId,
} from "@/features/fleet/api/driverTransfer.service";
import type { Driver, Partner } from "@/shared/types";

export interface BulkDriverTransferModalProps {
  open: boolean;
  onClose: () => void;
  drivers: Driver[];
  selectedIds: Array<string | number>;
  scope: "admin" | "franchise";
  franchiseId?: string | number | null;
  isSubmitting?: boolean;
  onSubmit: (payload: { targetPartnerId: string; reason?: string }) => void;
}

function filterBulkTargetPartners(
  partners: Partner[],
  scope: "admin" | "franchise",
  franchiseId?: string | number | null
): Partner[] {
  return partners.filter((partner) => {
    if (partner.status === "suspended") return false;
    if (scope === "franchise" && franchiseId != null) {
      return String(partner.franchise_id) === String(franchiseId);
    }
    return true;
  });
}

export function BulkDriverTransferModal({
  open,
  onClose,
  drivers,
  selectedIds,
  scope,
  franchiseId,
  isSubmitting = false,
  onSubmit,
}: BulkDriverTransferModalProps) {
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
      filterBulkTargetPartners(
        partnersQuery.data?.data ?? [],
        scope,
        franchiseId
      ),
    [partnersQuery.data?.data, scope, franchiseId]
  );

  const selectionSummary = useMemo(() => {
    const idSet = new Set(selectedIds.map(String));
    const selected = drivers.filter((d) => idSet.has(String(d.id)));
    const sourcePartnerIds = new Set(
      selected
        .map((d) => resolveDriverSourcePartnerId(d))
        .filter((id): id is string => Boolean(id))
    );
    return {
      total: selected.length,
      sourcePartners: sourcePartnerIds.size,
      withoutPartner: selected.filter((d) => !resolveDriverSourcePartnerId(d))
        .length,
    };
  }, [drivers, selectedIds]);

  const eligiblePreview = useMemo(() => {
    if (!targetPartnerId) return null;
    return prepareBulkDriverTransfers(drivers, selectedIds, targetPartnerId);
  }, [drivers, selectedIds, targetPartnerId]);

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
            Transférer les chauffeurs sélectionnés
          </h2>
          <p className="mt-1 text-sm text-muted">
            Déplace{" "}
            <span className="font-medium text-foreground">
              {selectionSummary.total} chauffeur
              {selectionSummary.total > 1 ? "s" : ""}
            </span>{" "}
            (et leurs véhicules rattachés) vers un même partenaire cible.
          </p>

          <dl className="mt-4 space-y-2 rounded-lg border border-border bg-canvas/60 px-4 py-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Sélection</dt>
              <dd className="text-right font-medium text-foreground">
                {selectionSummary.total} chauffeur
                {selectionSummary.total > 1 ? "s" : ""}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Partenaires source</dt>
              <dd className="text-right font-medium text-foreground">
                {selectionSummary.sourcePartners || "—"}
              </dd>
            </div>
            {selectionSummary.withoutPartner > 0 && (
              <p className="text-xs text-amber-700">
                {selectionSummary.withoutPartner} chauffeur
                {selectionSummary.withoutPartner > 1 ? "s" : ""} sans partenaire
                seront ignorés.
              </p>
            )}
            {scope === "franchise" && (
              <p className="text-xs text-muted">
                Transfert limité aux partenaires de votre franchise.
              </p>
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

          {eligiblePreview && targetPartnerId && (
            <p className="mt-2 text-xs text-muted">
              {eligiblePreview.eligible.length} transfert
              {eligiblePreview.eligible.length > 1 ? "s" : ""} à effectuer
              {eligiblePreview.skippedCount > 0
                ? ` · ${eligiblePreview.skippedCount} ignoré${eligiblePreview.skippedCount > 1 ? "s" : ""}`
                : ""}
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
              placeholder="Ex. regroupement de flotte, changement de partenaire…"
              className="mt-1 w-full resize-none rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            />
          </label>

          <p className="mt-3 text-xs text-muted">
            Chaque chauffeur sera mis hors ligne. Les véhicules liés suivront
            automatiquement.
          </p>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button
              disabled={
                !targetPartnerId ||
                isSubmitting ||
                targetPartners.length === 0 ||
                (eligiblePreview?.eligible.length ?? 0) === 0
              }
              onClick={() =>
                onSubmit({
                  targetPartnerId,
                  reason: reason.trim() || undefined,
                })
              }
            >
              {isSubmitting
                ? "Transfert en cours…"
                : `Transférer ${eligiblePreview?.eligible.length ?? selectionSummary.total} chauffeur${(eligiblePreview?.eligible.length ?? selectionSummary.total) > 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
