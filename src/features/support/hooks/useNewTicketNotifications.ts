"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supportTicketsService } from "../api/tickets.service";
import { disputeService } from "@/features/disputes/api/dispute.service";
import {
  playChatNotificationSound,
  unlockChatAudioOnInteraction,
} from "@/shared/lib/chatNotificationSound";
import { notificationService } from "@/core/http/notificationService";
import {
  NOTIF_POLL_MS,
  NOTIF_MAX_STORED,
  notifUid,
  loadSeenIds,
  saveSeenIds,
  loadNotifications,
  saveNotifications,
  isSessionInitialized,
  markSessionInitialized,
  buildIncomingLabel,
  type SupportNotif,
  type SupportNotifKind,
} from "../lib/supportNotifications";

// Ré-export pour compat des imports existants éventuels.
export type { SupportNotif, SupportNotifKind, NewTicketNotif } from "../lib/supportNotifications";

export function useNewTicketNotifications(options?: { includeDisputes?: boolean }) {
  const includeDisputes = options?.includeDisputes ?? false;

  const [notifications, setNotifications] = useState<SupportNotif[]>(loadNotifications);
  const seenIdsRef    = useRef<Set<string>>(loadSeenIds());
  const lastNotifyRef = useRef(0);
  // Miroir de `notifications` pour dédupliquer hors du cycle de rendu, sans
  // ajouter `notifications` aux deps de l'effet de polling.
  const notifsRef     = useRef<SupportNotif[]>(notifications);

  useEffect(() => { unlockChatAudioOnInteraction(); }, []);

  useEffect(() => {
    notifsRef.current = notifications;
    saveNotifications(notifications);
  }, [notifications]);

  const { data: ticketData } = useQuery({
    queryKey: ["support", "tickets", "open-notif"],
    queryFn: () => supportTicketsService.list({ status: "open", per_page: 20 }),
    refetchInterval: NOTIF_POLL_MS,
    refetchIntervalInBackground: true,
  });

  const { data: disputeData } = useQuery({
    queryKey: ["disputes", "open-notif"],
    queryFn: () => disputeService.list({ status: "open", per_page: 20 }),
    enabled: includeDisputes,
    refetchInterval: NOTIF_POLL_MS,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    const tickets = ticketData?.data ?? [];
    const disputes = includeDisputes ? (disputeData?.data ?? []) : [];

    // Normalise les deux sources vers la shape unique `SupportNotif`.
    const candidates: SupportNotif[] = [
      ...tickets.map<SupportNotif>((t) => ({
        kind: "ticket",
        id: t.id,
        subject: t.subject,
        reporter_name: t.reporter_name,
        reporter_type: t.reporter_type,
        created_at: t.created_at,
        seen: false,
      })),
      ...disputes.map<SupportNotif>((d) => ({
        kind: "dispute",
        id: d.id,
        subject: d.subject,
        reporter_name: d.reporter_name,
        category: d.category,
        created_at: d.created_at,
        seen: false,
      })),
    ];

    if (!isSessionInitialized()) {
      // Première réception de données dans la session : enregistrer l'existant
      // sans notifier (l'agent ouvre le portail, pas besoin de le bombarder).
      candidates.forEach((c) => seenIdsRef.current.add(notifUid(c.kind, c.id)));
      saveSeenIds(seenIdsRef.current);
      markSessionInitialized();
      return;
    }

    // Polls suivants ET navigations : seenIds chargé depuis LS → seuls les vrais
    // nouveaux éléments déclenchent son + badge. On dédoublonne aussi contre la
    // liste déjà affichée (seenIds peut dériver de `notifications` après reload).
    const present = new Set(notifsRef.current.map((n) => notifUid(n.kind, n.id)));
    const fresh = candidates.filter((c) => {
      const key = notifUid(c.kind, c.id);
      return !seenIdsRef.current.has(key) && !present.has(key);
    });
    if (!fresh.length) return;

    fresh.forEach((c) => seenIdsRef.current.add(notifUid(c.kind, c.id)));
    saveSeenIds(seenIdsRef.current);

    const now = Date.now();
    if (now - lastNotifyRef.current > 1500) {
      lastNotifyRef.current = now;
      playChatNotificationSound();
      notificationService.info(buildIncomingLabel(fresh), { duration: 5000 });
    }

    setNotifications((prev) => [...fresh, ...prev].slice(0, NOTIF_MAX_STORED));
  }, [ticketData, disputeData, includeDisputes]);

  const unseenCount = notifications.filter((n) => !n.seen).length;

  function markOneSeen(kind: SupportNotifKind, id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.kind === kind && n.id === id ? { ...n, seen: true } : n))
    );
  }

  function markAllSeen() {
    setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })));
  }

  function removeOne(kind: SupportNotifKind, id: string) {
    setNotifications((prev) => prev.filter((n) => !(n.kind === kind && n.id === id)));
  }

  function clearAll() {
    setNotifications([]);
  }

  return { notifications, unseenCount, markOneSeen, markAllSeen, removeOne, clearAll };
}
