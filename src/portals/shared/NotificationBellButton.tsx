"use client";

import Link from "next/link";
import { useNotificationsUnreadCount } from "@/features/support/api/notifications.queries";

interface NotificationBellButtonProps {
  href?: string;
}

export function NotificationBellButton({ href = "/partner/support/notifications" }: NotificationBellButtonProps) {
  const { data } = useNotificationsUnreadCount();
  const unread = data?.count ?? data?.unread_count ?? 0;

  return (
    <Link
      href={href}
      className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-foreground"
      aria-label={
        unread > 0 ? `Notifications, ${unread} non lues` : "Notifications"
      }
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[18px] w-[18px]"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {unread > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
