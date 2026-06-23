"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { KpiCard } from "@/shared/ui/KpiCard";
import { Button } from "@/shared/ui/Button";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { WithdrawalStatusPill } from "@/shared/ui/TransactionStatusPill";
import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { WITHDRAWAL_METHOD_LABELS } from "@/shared/lib/financeLabels";
import {
  useApproveWithdrawal,
  useRejectWithdrawal,
  useWithdrawalDetail,
} from "../api/withdrawals.queries";

interface WithdrawalDetailPageProps {
  withdrawalId: string;
}

export function WithdrawalDetailPage({ withdrawalId }: WithdrawalDetailPageProps) {
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const { data, isLoading, isError } = useWithdrawalDetail(withdrawalId);
  const approve = useApproveWithdrawal();
  const reject = useRejectWithdrawal();

  if (isLoading) {
    return (
      <DetailPageSkeleton
        title="Retrait"
        breadcrumb={["Admin", "Finance", "Retraits"]}
      />
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Retrait introuvable.{" "}
        <Link href="/admin/finance/withdrawals" className="text-teal underline">
          Retour à la liste
        </Link>
      </p>
    );
  }

  const partnerHref =
    data.beneficiary_type === "partner" && data.owner_id
      ? `/admin/network/partners/${data.owner_id}`
      : data.beneficiary_type === "driver" && data.owner_id
        ? `/admin/fleet/drivers/${data.owner_id}`
        : null;

  const overBalance = data.amount_fcfa > data.wallet_balance_fcfa;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={`Retrait ${data.id.slice(0, 8)}`}
        breadcrumb={["Admin", "Finance", "Retraits", data.id.slice(0, 8)]}
        actions={
          data.status === "pending" ? (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setConfirmApprove(true)}>Approuver</Button>
              <Button variant="secondary" onClick={() => setConfirmReject(true)}>
                Rejeter
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <WithdrawalStatusPill status={data.status} />
        <span className="text-sm text-muted">
          Demandé le {formatDateTime(data.requested_at)}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Montant" value={formatFCFA(data.amount_fcfa)} />
        <KpiCard label="Franchise" value={data.franchise_name} />
        <KpiCard
          label="Solde wallet"
          value={formatFCFA(data.wallet_balance_fcfa)}
        />
        <KpiCard
          label="Méthode"
          value={WITHDRAWAL_METHOD_LABELS[data.method]}
        />
      </div>

      {overBalance && data.status === "pending" ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-medium">Solde insuffisant</p>
          <p className="mt-1 text-xs">
            Le montant demandé ({formatFCFA(data.amount_fcfa)}) dépasse le solde du
            wallet ({formatFCFA(data.wallet_balance_fcfa)}). Vérifiez avant d&apos;approuver
            le paiement.
          </p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-card border border-border bg-surface p-5 shadow-card">
          <h2 className="font-medium text-foreground">Bénéficiaire</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Nom</dt>
              <dd>
                {partnerHref ? (
                  <Link href={partnerHref} className="text-teal hover:underline">
                    {data.owner_name}
                  </Link>
                ) : (
                  data.owner_name
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Compte / numéro</dt>
              <dd>{data.account_label}</dd>
            </div>
            {data.approved_by_name ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Validé par</dt>
                <dd>{data.approved_by_name}</dd>
              </div>
            ) : null}
            {data.rejection_reason ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Motif rejet</dt>
                <dd className="text-red-600">{data.rejection_reason}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="rounded-card border border-border bg-surface p-5 shadow-card">
          <h2 className="font-medium text-foreground">Historique</h2>
          <ul className="mt-4 space-y-3">
            {data.timeline.length ? (
              data.timeline.map((step) => (
                <li key={`${step.type}-${step.at ?? "pending"}`} className="text-sm">
                  <p className="font-medium text-foreground">{step.label}</p>
                  <p className="text-muted">
                    {step.at ? formatDateTime(step.at) : "En attente"}
                  </p>
                </li>
              ))
            ) : (
              <li className="text-sm text-muted">Aucun événement enregistré.</li>
            )}
          </ul>
        </section>
      </div>

      <ConfirmModal
        open={confirmApprove}
        title="Approuver ce retrait ?"
        message={
          overBalance
            ? `⚠️ Le montant ${formatFCFA(data.amount_fcfa)} dépasse le solde wallet (${formatFCFA(data.wallet_balance_fcfa)}). Confirmer quand même le paiement à ${data.owner_name} ?`
            : `Confirmer le paiement de ${formatFCFA(data.amount_fcfa)} à ${data.owner_name}.`
        }
        confirmLabel="Approuver"
        variant={overBalance ? "danger" : undefined}
        onConfirm={() => {
          approve.mutate(withdrawalId, { onSuccess: () => setConfirmApprove(false) });
        }}
        onCancel={() => setConfirmApprove(false)}
      />

      <ConfirmModal
        open={confirmReject}
        title="Rejeter ce retrait ?"
        message="Le montant restera sur le wallet du bénéficiaire."
        confirmLabel="Rejeter"
        variant="danger"
        onConfirm={() => {
          reject.mutate(withdrawalId, { onSuccess: () => setConfirmReject(false) });
        }}
        onCancel={() => setConfirmReject(false)}
      />
    </div>
  );
}
