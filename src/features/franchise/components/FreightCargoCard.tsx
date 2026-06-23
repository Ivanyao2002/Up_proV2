"use client";

import { formatFCFA } from "@/shared/lib/format";
import type { TripDetail } from "@/shared/types";

function IconPackage({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4 7.55 4.24" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" x2="12" y1="22" y2="12" />
    </svg>
  );
}
function IconTruck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" /><rect width="13" height="9" x="9" y="11" rx="1" /><circle cx="6.5" cy="17.5" r="2.5" /><circle cx="16.5" cy="17.5" r="2.5" />
    </svg>
  );
}
function IconWeight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="3" /><path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z" />
    </svg>
  );
}
function IconRuler({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.3 8.7 8.7 21.3c-1 1-2.5 1-3.4 0l-2.6-2.6c-1-1-1-2.5 0-3.4L15.3 2.7c1-1 2.5-1 3.4 0l2.6 2.6c1 1 1 2.5 0 3.4Z" /><path d="m7.5 10.5 2 2" /><path d="m10.5 7.5 2 2" /><path d="m13.5 4.5 2 2" /><path d="m4.5 13.5 2 2" />
    </svg>
  );
}
function IconShieldCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" />
    </svg>
  );
}
function IconShieldOff({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-3.16 1.18" /><path d="M4.73 4.73 4 5v7c0 6 8 10 8 10a20.29 20.29 0 0 0 5.62-4.38" /><line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}
function IconRoute({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="3" /><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" /><circle cx="18" cy="5" r="3" />
    </svg>
  );
}
function IconCreditCard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}
function IconFileText({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  CAMION_3T: "Camion 3 tonnes",
  CAMION_5T: "Camion 5 tonnes",
  CAMION_10T: "Camion 10 tonnes",
  CAMION_20T: "Camion 20 tonnes",
  PICKUP: "Pick-up",
  MOTO: "Moto",
  TRICYCLE: "Tricycle",
};

const PAYMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "text-amber-600 bg-amber-50" },
  paid: { label: "Payé", color: "text-emerald-600 bg-emerald-50" },
  failed: { label: "Échoué", color: "text-red-600 bg-red-50" },
  refunded: { label: "Remboursé", color: "text-blue-600 bg-blue-50" },
};

function DataRow({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-teal)]/8">
        <Icon className="h-4 w-4 text-[var(--color-teal)]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
        <p className={`mt-0.5 text-sm font-semibold text-foreground ${mono ? "font-mono" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

interface FreightCargoCardProps {
  cargo: NonNullable<TripDetail["freight_cargo"]>;
  estimatedPriceXof?: number;
}

export function FreightCargoCard({ cargo, estimatedPriceXof }: FreightCargoCardProps) {
  const vehicleLabel =
    cargo.vehicle_type_code
      ? (VEHICLE_TYPE_LABELS[cargo.vehicle_type_code] ?? cargo.vehicle_type_code)
      : null;

  const paymentInfo = cargo.payment_status
    ? (PAYMENT_STATUS_LABELS[cargo.payment_status] ?? { label: cargo.payment_status, color: "text-muted bg-muted/10" })
    : null;

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-[var(--color-teal)]/5 to-transparent px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-teal)]/10">
          <IconPackage className="h-5 w-5 text-[var(--color-teal)]" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Cargaison</h2>
          <p className="text-xs text-muted">Détails du fret transporté</p>
        </div>
      </div>

      <div className="divide-y divide-border px-5">
        {cargo.description && (
          <DataRow
            icon={IconFileText}
            label="Description"
            value={cargo.description}
          />
        )}

        {vehicleLabel && (
          <DataRow
            icon={IconTruck}
            label="Type de véhicule requis"
            value={vehicleLabel}
          />
        )}

        {cargo.weight_kg != null && (
          <DataRow
            icon={IconWeight}
            label="Poids"
            value={`${cargo.weight_kg.toLocaleString("fr-CI")} kg`}
          />
        )}

        {cargo.volume_m3 != null && (
          <DataRow
            icon={IconRuler}
            label="Volume"
            value={`${cargo.volume_m3} m³`}
          />
        )}

        {cargo.distance_km != null && (
          <DataRow
            icon={IconRoute}
            label="Distance estimée"
            value={`${cargo.distance_km.toLocaleString("fr-CI", { maximumFractionDigits: 1 })} km`}
          />
        )}

        {estimatedPriceXof != null && (
          <DataRow
            icon={IconCreditCard}
            label="Prix estimé"
            value={formatFCFA(estimatedPriceXof)}
          />
        )}

        <DataRow
          icon={cargo.customs_required ? IconShieldCheck : IconShieldOff}
          label="Dédouanement"
          value={
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                cargo.customs_required
                  ? "bg-amber-50 text-amber-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {cargo.customs_required ? "Requis" : "Non requis"}
            </span>
          }
        />

        {paymentInfo && (
          <div className="flex items-center justify-between py-3">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">
              Statut paiement
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${paymentInfo.color}`}
            >
              {paymentInfo.label}
            </span>
          </div>
        )}

        {cargo.order_reference && (
          <DataRow
            icon={IconFileText}
            label="Référence commande"
            value={cargo.order_reference}
            mono
          />
        )}
      </div>
    </div>
  );
}
