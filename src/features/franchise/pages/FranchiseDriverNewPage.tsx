"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { useCreateFranchiseDriver } from "../api/drivers.queries";

const CATEGORY_OPTIONS = [
  { value: "", label: "— Non renseigné —" },
  { value: "STANDARD", label: "Standard" },
  { value: "CONFORT", label: "Confort" },
  { value: "VIP", label: "VIP" },
  { value: "MOTO", label: "Moto" },
];

export function FranchiseDriverNewPage() {
  const router = useRouter();
  const createDriver = useCreateFranchiseDriver();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    ride_category_code: "",
    accepts_cash: true,
    accepts_wallet: true,
  });

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDriver.mutate(
      {
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        email: form.email || undefined,
        ride_category_code: form.ride_category_code || undefined,
        accepts_cash: form.accepts_cash,
        accepts_wallet: form.accepts_wallet,
      },
      {
        onSuccess: (driver) => {
          router.push(`/franchise/drivers/${driver.id}`);
        },
      }
    );
  };

  return (
    <div className="animate-fade-up">
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader
          title="Nouveau chauffeur"
          breadcrumb={["Franchise", "Chauffeurs", "Nouveau"]}
        />
      </div>

      <div className="mx-auto max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identité */}
          <div className="rounded-card border border-border bg-surface p-6 shadow-card">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Identité</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Prénom *</label>
                <input
                  required
                  type="text"
                  placeholder="Kouamé"
                  className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
                  value={form.first_name}
                  onChange={(e) => set("first_name", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Nom *</label>
                <input
                  required
                  type="text"
                  placeholder="Yao"
                  className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
                  value={form.last_name}
                  onChange={(e) => set("last_name", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Téléphone *</label>
                <input
                  required
                  type="tel"
                  placeholder="+225 07 00 00 00 00"
                  className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Email</label>
                <input
                  type="email"
                  placeholder="chauffeur@exemple.com"
                  className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Paramètres */}
          <div className="rounded-card border border-border bg-surface p-6 shadow-card">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Paramètres</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Catégorie de course</label>
                <select
                  className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
                  value={form.ride_category_code}
                  onChange={(e) => set("ride_category_code", e.target.value)}
                >
                  {CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex gap-6">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-teal"
                  checked={form.accepts_cash}
                  onChange={(e) => set("accepts_cash", e.target.checked)}
                />
                Accepte le cash
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-teal"
                  checked={form.accepts_wallet}
                  onChange={(e) => set("accepts_wallet", e.target.checked)}
                />
                Accepte le wallet
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/franchise/drivers")}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={createDriver.isPending}>
              {createDriver.isPending ? "Création en cours…" : "Créer le chauffeur"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
