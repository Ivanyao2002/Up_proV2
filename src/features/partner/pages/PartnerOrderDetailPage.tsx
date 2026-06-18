"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { StatusPill } from "@/shared/ui/StatusPill";
import { ServicePill } from "@/shared/ui/ServicePill";
import { Button } from "@/shared/ui/Button";
import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { getPaymentLabel } from "@/shared/lib/paymentLabels";
import { usePartnerOrderDetail } from "../api/orders.queries";

interface Props {
  orderId: string;
}

export function PartnerOrderDetailPage({ orderId }: Props) {
  const { data: order, isLoading, isError } = usePartnerOrderDetail(orderId);

  if (isLoading) {
    return <DetailPageSkeleton title="Course" breadcrumb={["Partenaire", "Courses"]} />;
  }

  if (isError || !order) {
    return (
      <p className="text-sm text-red-600">
        Course introuvable.{" "}
        <Link href="/partner/orders" className="text-teal underline">
          Retour
        </Link>
      </p>
    );
  }

  return (
    <div className="animate-fade-up mx-auto w-full max-w-6xl">
      <PageHeader
        title={order.ref}
        breadcrumb={["Partenaire", "Courses", order.ref]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {order.service && <ServicePill service={order.service} />}
            <StatusPill status={order.status} pulse={order.status === "in_progress"} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Colonne principale */}
        <div className="space-y-6">
          {/* Trajet */}
          <div className="rounded-card border border-border bg-surface p-6 shadow-card">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Trajet
            </h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal/10 text-xs font-bold text-teal">
                  A
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{order.from_label}</p>
                  <p className="text-xs text-muted">Point de départ</p>
                </div>
              </div>
              <div className="ml-3 h-6 w-px bg-border" />
              <div className="flex items-start gap-3">
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-xs font-bold text-red-500">
                  B
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{order.to_label}</p>
                  <p className="text-xs text-muted">Destination</p>
                </div>
              </div>
            </div>
          </div>

          {/* Client & Chauffeur */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-card border border-border bg-surface p-5 shadow-card">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
                Client
              </h3>
              <p className="mt-2 font-medium text-foreground">{order.client_name || "—"}</p>
              {order.client_phone && (
                <p className="mt-1 text-sm text-muted">{order.client_phone}</p>
              )}
            </div>
            <div className="rounded-card border border-border bg-surface p-5 shadow-card">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
                Chauffeur
              </h3>
              {order.driver_name ? (
                <>
                  <Link
                    href={`/partner/drivers/${order.driver_id ?? ""}`}
                    className="mt-2 block font-medium text-foreground hover:text-teal"
                  >
                    {order.driver_name}
                  </Link>
                  {order.driver_phone && (
                    <p className="mt-1 text-sm text-muted">{order.driver_phone}</p>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm text-muted">
                  {order.driver_id
                    ? `ID : ${String(order.driver_id).slice(0, 8)}…`
                    : "Non assigné"}
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="rounded-card border border-border bg-surface p-5 shadow-card">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
                Notes
              </h3>
              <p className="mt-2 text-sm text-foreground">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">Montant</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-heading">
              {order.amount_fcfa != null ? formatFCFA(order.amount_fcfa) : "—"}
            </p>
            {order.payment_method && (
              <p className="mt-1 text-sm text-muted">{getPaymentLabel(order.payment_method)}</p>
            )}
            {order.payment_status && (
              <p className="mt-1 text-xs text-muted capitalize">{order.payment_status}</p>
            )}
          </div>

          <div className="rounded-card border border-border bg-surface p-5 shadow-card text-sm">
            <h3 className="font-semibold text-foreground">Détails</h3>
            <dl className="mt-3 space-y-2 text-muted">
              <div className="flex justify-between gap-2">
                <dt>Référence</dt>
                <dd className="font-mono text-xs text-foreground">{order.ref}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Statut</dt>
                <dd className="text-foreground">
                  <StatusPill status={order.status} />
                </dd>
              </div>
              {order.category_code && (
                <div className="flex justify-between gap-2">
                  <dt>Catégorie</dt>
                  <dd className="text-foreground">{order.category_code}</dd>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <dt>Créée le</dt>
                <dd className="text-foreground">{formatDateTime(order.created_at)}</dd>
              </div>
              {order.scheduled_at && (
                <div className="flex justify-between gap-2">
                  <dt>Programmée</dt>
                  <dd className="text-foreground">{formatDateTime(order.scheduled_at)}</dd>
                </div>
              )}
            </dl>
          </div>

          <Link href="/partner/orders">
            <Button variant="secondary" className="w-full">
              ← Retour aux courses
            </Button>
          </Link>
        </aside>
      </div>
    </div>
  );
}
