"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { NavGroup } from "@/portals/shared/navTypes";
import { useAuthStore } from "@/core/auth/authStore";
import { NavIcon } from "./NavIcon";
import { isNavGroupActive, isNavItemActive } from "./navActive";

interface PortalSidebarProps {
  nav: NavGroup[];
  subtitle: string;
  filterByPermission?: boolean;
}

export function PortalSidebar({
  nav,
  subtitle,
  filterByPermission = true,
}: PortalSidebarProps) {
  const pathname = usePathname();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

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
    <aside className="sticky top-0 flex h-screen max-h-screen w-60 shrink-0 flex-col overflow-hidden border-r border-border bg-surface">
      <div className="shrink-0 border-b border-border px-5 py-5">
        <p className="text-lg font-semibold text-heading">UpJunoo</p>
        <p className="text-xs text-muted">Pro · {subtitle}</p>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">
        {nav.map((section) => {
          const items = filterByPermission
            ? section.items.filter((item) => hasPermission(item.permission))
            : section.items;
          if (items.length === 0) return null;

          const isOpen = openGroups[section.group] ?? true;
          const groupActive = isNavGroupActive(pathname, items);

          return (
            <div key={section.group} className="mb-2">
              <button
                type="button"
                onClick={() => toggleGroup(section.group)}
                className={`mb-1 flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface-hover ${
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
                <ul className="space-y-0.5 border-l border-border/60 pl-2 ml-1">
                  {items.map((item) => {
                    const active = isNavItemActive(pathname, item.path);
                    return (
                      <li key={item.path}>
                        <Link
                          href={item.path}
                          className={`relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                            active
                              ? "bg-teal/10 text-teal-dark"
                              : "text-muted hover:bg-surface-hover hover:text-foreground"
                          }`}
                        >
                          {active && (
                            <span
                              className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-teal"
                              aria-hidden
                            />
                          )}
                          {item.icon ? (
                            <NavIcon
                              name={item.icon}
                              className={`h-[18px] w-[18px] shrink-0 ${
                                active ? "text-teal-dark" : "text-muted"
                              }`}
                            />
                          ) : null}
                          <span className="min-w-0 truncate">{item.label}</span>
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
    </aside>
  );
}
