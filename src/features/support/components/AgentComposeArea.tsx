"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/Button";

export type ComposeTab = "reply" | "note" | "justification";

interface Props {
  isPending : boolean;
  onSend    : (content: string, tab: ComposeTab) => void;
}

const TABS: { id: ComposeTab; label: string }[] = [
  { id: "reply",         label: "Répondre" },
  { id: "note",          label: "Note interne" },
  { id: "justification", label: "Justificatifs" },
];

const HINTS: Record<ComposeTab, string | null> = {
  reply        : null,
  note         : "Visible uniquement par les agents support.",
  justification: "L'utilisateur recevra une demande de pièce justificative.",
};

const HINT_STYLES: Record<ComposeTab, string> = {
  reply        : "",
  note         : "text-amber-700 dark:text-amber-300",
  justification: "text-indigo-700 dark:text-indigo-300",
};

const PLACEHOLDERS: Record<ComposeTab, string> = {
  reply        : "Répondre à l'utilisateur…",
  note         : "Ajouter une note interne…",
  justification: "Décrire les justificatifs demandés…",
};

export function AgentComposeArea({ isPending, onSend }: Props) {
  const [activeTab, setActiveTab]   = useState<ComposeTab>("reply");
  const [content, setContent]       = useState("");

  function handleSend() {
    const trimmed = content.trim();
    if (!trimmed) return;
    onSend(trimmed, activeTab);
    setContent("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
  }

  return (
    <div className="rounded-card border border-border bg-surface shadow-card">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-border px-4 pt-3">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
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
        {HINTS[activeTab] && (
          <p className={`mb-2 text-xs ${HINT_STYLES[activeTab]}`}>
            {HINTS[activeTab]}
          </p>
        )}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          placeholder={PLACEHOLDERS[activeTab]}
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
