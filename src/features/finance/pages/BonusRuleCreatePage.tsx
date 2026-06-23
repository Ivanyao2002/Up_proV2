"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SimplePageSkeleton } from "@/shared/ui/skeletons";
import { BonusRuleForm } from "../components/BonusRuleForm";

const LIST_HREF = "/admin/finance/bonus-rules";

export function BonusRuleCreatePage() {
  const router = useRouter();

  return (
    <div className="animate-fade-up mx-auto max-w-4xl">
      <PageHeader
        title="Nouvelle règle bonus"
        breadcrumb={["Admin", "Finance", "Règles bonus", "Nouvelle"]}
      />

      <p className="mb-6 text-sm">
        <Link href={LIST_HREF} className="text-teal hover:underline">
          ← Retour à la liste
        </Link>
      </p>

      <p className="mb-6 max-w-3xl text-sm text-muted">
        Définissez les paliers de bonus (courses → récompense), la période de
        comptage et le périmètre. Le jour de début de semaine par chauffeur se
        configure séparément sur la fiche chauffeur (onglet Bonus).
      </p>

      <BonusRuleForm
        mode="create"
        backHref={LIST_HREF}
        onSuccess={() => router.push(LIST_HREF)}
      />
    </div>
  );
}
