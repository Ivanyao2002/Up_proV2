"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { QUICK_REPLIES } from "../lib/quickReplies";

export type ComposeTab = "reply" | "note" | "justification";

interface Props {
  isPending : boolean;
  onSend    : (content: string, tab: ComposeTab) => void;
}

const TABS: { id: ComposeTab; label: string }[] = [
  { id: "reply", label: "Répondre" },
  { id: "note",  label: "Note interne" },
];

const PLACEHOLDERS: Record<ComposeTab, string> = {
  reply        : "Répondre à l'utilisateur…",
  note         : "Ajouter une note interne (visible par les agents uniquement)…",
  justification: "Décrire les justificatifs demandés…",
};

export function AgentComposeArea({ isPending, onSend }: Props) {
  const [activeTab, setActiveTab] = useState<ComposeTab>("reply");
  const [content, setContent]     = useState("");
  // Marque une réponse comme demande de justificatif (déclenchée par un quick reply).
  const [asJustification, setAsJustification] = useState(false);

  const isNote = activeTab === "note";

  function handleSend() {
    const trimmed = content.trim();
    if (!trimmed) return;
    const effectiveTab: ComposeTab = isNote
      ? "note"
      : asJustification
        ? "justification"
        : "reply";
    onSend(trimmed, effectiveTab);
    setContent("");
    setAsJustification(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
  }

  function applyQuickReply(text: string, tab?: ComposeTab) {
    setContent(text);
    setAsJustification(tab === "justification");
  }

  function selectTab(id: ComposeTab) {
    setActiveTab(id);
    if (id === "note") setAsJustification(false);
  }

  return (
    <div className="rounded-card border border-border bg-surface shadow-card">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-border px-4 pt-3">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => selectTab(id)}
            className={`rounded-t-md px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === id
                ? "bg-canvas text-teal-dark"
                : "text-muted hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Réponses prédéfinies — uniquement en mode "Répondre" */}
        {!isNote && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {QUICK_REPLIES.map((qr) => (
              <button
                key={qr.label}
                type="button"
                onClick={() => applyQuickReply(qr.text, qr.tab)}
                className="rounded-full border border-border bg-canvas px-2.5 py-1 text-[11px] font-medium text-muted transition-colors hover:border-teal/40 hover:text-teal-dark"
              >
                {qr.label}
              </button>
            ))}
          </div>
        )}

        {isNote && (
          <p className="mb-2 text-xs text-amber-700 dark:text-amber-300">
            Visible uniquement par les agents support.
          </p>
        )}
        {asJustification && !isNote && (
          <p className="mb-2 flex items-center gap-1.5 text-xs text-indigo-700 dark:text-indigo-300">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Cette réponse sera envoyée comme demande de justificatif.
          </p>
        )}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          placeholder={PLACEHOLDERS[isNote ? "note" : asJustification ? "justification" : "reply"]}
          className="w-full resize-none rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
        />

        <div className="mt-3 flex items-center justify-between">
          <p className="text-[11px] text-muted">⌘ + Entrée pour envoyer</p>
          <Button disabled={!content.trim() || isPending} onClick={handleSend}>
            {isPending ? "Envoi…" : "Envoyer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
