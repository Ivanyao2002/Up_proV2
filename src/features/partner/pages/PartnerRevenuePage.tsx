"use client";

import { PageHeader } from "@/shared/ui/PageHeader";
import { KpiCard } from "@/shared/ui/KpiCard";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import { usePartnerRevenuePaginated } from "../api/wallet.queries";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import type { RevenueEntry } from "../api/wallet.service";

function EntryTypeLabel({ type }: { type: string }) {
  const labels: Record<string, string> = {
    wallet_recharge: "Recharge wallet",
    partner_driver_recharge: "Recharge chauffeur",
  };
  return <span className="text-sm text-muted capitalize">{labels[type] ?? type.replace(/_/g, " ")}</span>;
}

export function PartnerRevenuePage() {
  const table = useServerTableState([]);
  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
  });

  const { data, isLoading, isError } = usePartnerRevenuePaginated(table.listParams);

  const rows = data?.entries ?? [];
  const meta = data?.pagination
    ? {
        current_page: data.pagination.page,
        last_page: data.pagination.hasMore ? data.pagination.page + 1 : data.pagination.page,
        per_page: data.pagination.limit,
        total: data.pagination.total,
      }
    : undefined;

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les revenus.</p>;
  }

  const columns: Column<RevenueEntry>[] = [
    {
      id: "type",
      header: "Type",
      cell: (row) => <EntryTypeLabel type={row.entry_type} />,
    },
    {
      id: "description",
      header: "Description",
      cell: (row) => <span className="text-sm">{row.description || "—"}</span>,
    },
    {
      id: "amount",
      header: "Montant",
      cell: (row) => (
        <span
          className={`font-medium tabular-nums ${
            row.direction === "credit" ? "text-teal-dark" : "text-red-600"
          }`}
        >
          {row.direction === "debit" ? "−" : "+"}
          {formatFCFA(row.amount_xof)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Statut",
      cell: (row) => (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
          {row.status}
        </span>
      ),
    },
    {
      id: "posted_at",
      header: "Date",
      cell: (row) => <span className="text-muted text-sm">{formatDateTime(row.posted_at)}</span>,
    },
  ];

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader
        title="Revenus"
        breadcrumb={["Partenaire", "Finance", "Revenus"]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <KpiCard
          index={0}
          label="Total des mouvements"
          value={isLoading ? "…" : formatFCFA(data?.totalXof ?? 0)}
        />
        <KpiCard
          index={1}
          label="Entrées"
          value={isLoading ? "…" : String(data?.pagination?.total ?? 0)}
        />
        <KpiCard
          index={2}
          label="Devise"
          value={rows[0]?.currency ?? "XOF"}
        />
      </div>

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Description, type..."
        totalLabel={meta ? `${meta.total} entrée${meta.total > 1 ? "s" : ""}` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      />

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        emptyTitle="Aucun mouvement"
        pagination={false}
        serverPagination={serverPaginationFromMeta(meta, table.setPage, table.setPageSize)}
      />
    </div>
  );
}
