"use client";

import { useScope } from "@/core/auth/useScope";
import Link from "next/link";

interface PartnerModuleGuardProps {
  module: "freight" | "rental";
  children: React.ReactNode;
}

const MODULE_LABELS: Record<"freight" | "rental", { title: string; description: string }> = {
  freight: {
    title: "Module Fret non disponible",
    description:
      "Votre compte partenaire n'est pas configuré pour le transport de fret. Contactez votre franchise pour activer ce module.",
  },
  rental: {
    title: "Module Location non disponible",
    description:
      "Votre compte partenaire n'est pas configuré pour la location de véhicules. Contactez votre franchise pour activer ce module.",
  },
};

export function PartnerModuleGuard({ module, children }: PartnerModuleGuardProps) {
  const { hasModule } = useScope();

  if (!hasModule(module)) {
    const { title, description } = MODULE_LABELS[module];
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
        <div className="rounded-card border border-border bg-surface p-10 shadow-card max-w-md">
          <div className="mb-4 text-4xl">🔒</div>
          <h1 className="text-lg font-semibold text-heading">{title}</h1>
          <p className="mt-2 text-sm text-muted">{description}</p>
          <Link href="/partner/dashboard" className="mt-6 inline-block">
            <button className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white">
              Retour au tableau de bord
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
