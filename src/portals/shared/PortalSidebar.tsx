"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavGroup } from "@/portals/admin/adminNav";
import { useAuthStore } from "@/core/auth/authStore";

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

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="border-b border-border px-5 py-5">
        <p className="text-lg font-semibold text-navy">UpJunoo</p>
        <p className="text-xs text-muted">Pro · {subtitle}</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {nav.map((section) => {
          const items = filterByPermission
            ? section.items.filter((item) => hasPermission(item.permission))
            : section.items;
          if (items.length === 0) return null;

          return (
            <div key={section.group} className="mb-6">
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted">
                {section.group}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active =
                    item.path === "/partner/drivers"
                      ? pathname === "/partner/drivers" ||
                        pathname === "/partner/drivers/new" ||
                        /^\/partner\/drivers\/\d+$/.test(pathname)
                        : item.path === "/partner/fleet"
                          ? pathname === "/partner/fleet" ||
                            pathname === "/partner/fleet/new" ||
                            /^\/partner\/fleet\/\d+$/.test(pathname)
                          : item.path === "/partner/bookings"
                            ? pathname === "/partner/bookings" ||
                              /^\/partner\/bookings\/[^/]+$/.test(pathname) &&
                                pathname !== "/partner/bookings/new"
                            : item.path === "/partner/bookings/new"
                              ? pathname === "/partner/bookings/new"
                              : item.path === "/franchise/drivers"
                          ? pathname === "/franchise/drivers" ||
                            /^\/franchise\/drivers\/\d+$/.test(pathname)
                          : item.path === "/franchise/partners"
                            ? pathname === "/franchise/partners" ||
                              /^\/franchise\/partners\/\d+$/.test(pathname)
                            : pathname === item.path ||
                              (item.path.endsWith("/pending") ||
                              item.path.endsWith("/moderation")
                                ? pathname === item.path
                                : pathname.startsWith(`${item.path}/`));
                  return (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        className={`relative flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                          active
                            ? "bg-teal/10 text-teal-dark"
                            : "text-muted hover:bg-canvas hover:text-navy"
                        }`}
                      >
                        {active && (
                          <span
                            className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-teal"
                            aria-hidden
                          />
                        )}
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
