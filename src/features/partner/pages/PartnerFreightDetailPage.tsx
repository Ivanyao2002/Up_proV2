"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { usePartnerFreightOfferDetail, useUpdateFreightOfferStatus } from "../api/freight.queries";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";

// Icônes SVG inline (au lieu de lucide-react)
const IconMapPin = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconPackage = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
const IconUser = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconPhone = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const IconClock = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconTruck = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M14 6h7l3 4v8a1 1 0 0 1-1 1h-3"/><circle cx="5" cy="18" r="3"/><circle cx="17" cy="18" r="3"/></svg>;
const IconNavigation = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>;

export function PartnerFreightDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [showAssign, setShowAssign] = useState(false);
  const [showPod, setShowPod] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; status: string } | null>(null);

  const { data: offer, isLoading, isError } = usePartnerFreightOfferDetail(id!);
  const updateStatus = useUpdateFreightOfferStatus();

  if (isLoading) return <div className="p-6">Chargement...</div>;
  if (isError || !offer) return <div className="p-6 text-red-600">Offre introuvable</div>;

  const statusFlow = {
    pending: { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
    quoted: { label: "Devis envoyé", color: "bg-blue-100 text-blue-700" },
    accepted: { label: "Acceptée", color: "bg-green-100 text-green-700" },
    assigned: { label: "Assignée", color: "bg-purple-100 text-purple-700" },
    pickup: { label: "Collecte", color: "bg-orange-100 text-orange-700" },
    transit: { label: "En transit", color: "bg-blue-100 text-blue-700" },
    delivered: { label: "Livrée", color: "bg-green-100 text-green-700" },
    completed: { label: "Clôturée", color: "bg-gray-100 text-gray-700" },
    cancelled: { label: "Annulée", color: "bg-red-100 text-red-700" },
  };

  const handleStatusChange = (newStatus: string) => {
    updateStatus.mutate({ id: id!, status: newStatus });
    setConfirmAction(null);
  };

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader
        title={`Fret ${offer.ref}`}
        breadcrumb={["Partenaire", "Fret", offer.ref]}
        actions={
          <div className="flex gap-2">
            {offer.status === "pending" && (
              <>
                <Button onClick={() => setConfirmAction({ type: "Accepter", status: "accepted" })}>
                  Accepter
                </Button>
                <Button variant="secondary" onClick={() => setConfirmAction({ type: "Refuser", status: "rejected" })}>
                  Refuser
                </Button>
              </>
            )}
            {offer.status === "accepted" && (
              <Button onClick={() => setShowAssign(true)}>Assigner véhicule</Button>
            )}
            {(offer.status === "assigned" || offer.status === "pickup") && (
              <Button onClick={() => handleStatusChange("transit")}>Démarrer transit</Button>
            )}
            {offer.status === "transit" && (
              <Button onClick={() => setShowPod(true)}>Confirmer livraison (POD)</Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Statut et progression */}
          <div className="rounded-card bg-surface p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Statut</h2>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusFlow[offer.status as keyof typeof statusFlow]?.color || statusFlow.pending.color}`}>
                {statusFlow[offer.status as keyof typeof statusFlow]?.label || offer.status}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted">
              <IconClock />
              <span>Créée le {formatDateTime(offer.requested_at)}</span>
            </div>
          </div>

          {/* Trajet */}
          <div className="rounded-card bg-surface p-6 shadow-card">
            <h2 className="text-lg font-semibold mb-4">Trajet</h2>
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div className="w-0.5 h-16 bg-border my-1" />
                <div className="w-3 h-3 rounded-full bg-red-500" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="font-medium">{offer.origin_label}</p>
                  <p className="text-sm text-muted">{offer.origin_lat}, {offer.origin_lng}</p>
                </div>
                <div>
                  <p className="font-medium">{offer.destination_label}</p>
                  <p className="text-sm text-muted">{offer.destination_lat}, {offer.destination_lng}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-teal">{offer.distance_km} km</p>
                <p className="text-sm text-muted">Distance estimée</p>
              </div>
            </div>
          </div>

          {/* Marchandise */}
          <div className="rounded-card bg-surface p-6 shadow-card">
            <h2 className="text-lg font-semibold mb-4">Marchandise</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <IconPackage />
                <div>
                  <p className="text-sm text-muted">Type</p>
                  <p className="font-medium">{offer.goods_type}</p>
                </div>
              </div>
              {offer.weight_kg && (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded bg-teal/20 flex items-center justify-center text-teal text-xs font-bold">kg</div>
                  <div>
                    <p className="text-sm text-muted">Poids</p>
                    <p className="font-medium">{offer.weight_kg} kg</p>
                  </div>
                </div>
              )}
              {offer.volume_m3 && (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded bg-teal/20 flex items-center justify-center text-teal text-xs font-bold">m³</div>
                  <div>
                    <p className="text-sm text-muted">Volume</p>
                    <p className="font-medium">{offer.volume_m3} m³</p>
                  </div>
                </div>
              )}
            </div>
            {offer.notes && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted">Notes</p>
                <p className="mt-1">{offer.notes}</p>
              </div>
            )}
          </div>

          {/* Tracking GPS */}
          {(offer.status === "assigned" || offer.status === "pickup" || offer.status === "transit") && (
            <div className="rounded-card bg-surface p-6 shadow-card">
              <h2 className="text-lg font-semibold mb-4">Tracking GPS</h2>
              <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted">
                  <IconNavigation />
                  <p>Carte de suivi en temps réel</p>
                  <p className="text-sm">Véhicule assigné : {offer.vehicle_id || "Non assigné"}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Prix */}
          <div className="rounded-card bg-surface p-6 shadow-card">
            <h2 className="text-lg font-semibold mb-4">Tarification</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted">Prix transport</span>
                <span className="font-medium">{formatFCFA(offer.price_fcfa)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-3">
                <span>Total</span>
                <span className="text-teal">{formatFCFA(offer.price_fcfa)}</span>
              </div>
            </div>
          </div>

          {/* Client */}
          <div className="rounded-card bg-surface p-6 shadow-card">
            <h2 className="text-lg font-semibold mb-4">Client</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <IconUser />
                <span className="font-medium">{offer.client_name || "Non renseigné"}</span>
              </div>
              {offer.client_phone && (
                <div className="flex items-center gap-3">
                  <IconPhone />
                  <a href={`tel:${offer.client_phone}`} className="text-teal hover:underline">
                    {offer.client_phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="rounded-card bg-surface p-6 shadow-card">
            <h2 className="text-lg font-semibold mb-4">Actions</h2>
            <div className="space-y-2">
              <Button variant="secondary" className="w-full" onClick={() => router.push("/partner/freight")}>
                Retour à la liste
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmation */}
      {confirmAction && (
        <ConfirmModal
          open={true}
          title={`${confirmAction.type} l'offre`}
          message={`Voulez-vous ${confirmAction.type.toLowerCase()} cette offre de fret ?`}
          confirmLabel={confirmAction.type}
          cancelLabel="Annuler"
          variant={confirmAction.type === "Refuser" ? "danger" : "primary"}
          onConfirm={() => handleStatusChange(confirmAction.status)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
