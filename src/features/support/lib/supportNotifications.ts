// Constantes, types et helpers purs de la cloche de notifications support.
// Aucune logique React ici (cf. règle lib/ vs hooks/components) : config,
// persistance localStorage/sessionStorage et libellés FR vivent dans lib/.

import type { AdminSupportTicket } from "../api/tickets.service";
import type { DisputeCategory } from "@/features/disputes/api/dispute.types";

// ── config ───────────────────────────────────────────────────────────────────

export const NOTIF_POLL_MS    = 8000;  // cadence de polling tickets + litiges
export const NOTIF_MAX_STORED = 30;    // notifications conservées dans la cloche
const SEEN_IDS_CAP = 500;              // borne du jeu d'IDs « vus » persistés

const LS_SEEN_KEY   = "support:notif:seen_ids";    // IDs connus (cross-session)
const LS_NOTIFS_KEY = "support:notif:list";        // liste affichée dans la cloche
const SS_INIT_KEY   = "support:notif:initialized"; // init silencieuse faite cette session ?

// ── types ──────────────────────────────────────────────────────────────────────

export type SupportNotifKind = "ticket" | "dispute";

export interface SupportNotif {
  kind: SupportNotifKind;
  id: string;
  subject: string;
  reporter_name: string;
  /** Présent pour les réclamations (tickets). */
  reporter_type?: AdminSupportTicket["reporter_type"];
  /** Présent pour les litiges (disputes). */
  category?: DisputeCategory;
  created_at: string;
  seen: boolean;
}

/** Conserve l'ancien nom de type pour les imports existants. */
export type NewTicketNotif = SupportNotif;

// IDs tickets et litiges peuvent se chevaucher → on namespace la clé « vu ».
export function notifUid(kind: SupportNotifKind, id: string) {
  return `${kind}:${id}`;
}

// ── persistance : IDs déjà vus (localStorage, cross-session) ─────────────────────

export function loadSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_SEEN_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch { return new Set(); }
}

export function saveSeenIds(ids: Set<string>) {
  try {
    localStorage.setItem(LS_SEEN_KEY, JSON.stringify([...ids].slice(-SEEN_IDS_CAP)));
  } catch {}
}

// ── persistance : liste affichée (localStorage) ──────────────────────────────────

export function loadNotifications(): SupportNotif[] {
  try {
    const raw = localStorage.getItem(LS_NOTIFS_KEY);
    const list = raw ? (JSON.parse(raw) as SupportNotif[]) : [];
    // Rétro-compat (entrées sans `kind` → ticket) + dédup par `kind:id` : purge
    // d'éventuels doublons persistés, sinon React lève « same key ».
    const seen = new Set<string>();
    const out: SupportNotif[] = [];
    for (const n of list) {
      const kind = n.kind ?? "ticket";
      const key = notifUid(kind, n.id);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ ...n, kind });
    }
    return out;
  } catch { return []; }
}

export function saveNotifications(notifs: SupportNotif[]) {
  try {
    localStorage.setItem(LS_NOTIFS_KEY, JSON.stringify(notifs));
  } catch {}
}

// ── init silencieuse (sessionStorage) ────────────────────────────────────────────
// Survit à la navigation dans l'onglet, reset au reload/nouvel onglet. La 1ʳᵉ
// arrivée de données dans la session est ainsi silencieuse ; les navigations
// suivantes (remounts) n'entrent PLUS dans la branche init.

export function isSessionInitialized(): boolean {
  try { return sessionStorage.getItem(SS_INIT_KEY) === "1"; } catch { return false; }
}

export function markSessionInitialized() {
  try { sessionStorage.setItem(SS_INIT_KEY, "1"); } catch {}
}

// ── libellé du toast selon le mix réclamations / litiges entrants ────────────────

export function buildIncomingLabel(incoming: SupportNotif[]): string {
  const tickets  = incoming.filter((n) => n.kind === "ticket");
  const disputes = incoming.filter((n) => n.kind === "dispute");

  if (disputes.length === 0) {
    return tickets.length === 1
      ? `Nouvelle réclamation — ${tickets[0].reporter_name}`
      : `${tickets.length} nouvelles réclamations entrantes`;
  }
  if (tickets.length === 0) {
    return disputes.length === 1
      ? `Nouveau litige — ${disputes[0].reporter_name}`
      : `${disputes.length} nouveaux litiges entrants`;
  }
  return `${incoming.length} nouvelles demandes (réclamations & litiges)`;
}
