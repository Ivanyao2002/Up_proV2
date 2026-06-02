"use client";

import { useEffect, useState, type ReactNode } from "react";
import { env } from "@/core/config/env";

export function MswProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!env.useMocks);

  useEffect(() => {
    if (!env.useMocks) return;

    async function init() {
      const { worker } = await import("@/mocks/browser");
      await worker.start({ onUnhandledRequest: "bypass" });
      setReady(true);
    }

    void init();
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-sm text-muted">
        Chargement des données de démonstration…
      </div>
    );
  }

  return <>{children}</>;
}
