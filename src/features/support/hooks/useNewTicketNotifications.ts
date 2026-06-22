"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supportTicketsService } from "../api/tickets.service";
import {
  playChatNotificationSound,
  unlockChatAudioOnInteraction,
} from "@/shared/lib/chatNotificationSound";
import { notificationService } from "@/core/http/notificationService";
import type { AdminSupportTicket } from "../api/tickets.service";

const POLL_MS       = 8000;
const LS_SEEN_KEY   = "support:notif:seen_ids";   // IDs connus (cross-session)
const LS_NOTIFS_KEY = "support:notif:list";        // liste affichée dans la cloche
const SS_INIT_KEY   = "support:notif:initialized"; // init silencieuse faite cette session ?
const MAX_STORED    = 30;

// ── helpers ────────────────────────────────────────────────────────────────────

function loadSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_SEEN_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch { return new Set(); }
}

function saveSeenIds(ids: Set<string>) {
  try {
    localStorage.setItem(LS_SEEN_KEY, JSON.stringify([...ids].slice(-500)));
  } catch {}
}

function loadNotifications(): NewTicketNotif[] {
  try {
    const raw = localStorage.getItem(LS_NOTIFS_KEY);
    return raw ? (JSON.parse(raw) as NewTicketNotif[]) : [];
  } catch { return []; }
}

function saveNotifications(notifs: NewTicketNotif[]) {
  try {
    localStorage.setItem(LS_NOTIFS_KEY, JSON.stringify(notifs));
  } catch {}
}

// sessionStorage : survit à la navigation dans l'onglet, reset au reload/nouvel onglet.
// Grâce à ça, la 1ʳᵉ arrivée de données dans la session est silencieuse.
// Les navigations suivantes (remounts) n'entrent PLUS dans la branche init.
function isSessionInitialized(): boolean {
  try { return sessionStorage.getItem(SS_INIT_KEY) === "1"; } catch { return false; }
}
function markSessionInitialized() {
  try { sessionStorage.setItem(SS_INIT_KEY, "1"); } catch {}
}

// ── types ──────────────────────────────────────────────────────────────────────

export interface NewTicketNotif {
  id: string;
  subject: string;
  reporter_name: string;
  reporter_type: AdminSupportTicket["reporter_type"];
  created_at: string;
  seen: boolean;
}

// ── hook ───────────────────────────────────────────────────────────────────────

export function useNewTicketNotifications() {
  const [notifications, setNotifications] = useState<NewTicketNotif[]>(loadNotifications);
  const seenIdsRef    = useRef<Set<string>>(loadSeenIds());
  const lastNotifyRef = useRef(0);

  useEffect(() => { unlockChatAudioOnInteraction(); }, []);

  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  const { data } = useQuery({
    queryKey: ["support", "tickets", "open-notif"],
    queryFn: () => supportTicketsService.list({ status: "open", per_page: 20 }),
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    const tickets = data?.data ?? [];

    if (!isSessionInitialized()) {
      // Première réception de données dans la session : enregistrer les tickets
      // existants sans notifier (l'agent ouvre le portail, pas besoin de le bombarder).
      tickets.forEach((t) => seenIdsRef.current.add(t.id));
      saveSeenIds(seenIdsRef.current);
      markSessionInitialized();
      return;
    }

    // Polls suivants ET navigations : seenIds chargé depuis LS → seuls les vrais
    // nouveaux tickets déclenchent son + badge.
    const incoming = tickets.filter((t) => !seenIdsRef.current.has(t.id));
    if (!incoming.length) return;

    incoming.forEach((t) => seenIdsRef.current.add(t.id));
    saveSeenIds(seenIdsRef.current);

    const now = Date.now();
    if (now - lastNotifyRef.current > 1500) {
      lastNotifyRef.current = now;
      playChatNotificationSound();
      const label =
        incoming.length === 1
          ? `Nouvelle réclamation — ${incoming[0].reporter_name}`
          : `${incoming.length} nouvelles réclamations entrantes`;
      notificationService.info(label, { duration: 5000 });
    }

    setNotifications((prev) =>
      [
        ...incoming.map<NewTicketNotif>((t) => ({
          id: t.id,
          subject: t.subject,
          reporter_name: t.reporter_name,
          reporter_type: t.reporter_type,
          created_at: t.created_at,
          seen: false,
        })),
        ...prev,
      ].slice(0, MAX_STORED)
    );
  }, [data]);

  const unseenCount = notifications.filter((n) => !n.seen).length;

  function markOneSeen(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, seen: true } : n))
    );
  }

  function markAllSeen() {
    setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })));
  }

  function removeOne(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  function clearAll() {
    setNotifications([]);
  }

  return { notifications, unseenCount, markOneSeen, markAllSeen, removeOne, clearAll };
}
