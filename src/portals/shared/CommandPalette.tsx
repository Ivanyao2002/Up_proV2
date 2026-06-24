"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export interface CommandPaletteItem {
  label: string;
  href: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  items: CommandPaletteItem[];
}

/**
 * Palette de recherche (Cmd/Ctrl+K) filtrant les liens de navigation du portail.
 * Composant contrôlé : l'ouverture et le raccourci clavier sont gérés par l'appelant.
 */
export function CommandPalette({ open, onClose, items }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }, [items, query]);

  // Réinitialise et focus à l'ouverture
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  // Garde l'index actif dans les bornes des résultats
  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, results.length - 1)));
  }, [results.length]);

  if (!open) return null;

  function go(href: string) {
    onClose();
    router.push(href);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (results.length ? (i + 1) % results.length : 0));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) =>
        results.length ? (i - 1 + results.length) % results.length : 0,
      );
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const item = results[activeIndex];
      if (item) go(item.href);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh]"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Recherche de navigation"
        className="w-full max-w-lg overflow-hidden rounded-card border border-border bg-surface shadow-card"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="border-b border-border px-4">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une page…"
            aria-label="Rechercher une page"
            aria-controls={listId}
            className="w-full bg-transparent py-3.5 text-sm text-foreground outline-none placeholder:text-muted"
          />
        </div>
        <ul id={listId} role="listbox" className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted">
              Aucun résultat
            </li>
          ) : (
            results.map((item, index) => (
              <li key={item.href} role="option" aria-selected={index === activeIndex}>
                <button
                  type="button"
                  onClick={() => go(item.href)}
                  onMouseMove={() => setActiveIndex(index)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    index === activeIndex
                      ? "bg-canvas text-foreground"
                      : "text-muted hover:bg-canvas hover:text-foreground"
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  <span className="ml-3 truncate text-xs text-muted">
                    {item.href}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
