"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { formatFCFA } from "@/shared/lib/format";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import {
  bonusRuleScopeLabel,
  type BonusRule,
} from "../api/bonusRules.service";
import { useBonusRulesList } from "../api/bonusRules.queries";

const STATUS_LABELS = {
  active: "Active",
  draft: "Brouillon",
  archived: "Archivée",
} as const;

export function BonusRulesListPage() {
  const table = useServerTableState([]);
  const { data, isLoading, isError } = useBonusRulesList(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<BonusRule>[] = [
    {
      id: "name",
      header: "Règle",
      cell: (r) => (
        <div>
          <p className="font-medium text-foreground">{r.name}</p>
          <p className="text-xs text-muted">{r.metric}</p>
        </div>
      ),
      exportValue: (r) => r.name,
    },
    {
      id: "scope",
      header: "Périmètre",
      cell: (r) => bonusRuleScopeLabel(r.scope),
      exportValue: (r) => bonusRuleScopeLabel(r.scope),
    },
    {
      id: "threshold",
      header: "Seuil",
      className: "tabular-nums",
      cell: (r) => r.threshold_value.toLocaleString("fr-CI"),
      exportValue: (r) => r.threshold_value,
    },
    {
      id: "reward",
      header: "Récompense",
      className: "tabular-nums",
      cell: (r) => formatFCFA(r.reward_xof),
      exportValue: (r) => r.reward_xof,
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
  ];

  if (isError) {
    return (
      <p className="text-sm text-red-600">Impossible de charger les règles bonus.</p>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Règles bonus"
        breadcrumb={["Admin", "Finance"]}
        actions={
          <span className="text-xs text-muted">
            API : GET /v1/admin/bonus-rules
          </span>
        }
      />

      <p className="mb-4 text-sm text-muted">
        Paramétrage des paliers de bonus (chauffeur, partenaire, franchise). Consultez{" "}
        <code className="rounded bg-navy/5 px-1 text-xs">docs/module_finance/01-bonus-engine.md</code>{" "}
        pour le modèle métier.{" "}
        <Link href="/admin/finance/commission-rules" className="text-teal hover:underline">
          Règles de commission
        </Link>
      </p>

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Rechercher une règle…"
        totalLabel={meta ? `${meta.total} règles` : undefined}
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
        emptyDescription="Les règles apparaîtront ici lorsque l'endpoint admin bonus-rules sera alimenté."
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
