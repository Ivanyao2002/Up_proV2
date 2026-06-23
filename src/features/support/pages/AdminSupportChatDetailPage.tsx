"use client";

import Link from "next/link";
import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { SupportMessageThread } from "../components/SupportMessageThread";
import {
  useAdminSupportChat,
  useCloseAdminChat,
  useReplyAdminChat,
  useUploadChatAttachment,
} from "../api/adminChat.queries";
import { useSupportPaths } from "../lib/supportPaths";
import { useState } from "react";

interface AdminSupportChatDetailPageProps {
  chatId: string;
}

export function AdminSupportChatDetailPage({ chatId }: AdminSupportChatDetailPageProps) {
  const paths = useSupportPaths();
  const { data, isLoading, isError } = useAdminSupportChat(chatId);
  const reply = useReplyAdminChat(chatId);
  const close = useCloseAdminChat(chatId);
  const uploadAtt = useUploadChatAttachment(chatId);
  const [confirmClose, setConfirmClose] = useState(false);

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
    <div className="min-h-0 animate-fade-up">
      <PageHeader
        title={data.participant_name}
        breadcrumb={["Admin", "Support", "Chat", data.id]}
        actions={
          <div className="flex items-center gap-2">
            {data.unread_count > 0 && (
              <span className="rounded-full bg-teal/15 px-3 py-1 text-xs font-medium text-teal-dark">
                {data.unread_count} non lu{data.unread_count > 1 ? "s" : ""}
              </span>
            )}
            {!closed && (
              <Button
                variant="ghost"
                className="!text-xs !text-red-600 hover:!bg-red-50 dark:hover:!bg-red-950/20"
                onClick={() => setConfirmClose(true)}
                disabled={close.isPending}
              >
                {close.isPending ? "Clôture…" : "Clôturer la conversation"}
              </Button>
            )}
            {closed && (
              <span className="rounded-full bg-canvas px-3 py-1 text-xs font-medium text-muted">
                Clôturée
              </span>
            )}
          </div>
        }
      />

      <p className="mb-2 text-sm text-muted">
        Franchise
        {data.franchise_city ? ` · ${data.franchise_city}` : ""}
        {data.subject ? ` · ${data.subject}` : ""}
      </p>

      <p className="mb-4 text-sm">
        <Link href={paths.chat} className="text-teal hover:underline">
          ← Retour aux conversations
        </Link>
      </p>

      <SupportMessageThread
        messages={data.messages}
        disabled={closed}
        isSending={reply.isPending}
        isUploading={uploadAtt.isPending}
        onSend={(body, attachmentId) => reply.mutate({ body, attachmentId })}
        onUploadAttachment={(file) => uploadAtt.mutateAsync(file)}
        placeholder={closed ? "Conversation clôturée" : "Répondre à la franchise…"}
      />

      <ConfirmModal
        open={confirmClose}
        title="Clôturer la conversation ?"
        message="La franchise ne pourra plus envoyer de messages dans cette conversation. Cette action est irréversible."
        confirmLabel="Clôturer"
        variant="danger"
        onConfirm={() => {
          close.mutate();
          setConfirmClose(false);
        }}
        onCancel={() => setConfirmClose(false)}
      />
    </div>
  );
}
