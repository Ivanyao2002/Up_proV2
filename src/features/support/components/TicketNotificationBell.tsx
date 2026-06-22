"use client";

import { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { timeAgo } from "@/shared/lib/format";
import { useNewTicketNotifications } from "../hooks/useNewTicketNotifications";
import { useSupportPaths } from "../lib/supportPaths";
import { REPORTER_LABELS } from "../lib/ticketConstants";

export function TicketNotificationBell() {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);
  const paths = useSupportPaths();
  const { notifications, unseenCount, markOneSeen, markAllSeen, removeOne, clearAll } =
    useNewTicketNotifications();

  const hasUnseen = unseenCount > 0;

  // Calculer la position du dropdown par rapport au trigger
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
    });
  }, [open]);

  // Fermer au clic extérieur
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const dropdown = open ? (
    <div
      ref={panelRef}
      style={dropdownStyle}
      className="z-[9999] w-80 overflow-hidden rounded-2xl border border-border bg-surface shadow-elevated"
    >
      <div className="h-[3px] bg-amber-500" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          Réclamations entrantes
        </p>
        {notifications.length > 0 && (
          <div className="flex items-center gap-1">
            {hasUnseen && (
              <button
                type="button"
                onClick={markAllSeen}
                title="Tout marquer comme lu"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-teal"
              >
                {/* Double check */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 12.5 7 18 22.5 6" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 12.5 12.5 18 22.5 6" opacity="0.4" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={clearAll}
              title="Tout supprimer"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-red-500"
            >
              {/* Trash */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <div className="px-4 pb-5 pt-2 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-canvas">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5 text-muted">
              <path strokeLinecap="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 0 0-5-5.917V4a1 1 0 1 0-2 0v1.083A6 6 0 0 0 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" />
            </svg>
          </div>
          <p className="text-xs text-muted">Aucune nouvelle réclamation</p>
        </div>
      ) : (
        <ul className="max-h-72 divide-y divide-border overflow-y-auto">
          {notifications.map((notif) => (
            <li key={notif.id} className="group relative">
              <Link
                href={paths.ticketDetail(notif.id)}
                onClick={() => {
                  markOneSeen(notif.id);
                  setOpen(false);
                }}
                className="flex items-start gap-3 px-4 py-3 pr-8 transition-colors hover:bg-surface-hover"
              >
                {/* Dot non-lu */}
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full transition-colors ${
                    notif.seen ? "bg-transparent" : "bg-amber-500"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm ${notif.seen ? "font-normal text-muted" : "font-medium text-foreground"}`}>
                    {notif.subject}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {REPORTER_LABELS[notif.reporter_type] ?? notif.reporter_type} · {notif.reporter_name}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-muted">{timeAgo(notif.created_at)}</span>
              </Link>

              {/* Bouton supprimer — visible au hover */}
              <button
                type="button"
                onClick={() => removeOne(notif.id)}
                aria-label="Supprimer cette notification"
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full text-muted opacity-0 transition-opacity hover:bg-canvas hover:text-foreground group-hover:opacity-100"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Footer */}
      <div className="border-t border-border px-4 py-2.5">
        <Link
          href={paths.tickets}
          onClick={() => setOpen(false)}
          className="flex items-center justify-center gap-1 text-xs font-medium text-teal hover:underline"
        >
          Voir toutes les réclamations
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Réclamations entrantes${unseenCount > 0 ? ` — ${unseenCount} nouvelles` : ""}`}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-canvas text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[18px] w-[18px]">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 0 0-5-5.917V4a1 1 0 1 0-2 0v1.083A6 6 0 0 0 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" />
        </svg>

        {unseenCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unseenCount > 99 ? "99+" : unseenCount}
          </span>
        )}
      </button>

      {typeof document !== "undefined" && createPortal(dropdown, document.body)}
    </>
  );
}
