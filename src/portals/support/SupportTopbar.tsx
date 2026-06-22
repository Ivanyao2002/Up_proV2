"use client";

import { usePathname } from "next/navigation";
import { useAuthStore } from "@/core/auth/authStore";
import { env } from "@/core/config/env";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { useChatSocketStore } from "@/features/support/hooks/useSupportChatSocket";
import { TicketNotificationBell } from "@/features/support/components/TicketNotificationBell";
import { MobileNavToggle } from "@/portals/shared/MobileNavToggle";
import type { PortalShellTopbarProps } from "@/portals/shared/PortalShellLayout";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";

function getPageContext(pathname: string) {
  if (/\/support\/tickets\/[^/]+$/.test(pathname)) {
    return {
      title: "Traitement d’une réclamation",
      description: "Conversation, analyse et actions de résolution",
    };
  }
  if (pathname.startsWith("/support/tickets")) {
    return {
      title: "File des réclamations",
      description: "Plaintes partagées entre les agents support",
    };
  }
  if (/\/support\/chat\/[^/]+$/.test(pathname)) {
    return {
      title: "Conversation support",
      description: "Échange en temps réel avec une franchise",
    };
  }
  if (pathname.startsWith("/support/chat")) {
    return {
      title: "Chat support",
      description: "Conversations et messages non lus",
    };
  }
  if (pathname.startsWith("/support/anomalies")) {
    return {
      title: "Historique des réclamations",
      description: "Traçabilité des actions réalisées par les agents",
    };
  }
  return {
    title: "Centre de support",
    description: "Vue d’ensemble de l’activité",
  };
}

function getInitials(name?: string) {
  return (name ?? "Agent Support")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function SupportTopbar({
  onMenuToggle,
  mobileNavOpen,
}: PortalShellTopbarProps) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const socketStatus = useChatSocketStore((s) => s.status);
  const context = getPageContext(pathname);

  const realtime = env.useRealAuth
    ? socketStatus === "connected"
      ? { label: "Temps réel actif", dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300" }
      : socketStatus === "connecting"
        ? { label: "Connexion…", dot: "bg-amber-400 animate-pulse", text: "text-amber-700 dark:text-amber-300" }
        : { label: "Reconnexion", dot: "bg-red-500", text: "text-red-700 dark:text-red-300" }
    : { label: "Mode démonstration", dot: "bg-blue-500", text: "text-blue-700 dark:text-blue-300" };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <MobileNavToggle onClick={onMenuToggle} open={mobileNavOpen} />

        <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal-dark sm:flex">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
            aria-hidden
          >
            <path d="M4 13v-2a8 8 0 0 1 16 0v2" />
            <path d="M4 13a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2ZM20 13a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2Z" />
            <path d="M17 17c0 2-2 3-5 3" />
          </svg>
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-heading">
            {context.title}
          </p>
          <p className="hidden truncate text-xs text-muted sm:block">
            {context.description}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div
          className={`hidden items-center gap-2 rounded-full border border-border bg-canvas px-3 py-1.5 text-xs font-medium lg:flex ${realtime.text}`}
          title="État de synchronisation du support"
        >
          <span className={`h-2 w-2 rounded-full ${realtime.dot}`} />
          {realtime.label}
        </div>

        <TicketNotificationBell />

        <ThemeToggle />

        <div className="hidden items-center gap-2 border-l border-border pl-3 md:flex">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-xs font-semibold text-white">
            {getInitials(user?.name)}
          </span>
          <div className="max-w-[11rem] leading-tight">
            <p className="truncate text-sm font-medium text-foreground">
              {user?.name ?? "Agent Support"}
            </p>
            <p className="text-xs text-muted">Agent support</p>
          </div>
        </div>

        <LogoutButton
          loginPath="/support/login"
          className="!h-9 !px-2.5 !py-0 text-xs sm:!px-3"
        />
      </div>
    </header>
  );
}
