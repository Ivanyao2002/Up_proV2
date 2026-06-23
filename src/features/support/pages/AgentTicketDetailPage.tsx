"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/core/auth/authStore";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import { formatDateTime } from "@/shared/lib/format";

import { TicketDetailRow }         from "../components/TicketDetailRow";
import { TicketStatusBadge }       from "../components/TicketStatusBadge";
import { TicketPriorityBadge }     from "../components/TicketPriorityBadge";
import { AgentMessageBubble }      from "../components/AgentMessageBubble";
import { AgentComposeArea }        from "../components/AgentComposeArea";
import { AgentSanctionsPanel }     from "../components/AgentSanctionsPanel";
import { AgentCompensationsPanel } from "../components/AgentCompensationsPanel";
import { TripSummaryPanel }        from "../components/TripSummaryPanel";
import { AgentActionModal }        from "../components/AgentActionModal";
import type { ActionModalKind }    from "../components/AgentActionModal";
import type { ComposeTab }         from "../components/AgentComposeArea";

import { useSupportPaths } from "../lib/supportPaths";
import { TERMINAL_STATUSES, REPORTER_LABELS, CATEGORY_CONFIG } from "../lib/ticketConstants";
import {
  useAgentTicketDetail,
  useAssignTicket,
  useSendMessage,
  useAddNote,
  useRequestJustification,
  useApplySanction,
  useApplyCompensation,
  useCancelCompensation,
  useResolveTicket,
  useCloseTicket,
  useEscalateTicket,
} from "../api/agentTicket.queries";
import { useChatSocketStore } from "../hooks/useSupportChatSocket";
import type {
  AgentApplicableSanctionType,
} from "../api/agentTicket.types";


interface Props {
  ticketId: string;
}

export function AgentTicketDetailPage({ ticketId }: Props) {
  const paths     = useSupportPaths();
  const threadRef = useRef<HTMLDivElement>(null);
  const [modal, setModal] = useState<ActionModalKind | null>(null);
  const currentUserId = useAuthStore((s) => s.user?.id);

  // ── Data ────────────────────────────────────────────────────────
  const { data, isLoading, isError } = useAgentTicketDetail(ticketId);

  const socketStatus = useChatSocketStore((s) => s.status);

  // ── Mutations ───────────────────────────────────────────────────
  const assign      = useAssignTicket(ticketId);
  const sendMsg     = useSendMessage(ticketId);
  const addNote     = useAddNote(ticketId);
  const requestDoc  = useRequestJustification(ticketId);
  const applySanc   = useApplySanction(ticketId);
  const applyComp   = useApplyCompensation(ticketId);
  const cancelComp  = useCancelCompensation(ticketId);
  const resolve     = useResolveTicket(ticketId);
  const close       = useCloseTicket(ticketId);
  const escalate    = useEscalateTicket(ticketId);

  // Scroll thread to bottom on new messages
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [data?.messages.length]);

  // ── Loading / Error guards ───────────────────────────────────────
  if (isLoading) return <DetailPageSkeleton />;
  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Ticket introuvable.{" "}
        <Link href={paths.tickets} className="text-teal underline">
          Retour aux tickets
        </Link>
      </p>
    );
  }

  const isTerminal = TERMINAL_STATUSES.has(data.status);
  const isAssignedToMe =
    data.assigned_to_id != null &&
    String(data.assigned_to_id) === String(currentUserId);
  const canAct = !isTerminal && isAssignedToMe;

  // ── Compose handler (single entry for all 3 tabs) ───────────────
  function handleCompose(content: string, tab: ComposeTab) {
    if (tab === "reply")         sendMsg.mutate(content);
    else if (tab === "note")     addNote.mutate(content);
    else                         requestDoc.mutate(content);
  }

  // ── Action modal confirm ─────────────────────────────────────────
  function handleModalConfirm(kind: ActionModalKind, note?: string) {
    const mutation = kind === "resolve" ? resolve : kind === "close" ? close : escalate;
    mutation.mutate(note, { onSuccess: () => setModal(null) });
  }

  const composePending = sendMsg.isPending || addNote.isPending || requestDoc.isPending;
  const modalPending   = resolve.isPending || close.isPending || escalate.isPending;

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <PageHeader
        title={data.subject}
        breadcrumb={["Support", "Tickets", data.id]}
        actions={
          isTerminal ? (
            <TicketStatusBadge status={data.status} />
          ) : canAct ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                className="!text-xs"
                onClick={() => setModal("resolve")}
              >
                Résoudre
              </Button>
              <Button
                variant="secondary"
                className="!text-xs"
                onClick={() => setModal("close")}
              >
                Clôturer
              </Button>
              <Button
                variant="secondary"
                className="!text-xs border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400"
                onClick={() => setModal("escalate")}
              >
                ↑ Escalader
              </Button>
            </div>
          ) : null
        }
      />

      <p className="mb-6 text-sm">
        <Link href={paths.tickets} className="text-teal hover:underline">
          ← Retour aux tickets
        </Link>
      </p>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

        {/* LEFT — Thread + Compose */}
        <div className="flex flex-col gap-4">

          {/* Thread */}
          <div className="flex flex-col rounded-card border border-border bg-surface shadow-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold text-heading">Conversation</h2>
              {socketStatus === "connected" && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Temps réel
                </span>
              )}
              {socketStatus === "connecting" && (
                <span className="text-xs text-muted">Connexion…</span>
              )}
            </div>
            <div
              ref={threadRef}
              className="flex max-h-[500px] flex-col gap-3 overflow-y-auto p-5"
            >
              {data.messages.length === 0 ? (
                <p className="text-center text-sm text-muted">Aucun message.</p>
              ) : (
                data.messages.map((msg) => (
                  <AgentMessageBubble key={msg.id} message={msg} />
                ))
              )}
            </div>
          </div>

          {/* Compose — hidden once ticket is terminal */}
          {canAct && (
            <AgentComposeArea isPending={composePending} onSend={handleCompose} />
          )}
          {!isTerminal && !canAct && (
            <div className="rounded-card border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {data.assigned_to
                ? `Cette réclamation est prise en charge par ${data.assigned_to}.`
                : "Assignez-vous cette réclamation pour commencer son traitement."}
            </div>
          )}
        </div>

        {/* RIGHT — Sidebar */}
        <aside className="space-y-4">

          {/* Assign card */}
          {!data.assigned_to && !isTerminal && (
            <div className="rounded-card border border-teal/30 bg-teal/5 p-4 shadow-card">
              <p className="text-sm font-semibold text-heading">Ticket non assigné</p>
              <p className="mt-1 text-xs text-muted">
                Prenez en charge ce ticket pour démarrer le traitement.
              </p>
              <Button
                className="mt-3 w-full"
                disabled={assign.isPending}
                onClick={() => assign.mutate()}
              >
                {assign.isPending ? "Assignation…" : "Prendre en charge"}
              </Button>
            </div>
          )}

          {data.assigned_to && (
            <div className="rounded-card border border-border bg-surface px-4 py-3 text-sm shadow-card">
              <span className="text-muted">Assigné à </span>
              <span className="font-medium text-foreground">{data.assigned_to}</span>
            </div>
          )}

          {/* Ticket metadata */}
          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <h3 className="text-sm font-semibold text-heading">Détails</h3>
            <dl className="mt-3 space-y-2.5 text-sm">
              <TicketDetailRow label="Statut">
                <TicketStatusBadge status={data.status} />
              </TicketDetailRow>
              <TicketDetailRow label="Priorité">
                <TicketPriorityBadge priority={data.priority} />
              </TicketDetailRow>
              <TicketDetailRow label="Signaleur">
                <span className="font-medium text-foreground">{data.reporter_name}</span>
              </TicketDetailRow>
              <TicketDetailRow label="Type">
                <span className="text-foreground">
                  {REPORTER_LABELS[data.reporter_type] ?? data.reporter_type}
                </span>
              </TicketDetailRow>
              <TicketDetailRow label="Catégorie">
                {data.category
                  ? <span className="text-foreground">{CATEGORY_CONFIG[data.category]?.label ?? data.category}</span>
                  : <span className="italic text-muted">Non catégorisé</span>
                }
              </TicketDetailRow>
              <TicketDetailRow label="Franchise">
                <span className="text-right text-foreground">{data.franchise_name}</span>
              </TicketDetailRow>
              {data.trip_ref && (
                <TicketDetailRow label="Course">
                  <span className="font-mono text-foreground">{data.trip_ref}</span>
                </TicketDetailRow>
              )}
              <TicketDetailRow label="Créé le">
                <span className="text-foreground">{formatDateTime(data.created_at)}</span>
              </TicketDetailRow>
            </dl>
          </div>

          {/* Résumé course */}
          {data.trip_id && data.trip_ref && (
            <TripSummaryPanel tripId={data.trip_id} tripRef={data.trip_ref} />
          )}

          {/* Sanctions */}
          <AgentSanctionsPanel
            sanctions={data.sanctions}
            readOnly={!canAct}
            noTrip={!data.trip_id}
            isPending={applySanc.isPending}
            onApply={(type: AgentApplicableSanctionType, reason: string) =>
              applySanc.mutate({ type, reason })
            }
          />

          {/* Compensations */}
          <AgentCompensationsPanel
            compensations={data.compensations}
            readOnly={!canAct}
            isPending={applyComp.isPending}
            isCancelling={cancelComp.isPending}
            onApply={(payload) => applyComp.mutate(payload)}
            onCancel={(compId) => cancelComp.mutate(compId)}
          />
        </aside>
      </div>

      {/* Action modals */}
      {modal && (
        <AgentActionModal
          kind={modal}
          isPending={modalPending}
          onConfirm={(note) => handleModalConfirm(modal, note)}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}

