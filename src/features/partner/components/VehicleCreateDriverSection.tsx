"use client";

import type { CreateDriverPayload } from "../api/drivers.service";

interface VehicleCreateDriverSectionProps {
  driver: CreateDriverPayload | null;
  onChange: (driver: CreateDriverPayload | null) => void;
}

const EMPTY_DRIVER: CreateDriverPayload = {
  first_name: "",
  last_name: "",
  phone: "",
  zone: "",
  email: "",
};

export function VehicleCreateDriverSection({
  driver,
  onChange,
}: VehicleCreateDriverSectionProps) {
  const enabled = driver !== null;

  const update = (patch: Partial<CreateDriverPayload>) => {
    if (!driver) return;
    onChange({ ...driver, ...patch });
  };

  return (
    <section className="w-full rounded-card border border-border bg-surface p-5">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            onChange(e.target.checked ? { ...EMPTY_DRIVER } : null);
          }}
          className="mt-1 h-4 w-4 rounded border-border text-teal focus:ring-teal/30"
        />
        <div>
          <span className="text-sm font-semibold text-[#212529]">
            Créer et assigner un chauffeur
          </span>
          <p className="mt-1 text-sm text-muted">
            Optionnel. Le chauffeur sera créé en attente de validation KYC et rattaché à ce
            véhicule. Sinon, assignez un chauffeur plus tard depuis la fiche véhicule ou la liste
            des chauffeurs.
          </p>
        </div>
      </label>

      {enabled && driver && (
        <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Prénom</span>
            <input
              value={driver.first_name}
              onChange={(e) => update({ first_name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              placeholder="Jean"
              required={enabled}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Nom</span>
            <input
              value={driver.last_name}
              onChange={(e) => update({ last_name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              placeholder="Kouassi"
              required={enabled}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium">Téléphone</span>
            <input
              type="tel"
              value={driver.phone}
              onChange={(e) => update({ phone: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              placeholder="+225 07 00 00 00 00"
              required={enabled}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Zone</span>
            <input
              value={driver.zone}
              onChange={(e) => update({ zone: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              placeholder="Cocody"
              required={enabled}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">E-mail (optionnel)</span>
            <input
              type="email"
              value={driver.email ?? ""}
              onChange={(e) => update({ email: e.target.value || undefined })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              placeholder="chauffeur@email.ci"
            />
          </label>
        </div>
      )}
    </section>
  );
}
