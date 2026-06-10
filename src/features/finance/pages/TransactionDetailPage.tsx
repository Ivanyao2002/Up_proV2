"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { KpiCard } from "@/shared/ui/KpiCard";
import { TransactionStatusPill } from "@/shared/ui/TransactionStatusPill";
import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { TRANSACTION_TYPE_LABELS } from "@/shared/lib/financeLabels";
import { getPaymentLabel } from "@/shared/lib/paymentLabels";
import { useTransactionDetail } from "../api/transactions.queries";

interface TransactionDetailPageProps {
  transactionId: string;
}

export function TransactionDetailPage({ transactionId }: TransactionDetailPageProps) {
  const { data, isLoading, isError } = useTransactionDetail(transactionId);

  if (isLoading) {
    return (
      <DetailPageSkeleton
        title="Transaction"
        breadcrumb={["Admin", "Finance", "Transactions"]}
      />
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Transaction introuvable.{" "}
        <Link href="/admin/finance/transactions" className="text-teal underline">
          Retour à la liste
        </Link>
      </p>
    );
  }

  const breakdown = data.commission_breakdown;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={data.label}
        breadcrumb={["Admin", "Finance", "Transactions", data.id.slice(0, 8)]}
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <TransactionStatusPill status={data.status} />
        <span className="text-sm text-muted">
          {TRANSACTION_TYPE_LABELS[data.type]} · {formatDateTime(data.created_at)}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Montant"
          value={`${data.direction === "debit" ? "−" : "+"}${formatFCFA(data.amount_fcfa)}`}
        />
        <KpiCard label="Franchise" value={data.franchise_name} />
        <KpiCard
          label={data.driver_id ? "Chauffeur" : "Propriétaire"}
          value={data.owner_name}
          hint={
            data.driver_detail_path
              ? "Voir la fiche chauffeur ci-dessous →"
              : undefined
          }
        />
        <KpiCard label="Paiement" value={getPaymentLabel(data.payment_method)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-card border border-border bg-surface p-5 shadow-card">
          <h2 className="font-medium text-foreground">Contexte</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Partenaire</dt>
              <dd className="text-right">{data.partner_name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">
                {data.driver_id ? "Chauffeur" : "Propriétaire"}
              </dt>
              <dd className="text-right">
                {data.driver_detail_path ? (
                  <Link
                    href={data.driver_detail_path}
                    className="font-medium text-teal hover:underline"
                  >
                    {data.owner_name}
                  </Link>
                ) : (
                  data.owner_name
                )}
              </dd>
            </div>
            {data.wallet_owner_type ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Type wallet</dt>
                <dd className="text-right">{data.wallet_owner_type}</dd>
              </div>
            ) : null}
            {data.order_id ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Course</dt>
                <dd>
                  <Link
                    href={`/admin/ops/trips/${data.order_id}`}
                    className="text-teal hover:underline"
                  >
                    {data.order_ref ?? data.order_id}
                  </Link>
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        {breakdown ? (
          <section className="rounded-card border border-border bg-surface p-5 shadow-card">
            <h2 className="font-medium text-foreground">Répartition commission</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Montant brut</dt>
                <dd>{formatFCFA(breakdown.grossAmountXof ?? 0)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Part chauffeur</dt>
                <dd className="text-right">
                  <span>{formatFCFA(breakdown.driverAmountXof ?? 0)}</span>
                  {data.driver_detail_path ? (
                    <>
                      {" · "}
                      <Link
                        href={data.driver_detail_path}
                        className="text-teal hover:underline"
                      >
                        Fiche chauffeur
                      </Link>
                    </>
                  ) : null}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Partenaire</dt>
                <dd>{formatFCFA(breakdown.partnerAmountXof ?? 0)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Plateforme</dt>
                <dd>{formatFCFA(breakdown.platformAmountXof ?? 0)}</dd>
              </div>
            </dl>
          </section>
        ) : null}
      </div>
    </div>
  );
}
