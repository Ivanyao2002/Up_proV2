"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import type { AdminRole } from "@/shared/types";
import { togglePermission } from "../components/RoleForm";
import { useRoleDetail, useUpdateRole } from "../api/roles.queries";

interface RoleDetailPageProps {
  roleId: string;
}

export function RoleDetailPage({ roleId }: RoleDetailPageProps) {
  const [editing, setEditing] = useState(false);
  const [metaEditing, setMetaEditing] = useState(false);
  const [draftGroups, setDraftGroups] = useState<AdminRole["permission_groups"]>([]);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");

  const { data, isLoading, isError } = useRoleDetail(roleId);
  const updateRole = useUpdateRole(roleId);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-card bg-border" />;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Rôle introuvable.{" "}
        <Link href="/admin/settings/roles" className="text-teal underline">
          Retour
        </Link>
      </p>
    );
  }

  const groups = editing ? draftGroups : data.permission_groups;

  const startEditing = () => {
    setDraftGroups(structuredClone(data.permission_groups));
    setEditing(true);
  };

  const startMetaEditing = () => {
    setDraftName(data.name);
    setDraftDescription(data.description);
    setMetaEditing(true);
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={metaEditing ? draftName || data.name : data.name}
        breadcrumb={["Admin", "Paramètres", "Rôles", data.name]}
        actions={
          data.is_system ? (
            <span className="rounded-full bg-navy/10 px-3 py-1 text-xs font-medium text-foreground">
              Rôle système
            </span>
          ) : metaEditing ? (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setMetaEditing(false)}>
                Annuler
              </Button>
              <Button
                disabled={updateRole.isPending || !draftName.trim()}
                onClick={() => {
                  updateRole.mutate(
                    { name: draftName.trim(), description: draftDescription.trim() },
                    { onSuccess: () => setMetaEditing(false) }
                  );
                }}
              >
                Enregistrer
              </Button>
            </div>
          ) : editing ? (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setEditing(false)}>
                Annuler
              </Button>
              <Button
                disabled={updateRole.isPending}
                onClick={() => {
                  updateRole.mutate(
                    { permission_groups: draftGroups },
                    { onSuccess: () => setEditing(false) }
                  );
                }}
              >
                Enregistrer
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={startMetaEditing}>
                Modifier le rôle
              </Button>
              <Button variant="secondary" onClick={startEditing}>
                Permissions
              </Button>
            </div>
          )
        }
      />

      {metaEditing ? (
        <div className="mb-8 space-y-4 rounded-card border border-border bg-surface p-6 shadow-card">
          <label className="block">
            <span className="text-sm font-medium">Nom</span>
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Description</span>
            <textarea
              value={draftDescription}
              onChange={(e) => setDraftDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            />
          </label>
        </div>
      ) : (
        <p className="mb-6 text-sm text-muted">{data.description}</p>
      )}

      <p className="mb-8 text-sm">
        <Link href="/admin/settings/roles" className="text-teal hover:underline">
          ← Retour à la liste
        </Link>
        {" · "}
        <span className="text-muted">{data.users_count} utilisateurs</span>
      </p>

      <div className="space-y-6">
        {groups.map((group) => (
          <section
            key={group.module}
            className="rounded-card border border-border bg-surface p-6 shadow-card"
          >
            <h2 className="text-sm font-semibold text-heading">{group.module}</h2>
            <ul className="mt-4 divide-y divide-border">
              {group.permissions.map((perm) => (
                <li
                  key={perm.key}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{perm.label}</p>
                    <p className="text-xs font-mono text-muted">{perm.key}</p>
                  </div>
                  {editing ? (
                    <button
                      type="button"
                      onClick={() =>
                        setDraftGroups((prev) => togglePermission(prev, perm.key))
                      }
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                        perm.enabled
                          ? "bg-teal/15 text-teal-dark hover:bg-teal/25"
                          : "bg-canvas text-muted hover:bg-border"
                      }`}
                    >
                      {perm.enabled ? "Activé" : "Désactivé"}
                    </button>
                  ) : (
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        perm.enabled
                          ? "bg-teal/15 text-teal-dark"
                          : "bg-canvas text-muted"
                      }`}
                    >
                      {perm.enabled ? "Activé" : "Désactivé"}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
