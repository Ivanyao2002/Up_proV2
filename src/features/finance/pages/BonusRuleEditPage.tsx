"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SimplePageSkeleton } from "@/shared/ui/skeletons";
import { bonusRulePeriodLabel, bonusRuleScopeLabel } from "../api/bonusRules.service";
import { BonusRuleForm } from "../components/BonusRuleForm";
import { useBonusRulesListAll } from "../api/bonusRules.queries";

const LIST_HREF = "/admin/finance/bonus-rules";

interface BonusRuleEditPageProps {
  ruleId: string;
}

export function BonusRuleEditPage({ ruleId }: BonusRuleEditPageProps) {
  const router = useRouter();
  const { data: rules = [], isLoading, isError } = useBonusRulesListAll();

  const rule = useMemo(
    () => rules.find((item) => item.id === ruleId) ?? null,
    [ruleId, rules]
  );

  if (isLoading) {
    return <SimplePageSkeleton />;
  }

  if (isError) {
    return (
      <p className="text-sm text-red-600">Impossible de charger la règle bonus.</p>
    );
  }

  if (!rule) {
    return (
      <div className="animate-fade-up mx-auto max-w-lg text-center">
        <p className="text-sm text-muted">Règle introuvable.</p>
        <Link href={LIST_HREF} className="mt-4 inline-block text-sm text-teal hover:underline">
          Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-up mx-auto max-w-4xl">
      <PageHeader
        title="Modifier la règle bonus"
        breadcrumb={["Admin", "Finance", "Règles bonus", rule.name]}
      />

      <p className="mb-6 text-sm">
        <Link href={LIST_HREF} className="text-teal hover:underline">
          ← Retour à la liste
        </Link>
      </p>

      <p className="mb-6 max-w-3xl text-sm text-muted">
        {bonusRuleScopeLabel(rule.scope)} · {bonusRulePeriodLabel(rule.period)} —
        ajustez les paliers, les services comptabilisés et l&apos;activation. Le
        périmètre (globale / franchise / partenaire) n&apos;est pas modifiable.
      </p>

      <BonusRuleForm
        mode="edit"
        rule={rule}
        backHref={LIST_HREF}
        onSuccess={() => router.push(LIST_HREF)}
      />
    </div>
  );
}
