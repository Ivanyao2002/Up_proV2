"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { formatDateTime } from "@/shared/lib/format";
import type { MarketingCampaign } from "../api/marketing.service";
import { useMarketingCampaigns } from "../api/marketing.queries";

const CHANNEL_LABELS: Record<MarketingCampaign["channel"], string> = {
  push: "Push",
  sms: "SMS",
  in_app: "In-app",
  email: "Email",
};

const STATUS_LABELS: Record<MarketingCampaign["status"], string> = {
  running: "En cours",
  scheduled: "Planifiée",
  completed: "Terminée",
  draft: "Brouillon",
};

export function MarketingCampaignsListPage() {
  const { data, isLoading, isError } = useMarketingCampaigns();

  const columns: Column<MarketingCampaign>[] = [
    {
      id: "name",
      header: "Campagne",
      cell: (c) => (
        <div>
          <p className="font-medium text-navy">{c.name}</p>
          <p className="text-xs text-muted">{c.id}</p>
        </div>
      ),
      exportValue: (c) => c.name,
    },
    {
      id: "channel",
      header: "Canal",
      cell: (c) => CHANNEL_LABELS[c.channel],
      exportValue: (c) => CHANNEL_LABELS[c.channel],
    },
    {
      id: "audience",
      header: "Audience",
      cell: (c) => <span className="text-sm text-muted">{c.audience}</span>,
      exportValue: (c) => c.audience,
    },
    {
      id: "sent",
      header: "Envoyés",
      className: "tabular-nums",
      cell: (c) => c.sent_count.toLocaleString("fr-CI"),
      exportValue: (c) => c.sent_count,
    },
    {
      id: "open",
      header: "Ouverture",
      className: "tabular-nums",
      cell: (c) => (c.open_rate_pct > 0 ? `${c.open_rate_pct} %` : "—"),
      exportValue: (c) => c.open_rate_pct,
    },
    {
      id: "period",
      header: "Période",
      cell: (c) => (
        <span className="text-xs text-muted">
          {formatDateTime(c.starts_at)} → {formatDateTime(c.ends_at)}
        </span>
      ),
      exportValue: (c) => c.starts_at,
    },
    {
      id: "status",
      header: "Statut",
      cell: (c) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            c.status === "running"
              ? "bg-teal/15 text-teal-dark"
              : c.status === "scheduled"
                ? "bg-navy/10 text-navy"
                : c.status === "completed"
                  ? "bg-canvas text-muted"
                  : "bg-amber-50 text-amber-700"
          }`}
        >
          {STATUS_LABELS[c.status]}
        </span>
      ),
      exportValue: (c) => STATUS_LABELS[c.status],
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les campagnes.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Campagnes"
        breadcrumb={["Admin", "Marketing"]}
        actions={
          <Link href="/admin/marketing/campaigns/new">
            <Button>Nouvelle campagne</Button>
          </Link>
        }
      />
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        exportFileName="campagnes-marketing"
        emptyTitle="Aucune campagne"
      />
    </div>
  );
}
