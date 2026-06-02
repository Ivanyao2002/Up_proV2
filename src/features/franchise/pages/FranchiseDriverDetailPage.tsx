"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Tabs } from "@/shared/ui/Tabs";
import { KycDocumentCard } from "@/shared/ui/KycDocumentCard";
import { AccountStatusPill, AvailabilityPill } from "@/shared/ui/DriverPills";
import { KpiCard } from "@/shared/ui/KpiCard";
import { formatFCFA } from "@/shared/lib/format";
import { useFranchiseDriverDetail } from "../api/drivers.queries";

interface FranchiseDriverDetailPageProps {
  driverId: string;
}

export function FranchiseDriverDetailPage({ driverId }: FranchiseDriverDetailPageProps) {
  const [tab, setTab] = useState("overview");
  const { data: driver, isLoading, isError } = useFranchiseDriverDetail(driverId);

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

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={fullName}
        breadcrumb={["Franchise", "Chauffeurs", fullName]}
        actions={
          <div className="flex gap-2">
            <AccountStatusPill status={driver.account_status} />
            <AvailabilityPill status={driver.availability} />
          </div>
        }
      />

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
                canReview={doc.status === "pending" && Boolean(doc.uploaded_at)}
                onApprove={() => undefined}
                onReject={() => undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
