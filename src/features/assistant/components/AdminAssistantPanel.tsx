"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/shared/ui/Button";
import { useAdminAssistant } from "../hooks/useAdminAssistant";
import { useAssistantOnboarding } from "../hooks/useAssistantOnboarding";

interface AdminAssistantPanelProps {
  open: boolean;
  onClose: () => void;
}

type PanelTab = "chat" | "onboarding";

export function AdminAssistantPanel({ open, onClose }: AdminAssistantPanelProps) {
  const {
    messages,
    isLoading,
    isExecuting,
    send,
    openCandidate,
    briefing,
    loadBriefing,
    pendingConfirmation,
    confirmPendingAction,
    dismissConfirmation,
    openBriefingLink,
    pageContext,
    suggestionChips,
  } = useAdminAssistant();
  const {
    processFiles,
    isProcessing,
    error: onboardingError,
    lastSummary,
    missingDocsWarning,
  } = useAssistantOnboarding();
  const [tab, setTab] = useState<PanelTab>("chat");
  const [draft, setDraft] = useState("");
  const [alertsExpanded, setAlertsExpanded] = useState(false);
  const [alertsDismissed, setAlertsDismissed] = useState(false);
  const [pickedFiles, setPickedFiles] = useState<File[]>([]);
  const [partnerQuery, setPartnerQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) void loadBriefing();
  }, [open, loadBriefing]);

  useEffect(() => {
    if (open) setAlertsDismissed(false);
  }, [open]);

  useEffect(() => {
    if (open && scrollRef.current && tab === "chat") {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, isLoading, tab]);

  if (!open) return null;

  const busy = isLoading || isProcessing || isExecuting;
  const contextHint =
    pageContext.entity && pageContext.entityId
      ? `Contexte : ${pageContext.entity}`
      : null;
  const alertCount = briefing?.alerts.length ?? 0;
  const showAlerts = tab === "chat" && alertCount > 0 && !alertsDismissed;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex max-h-[calc(100vh-2rem)] w-[min(100vw-2rem,420px)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
      role="dialog"
      aria-label="Assistant IA admin"
    >
      <header className="relative z-10 flex shrink-0 items-start justify-between gap-3 border-b border-border bg-surface px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground-display">
              Assistant UpJunoo
            </p>
            {alertCount > 0 && tab === "chat" ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-800">
                {alertCount}
              </span>
            ) : null}
          </div>
          <p className="truncate text-xs text-muted">
            {tab === "chat"
              ? contextHint ?? "Navigation · filtres · résumés · actions"
              : "Inscription chauffeur assistée"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg border border-border bg-canvas p-1.5 text-sm leading-none text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          aria-label="Fermer l'assistant"
        >
          ✕
        </button>
      </header>

      <div className="flex shrink-0 border-b border-border bg-canvas px-2 py-1.5">
        <button
          type="button"
          onClick={() => setTab("chat")}
          className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium ${
            tab === "chat"
              ? "bg-surface text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          Chat
        </button>
        <button
          type="button"
          onClick={() => setTab("onboarding")}
          className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium ${
            tab === "onboarding"
              ? "bg-surface text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          Inscription
        </button>
      </div>

      {showAlerts ? (
        <div className="shrink-0 border-b border-border bg-canvas px-3 py-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAlertsExpanded((v) => !v)}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-0.5 text-left hover:bg-surface"
              aria-expanded={alertsExpanded}
            >
              <span className="text-xs font-medium text-foreground">
                {alertCount} point{alertCount > 1 ? "s" : ""} d&apos;attention
              </span>
              <span className="text-[10px] text-muted">{alertsExpanded ? "▾" : "▸"}</span>
            </button>
            <button
              type="button"
              onClick={() => setAlertsDismissed(true)}
              className="shrink-0 rounded p-1 text-xs text-muted hover:bg-surface hover:text-foreground"
              aria-label="Masquer les alertes"
              title="Masquer"
            >
              ✕
            </button>
          </div>

          {alertsExpanded ? (
            <ul className="mt-2 space-y-1">
              {briefing!.alerts.slice(0, 5).map((a) => (
                <li key={`${a.href}-${a.label}`}>
                  <button
                    type="button"
                    onClick={() => openBriefingLink(a.href)}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-left text-xs transition-colors hover:border-teal/30 hover:bg-surface-hover ${
                      a.severity === "critical"
                        ? "text-red-700"
                        : a.severity === "warning"
                          ? "text-amber-800"
                          : "text-foreground"
                    }`}
                  >
                    <span className="min-w-0 truncate">{a.label}</span>
                    <span className="shrink-0 text-muted">→</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-1.5 flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {briefing!.alerts.slice(0, 4).map((a) => (
                <button
                  key={`${a.href}-${a.label}`}
                  type="button"
                  onClick={() => openBriefingLink(a.href)}
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] transition-colors hover:border-teal/40 ${
                    a.severity === "critical"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : a.severity === "warning"
                        ? "border-amber-200 bg-amber-50 text-amber-800"
                        : "border-border bg-surface text-muted hover:text-foreground"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {tab === "chat" ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            ref={scrollRef}
            className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4"
          >
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      isUser
                        ? "bg-teal text-white"
                        : "bg-canvas text-foreground"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      {!isUser && m.content.length > 20 ? (
                        <button
                          type="button"
                          title="Copier le résumé"
                          className="shrink-0 rounded p-0.5 text-xs text-muted hover:bg-surface-hover hover:text-foreground"
                          onClick={() => {
                            void navigator.clipboard.writeText(m.content);
                          }}
                        >
                          ⎘
                        </button>
                      ) : null}
                    </div>
                    {m.candidates?.length ? (
                      <ul className="mt-2 space-y-1 border-t border-border/50 pt-2">
                        {m.candidates.map((c) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              className="text-left text-xs text-teal underline hover:no-underline"
                              onClick={() => openCandidate(c.kind, c.id)}
                            >
                              {c.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              );
            })}
            {isLoading ? (
              <p className="text-center text-xs text-muted">Réflexion en cours…</p>
            ) : null}
          </div>

          {pendingConfirmation ? (
            <div
              className={`mx-3 mb-2 shrink-0 rounded-xl border px-3 py-3 text-sm ${
                pendingConfirmation.severity === "critical"
                  ? "border-red-200 bg-red-50"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              <p className="font-semibold">{pendingConfirmation.title}</p>
              <p className="mt-1 text-xs text-muted">{pendingConfirmation.description}</p>
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  variant="primary"
                  className="flex-1 text-xs"
                  disabled={isExecuting}
                  onClick={() => void confirmPendingAction()}
                >
                  {isExecuting ? "…" : "Confirmer"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1 text-xs"
                  disabled={isExecuting}
                  onClick={dismissConfirmation}
                >
                  Annuler
                </Button>
              </div>
              <p className="mt-2 text-[11px] text-muted">
                Cliquez Confirmer ou tapez « oui » — un autre message annule l&apos;action.
              </p>
            </div>
          ) : null}

          {suggestionChips.length ? (
            <div className="flex shrink-0 flex-wrap gap-1.5 border-t border-border px-3 py-2">
              {suggestionChips.map((chip) => (
                <button
                  key={chip.prompt}
                  type="button"
                  disabled={busy}
                  onClick={() => void send(chip.prompt)}
                  className="rounded-full border border-border bg-canvas px-2.5 py-1 text-xs text-muted transition-colors hover:border-teal/40 hover:text-foreground disabled:opacity-50"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          ) : null}

          <form
            className="flex shrink-0 gap-2 border-t border-border p-3"
            onSubmit={(e) => {
              e.preventDefault();
              const text = draft.trim();
              if (!text) return;
              void send(text);
              setDraft("");
            }}
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={
                pageContext.entityId
                  ? "Ex. Résume cette fiche, son véhicule…"
                  : "Ex. KYC en attente, chauffeur Kouassi…"
              }
              disabled={busy}
              className="min-w-0 flex-1 rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none ring-teal/30 focus:ring-2"
            />
            <Button type="submit" disabled={busy || !draft.trim()} className="shrink-0 px-3">
              →
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
          <p className="text-sm text-muted">
            Déposez les photos (CNI, permis, carte grise ou équivalent, assurance, selfie…). L&apos;assistant classe
            les documents, extrait les champs, puis ouvre le formulaire pré-rempli pour
            validation humaine.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const list = e.target.files ? Array.from(e.target.files) : [];
              setPickedFiles(list);
            }}
          />

          <button
            type="button"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const list = Array.from(e.dataTransfer.files).filter((f) =>
                f.type.startsWith("image/")
              );
              if (list.length) setPickedFiles(list);
            }}
            className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-canvas px-4 py-6 text-sm text-muted transition-colors hover:border-teal/50 hover:bg-surface"
          >
            <span className="text-2xl">📎</span>
            <span>Glisser-déposer ou cliquer pour choisir des images</span>
            {pickedFiles.length ? (
              <span className="font-medium text-teal">
                {pickedFiles.length} fichier{pickedFiles.length > 1 ? "s" : ""} sélectionné
                {pickedFiles.length > 1 ? "s" : ""}
              </span>
            ) : null}
          </button>

          {pickedFiles.length ? (
            <ul className="max-h-28 space-y-1 overflow-y-auto rounded-lg border border-border bg-canvas px-3 py-2 text-xs text-muted">
              {pickedFiles.map((f) => (
                <li key={`${f.name}-${f.size}`} className="truncate">
                  {f.name}
                </li>
              ))}
            </ul>
          ) : null}

          <label className="block text-sm">
            <span className="text-muted">Partenaire (optionnel, nom ou ID)</span>
            <input
              type="text"
              value={partnerQuery}
              onChange={(e) => setPartnerQuery(e.target.value)}
              placeholder="Ex. Taxi Abobo"
              disabled={busy}
              className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none ring-teal/30 focus:ring-2"
            />
          </label>

          {missingDocsWarning ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {missingDocsWarning}
            </p>
          ) : null}

          {onboardingError ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {onboardingError}
            </p>
          ) : null}

          {lastSummary.length ? (
            <ul className="space-y-1 rounded-lg border border-border bg-canvas px-3 py-2 text-xs">
              {lastSummary.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}

          <Button
            type="button"
            disabled={busy || !pickedFiles.length}
            className="w-full"
            onClick={() => {
              void processFiles(pickedFiles, partnerQuery.trim() || undefined);
            }}
          >
            {isProcessing ? "Analyse en cours…" : "Analyser et ouvrir le formulaire"}
          </Button>
        </div>
      )}
    </div>
  );
}

export function AdminAssistantFab({
  onClick,
  active,
}: {
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Assistant IA"
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors ${
        active
          ? "bg-teal text-white"
          : "border border-border bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
      }`}
      aria-label="Ouvrir l'assistant IA"
    >
      ✦
    </button>
  );
}
