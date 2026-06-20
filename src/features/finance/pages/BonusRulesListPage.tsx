"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { Button } from "@/shared/ui/Button";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import {
  bonusRulePayoutLabel,
  bonusRulePeriodLabel,
  bonusRuleScopeLabel,
  type BonusRule,
} from "../api/bonusRules.service";
import { useBonusRulesList } from "../api/bonusRules.queries";

const STATUS_LABELS = {
  active: "Active",
  draft: "Inactive",
  archived: "Archivée",
} as const;

function formatServiceTypes(types: string[]): string {
  if (!types.length) return "Tous services";
  return types
    .map((type) =>
      type
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase())
    )
    .join(", ");
}

function formatTiers(rule: BonusRule): string {
  if (!rule.tiers.length) return "—";
  return rule.tiers
    .map((tier) => `${tier.minTrips.toLocaleString("fr-CI")} courses → ${tier.rewardXof.toLocaleString("fr-CI")} F`)
    .join(" · ");
}

export function BonusRulesListPage() {
  const router = useRouter();
  const table = useServerTableState([]);
  const { data, isLoading, isError, error } = useBonusRulesList(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<BonusRule>[] = [
    {
      id: "name",
      header: "Règle",
      cell: (r) => (
        <div>
          <p className="font-medium text-foreground">{r.name}</p>
          <p className="text-xs text-muted">
            {bonusRulePeriodLabel(r.period)} · {bonusRulePayoutLabel(r.payoutModel)}
          </p>
          <p className="text-xs text-muted">{formatServiceTypes(r.countedServiceTypes)}</p>
        </div>
      ),
      exportValue: (r) => r.name,
    },
    {
      id: "scope",
      header: "Périmètre",
      cell: (r) => (
        <div>
          <p>{bonusRuleScopeLabel(r.scope)}</p>
          {r.franchiseId ? (
            <p className="text-xs text-muted">Franchise {r.franchiseId.slice(0, 8)}…</p>
          ) : null}
          {r.partnerId ? (
            <p className="text-xs text-muted">Partenaire {r.partnerId.slice(0, 8)}…</p>
          ) : null}
        </div>
      ),
      exportValue: (r) => bonusRuleScopeLabel(r.scope),
    },
    {
      id: "tiers",
      header: "Paliers",
      cell: (r) => (
        <div className="space-y-1">
          {r.tiers.length ? (
            r.tiers.map((tier) => (
              <p key={`${r.id}-${tier.minTrips}`} className="text-sm tabular-nums">
                <span className="font-medium text-foreground">
                  {tier.minTrips.toLocaleString("fr-CI")} courses
                </span>
                <span className="text-muted"> → </span>
                <span className="text-teal-dark">{formatFCFA(tier.rewardXof)}</span>
              </p>
            ))
          ) : (
            <span className="text-sm text-muted">Aucun palier</span>
          )}
        </div>
      ),
      exportValue: (r) => formatTiers(r),
    },
    {
      id: "effective",
      header: "Validité",
      cell: (r) => (
        <div className="text-sm">
          <p>{r.effectiveFrom ? formatDateTime(r.effectiveFrom) : "—"}</p>
          {r.effectiveTo ? (
            <p className="text-xs text-muted">jusqu&apos;au {formatDateTime(r.effectiveTo)}</p>
          ) : (
            <p className="text-xs text-muted">Sans date de fin</p>
          )}
        </div>
      ),
      exportValue: (r) => r.effectiveFrom ?? "",
    },
    {
      id: "status",
      header: "Statut",
      cell: (r) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            r.status === "active"
              ? "bg-teal/15 text-teal-dark"
              : r.status === "draft"
                ? "bg-amber-50 text-amber-800"
                : "bg-navy/10 text-muted"
          }`}
        >
          {STATUS_LABELS[r.status]}
        </span>
      ),
      exportValue: (r) => STATUS_LABELS[r.status],
    },
    {
      id: "actions",
      header: "",
      cell: (r) => (
        <Link
          href={`/admin/finance/bonus-rules/${r.id}/edit`}
          className="inline-flex rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground hover:bg-surface-hover"
        >
          Modifier
        </Link>
      ),
    },
  ];

  if (isError) {
    return (
      <p className="text-sm text-red-600">
        Impossible de charger les règles bonus
        {error instanceof Error && error.message ? ` : ${error.message}` : "."}
      </p>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Règles bonus"
        breadcrumb={["Admin", "Finance"]}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-muted">API : GET /v1/admin/bonus-rules</span>
            <Button
              type="button"
              onClick={() => router.push("/admin/finance/bonus-rules/new")}
            >
              Nouvelle règle
            </Button>
          </div>
        }
      />

      <p className="mb-4 text-sm text-muted">
        Paramétrage des paliers de bonus (chauffeur, partenaire, franchise). Chaque règle
        peut contenir plusieurs paliers (courses → récompense). Le jour de début de semaine
        par chauffeur se règle sur la fiche chauffeur (onglet Bonus).{" "}
        <Link href="/admin/finance/commission-rules" className="text-teal hover:underline">
          Règles de commission
        </Link>
      </p>

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Rechercher une règle…"
        totalLabel={meta ? `${meta.total} règle${meta.total > 1 ? "s" : ""}` : undefined}
        hasActiveFilters={Boolean(table.search)}
        onReset={() => table.setSearch("")}
      />

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        exportFileName="regles-bonus"
        emptyTitle="Aucune règle bonus"
        emptyDescription="Aucune règle n'est configurée sur la plateforme pour le moment."
        pagination={false}
        serverPagination={serverPaginationFromMeta(
          meta,
          table.setPage,
          table.setPageSize
        )}
      />
    </div>
  );
}
