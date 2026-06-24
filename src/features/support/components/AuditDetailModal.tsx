"use client";

import Link from "next/link";
import { ModalPortal } from "@/shared/ui/ModalPortal";
import { formatDateTime } from "@/shared/lib/format";
import type { SupportAuditEvent, SupportAuditSeverity } from "../api/supportAudit.types";
import {
  SEVERITY_CONFIG,
  ACTION_LABELS,
  CATEGORY_LABELS,
  META_LABELS,
  getActionSubtype,
} from "../lib/auditConstants";
import type { useSupportPaths } from "../lib/supportPaths";

export function SeverityBadge({ severity }: { severity: SupportAuditSeverity }) {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

interface Props {
  event: SupportAuditEvent;
  onClose: () => void;
  paths: ReturnType<typeof useSupportPaths>;
}

export function AuditDetailModal({ event, onClose, paths }: Props) {
  const subtype = getActionSubtype(event);
  const meta = event.metadata;
  const metaEntries = meta
    ? (Object.entries(meta) as [string, unknown][]).filter(([, v]) => v != null)
    : [];

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-hidden bg-surface shadow-xl">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div className="min-w-0 flex-1 pr-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              {CATEGORY_LABELS[event.category]}
            </p>
            <h2 className="mt-0.5 text-base font-semibold text-heading">
              {ACTION_LABELS[event.action]}
            </h2>
            {subtype && <p className="mt-0.5 text-sm text-muted">{subtype}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <SeverityBadge severity={event.severity} />
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted hover:bg-surface-hover hover:text-foreground"
              aria-label="Fermer"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <section>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">Horodatage</p>
            <p className="text-sm text-foreground">{formatDateTime(event.at)}</p>
          </section>

          <section>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">Agent</p>
            <p className="text-sm font-medium text-foreground">{event.actor_name}</p>
            <p className="text-xs text-muted">{event.actor_email}</p>
          </section>

          {event.resource_id && (
            <section>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">Ressource</p>
              <Link
                href={paths.ticketDetail(event.resource_id)}
                onClick={onClose}
                className="inline-flex items-center gap-1 text-sm font-medium text-teal hover:underline"
              >
                {event.resource_label ?? event.resource_id}
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
              <p className="text-xs text-muted">{event.resource_id}</p>
            </section>
          )}

          <section>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">Détail</p>
            <p className="rounded-lg bg-canvas px-3 py-2.5 text-sm text-foreground leading-relaxed">
              {event.detail}
            </p>
          </section>

          {metaEntries.length > 0 && (
            <section>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">Métadonnées</p>
              <dl className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                {metaEntries.map(([key, value]) => (
                  <div key={key} className="flex items-baseline justify-between gap-4 px-3 py-2">
                    <dt className="text-xs text-muted shrink-0">
                      {META_LABELS[key] ?? key}
                    </dt>
                    <dd className="text-xs font-medium text-foreground text-right break-all">
                      {String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <section>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">ID d'audit</p>
            <p className="font-mono text-xs text-muted">{event.id}</p>
          </section>
        </div>
      </div>
    </ModalPortal>
  );
}
