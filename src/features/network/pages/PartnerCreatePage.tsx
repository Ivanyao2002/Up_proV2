"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { useFranchisesList } from "../api/franchises.queries";
import { useCreatePartner } from "../api/partners.queries";

export function PartnerCreatePage() {
  const router = useRouter();
  const { data: franchises } = useFranchisesList();
  const create = useCreatePartner();

  const [name, setName] = useState("");
  const [franchiseId, setFranchiseId] = useState<number | "">("");
  const [city, setCity] = useState("Abidjan");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const submit = () => {
    const next: string[] = [];
    if (!name.trim()) next.push("Le nom est requis.");
    if (franchiseId === "") next.push("Sélectionnez une franchise.");
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.push("Un email valide est requis.");
    }
    setErrors(next);
    if (next.length) return;

    create.mutate(
      {
        name: name.trim(),
        franchise_id: franchiseId as number,
        city: city.trim(),
        contact_email: email.trim(),
        contact_phone: phone.trim(),
        address: address.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          router.push(`/admin/network/partners/${data.id}`);
        },
      }
    );
  };

  return (
    <div className="animate-fade-up mx-auto w-full max-w-3xl px-4 pb-10">
      <PageHeader title="Nouveau partenaire" breadcrumb={["Admin", "Réseau", "Partenaires"]} />
      <p className="mb-6 text-sm">
        <Link href="/admin/network/partners" className="text-teal hover:underline">
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
          <span className="text-sm font-medium">Raison sociale</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Franchise</span>
          <select
            value={franchiseId === "" ? "" : String(franchiseId)}
            onChange={(e) =>
              setFranchiseId(e.target.value ? Number(e.target.value) : "")
            }
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            required
          >
            <option value="">— Choisir —</option>
            {(franchises?.data ?? []).map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Ville</span>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Téléphone</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Adresse</span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Création…" : "Créer le partenaire"}
          </Button>
        </div>
      </form>
    </div>
  );
}
