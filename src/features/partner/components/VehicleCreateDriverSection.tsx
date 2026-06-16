"use client";

import { useEffect, useState } from "react";
import {
  buildInternationalPhone,
  extractLocalPhonePart,
  type CatalogCountry,
} from "@/core/api/catalogLookup.service";
import { PhoneDialPrefix } from "@/shared/ui/PhoneDialPrefix";
import { DriverPhoneOtpBlock } from "@/features/fleet/components/DriverPhoneOtpBlock";
import type { CreateDriverPayload } from "../api/drivers.service";

export const EMPTY_DRIVER: CreateDriverPayload = {
  first_name: "",
  last_name: "",
  phone: "",
  zone: "",
};

interface VehicleCreateDriverSectionProps {
  driver: CreateDriverPayload | null;
  onChange: (driver: CreateDriverPayload | null) => void;
  /** Chauffeur obligatoire — pas de case à cocher, création couplée avec le véhicule. */
  required?: boolean;
  /** Pays du partenaire — précharge l'indicatif téléphonique (ex. Lomé → +228). */
  phoneCountry?: CatalogCountry | null;
  /** Vérification OTP obligatoire (désactivée en mode legacy). */
  requirePhoneOtp?: boolean;
  phoneVerified?: boolean;
  onPhoneVerifiedChange?: (verified: boolean) => void;
}

export function VehicleCreateDriverSection({
  driver,
  onChange,
  required = false,
  phoneCountry,
  requirePhoneOtp = false,
  phoneVerified = false,
  onPhoneVerifiedChange,
}: VehicleCreateDriverSectionProps) {
  const enabled = required || driver !== null;
  const activeDriver = driver ?? EMPTY_DRIVER;
  const dialCode = phoneCountry?.dial_code ?? "+225";
  const [phoneLocal, setPhoneLocal] = useState("");

  useEffect(() => {
    if (!phoneCountry) return;
    const local = extractLocalPhonePart(activeDriver.phone, dialCode);
    setPhoneLocal(local);
  }, [activeDriver.phone, dialCode, phoneCountry]);

  const update = (patch: Partial<CreateDriverPayload>) => {
    onChange({ ...activeDriver, ...patch });
  };

  const updatePhoneLocal = (local: string) => {
    const sanitized = local.replace(/[^\d\s]/g, "");
    setPhoneLocal(sanitized);
    const digits = sanitized.replace(/\D/g, "");
    update({
      phone:
        digits.length > 0 ? buildInternationalPhone(dialCode, sanitized) : "",
    });
  };

  return (
    <section className="w-full rounded-card border border-border bg-surface p-5">
      {required ? (
        <div>
          <h2 className="text-sm font-semibold text-foreground">Chauffeur</h2>
          <p className="mt-1 text-sm text-muted">
            Obligatoire. Le chauffeur et le véhicule sont créés ensemble et rattachés au même
            partenaire.
          </p>
        </div>
      ) : (
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
            <span className="text-sm font-semibold text-foreground">
              Créer et assigner un chauffeur
            </span>
            <p className="mt-1 text-sm text-muted">
              Optionnel. Le chauffeur sera créé en attente de validation KYC et rattaché à ce
              véhicule. Sinon, assignez un chauffeur plus tard depuis la fiche véhicule ou la liste
              des chauffeurs.
            </p>
          </div>
        </label>
      )}

      {enabled && (
        <div
          className={`grid gap-4 sm:grid-cols-2 ${required ? "mt-5" : "mt-5 border-t border-border pt-5"}`}
        >
          <label className="block">
            <span className="text-sm font-medium">Prénom</span>
            <input
              value={activeDriver.first_name}
              onChange={(e) => update({ first_name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              placeholder="Jean"
              required={enabled}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Nom</span>
            <input
              value={activeDriver.last_name}
              onChange={(e) => update({ last_name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              placeholder="Kouassi"
              required={enabled}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium">Téléphone</span>
            {phoneCountry ? (
              <div className="mt-1 flex overflow-hidden rounded-lg border border-border ring-teal/30 focus-within:ring-2">
                <PhoneDialPrefix
                  dialCode={dialCode}
                  flagUrl={phoneCountry.flag_url}
                  countryCode={phoneCountry.code}
                />
                <input
                  type="tel"
                  value={phoneLocal}
                  onChange={(e) => updatePhoneLocal(e.target.value)}
                  placeholder="07 00 00 00 00"
                  inputMode="tel"
                  className="w-full px-3 py-2.5 text-sm outline-none"
                  required={enabled}
                />
              </div>
            ) : (
              <input
                type="tel"
                value={activeDriver.phone}
                onChange={(e) => update({ phone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                placeholder="+225 07 00 00 00 00"
                required={enabled}
              />
            )}
            {phoneCountry && (
              <p className="mt-1 text-xs text-muted">
                Indicatif {phoneCountry.label} ({dialCode}) — saisissez le numéro local
                uniquement.
              </p>
            )}
          </label>
          {requirePhoneOtp && onPhoneVerifiedChange && (
            <div className="sm:col-span-2">
              <DriverPhoneOtpBlock
                internationalPhone={activeDriver.phone}
                dialCode={dialCode}
                countryCode={phoneCountry?.code ?? "CI"}
                verified={phoneVerified}
                onVerifiedChange={onPhoneVerifiedChange}
                disabled={!enabled}
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
