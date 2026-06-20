"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { NavGroup } from "@/portals/shared/navTypes";
import { useAuthStore } from "@/core/auth/authStore";
import { AppLogo } from "@/shared/ui/AppLogo";
import { NavIcon } from "./NavIcon";
import { isNavGroupActive, isNavItemActive } from "./navActive";

interface PortalSidebarProps {
  nav: NavGroup[];
  subtitle: string;
  appearance?: "default" | "support";
  filterByPermission?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function PortalSidebar({
  nav,
  subtitle,
  appearance = "default",
  filterByPermission = true,
  mobileOpen = false,
  onMobileClose,
}: PortalSidebarProps) {
  const pathname = usePathname();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const isSupport = appearance === "support";

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const section of nav) {
        const items = filterByPermission
          ? section.items.filter((item) => hasPermission(item.permission))
          : section.items;
        if (items.length === 0) continue;
        if (isNavGroupActive(pathname, items)) {
          next[section.group] = true;
        } else if (next[section.group] === undefined) {
          next[section.group] = true;
        }
      }
      return next;
    });
  }, [pathname, nav, filterByPermission, hasPermission]);

  const toggleGroup = (group: string) => {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-screen max-h-screen max-w-[85vw] shrink-0 flex-col overflow-hidden border-r border-border bg-surface transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:z-auto lg:max-w-none lg:translate-x-0 ${
        isSupport ? "w-64" : "w-60"
      } ${
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <div
        className={`shrink-0 border-b border-border ${
          isSupport
            ? "bg-gradient-to-br from-teal/10 via-surface to-surface px-5 py-5"
            : "px-5 py-5"
        }`}
      >
        <AppLogo size="md" subtitle={isSupport ? undefined : subtitle} />
        {isSupport && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-heading">Centre support</p>
              <p className="text-xs text-muted">Espace agents</p>
            </div>
            <span className="rounded-full border border-teal/20 bg-teal/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-teal-dark">
              Pro
            </span>
          </div>
        )}
      </div>
      <nav
        className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${
          isSupport ? "px-3 py-5" : "px-3 py-4"
        }`}
      >
        {nav.map((section) => {
          const items = filterByPermission
            ? section.items.filter((item) => hasPermission(item.permission))
            : section.items;
          if (items.length === 0) return null;

          const isOpen = openGroups[section.group] ?? true;
          const groupActive = isNavGroupActive(pathname, items);

          return (
            <div key={section.group} className={isSupport ? "mb-5" : "mb-2"}>
              <button
                type="button"
                onClick={() => toggleGroup(section.group)}
                className={`mb-1 flex w-full items-center justify-between gap-2 rounded-lg text-left transition-colors hover:bg-surface-hover ${
                  isSupport ? "px-3 py-2" : "px-2 py-2"
                } ${
                  groupActive ? "text-teal-dark" : "text-muted"
                }`}
                aria-expanded={isOpen}
              >
                <span className="text-[10px] font-semibold uppercase tracking-widest">
                  {section.group}
                </span>
                <NavIcon
                  name="chevron"
                  className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-0" : "-rotate-90"
                  }`}
                />
              </button>
              {isOpen && (
                <ul
                  className={
                    isSupport
                      ? "space-y-1.5"
                      : "ml-1 space-y-0.5 border-l border-border/60 pl-2"
                  }
                >
                  {items.map((item) => {
                    const active = isNavItemActive(pathname, item.path);
                    return (
                      <li key={item.path}>
                        <Link
                          href={item.path}
                          onClick={() => onMobileClose?.()}
                          className={`relative flex items-center text-sm font-medium transition-all duration-150 ${
                            isSupport
                              ? "gap-3 rounded-xl border px-3 py-3"
                              : "gap-2.5 rounded-lg px-3 py-2.5"
                          } ${
                            active
                              ? isSupport
                                ? "border-teal/25 bg-teal/10 text-teal-dark shadow-sm"
                                : "bg-teal/10 text-teal-dark"
                              : isSupport
                                ? "border-transparent text-muted hover:border-border hover:bg-surface-hover hover:text-foreground"
                                : "text-muted hover:bg-surface-hover hover:text-foreground"
                          }`}
                        >
                          {active && !isSupport && (
                            <span
                              className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-teal"
                              aria-hidden
                            />
                          )}
                          {item.icon ? (
                            <span
                              className={
                                isSupport
                                  ? `flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                      active
                                        ? "bg-teal text-white"
                                        : "bg-canvas text-muted"
                                    }`
                                  : ""
                              }
                            >
                              <NavIcon
                                name={item.icon}
                                className={`h-[18px] w-[18px] shrink-0 ${
                                  active && !isSupport
                                    ? "text-teal-dark"
                                    : !isSupport
                                      ? "text-muted"
                                      : ""
                                }`}
                              />
                            </span>
                          ) : null}
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          {active && isSupport && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-teal" />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
      {isSupport && (
        <div className="shrink-0 border-t border-border p-3">
          <div className="rounded-xl border border-border bg-canvas/70 p-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal/10 text-teal-dark">
                <NavIcon name="support" className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">File partagée</p>
                <p className="text-[11px] text-muted">Premier agent assigné</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
