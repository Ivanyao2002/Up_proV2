"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import type { Zone } from "@/shared/types";
import { useFranchisesList } from "../api/franchises.queries";
import { useCreateZone, useZonesMapOverview } from "../api/zones.queries";
import { AbidjanZonesMap } from "../components/AbidjanZonesMap";

export function ZoneCreatePage() {
  const router = useRouter();
  const { data: franchises } = useFranchisesList();
  const { data: mapData, isLoading: mapLoading } = useZonesMapOverview();
  const create = useCreateZone();

  const [name, setName] = useState("");
  const [city, setCity] = useState("Abidjan");
  const [franchiseId, setFranchiseId] = useState<number | "">("");
  const [type, setType] = useState<Zone["type"]>("standard");
  const [surge, setSurge] = useState(1);
  const [draftRing, setDraftRing] = useState<number[][]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const submit = () => {
    const next: string[] = [];
    if (!name.trim()) next.push("Le nom est requis.");
    if (franchiseId === "") next.push("Sélectionnez une franchise.");
    if (surge <= 0) next.push("Le multiplicateur doit être positif.");
    if (draftRing.length < 3) {
      next.push("Tracez la zone sur la carte (au moins 3 points).");
    }
    setErrors(next);
    if (next.length) return;

    const closedRing = [...draftRing, draftRing[0]];
    create.mutate(
      {
        name: name.trim(),
        city: city.trim(),
        franchise_id: franchiseId as number,
        type,
        surge_multiplier: surge,
        polygon_geojson: {
          type: "Polygon",
          coordinates: [closedRing],
        },
      },
      {
        onSuccess: (data) => {
          router.push(`/admin/network/zones/${data.id}`);
        },
      }
    );
  };

  return (
    <div className="animate-fade-up mx-auto w-full max-w-3xl px-4 pb-10">
      <PageHeader title="Nouvelle zone" breadcrumb={["Admin", "Réseau", "Zones"]} />
      <p className="mb-6 text-sm">
        <Link href="/admin/network/zones" className="text-teal hover:underline">
          ← Retour
        </Link>
      </p>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-navy">
          Délimiter la zone sur la carte
        </h2>
        {mapLoading ? (
          <div className="h-[min(380px,50vh)] animate-pulse rounded-card bg-border" />
        ) : (
          <AbidjanZonesMap
            mode="draw"
            zones={mapData?.zones ?? []}
            cityLabel={mapData?.city ?? "Abidjan"}
            draftRing={draftRing}
            onDraftPoint={(lng, lat) =>
              setDraftRing((prev) => [...prev, [lng, lat]])
            }
            onUndoDraftPoint={() => setDraftRing((prev) => prev.slice(0, -1))}
            onClearDraft={() => setDraftRing([])}
          />
        )}
      </section>

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
          <span className="text-sm font-medium">Nom de la zone</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex. Cocody — Plateau"
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
          <span className="text-sm font-medium">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Zone["type"])}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          >
            <option value="standard">Standard</option>
            <option value="surge">Surge</option>
            <option value="airport">Aéroport</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Multiplicateur surge</span>
          <input
            type="number"
            min={1}
            step={0.05}
            value={surge}
            onChange={(e) => setSurge(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Création…" : "Créer la zone"}
          </Button>
        </div>
      </form>
    </div>
  );
}
