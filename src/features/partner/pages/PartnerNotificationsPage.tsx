"use client";

import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { formatDateTime } from "@/shared/lib/format";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import { Button } from "@/shared/ui/Button";
import type { NotificationItem } from "@/features/support/api/notifications.service";
import {
  useNotificationsList,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/features/support/api/notifications.queries";

export function PartnerNotificationsPage() {
  const table = useServerTableState([]);

  const { data, isLoading, isError } = useNotificationsList(table.listParams);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<NotificationItem>[] = [
    {
      id: "title",
      header: "Notification",
      cell: (n) => (
        <div className={n.read ? "opacity-60" : "font-medium"}>
          <p className="text-sm font-medium text-foreground">{n.title}</p>
          <p className="mt-0.5 text-sm text-muted">{n.body}</p>
        </div>
      ),
      exportValue: (n) => n.title,
    },
    {
      id: "type",
      header: "Type",
      cell: (n) => (
        <span className="inline-flex rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-muted">
          {n.type}
        </span>
      ),
      exportValue: (n) => n.type,
    },
    {
      id: "read",
      header: "Statut",
      cell: (n) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            n.read
              ? "bg-canvas text-muted"
              : "bg-teal/15 text-teal-dark"
          }`}
        >
          {n.read ? "Lue" : "Non lue"}
        </span>
      ),
      exportValue: (n) => (n.read ? "Lue" : "Non lue"),
    },
    {
      id: "created",
      header: "Reçue le",
      cell: (n) => formatDateTime(n.created_at),
      exportValue: (n) => n.created_at,
    },
    {
      id: "actions",
      header: "",
      cell: (n) =>
        !n.read ? (
          <Button
            variant="ghost"
            onClick={() => markRead.mutate(n.id)}
            disabled={markRead.isPending}
          >
            Marquer lue
          </Button>
        ) : null,
    },
  ];

  if (isError) {
    return (
      <p className="text-sm text-red-600">
        Impossible de charger les notifications.
      </p>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Notifications"
        breadcrumb={["Partenaire", "Support", "Notifications"]}
        actions={
          <Button
            variant="secondary"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending || rows.every((r) => r.read)}
          >
            Tout marquer comme lu
          </Button>
        }
      />

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Rechercher…"
        totalLabel={meta ? `${meta.total} notifications` : undefined}
      />

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(n) => n.id}
        isLoading={isLoading}
        exportFileName="notifications"
        emptyTitle="Aucune notification"
        serverPagination={serverPaginationFromMeta(
          meta,
          table.setPage,
          table.setPageSize
        )}
      />
    </div>
  );
}
