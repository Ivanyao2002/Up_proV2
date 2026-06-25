"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { formatDate } from "@/shared/lib/format";
import { notificationService } from "@/core/http/notificationService";
import { usePartnerRentalVehicles } from "../api/rentalFleet.queries";
import {
  usePartnerRentalAvailability,
  useAddRentalBlock,
  useRemoveRentalBlock,
} from "../api/rentalAvailability.queries";
import { RentalCalendar } from "../components/RentalCalendar";
import {
  RENTAL_BLOCK_REASON_LABELS,
  type RentalBlockReason,
} from "../api/rentalAvailability.service";
import { RENTAL_VEHICLE_CATEGORY_LABELS } from "../api/rentalFleet.service";

const inputClass = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm";
const REASONS = Object.keys(RENTAL_BLOCK_REASON_LABELS) as RentalBlockReason[];

export function PartnerRentalCalendarPage() {
  const { data: fleet, isLoading: fleetLoading } = usePartnerRentalVehicles({ per_page: 200 });
  const vehicles = useMemo(() => fleet?.data ?? [], [fleet?.data]);
  const [vehicleId, setVehicleId] = useState<string>("");

  useEffect(() => {
    if (!vehicleId && vehicles.length > 0) setVehicleId(vehicles[0].id);
  }, [vehicles, vehicleId]);

  const { data: availability, isLoading } = usePartnerRentalAvailability(vehicleId);
  const addBlock = useAddRentalBlock();
  const removeBlock = useRemoveRentalBlock();

  const [block, setBlock] = useState<{
    start_date: string;
    end_date: string;
    reason: RentalBlockReason;
    note: string;
  }>({ start_date: "", end_date: "", reason: "maintenance", note: "" });

  const blocks = availability?.blocks ?? [];
  const reservations = availability?.reservations ?? [];

  const submitBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!block.start_date || !block.end_date) return;
    addBlock.mutate(
      { vehicleId, data: block },
      {
        onSuccess: () => {
          notificationService.success("Période bloquée");
          setBlock({ start_date: "", end_date: "", reason: "maintenance", note: "" });
        },
        onError: () => notificationService.error("Blocage impossible."),
      }
    );
  };

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader title="Calendrier & disponibilités" breadcrumb={["Partenaire", "Location", "Calendrier"]} />

      {fleetLoading ? (
        <p className="mt-6 text-sm text-muted">Chargement de la flotte…</p>
      ) : vehicles.length === 0 ? (
        <p className="mt-6 text-sm text-muted">
          Ajoutez d&apos;abord un véhicule à votre flotte.
        </p>
      ) : (
        <>
          <div className="mb-6 mt-6 max-w-md">
            <label className="mb-1 block text-sm font-medium text-foreground">Véhicule</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className={inputClass}
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {(v.label || v.plate || v.id) +
                    " — " +
                    (RENTAL_VEHICLE_CATEGORY_LABELS[v.category] ?? v.category)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-card border border-border bg-surface p-6 shadow-card lg:col-span-2">
              {isLoading ? (
                <p className="text-sm text-muted">Chargement du calendrier…</p>
              ) : (
                <RentalCalendar blocks={blocks} reservations={reservations} />
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-card border border-border bg-surface p-6 shadow-card">
                <h2 className="mb-4 text-sm font-semibold text-heading">Bloquer une période</h2>
                <form onSubmit={submitBlock} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted">Du</label>
                    <input
                      type="date"
                      required
                      className={inputClass}
                      value={block.start_date}
                      onChange={(e) => setBlock({ ...block, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted">Au</label>
                    <input
                      type="date"
                      required
                      className={inputClass}
                      value={block.end_date}
                      onChange={(e) => setBlock({ ...block, end_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted">Motif</label>
                    <select
                      className={inputClass}
                      value={block.reason}
                      onChange={(e) =>
                        setBlock({ ...block, reason: e.target.value as RentalBlockReason })
                      }
                    >
                      {REASONS.map((r) => (
                        <option key={r} value={r}>
                          {RENTAL_BLOCK_REASON_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    placeholder="Note (optionnel)"
                    className={inputClass}
                    value={block.note}
                    onChange={(e) => setBlock({ ...block, note: e.target.value })}
                  />
                  <Button type="submit" className="w-full" disabled={addBlock.isPending}>
                    {addBlock.isPending ? "Blocage..." : "Bloquer"}
                  </Button>
                </form>
              </div>

              <div className="rounded-card border border-border bg-surface p-6 shadow-card">
                <h2 className="mb-4 text-sm font-semibold text-heading">Périodes bloquées</h2>
                {blocks.length === 0 ? (
                  <p className="text-sm text-muted">Aucune période bloquée.</p>
                ) : (
                  <ul className="space-y-2">
                    {blocks.map((b) => (
                      <li
                        key={b.id}
                        className="flex items-center justify-between border-b border-border pb-2 text-sm last:border-0"
                      >
                        <div>
                          <div>
                            {formatDate(b.start_date)} → {formatDate(b.end_date)}
                          </div>
                          <div className="text-xs text-muted">
                            {RENTAL_BLOCK_REASON_LABELS[b.reason]}
                            {b.note ? ` · ${b.note}` : ""}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="text-xs text-red-600 hover:underline"
                          disabled={removeBlock.isPending}
                          onClick={() =>
                            removeBlock.mutate(
                              { vehicleId, blockId: b.id },
                              {
                                onSuccess: () => notificationService.success("Blocage retiré"),
                                onError: () =>
                                  notificationService.error("Suppression impossible."),
                              }
                            )
                          }
                        >
                          Retirer
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
