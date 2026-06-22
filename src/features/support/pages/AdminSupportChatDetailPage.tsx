"use client";

import Link from "next/link";
import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SupportMessageThread } from "../components/SupportMessageThread";
import {
  useAdminSupportChat,
  useReplyAdminChat,
} from "../api/adminChat.queries";
import { useSupportPaths } from "../lib/supportPaths";

interface AdminSupportChatDetailPageProps {
  chatId: string;
}

export function AdminSupportChatDetailPage({ chatId }: AdminSupportChatDetailPageProps) {
  const paths = useSupportPaths();
  const { data, isLoading, isError } = useAdminSupportChat(chatId);
  const reply = useReplyAdminChat(chatId);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Conversation introuvable.{" "}
        <Link href={paths.chat} className="text-teal underline">
          Retour
        </Link>
      </p>
    );
  }

  const closed = data.status === "closed";

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={data.participant_name}
        breadcrumb={["Admin", "Support", "Chat", data.id]}
        actions={
          data.unread_count > 0 ? (
            <span className="rounded-full bg-teal/15 px-3 py-1 text-xs font-medium text-teal-dark">
              {data.unread_count} non lu{data.unread_count > 1 ? "s" : ""}
            </span>
          ) : null
        }
      />

      <p className="mb-2 text-sm text-muted">
        Franchise
        {data.franchise_city ? ` · ${data.franchise_city}` : ""}
        {data.subject ? ` · ${data.subject}` : ""}
      </p>

      <p className="mb-6 text-sm">
        <Link href={paths.chat} className="text-teal hover:underline">
          ← Retour aux conversations
        </Link>
      </p>

      <SupportMessageThread
        messages={data.messages}
        disabled={closed}
        isSending={reply.isPending}
        onSend={(body) => reply.mutate(body)}
        placeholder={closed ? "Conversation clôturée" : "Répondre à la franchise…"}
      />
    </div>
  );
}
