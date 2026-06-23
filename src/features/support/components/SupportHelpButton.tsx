"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HELP_INTRO, HELP_SECTIONS, HELP_ACCENT_DOT } from "../lib/helpGuide";

export function SupportHelpButton() {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);

  // Position du panneau par rapport au bouton.
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
    });
  }, [open]);

  // Fermer au clic extérieur + touche Échap.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const panel = open ? (
    <div
      ref={panelRef}
      style={dropdownStyle}
      className="z-[9999] w-[22rem] overflow-hidden rounded-2xl border border-border bg-surface shadow-elevated"
    >
      <div className="h-[3px] bg-teal" />

      {/* Header */}
      <div className="px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          Aide — guide du support
        </p>
        <p className="mt-1 text-xs text-muted">{HELP_INTRO}</p>
      </div>

      {/* Sections */}
      <ul className="max-h-[26rem] divide-y divide-border overflow-y-auto">
        {HELP_SECTIONS.map((section) => (
          <li key={section.id} className="px-4 py-3">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 shrink-0 rounded-full ${HELP_ACCENT_DOT[section.accent]}`} />
              <p className="text-sm font-semibold text-foreground">{section.title}</p>
            </div>
            <p className="mt-1 text-xs text-muted">{section.intro}</p>
            <ul className="mt-2 space-y-1.5">
              {section.points.map((point, i) => (
                <li key={i} className="flex gap-2 text-xs text-foreground/80">
                  <span className="mt-[3px] h-1 w-1 shrink-0 rounded-full bg-muted" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="border-t border-border px-4 py-2.5">
        <p className="text-[11px] text-muted">
          Version préliminaire — d’autres rubriques arrivent.
        </p>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Aide et guide du support"
        aria-expanded={open}
        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-canvas transition-colors hover:bg-surface-hover hover:text-foreground ${
          open ? "text-teal" : "text-muted"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[18px] w-[18px]">
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.24c-.7.36-1.1.93-1.1 1.76v.25" />
          <path strokeLinecap="round" d="M12 17h.01" />
        </svg>
      </button>

      {typeof document !== "undefined" && createPortal(panel, document.body)}
    </>
  );
}
