"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { formatDateTime } from "@/shared/lib/format";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { ChatConversation } from "../api/chatConversations.service";
import { useChatConversationsList } from "../api/chatConversations.queries";

export function ChatConversationsPage() {
  const table = useServerTableState([]);

  const { data, isLoading, isError } = useChatConversationsList(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<ChatConversation>[] = [
    {
      id: "conversation",
      header: "Conversation",
      cell: (c) => (
        <Link href={`/admin/support/chat/${c.id}`} className="block hover:opacity-90">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">
                {c.trip_ref ?? "Chat support"}
              </p>
              <p className="mt-1 truncate text-sm text-muted">{c.last_message_preview}</p>
            </div>
            {c.unread_count > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-teal px-1.5 text-[10px] font-bold text-white">
                {c.unread_count}
              </span>
            )}
          </div>
        </Link>
      ),
      exportValue: (c) => c.trip_ref ?? c.id,
    },
    {
      id: "participants",
      header: "Participants",
      cell: (c) => (
        <span className="text-sm text-muted">
          {c.participants.map((p) => p.name).join(", ")}
        </span>
      ),
      exportValue: (c) => c.participants.map((p) => p.name).join(", "),
    },
    {
      id: "last_message",
      header: "Dernier message",
      cell: (c) => formatDateTime(c.last_message_at),
      exportValue: (c) => c.last_message_at,
    },
  ];

  if (isError) {
    return (
      <p className="text-sm text-red-600">
        Impossible de charger les conversations.
      </p>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Chat course"
        breadcrumb={["Admin", "Support", "Chat"]}
      />

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Rechercher…"
        totalLabel={meta ? `${meta.total} conversations` : undefined}
      />

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        exportFileName="chat-conversations"
        emptyTitle="Aucune conversation"
        serverPagination={serverPaginationFromMeta(
          meta,
          table.setPage,
          table.setPageSize
        )}
      />
    </div>
  );
}
