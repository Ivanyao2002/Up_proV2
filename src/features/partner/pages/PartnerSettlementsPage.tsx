"use client";

import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import { usePartnerSettlements } from "../api/wallet.queries";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import type { SettlementEntry } from "../api/wallet.service";

function StatusBadge({ status }: { status: SettlementEntry["status"] }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    processed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-700",
  };
  const labels: Record<string, string> = {
    pending: "En attente",
    processed: "Traitée",
    failed: "Échouée",
    cancelled: "Annulée",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${styles[status] ?? styles.pending}`}>
      {labels[status] ?? status}
    </span>
  );
}

export function PartnerSettlementsPage() {
  const table = useServerTableState([]);

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
  });

  const { data, isLoading, isError } = usePartnerSettlements(table.listParams);
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<SettlementEntry>[] = [
    {
      id: "ref",
      header: "Référence",
      cell: (s) => <span className="font-mono text-sm font-medium">{s.ref}</span>,
    },
    {
      id: "amount",
      header: "Montant",
      cell: (s) => <div className="font-medium">{formatFCFA(s.amount_fcfa)}</div>,
    },
    {
      id: "status",
      header: "Statut",
      cell: (s) => <StatusBadge status={s.status} />,
    },
    {
      id: "period",
      header: "Période",
      cell: (s) => (
        <span className="text-muted text-sm">
          {s.period_start && s.period_end
            ? `${new Date(s.period_start).toLocaleDateString("fr-FR")} → ${new Date(s.period_end).toLocaleDateString("fr-FR")}`
            : "—"}
        </span>
      ),
    },
    {
      id: "processed_at",
      header: "Traitée le",
      cell: (s) => (
        <span className="text-muted text-sm">
          {s.processed_at ? formatDateTime(s.processed_at) : "—"}
        </span>
      ),
    },
    {
      id: "created_at",
      header: "Créée le",
      cell: (s) => <span className="text-muted text-sm">{formatDateTime(s.created_at)}</span>,
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les acomptes.</p>;
  }

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader
        title="Acomptes"
        breadcrumb={["Partenaire", "Finance", "Acomptes"]}
      />

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Référence, statut..."
        totalLabel={meta ? `${meta.total} acompte${meta.total > 1 ? "s" : ""}` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      />

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(s) => s.id}
        isLoading={isLoading}
        emptyTitle="Aucun acompte"
        pagination={false}
        serverPagination={serverPaginationFromMeta(meta, table.setPage, table.setPageSize)}
      />
    </div>
  );
}
