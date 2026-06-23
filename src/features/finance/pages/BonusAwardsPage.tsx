"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { Button } from "@/shared/ui/Button";
import { formatFCFA, formatDate } from "@/shared/lib/format";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import {
  bonusAwardStatusLabel,
  type BonusAward,
} from "../api/bonusAwards.service";
import {
  useBonusAwardsList,
  useRunBonusEvaluation,
} from "../api/bonusAwards.queries";

function statusBadgeClass(award: BonusAward): string {
  if (award.status === "paid") return "bg-teal/15 text-teal-dark";
  if (award.eligible) return "bg-teal/10 text-teal-dark";
  if (award.status === "pending") return "bg-amber-50 text-amber-800";
  return "bg-red-50 text-red-700";
}

export function BonusAwardsPage() {
  const table = useServerTableState([]);
  const { data, isLoading, isError, error } = useBonusAwardsList(table.listParams);
  const runEvaluation = useRunBonusEvaluation();

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<BonusAward>[] = [
    {
      id: "driver",
      header: "Chauffeur",
      cell: (r) => (
        <div>
          <p className="font-medium text-foreground">
            {r.driverId ? (
              <Link
                href={`/admin/drivers/${r.driverId}`}
                className="hover:text-teal hover:underline"
              >
                {r.driverName}
              </Link>
            ) : (
              r.driverName
            )}
          </p>
          {r.driverPhone ? (
            <p className="text-xs text-muted">{r.driverPhone}</p>
          ) : null}
        </div>
      ),
      exportValue: (r) => r.driverName,
    },
    {
      id: "amount",
      header: "Montant",
      cell: (r) => (
        <span
          className={`font-medium tabular-nums ${
            r.eligible ? "text-teal-dark" : "text-muted"
          }`}
        >
          {formatFCFA(r.amountXof)}
        </span>
      ),
      exportValue: (r) => r.amountXof,
      sortKey: (r) => r.amountXof,
    },
    {
      id: "period",
      header: "Période",
      cell: (r) => (
        <div className="text-sm">
          <p>{r.periodLabel}</p>
          {r.periodStart && r.periodEnd ? (
            <p className="text-xs text-muted">
              {formatDate(r.periodStart)} – {formatDate(r.periodEnd)}
            </p>
          ) : null}
        </div>
      ),
      exportValue: (r) => r.periodLabel,
    },
    {
      id: "rule",
      header: "Règle source",
      cell: (r) => (
        <div className="text-sm">
          <p>{r.ruleName}</p>
          {r.metricValue != null ? (
            <p className="text-xs text-muted tabular-nums">
              {r.metricValue.toLocaleString("fr-CI")}
              {r.thresholdValue != null
                ? ` / ${r.thresholdValue.toLocaleString("fr-CI")}`
                : ""}{" "}
              courses
            </p>
          ) : null}
        </div>
      ),
      exportValue: (r) => r.ruleName,
    },
    {
      id: "status",
      header: "Statut",
      cell: (r) => (
        <div>
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(r)}`}
          >
            {bonusAwardStatusLabel(r.status)}
          </span>
          {!r.eligible && r.reason ? (
            <p className="mt-1 text-xs text-muted">{r.reason}</p>
          ) : null}
        </div>
      ),
      exportValue: (r) => bonusAwardStatusLabel(r.status),
    },
    {
      id: "awardedAt",
      header: "Attribué le",
      cell: (r) => (
        <span className="text-sm text-muted">{formatDate(r.awardedAt)}</span>
      ),
      exportValue: (r) => r.awardedAt ?? "",
      sortKey: (r) => r.awardedAt ?? "",
    },
  ];

  if (isError) {
    return (
      <p className="text-sm text-red-600">
        Impossible de charger les attributions bonus
        {error instanceof Error && error.message ? ` : ${error.message}` : "."}
      </p>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Attributions bonus"
        breadcrumb={["Admin", "Finance"]}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-muted">
              API : GET /v1/admin/bonus-awards
            </span>
            <Button
              type="button"
              onClick={() => runEvaluation.mutate()}
              disabled={runEvaluation.isPending}
            >
              {runEvaluation.isPending ? "Évaluation…" : "Lancer l'évaluation"}
            </Button>
          </div>
        }
      />

      <p className="mb-4 text-sm text-muted">
        Historique des crédits bonus produits par le moteur d&apos;évaluation
        (paliers de courses → récompense). « Lancer l&apos;évaluation » exécute le
        calcul des bonus pour la période courante puis crédite les chauffeurs
        éligibles.{" "}
        <Link
          href="/admin/finance/bonus-rules"
          className="text-teal hover:underline"
        >
          Règles bonus
        </Link>
      </p>

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Rechercher un chauffeur, une règle…"
        totalLabel={
          meta
            ? `${meta.total} attribution${meta.total > 1 ? "s" : ""}`
            : undefined
        }
        hasActiveFilters={Boolean(table.search)}
        onReset={() => table.setSearch("")}
      />

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        exportFileName="attributions-bonus"
        emptyTitle="Aucune attribution bonus"
        emptyDescription="Aucun bonus n'a encore été attribué. Lancez une évaluation pour générer les crédits."
        getRowClassName={(r) => (r.eligible ? undefined : "opacity-60")}
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
