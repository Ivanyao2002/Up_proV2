"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import type { Franchise } from "@/shared/types";
import { useCreateFranchise } from "../api/franchises.queries";

export function FranchiseCreatePage() {
  const router = useRouter();
  const create = useCreateFranchise();
  const [name, setName] = useState("");
  const [city, setCity] = useState("Abidjan");
  const [status, setStatus] = useState<Franchise["status"]>("pending");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const submit = () => {
    const next: string[] = [];
    if (!name.trim()) next.push("Le nom est requis.");
    if (!city.trim()) next.push("La ville est requise.");
    if (!contactEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      next.push("Un email de contact valide est requis.");
    }
    setErrors(next);
    if (next.length) return;

    create.mutate(
      {
        name: name.trim(),
        city: city.trim(),
        status,
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim(),
      },
      {
        onSuccess: (data) => {
          router.push(`/admin/network/franchises/${data.id}`);
        },
      }
    );
  };

  return (
    <div className="animate-fade-up mx-auto w-full max-w-3xl px-4 pb-10">
      <PageHeader title="Nouvelle franchise" breadcrumb={["Admin", "Réseau", "Franchises"]} />
      <p className="mb-6 text-sm">
        <Link href="/admin/network/franchises" className="text-teal hover:underline">
          ← Retour
        </Link>
      </p>

      {errors.length > 0 && (
        <ul className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <form
        className="space-y-4 rounded-card border border-border bg-surface p-6 shadow-card"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label className="block">
          <span className="text-sm font-medium">Nom</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Ville</span>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Email contact</span>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Téléphone</span>
          <input
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="+225 …"
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Statut initial</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Franchise["status"])}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          >
            <option value="pending">En attente</option>
            <option value="active">Actif</option>
          </select>
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Création…" : "Créer la franchise"}
          </Button>
        </div>
      </form>
    </div>
  );
}
