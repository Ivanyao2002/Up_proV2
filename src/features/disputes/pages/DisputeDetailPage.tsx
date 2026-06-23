"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import { formatDateTime } from "@/shared/lib/format";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  TERMINAL_STATUSES,
} from "../lib/disputeConstants";
import { DISPUTE_QUICK_REPLIES } from "../lib/quickReplies";
import {
  useDisputeDetail,
  useAssignDispute,
  useSendDisputeMessage,
  useResolveDispute,
  useCloseDispute,
  useEscalateDispute,
} from "../api/dispute.queries";
import type { DisputeMessage } from "../api/dispute.types";

interface Props {
  disputeId: string;
}

export function DisputeDetailPage({ disputeId }: Props) {
  const router     = useRouter();
  const threadRef  = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");
  const [confirmClose, setConfirmClose] = useState<"resolve" | "close" | "escalate" | null>(null);

  const { data, isLoading, isError } = useDisputeDetail(disputeId);

  const assign   = useAssignDispute(disputeId);
  const sendMsg  = useSendDisputeMessage(disputeId);
  const resolve  = useResolveDispute(disputeId);
  const close    = useCloseDispute(disputeId);
  const escalate = useEscalateDispute(disputeId);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [data?.messages.length]);

  if (isLoading) return <DetailPageSkeleton />;
  if (isError || !data) {
    return <p className="text-sm text-red-600">Impossible de charger ce litige.</p>;
  }

  const isTerminal  = TERMINAL_STATUSES.includes(data.status);
  const isAssigned  = !!data.assigned_to_id;
  const isPending   = resolve.isPending || close.isPending || escalate.isPending;
  // L'IA assiste tant que le litige est ouvert et qu'aucun agent n'a pris la main.
  const aiActive    = data.status === "open" && !isAssigned;

  function handleSend() {
    if (!draft.trim()) return;
    sendMsg.mutate(draft, { onSuccess: () => setDraft("") });
  }

  function handleConfirmAction() {
    if (confirmClose === "resolve") {
      resolve.mutate(undefined, { onSuccess: () => setConfirmClose(null) });
    } else if (confirmClose === "close") {
      close.mutate(undefined, { onSuccess: () => { setConfirmClose(null); router.push("/support/disputes"); } });
    } else if (confirmClose === "escalate") {
      escalate.mutate(undefined, { onSuccess: () => { setConfirmClose(null); } });
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={data.subject}
        breadcrumb={["Support", "Litiges"]}
      />

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* ── Thread messages ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="rounded-card border border-border bg-surface shadow-card">
            {/* Bandeau assistant IA — actif tant qu'aucun agent n'a pris la main */}
            {aiActive && (
              <div className="flex items-center gap-2 rounded-t-card border-b border-violet-400/30 bg-violet-500/5 px-5 py-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-400">
                  <BotIcon />
                </span>
                <p className="text-xs text-violet-700 dark:text-violet-300">
                  <span className="font-semibold">Assistant IA actif</span> — répond automatiquement au client en attendant qu'un agent prenne en charge le litige.
                </p>
              </div>
            )}
            <div
              ref={threadRef}
              className="flex flex-col gap-3 overflow-y-auto p-5"
              style={{ maxHeight: "420px" }}
            >
              {data.messages.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">
                  Aucun message pour le moment.
                </p>
              ) : (
                data.messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))
              )}
            </div>

            {/* Composer */}
            {!isTerminal && (
              <div className="border-t border-border p-4">
                {/* Réponses prédéfinies — disponibles une fois le litige pris en charge */}
                {isAssigned && (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {DISPUTE_QUICK_REPLIES.map((qr) => (
                      <button
                        key={qr.label}
                        type="button"
                        onClick={() => setDraft(qr.text)}
                        className="rounded-full border border-border bg-canvas px-2.5 py-1 text-[11px] font-medium text-muted transition-colors hover:border-teal/40 hover:text-teal-dark"
                      >
                        {qr.label}
                      </button>
                    ))}
                  </div>
                )}
                <textarea
                  rows={3}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Répondre au client…"
                  disabled={!isAssigned}
                  className="w-full resize-none rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none ring-teal/30 focus:ring-2 disabled:opacity-50"
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    disabled={!draft.trim() || sendMsg.isPending || !isAssigned}
                    onClick={handleSend}
                  >
                    {sendMsg.isPending ? "Envoi…" : "Envoyer"}
                  </Button>
                </div>
                {!isAssigned && (
                  <p className="mt-1 text-xs text-muted">
                    Prenez en charge ce litige pour pouvoir répondre.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Panneau latéral ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Statut + catégorie */}
          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <h3 className="text-sm font-semibold text-heading">Informations</h3>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted">Statut</dt>
                <dd>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[data.status]}`}>
                    {STATUS_LABELS[data.status]}
                  </span>
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">Catégorie</dt>
                <dd>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[data.category]}`}>
                    {CATEGORY_LABELS[data.category]}
                  </span>
                </dd>
              </div>
              <div className="flex items-start justify-between gap-2">
                <dt className="text-muted">Client</dt>
                <dd className="text-right">
                  <p className="font-medium text-foreground">{data.reporter_name}</p>
                  {data.reporter_phone && (
                    <p className="text-xs text-muted">{data.reporter_phone}</p>
                  )}
                </dd>
              </div>
              {data.trip_ref && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted">Course</dt>
                  <dd className="font-mono text-xs text-foreground">{data.trip_ref}</dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="text-muted">Ouvert le</dt>
                <dd className="text-xs text-muted">{formatDateTime(data.created_at)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">Mis à jour</dt>
                <dd className="text-xs text-muted">{formatDateTime(data.updated_at)}</dd>
              </div>
            </dl>
          </div>

          {/* Prise en charge */}
          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <h3 className="text-sm font-semibold text-heading">Prise en charge</h3>
            {isAssigned ? (
              <p className="mt-2 text-sm text-foreground">{data.assigned_to ?? "Agent assigné"}</p>
            ) : (
              <>
                <p className="mt-2 text-xs text-muted">Aucun agent assigné.</p>
                {!isTerminal && (
                  <Button
                    className="mt-3 w-full !text-sm"
                    disabled={assign.isPending}
                    onClick={() => assign.mutate()}
                  >
                    {assign.isPending ? "Assignation…" : "S'assigner ce litige"}
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          {!isTerminal && (
            <div className="rounded-card border border-border bg-surface p-5 shadow-card">
              <h3 className="text-sm font-semibold text-heading">Actions</h3>

              {confirmClose ? (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-muted">
                    {confirmClose === "resolve"  && "Confirmer la résolution de ce litige ?"}
                    {confirmClose === "close"    && "Confirmer la clôture de ce litige ?"}
                    {confirmClose === "escalate" && "Escalader ce litige au niveau supérieur ? Il ne pourra plus être traité par le support de premier niveau."}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      className="flex-1 !text-xs"
                      onClick={() => setConfirmClose(null)}
                    >
                      Annuler
                    </Button>
                    <Button
                      className={`flex-1 !text-xs ${confirmClose === "escalate" ? "!bg-red-600 hover:!bg-red-700" : ""}`}
                      disabled={isPending}
                      onClick={handleConfirmAction}
                    >
                      {isPending ? "…" : "Confirmer"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex flex-col gap-2">
                  {isAssigned && (
                    <>
                      <Button
                        className="w-full !text-sm"
                        onClick={() => setConfirmClose("resolve")}
                      >
                        Marquer comme résolu
                      </Button>
                      <Button
                        variant="secondary"
                        className="w-full !text-sm"
                        onClick={() => setConfirmClose("close")}
                      >
                        Clôturer
                      </Button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setConfirmClose("escalate")}
                    className="mt-1 text-xs text-red-500 hover:text-red-600 hover:underline"
                  >
                    Escalader au niveau supérieur
                  </button>
                  {!isAssigned && (
                    <p className="text-[11px] text-muted">
                      Vous pouvez escalader ce litige sans le prendre en charge si vous ne pouvez pas le traiter.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {isTerminal && (
            <div className="rounded-card border border-border bg-canvas p-4 text-center">
              <p className="text-xs text-muted">
                Ce litige est{" "}
                <span className={`font-medium ${STATUS_COLORS[data.status].split(" ").find((c) => c.startsWith("text-")) ?? ""}`}>
                  {STATUS_LABELS[data.status].toLowerCase()}
                </span>{" "}
                et ne peut plus être modifié.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: DisputeMessage }) {
  if (msg.sender === "system") {
    return (
      <div className="flex justify-center">
        <p className="rounded-full bg-canvas px-3 py-1 text-xs text-muted">
          {msg.content}
        </p>
      </div>
    );
  }

  // Réponse automatique de l'assistant IA — visuel distinct (violet + robot).
  if (msg.sender === "ai") {
    return (
      <div className="flex justify-start">
        <div className="max-w-sm rounded-2xl rounded-tl-sm border border-violet-400/30 bg-violet-500/5 px-4 py-2.5">
          <div className="mb-1 flex items-center gap-1.5">
            <span className="flex h-4 w-4 items-center justify-center text-violet-600 dark:text-violet-400">
              <BotIcon />
            </span>
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">
              {msg.sender_name}
            </span>
            <span className="rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-medium text-violet-600 dark:text-violet-400">
              Réponse automatique
            </span>
          </div>
          <p className="text-sm leading-relaxed text-foreground">{msg.content}</p>
          {msg.ai_sources && msg.ai_sources.length > 0 && (
            <p className="mt-1.5 text-[11px] text-violet-600/70 dark:text-violet-400/70">
              Sources : {msg.ai_sources.join(", ")}
              {typeof msg.ai_confidence === "number" && ` · confiance ${Math.round(msg.ai_confidence * 100)}%`}
            </p>
          )}
          <p className="mt-1 text-[11px] text-muted/70 text-right">
            {formatDateTime(msg.created_at)}
          </p>
        </div>
      </div>
    );
  }

  const isAgent = msg.sender === "agent";
  return (
    <div className={`flex ${isAgent ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-sm rounded-2xl px-4 py-2.5 ${
        isAgent
          ? "rounded-tr-sm bg-teal/10 text-teal-dark"
          : "rounded-tl-sm bg-surface-hover text-foreground"
      }`}>
        <p className="text-xs font-medium text-muted mb-1">{msg.sender_name}</p>
        <p className="text-sm leading-relaxed">{msg.content}</p>
        <p className="mt-1 text-[11px] text-muted/70 text-right">
          {formatDateTime(msg.created_at)}
        </p>
      </div>
    </div>
  );
}

function BotIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  );
}
