"use client";

import type {
  DispatcherAccountDetail,
  DispatcherPermissions,
  DispatcherStatus,
} from "@/shared/types";
import type { Franchise, Zone } from "@/shared/types";
import { Button } from "@/shared/ui/Button";

export interface DispatcherFormValues {
  name: string;
  email: string;
  phone: string;
  password: string;
  franchise_id: number | "";
  zone_ids: number[];
  shift_label: string;
  status: DispatcherStatus;
  permissions: DispatcherPermissions;
}

interface DispatcherFormProps {
  mode: "create" | "edit";
  franchises: Franchise[];
  zones: Zone[];
  values: DispatcherFormValues;
  onChange: (values: DispatcherFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  errors?: string[];
}

export function DispatcherForm({
  mode,
  franchises,
  zones,
  values,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting,
  errors = [],
}: DispatcherFormProps) {
  const set = (patch: Partial<DispatcherFormValues>) =>
    onChange({ ...values, ...patch });

  const toggleZone = (zoneId: number) => {
    const has = values.zone_ids.includes(zoneId);
    set({
      zone_ids: has
        ? values.zone_ids.filter((id) => id !== zoneId)
        : [...values.zone_ids, zoneId],
    });
  };

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {errors.length > 0 && (
        <ul className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-card border border-border bg-surface p-6">
          <h2 className="text-sm font-semibold text-heading">Identité</h2>
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-foreground">Nom complet</span>
              <input
                value={values.name}
                onChange={(e) => set({ name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-foreground">Email</span>
              <input
                type="email"
                value={values.email}
                onChange={(e) => set({ email: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-foreground">Téléphone</span>
              <input
                value={values.phone}
                onChange={(e) => set({ phone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              />
            </label>
            {mode === "create" && (
              <label className="block">
                <span className="text-sm font-medium text-foreground">Mot de passe</span>
                <input
                  type="password"
                  value={values.password}
                  onChange={(e) => set({ password: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                  minLength={6}
                />
              </label>
            )}
            <label className="block">
              <span className="text-sm font-medium text-foreground">Franchise</span>
              <select
                value={values.franchise_id === "" ? "" : String(values.franchise_id)}
                onChange={(e) =>
                  set({
                    franchise_id: e.target.value ? Number(e.target.value) : "",
                  })
                }
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              >
                <option value="">— Plateforme —</option>
                {franchises.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-foreground">Horaires / shift</span>
              <input
                value={values.shift_label}
                onChange={(e) => set({ shift_label: e.target.value })}
                placeholder="ex. 06h – 14h"
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-foreground">Statut</span>
              <select
                value={values.status}
                onChange={(e) =>
                  set({ status: e.target.value as DispatcherStatus })
                }
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              >
                <option value="active">Actif</option>
                <option value="suspended">Suspendu</option>
              </select>
            </label>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-card border border-border bg-surface p-6">
            <h2 className="text-sm font-semibold text-heading">Zones autorisées</h2>
            <p className="mt-1 text-xs text-muted">Au moins une zone requise</p>
            <div className="mt-4 space-y-2">
              {zones.map((z) => (
                <label
                  key={z.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-surface-hover"
                >
                  <input
                    type="checkbox"
                    checked={values.zone_ids.includes(z.id)}
                    onChange={() => toggleZone(z.id)}
                    className="h-4 w-4 rounded border-border text-teal focus:ring-teal"
                  />
                  <span className="text-sm text-foreground">{z.name}</span>
                  <span className="ml-auto text-xs text-muted">{z.franchise_name}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-card border border-border bg-surface p-6">
            <h2 className="text-sm font-semibold text-heading">Permissions dispatch</h2>
            <div className="mt-4 space-y-2">
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={values.permissions.assign_trips}
                  onChange={(e) =>
                    set({
                      permissions: {
                        ...values.permissions,
                        assign_trips: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4 rounded border-border text-teal"
                />
                Assigner des courses
              </label>
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={values.permissions.view_live_map}
                  onChange={(e) =>
                    set({
                      permissions: {
                        ...values.permissions,
                        view_live_map: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4 rounded border-border text-teal"
                />
                Voir la carte live
              </label>
            </div>
          </section>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

export function emptyDispatcherForm(): DispatcherFormValues {
  return {
    name: "",
    email: "",
    phone: "",
    password: "",
    franchise_id: "",
    zone_ids: [],
    shift_label: "08h – 16h",
    status: "active",
    permissions: { assign_trips: true, view_live_map: true },
  };
}

export function dispatcherToForm(d: DispatcherAccountDetail): DispatcherFormValues {
  return {
    name: d.name,
    email: d.email,
    phone: d.phone,
    password: "",
    franchise_id: d.franchise_id ?? "",
    zone_ids: d.zone_ids,
    shift_label: d.shift_label ?? "",
    status: d.status,
    permissions: d.permissions,
  };
}

export function validateDispatcherForm(
  values: DispatcherFormValues,
  mode: "create" | "edit"
): string[] {
  const errors: string[] = [];
  if (!values.name.trim()) errors.push("Le nom est requis.");
  if (!values.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.push("Un email valide est requis.");
  }
  if (values.zone_ids.length === 0) {
    errors.push("Sélectionnez au moins une zone.");
  }
  if (mode === "create" && values.password.length < 6) {
    errors.push("Le mot de passe doit contenir au moins 6 caractères.");
  }
  return errors;
}
