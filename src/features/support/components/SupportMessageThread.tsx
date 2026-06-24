"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/shared/ui/Button";
import { formatDateTime } from "@/shared/lib/format";
import type { AdminSupportAttachment, AdminSupportMessage } from "../api/adminChat.types";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/gif,application/pdf";
const MAX_SIZE_MB = 10;

interface SupportMessageThreadProps {
  messages: AdminSupportMessage[];
  onSend: (body: string, attachmentId?: string) => void;
  onUploadAttachment?: (file: File) => Promise<AdminSupportAttachment>;
  isSending?: boolean;
  isUploading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

function AttachmentPreview({
  att,
  onRemove,
}: {
  att: AdminSupportAttachment & { localUrl?: string };
  onRemove: () => void;
}) {
  const isImage = att.type === "image";
  return (
    <div className="relative flex items-center gap-2 rounded-lg border border-border bg-canvas px-3 py-2 text-xs">
      {isImage && att.localUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={att.localUrl} alt={att.filename} className="h-10 w-10 rounded object-cover" />
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded bg-surface text-lg">
          {att.type === "pdf" ? "📄" : "📎"}
        </span>
      )}
      <span className="max-w-[160px] truncate text-foreground">{att.filename}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-auto text-muted hover:text-foreground"
        aria-label="Supprimer la pièce jointe"
      >
        ✕
      </button>
    </div>
  );
}

function MessageAttachment({ att }: { att: AdminSupportAttachment }) {
  const isImage = att.type === "image";
  if (isImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={att.url}
        alt={att.filename}
        className="mt-2 max-h-48 max-w-xs rounded-lg object-cover"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <a
      href={att.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex items-center gap-1.5 rounded border border-current/20 px-2 py-1 text-[11px] underline-offset-2 hover:underline"
    >
      <span>{att.type === "pdf" ? "📄" : "📎"}</span>
      <span className="truncate max-w-[180px]">{att.filename}</span>
    </a>
  );
}

export function SupportMessageThread({
  messages,
  onSend,
  onUploadAttachment,
  isSending,
  isUploading,
  disabled,
  placeholder = "Écrire une réponse…",
}: SupportMessageThreadProps) {
  const [draft, setDraft] = useState("");
  const [pendingAtt, setPendingAtt] = useState<(AdminSupportAttachment & { localUrl?: string }) | null>(null);
  const [attError, setAttError] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages.length]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    if (!file) return;

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setAttError(`Fichier trop lourd (max ${MAX_SIZE_MB} Mo)`);
      return;
    }
    setAttError(null);

    const localUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    if (!onUploadAttachment) return;

    try {
      const uploaded = await onUploadAttachment(file);
      setPendingAtt({ ...uploaded, localUrl });
    } catch {
      setAttError("Échec de l'envoi du fichier. Réessaie.");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text && !pendingAtt) return;
    onSend(text, pendingAtt?.id);
    setDraft("");
    if (pendingAtt?.localUrl) URL.revokeObjectURL(pendingAtt.localUrl);
    setPendingAtt(null);
  }

  return (
    <div className="flex h-[clamp(420px,calc(100dvh-300px),760px)] min-h-0 flex-col overflow-hidden rounded-card border border-border bg-surface shadow-card">
      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4"
      >
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted">Aucun message pour le moment.</p>
        ) : (
          messages.map((m) => {
            const isAgent = m.role === "agent";
            const isSystem = m.role === "system";
            return (
              <div key={m.id} className={`flex ${isAgent ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    isSystem
                      ? "mx-auto bg-canvas text-center text-xs text-muted"
                      : isAgent
                        ? "bg-teal text-white"
                        : "bg-canvas text-foreground"
                  }`}
                >
                  {!isSystem && (
                    <p className={`mb-1 text-xs font-medium ${isAgent ? "text-teal-100" : "text-muted"}`}>
                      {m.author}
                    </p>
                  )}
                  {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
                  {m.attachment && <MessageAttachment att={m.attachment} />}
                  {!isSystem && (
                    <p className={`mt-1 text-[10px] ${isAgent ? "text-teal-100/80" : "text-muted"}`}>
                      {formatDateTime(m.at)}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Zone de saisie */}
      {!disabled && (
        <form
          className="shrink-0 border-t border-border bg-surface p-3 sm:p-4"
          onSubmit={handleSubmit}
        >
          {pendingAtt && (
            <div className="mb-2">
              <AttachmentPreview att={pendingAtt} onRemove={() => setPendingAtt(null)} />
            </div>
          )}
          {attError && <p className="mb-1.5 text-[11px] text-red-500">{attError}</p>}

          <div className="flex items-end gap-2">
            {onUploadAttachment && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  disabled={isUploading || !!pendingAtt}
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 rounded-lg border border-border p-2 text-muted transition hover:bg-surface-hover hover:text-foreground disabled:opacity-40"
                  title="Joindre une image ou un PDF"
                >
                  {isUploading ? (
                    <span className="block h-4 w-4 animate-spin rounded-full border-2 border-border border-t-teal" />
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  )}
                </button>
              </>
            )}

            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              rows={2}
              placeholder={placeholder}
              className="max-h-32 min-h-[44px] flex-1 resize-none rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none ring-teal/30 focus:ring-2"
            />
            <Button
              type="submit"
              className="shrink-0"
              disabled={isSending || isUploading || (!draft.trim() && !pendingAtt)}
            >
              {isSending ? "…" : "Envoyer"}
            </Button>
          </div>
          <p className="mt-1.5 text-[11px] text-muted">
            Entrée pour envoyer · Maj + Entrée pour nouvelle ligne
            {onUploadAttachment && " · Trombone pour image/PDF"}
          </p>
        </form>
      )}
    </div>
  );
}
