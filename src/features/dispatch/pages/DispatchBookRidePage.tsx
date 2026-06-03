"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { notificationService } from "@/core/http/notificationService";
import { formatFCFA } from "@/shared/lib/format";
import {
  BookingLocationPicker,
  type BookingLocation,
} from "@/features/partner/components/BookingLocationPicker";
import { useDispatchBookRide } from "../api/dispatchPortal.queries";

export function DispatchBookRidePage() {
  const router = useRouter();
  const create = useDispatchBookRide();
  const [from, setFrom] = useState<BookingLocation | null>(null);
  const [to, setTo] = useState<BookingLocation | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [service, setService] = useState<"taxi" | "delivery">("taxi");
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "wallet" | "orange_money"
  >("cash");
  const [notes, setNotes] = useState("");

  const canSubmit = Boolean(from && to && clientName.trim() && clientPhone.trim());

  return (
    <div className="animate-fade-up mx-auto w-full max-w-6xl">
      <PageHeader
        title="Réserver une course"
        breadcrumb={["Dispatch", "Réserver"]}
      />

      <form
        className="space-y-6 rounded-card border border-border bg-surface p-6 shadow-card"
        onSubmit={(e) => {
          e.preventDefault();
          if (!from || !to) {
            notificationService.warning(
              "Indiquez le départ et l'arrivée sur la carte"
            );
            return;
          }
          create.mutate(
            {
              from_label: from.label,
              to_label: to.label,
              from_lat: from.lat,
              from_lng: from.lng,
              to_lat: to.lat,
              to_lng: to.lng,
              client_name: clientName,
              client_phone: clientPhone,
              service,
              payment_method: paymentMethod,
              notes: notes || undefined,
            },
            {
              onSuccess: (trip) => {
                notificationService.success(
                  `Course ${trip.ref} créée — ${formatFCFA(trip.amount_fcfa)}`
                );
                router.push("/dispatch/console");
              },
              onError: () =>
                notificationService.error("Impossible de créer la course"),
            }
          );
        }}
      >
        <BookingLocationPicker
          from={from}
          to={to}
          onFromChange={setFrom}
          onToChange={setTo}
          geoError={geoError}
          onGeoError={setGeoError}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-foreground">Client</span>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm"
              placeholder="Nom complet"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Téléphone</span>
            <input
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm"
              placeholder="+225 …"
              required
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-foreground">Service</span>
            <select
              value={service}
              onChange={(e) =>
                setService(e.target.value as "taxi" | "delivery")
              }
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm"
            >
              <option value="taxi">Taxi</option>
              <option value="delivery">Livraison</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Paiement</span>
            <select
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(
                  e.target.value as "cash" | "wallet" | "orange_money"
                )
              }
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm"
            >
              <option value="cash">Espèces</option>
              <option value="wallet">Portefeuille</option>
              <option value="orange_money">Orange Money</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-foreground">Notes (optionnel)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm"
          />
        </label>

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/dispatch/console")}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={create.isPending || !canSubmit}>
            {create.isPending ? "Création…" : "Créer la course"}
          </Button>
        </div>
      </form>
    </div>
  );
}
