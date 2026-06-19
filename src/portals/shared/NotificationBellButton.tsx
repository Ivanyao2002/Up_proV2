"use client";

import Link from "next/link";
import { usePartnerSupportChats } from "@/features/partner/api/support.queries";

export function NotificationBellButton() {
  const { data } = usePartnerSupportChats({ per_page: 50 });
  const unread = (data?.data ?? []).reduce(
    (sum, chat) => sum + (chat.unread_count ?? 0),
    0
  );

  return (
    <Link
      href="/partner/support/notifications"
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-canvas text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
      aria-label={
        unread > 0 ? `Notifications (${unread} non lues)` : "Notifications"
      }
      title="Notifications"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        className="h-[18px] w-[18px]"
        aria-hidden
      >
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unread > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
