"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { usePermission } from "@/core/auth/usePermission";
import { useZonesList } from "@/features/network/api/zones.queries";
import type { DispatchRules } from "@/shared/types";
import {
  useDispatchRules,
  useUpdateDispatchRules,
} from "../api/dispatchRules.queries";
import {
  DispatchRulesForm,
  validateDispatchRules,
} from "../components/DispatchRulesForm";

export function DispatchRulesPage() {
  const canEdit = usePermission("settings.dispatch_rules.edit");
  const { data, isLoading, isError } = useDispatchRules();
  const { data: zonesData } = useZonesList();
  const updateMutation = useUpdateDispatchRules();

  const [form, setForm] = useState<DispatchRules | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (isLoading || !form) {
    return <div className="h-64 animate-pulse rounded-card bg-border" />;
  }

  if (isError) {
    return (
      <p className="text-sm text-red-600">Impossible de charger les règles de dispatch.</p>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Règles de dispatch"
        breadcrumb={["Admin", "Paramètres"]}
      />

      {canEdit ? (
        <DispatchRulesForm
          zones={zonesData?.data ?? []}
          values={form}
          onChange={setForm}
          onSubmit={() => {
            const validation = validateDispatchRules(form);
            setErrors(validation);
            if (validation.length > 0) return;
            updateMutation.mutate(form);
          }}
          isSubmitting={updateMutation.isPending}
          errors={errors}
        />
      ) : (
        <p className="text-sm text-muted">Lecture seule — droits insuffisants.</p>
      )}
    </div>
  );
}
