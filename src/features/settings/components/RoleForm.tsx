"use client";

import type { AdminRole } from "@/shared/types";
import { Button } from "@/shared/ui/Button";

export interface RoleFormValues {
  name: string;
  description: string;
}

interface RoleFormProps {
  values: RoleFormValues;
  onChange: (values: RoleFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function RoleForm({
  values,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting,
}: RoleFormProps) {
  const set = (patch: Partial<RoleFormValues>) =>
    onChange({ ...values, ...patch });

  return (
    <form
      className="max-w-lg space-y-4 rounded-card border border-border bg-surface p-6 shadow-card"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <label className="block">
        <span className="text-sm font-medium">Nom du rôle</span>
        <input
          required
          value={values.name}
          onChange={(e) => set({ name: e.target.value })}
          className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Description</span>
        <textarea
          rows={3}
          value={values.description}
          onChange={(e) => set({ description: e.target.value })}
          className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
        />
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting || !values.name.trim()}>
          {isSubmitting ? "Enregistrement…" : "Créer le rôle"}
        </Button>
      </div>
    </form>
  );
}

export function togglePermission(
  groups: AdminRole["permission_groups"],
  key: string
): AdminRole["permission_groups"] {
  return groups.map((group) => ({
    ...group,
    permissions: group.permissions.map((perm) =>
      perm.key === key ? { ...perm, enabled: !perm.enabled } : perm
    ),
  }));
}
