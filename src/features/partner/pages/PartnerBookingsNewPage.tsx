"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { notificationService } from "@/core/http/notificationService";
import { formatFCFA } from "@/shared/lib/format";
import {
  BookingLocationPicker,
  type BookingLocation,
} from "../components/BookingLocationPicker";
import { useCreatePartnerBooking } from "../api/bookings.queries";

export function PartnerBookingsNewPage() {
  const router = useRouter();
  const create = useCreatePartnerBooking();
  const [from, setFrom] = useState<BookingLocation | null>(null);
  const [to, setTo] = useState<BookingLocation | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [service, setService] = useState<"taxi" | "delivery">("taxi");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "wallet" | "orange_money">(
    "cash"
  );
  const [notes, setNotes] = useState("");

  const canSubmit = Boolean(from && to && clientName.trim() && clientPhone.trim());

  return (
    <div className="animate-fade-up mx-auto w-full max-w-6xl">
      <PageHeader
        title="Réserver une course"
        breadcrumb={["Partenaire", "Réservations", "Nouvelle"]}
      />

      <form
        className="space-y-6 rounded-card border border-border bg-surface p-6 shadow-card"
        onSubmit={(e) => {
          e.preventDefault();
          if (!from || !to) {
            notificationService.warning(
              "Indiquez le départ (GPS) et l'arrivée (recherche ou pin sur la carte)"
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
              onSuccess: (booking) => {
                notificationService.success(
                  `Course ${booking.ref} créée — ${formatFCFA(booking.estimated_amount_fcfa ?? booking.amount_fcfa)} estimés`
                );
                router.push(`/partner/bookings/${booking.id}`);
              },
              onError: () => notificationService.error("Impossible de créer la réservation"),
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

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium">Client</span>
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Téléphone client</span>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                required
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium">Service</span>
              <select
                value={service}
                onChange={(e) => setService(e.target.value as "taxi" | "delivery")}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm"
              >
                <option value="taxi">Taxi</option>
                <option value="delivery">Livraison</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Paiement</span>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as "cash" | "wallet" | "orange_money")
                }
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm"
              >
                <option value="cash">Espèces</option>
                <option value="wallet">Portefeuille</option>
                <option value="orange_money">Orange Money</option>
              </select>
            </label>
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-medium">Notes (optionnel)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            placeholder="Instructions pour le chauffeur…"
          />
        </label>

        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <Button type="submit" disabled={create.isPending || !canSubmit}>
            {create.isPending ? "Réservation…" : "Réserver la course"}
          </Button>
          <Link href="/partner/bookings">
            <Button type="button" variant="secondary">
              Annuler
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
