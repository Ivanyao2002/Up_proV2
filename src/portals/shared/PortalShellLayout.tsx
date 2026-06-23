"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { NavGroup } from "@/portals/shared/navTypes";
import { PortalSidebar } from "@/portals/shared/PortalSidebar";

export interface PortalShellTopbarProps {
  onMenuToggle: () => void;
  mobileNavOpen: boolean;
}

interface PortalShellLayoutProps {
  nav: NavGroup[];
  subtitle: string;
  topbar: (props: PortalShellTopbarProps) => ReactNode;
  children: ReactNode;
  headerSlot?: ReactNode;
  filterByPermission?: boolean;
}

export function PortalShellLayout({
  nav,
  subtitle,
  topbar,
  children,
  headerSlot,
  filterByPermission = true,
}: PortalShellLayoutProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileNavOpen]);

  return (
    <div className="flex min-h-screen bg-canvas">
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>
      {headerSlot}

      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-navy/40 backdrop-blur-[1px] lg:hidden"
          aria-label="Fermer le menu"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <PortalSidebar
        nav={nav}
        subtitle={subtitle}
        filterByPermission={filterByPermission}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {topbar({
          onMenuToggle: () => setMobileNavOpen((open) => !open),
          mobileNavOpen,
        })}
        <main
          id="main-content"
          tabIndex={-1}
          className="page-main flex-1 overflow-x-hidden overflow-y-auto outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
