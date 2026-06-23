"use client";

import { useEffect, useState, type ReactNode } from "react";
import { env } from "@/core/config/env";

export function MswProvider({ children }: { children: ReactNode }) {
  // Always start false so server and client render the same initial HTML.
  // useEffect runs only on the client after hydration.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!env.useMocks) {
      setReady(true);
      return;
    }
    import("@/mocks/browser")
      .then(({ worker }) => worker.start({ onUnhandledRequest: "bypass" }))
      .then(() => setReady(true))
      .catch(() => setReady(true));
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
