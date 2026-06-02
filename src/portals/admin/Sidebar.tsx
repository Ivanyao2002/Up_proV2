"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV } from "./adminNav";
import { useAuthStore } from "@/core/auth/authStore";

export function Sidebar() {
  const pathname = usePathname();
  const hasPermission = useAuthStore((s) => s.hasPermission);

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="border-b border-border px-5 py-5">
        <p className="text-lg font-semibold text-navy">UpJunoo</p>
        <p className="text-xs text-muted">Pro · Administrateur</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {ADMIN_NAV.map((section) => {
          const items = section.items.filter((item) =>
            hasPermission(item.permission)
          );
          if (items.length === 0) return null;

          return (
            <div key={section.group} className="mb-6">
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted">
                {section.group}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active =
                    pathname === item.path ||
                    pathname.startsWith(item.path + "/");
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
