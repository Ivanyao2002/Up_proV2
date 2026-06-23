"use client";

import { usePathname } from "next/navigation";
import { useAuthStore } from "@/core/auth/authStore";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { MobileNavToggle } from "@/portals/shared/MobileNavToggle";
import type { PortalShellTopbarProps } from "@/portals/shared/PortalShellLayout";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";

const PAGE_CONTEXTS = [
  {
    path: "/reporting/activity",
    title: "Activité consolidée",
    description: "Volumes, performance et classement des activités",
  },
  {
    path: "/reporting/finance",
    title: "Finance analytique",
    description: "GMV, commissions, wallets et transactions",
  },
  {
    path: "/reporting/quality",
    title: "Qualité & incidents",
    description: "Réclamations, délais de traitement et respect des SLA",
  },
  {
    path: "/reporting/governance",
    title: "Audit & conformité",
    description: "Événements sensibles et conformité des entités",
  },
  {
    path: "/reporting/exports",
    title: "Rapports & exports",
    description: "Génération et téléchargement des rapports consolidés",
  },
] as const;

function getPageContext(pathname: string) {
  return (
    PAGE_CONTEXTS.find(({ path }) => pathname.startsWith(path)) ?? {
      title: "Tableau de bord reporting",
      description: "Vue consolidée des performances de la plateforme",
    }
  );
}

function getInitials(name?: string) {
  return (name ?? "Analyste Reporting")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ReportingTopbar({
  onMenuToggle,
  mobileNavOpen,
}: PortalShellTopbarProps) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const context = getPageContext(pathname);

  return (
    <header className="relative z-20 m-3 mb-0 flex h-16 shrink-0 items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 shadow-card sm:mx-4 sm:px-6">
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
            <path d="M4 19V9" />
            <path d="M10 19V5" />
            <path d="M16 19v-7" />
            <path d="M22 19V3" />
            <path d="M2 19h22" />
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
          className="hidden items-center gap-2 rounded-full border border-border bg-canvas px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 lg:flex"
          title="Le portail Reporting ne permet aucune mutation métier"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Lecture seule
        </div>

        <ThemeToggle />

        <div className="hidden items-center gap-2 border-l border-border pl-3 md:flex">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-xs font-semibold text-white">
            {getInitials(user?.name)}
          </span>
          <div className="max-w-[11rem] leading-tight">
            <p className="truncate text-sm font-medium text-foreground">
              {user?.name ?? "Analyste Reporting"}
            </p>
            <p className="text-xs text-muted">Analyste reporting</p>
          </div>
        </div>

        <LogoutButton
          loginPath="/reporting/login"
          className="!h-9 !px-2.5 !py-0 text-xs sm:!px-3"
        />
      </div>
    </header>
  );
}
