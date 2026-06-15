"use client";

import { SimplePageSkeleton } from "@/shared/ui/skeletons";
import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { KpiCard } from "@/shared/ui/KpiCard";
import {
  AbidjanZonesMap,
  ZonesMapLegend,
} from "@/features/network/components/AbidjanZonesMap";
import { useFranchiseTerritory, useRequestExtension } from "../api/territory.queries";
import { notificationService } from "@/core/http/notificationService";

export function FranchiseTerritoryExtensionPage() {
  const { data, isLoading, isError } = useFranchiseTerritory();
  const extensionMutation = useRequestExtension();
  const [draftRing, setDraftRing] = useState<number[][]>([]);
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  if (isLoading) {
    return <SimplePageSkeleton />;
  }

  if (isError || !data) {
    return <p className="text-sm text-red-600">Impossible de charger le territoire.</p>;
  }

  const submit = () => {
    if (draftRing.length < 3 && selectedZoneIds.length === 0) {
      notificationService.warning("Tracez la zone demandée sur la carte (min. 3 points) ou sélectionnez des zones.");
      return;
    }
    const zone_ids = selectedZoneIds.length > 0
      ? selectedZoneIds
      : [`draft-${Date.now()}`];
    extensionMutation.mutate(
      { zone_ids, notes: notes || undefined },
      {
        onSuccess: () => {
          notificationService.success("Demande d'extension enregistrée — traitement sous 5 jours ouvrés.");
          setDraftRing([]);
          setSelectedZoneIds([]);
          setNotes("");
        },
        onError: () => {
          notificationService.error("Erreur lors de l'envoi de la demande. Veuillez réessayer.");
        },
      }
    );
  };

  return (
    <div className="animate-fade-up mx-auto w-full max-w-3xl px-4 pb-10">
      <PageHeader
        title="Extension de territoire"
        breadcrumb={["Franchise", data.franchise_name, "Extension"]}
      />

      <p className="mb-6 text-sm">
        <Link href="/franchise/territory" className="text-teal hover:underline">
          ← Retour à la carte territoire
        </Link>
      </p>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <KpiCard label="Zones actuelles" value={String(data.stats.zones_count)} />
        <KpiCard label="Superficie" value={`${data.stats.area_km2} km²`} />
      </div>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-heading">Territoire actuel</h2>
        <AbidjanZonesMap
          mode="select"
          zones={data.zones}
          cityLabel={`${data.franchise_name} · ${data.city}`}
          selectedZoneId={null}
        />
        <div className="mt-3">
          <ZonesMapLegend zones={data.zones} selectedZoneId={null} />
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-heading">
          Zone demandée (nouveau périmètre)
        </h2>
        <AbidjanZonesMap
          mode="draw"
          zones={data.zones}
          cityLabel="Extension proposée"
          draftRing={draftRing}
          onDraftPoint={(lng, lat) => setDraftRing((prev) => [...prev, [lng, lat]])}
          onUndoDraftPoint={() => setDraftRing((prev) => prev.slice(0, -1))}
          onClearDraft={() => setDraftRing([])}
        />
      </section>

      <div className="space-y-4 rounded-card border border-border bg-surface p-6 shadow-card">
        <label className="block">
          <span className="text-sm font-medium">Justification</span>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Motif de l'extension, communes visées…"
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>
        <div className="flex justify-end">
          <Button
            onClick={submit}
            disabled={extensionMutation.isPending || (draftRing.length < 3 && selectedZoneIds.length === 0)}
          >
            {extensionMutation.isPending ? "Envoi en cours…" : "Soumettre la demande"}
          </Button>
        </div>
      </div>
    </div>
  );
}
