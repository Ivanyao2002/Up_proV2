"use client";

import { useState } from "react";
import Link from "next/link";
import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { formatDateTime } from "@/shared/lib/format";
import {
  useChatConversation,
  useSendChatMessage,
} from "@/features/support/api/chatConversations.queries";

interface PartnerChatConversationDetailPageProps {
  conversationId: string;
}

export function PartnerChatConversationDetailPage({
  conversationId,
}: PartnerChatConversationDetailPageProps) {
  const { data, isLoading, isError } = useChatConversation(conversationId);
  const send = useSendChatMessage(conversationId);
  const [draft, setDraft] = useState("");

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Conversation introuvable.{" "}
        <Link href="/partner/support/conversations" className="text-teal underline">
          Retour
        </Link>
      </p>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={data.trip_ref ?? "Chat support"}
        breadcrumb={["Partenaire", "Support", "Chat course", data.id]}
        actions={
          data.unread_count > 0 ? (
            <span className="rounded-full bg-teal/15 px-3 py-1 text-xs font-medium text-teal-dark">
              {data.unread_count} non lu{data.unread_count > 1 ? "s" : ""}
            </span>
          ) : null
        }
      />

      <p className="mb-2 text-sm text-muted">
        Participants : {data.participants.map((p) => p.name).join(", ")}
      </p>

      <p className="mb-6 text-sm">
        <Link href="/partner/support/conversations" className="text-teal hover:underline">
          ← Retour aux conversations
        </Link>
      </p>

      <div className="flex min-h-[420px] flex-col rounded-card border border-border bg-surface shadow-card">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {data.messages.length === 0 ? (
            <p className="text-center text-sm text-muted">Aucun message pour le moment.</p>
          ) : (
            data.messages.map((m) => {
              const isMe = m.author_role === "partner" || m.author_role === "admin";
              return (
                <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      isMe ? "bg-teal text-white" : "bg-canvas text-foreground"
                    }`}
                  >
                    <p className={`mb-1 text-xs font-medium ${isMe ? "text-teal-100" : "text-muted"}`}>
                      {m.author_name}
                    </p>
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    <p className={`mt-1 text-[10px] ${isMe ? "text-teal-100/80" : "text-muted"}`}>
                      {formatDateTime(m.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form
          className="flex gap-2 border-t border-border p-4"
          onSubmit={(e) => {
            e.preventDefault();
            const text = draft.trim();
            if (!text) return;
            send.mutate(text);
            setDraft("");
          }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder="Écrire une réponse…"
            className="min-h-[44px] flex-1 resize-none rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none ring-teal/30 focus:ring-2"
          />
          <Button type="submit" disabled={send.isPending || !draft.trim()}>
            {send.isPending ? "…" : "Envoyer"}
          </Button>
        </form>
      </div>
    </div>
  );
}
