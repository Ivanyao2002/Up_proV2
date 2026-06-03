"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Tabs } from "@/shared/ui/Tabs";
import { KycDocumentCard } from "@/shared/ui/KycDocumentCard";
import { KpiCard } from "@/shared/ui/KpiCard";
import { Button } from "@/shared/ui/Button";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { usePermission } from "@/core/auth/usePermission";
import { formatFCFA } from "@/shared/lib/format";
import {
  useApproveFranchiseDocument,
  useApproveFranchiseDriverKyc,
  useFranchiseDriverDetail,
  useRejectFranchiseDocument,
  useRejectFranchiseDriverKyc,
} from "../api/drivers.queries";

interface FranchiseDriverDetailPageProps {
  driverId: string;
}

export function FranchiseDriverDetailPage({ driverId }: FranchiseDriverDetailPageProps) {
  const [tab, setTab] = useState("kyc");
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const canModerate = usePermission("fleet.kyc.approve");

  const { data: driver, isLoading, isError } = useFranchiseDriverDetail(driverId);
  const approveKyc = useApproveFranchiseDriverKyc();
  const rejectKyc = useRejectFranchiseDriverKyc();
  const approveDoc = useApproveFranchiseDocument(driverId);
  const rejectDoc = useRejectFranchiseDocument(driverId);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-card bg-border" />;
  }

  if (isError || !driver) {
    return (
      <p className="text-sm text-red-600">
        Chauffeur introuvable.{" "}
        <Link href="/franchise/drivers" className="text-teal underline">
          Retour
        </Link>
      </p>
    );
  }

  const fullName = `${driver.first_name} ${driver.last_name}`;
  const isPending = driver.account_status === "pending";

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={fullName}
        breadcrumb={["Franchise", "Chauffeurs", fullName]}
        actions={
          isPending && canModerate ? (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setConfirmApprove(true)}>Approuver le compte</Button>
              <Button variant="secondary" onClick={() => setConfirmReject(true)}>
                Rejeter
              </Button>
            </div>
          ) : undefined
        }
      />

      <p className="mb-6 text-sm text-muted">
        {driver.phone} · {driver.zone} · {driver.owner_name}
      </p>

      <Tabs
        tabs={[
          { id: "overview", label: "Aperçu" },
          { id: "kyc", label: "Documents KYC" },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="mt-6">
        {tab === "overview" && (
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard label="Partenaire" value={driver.owner_name ?? "—"} />
            <KpiCard label="Zone" value={driver.zone} />
            <KpiCard
              label="Portefeuille"
              value={formatFCFA(driver.stats.wallet_balance_fcfa)}
            />
          </div>
        )}

        {tab === "kyc" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {driver.kyc_documents.map((doc) => (
              <KycDocumentCard
                key={doc.id}
                document={doc}
                canReview={canModerate && doc.status === "pending" && Boolean(doc.uploaded_at)}
                onApprove={() => approveDoc.mutate(doc.id)}
                onReject={() =>
                  rejectDoc.mutate({ docId: doc.id, reason: "Document illisible ou incomplet" })
                }
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmApprove}
        title="Approuver ce chauffeur ?"
        message="Validation complète du dossier KYC sur le territoire franchise."
        confirmLabel="Approuver"
        onConfirm={() => {
          approveKyc.mutate(driverId, { onSuccess: () => setConfirmApprove(false) });
        }}
        onCancel={() => setConfirmApprove(false)}
      />

      <ConfirmModal
        open={confirmReject}
        title="Rejeter la demande ?"
        confirmLabel="Rejeter"
        variant="danger"
        message="Le chauffeur devra soumettre de nouveaux documents."
        onConfirm={() => {
          rejectKyc.mutate(
            { driverId, reason: "Dossier incomplet — modération franchise" },
            { onSuccess: () => setConfirmReject(false) }
          );
        }}
        onCancel={() => setConfirmReject(false)}
      />
    </div>
  );
}
