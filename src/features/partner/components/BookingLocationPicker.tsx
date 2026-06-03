"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/shared/ui/Button";
import {
  searchAbidjanPlaces,
  labelFromCoords,
  type AbidjanPlace,
} from "@/shared/lib/abidjanPlaces";
import {
  latLngToPercent,
  percentToLatLng,
  clampCoordsToBounds,
} from "@/shared/lib/mapProjection";

export type LocationSource = "geolocation" | "search" | "pin";

export interface BookingLocation {
  label: string;
  lat: number;
  lng: number;
  source: LocationSource;
}

interface BookingLocationPickerProps {
  from: BookingLocation | null;
  to: BookingLocation | null;
  onFromChange: (location: BookingLocation) => void;
  onToChange: (location: BookingLocation | null) => void;
  geoError?: string | null;
  onGeoError?: (message: string | null) => void;
}

function MapPin({
  position,
  colorClass,
  label,
  pulse,
}: {
  position: { left: string; top: string };
  colorClass: string;
  label: string;
  pulse?: boolean;
}) {
  return (
    <div
      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full"
      style={position}
    >
      <div className="flex flex-col items-center">
        {pulse && (
          <span
            className={`absolute bottom-0 h-8 w-8 animate-pulse-ring rounded-full opacity-40 ${colorClass}`}
          />
        )}
        <span
          className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-lg ${colorClass}`}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-white/90" />
        </span>
        <span className="mt-1 max-w-[140px] truncate rounded bg-navy px-2 py-0.5 text-[10px] font-medium text-white shadow">
          {label}
        </span>
      </div>
    </div>
  );
}

export function BookingLocationPicker({
  from,
  to,
  onFromChange,
  onToChange,
  geoError,
  onGeoError,
}: BookingLocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<AbidjanPlace[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locating, setLocating] = useState(false);

  const refreshGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      onGeoError?.("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    setLocating(true);
    onGeoError?.(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const clamped = clampCoordsToBounds(latitude, longitude);
        onFromChange({
          label: `Ma position · ${labelFromCoords(clamped.lat, clamped.lng, "Position")}`,
          lat: clamped.lat,
          lng: clamped.lng,
          source: "geolocation",
        });
        setLocating(false);
      },
      () => {
        onGeoError?.(
          "Impossible d'accéder à votre position. Autorisez la localisation ou réessayez."
        );
        setLocating(false);
        onFromChange({
          label: "Cocody, Angré (position par défaut)",
          lat: 5.3654,
          lng: -3.9872,
          source: "geolocation",
        });
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, [onFromChange, onGeoError]);

  useEffect(() => {
    refreshGeolocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- géolocalisation au montage uniquement
  }, []);

  useEffect(() => {
    setSuggestions(searchAbidjanPlaces(search));
  }, [search]);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = mapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const leftPct = ((e.clientX - rect.left) / rect.width) * 100;
    const topPct = ((e.clientY - rect.top) / rect.height) * 100;
    const { lat, lng } = percentToLatLng(leftPct, topPct);
    onToChange({
      label: labelFromCoords(lat, lng, "Point carte"),
      lat,
      lng,
      source: "pin",
    });
    setSearch("");
    setShowSuggestions(false);
  };

  const selectPlace = (place: AbidjanPlace) => {
    onToChange({
      label: place.name,
      lat: place.lat,
      lng: place.lng,
      source: "search",
    });
    setSearch(place.name);
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-4">
      <div
        ref={mapRef}
        role="presentation"
        onClick={handleMapClick}
        className="relative h-[min(380px,50vh)] w-full cursor-crosshair overflow-hidden rounded-card border border-border bg-map shadow-card"
        aria-label="Carte — cliquez pour placer la destination"
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(rgba(64,81,137,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(64,81,137,0.08) 1px, transparent 1px)
            `,
            backgroundSize: "36px 36px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-teal/5 via-transparent to-navy/10" />
        <div className="absolute left-[18%] top-[22%] h-20 w-28 rounded-2xl border border-teal/25 bg-teal/10" />
        <div className="absolute right-[15%] bottom-[28%] h-16 w-24 rounded-2xl border border-navy/20 bg-navy/5" />

        <p className="absolute left-3 top-3 rounded-lg bg-surface/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur">
          Abidjan · Cliquez pour l&apos;arrivée
        </p>

        {from && (
          <MapPin
            position={latLngToPercent(from.lat, from.lng)}
            colorClass="bg-teal"
            label="Départ"
            pulse
          />
        )}
        {to && (
          <MapPin
            position={latLngToPercent(to.lat, to.lng)}
            colorClass="bg-navy"
            label="Arrivée"
          />
        )}

        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 rounded-lg bg-surface/95 px-3 py-2 text-[10px] text-muted shadow-sm backdrop-blur">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-teal" /> Départ (GPS)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-navy" /> Arrivée
          </span>
        </div>
      </div>

      <div className="rounded-card border border-border bg-surface p-4 shadow-card">
        <div className="space-y-3">
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">Départ</span>
              <Button
                type="button"
                variant="secondary"
                className="!px-2 !py-1 !text-xs"
                disabled={locating}
                onClick={refreshGeolocation}
              >
                {locating ? "Localisation…" : "Ma position actuelle"}
              </Button>
            </div>
            <p className="rounded-lg border border-teal/20 bg-teal/5 px-3 py-2.5 text-sm text-teal-dark">
              {from?.label ?? "Acquisition de votre position…"}
            </p>
            {geoError && <p className="mt-1 text-xs text-amber-700">{geoError}</p>}
          </div>

          <div className="relative">
            <label className="block">
              <span className="text-sm font-medium text-foreground">Arrivée</span>
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSuggestions(true);
                  if (!e.target.value.trim()) onToChange(null);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                placeholder="Rechercher un lieu ou cliquer sur la carte"
                autoComplete="off"
              />
            </label>
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-30 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-surface py-1 shadow-lg">
                {suggestions.map((place) => (
                  <li key={place.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-surface-hover"
                      onClick={() => selectPlace(place)}
                    >
                      {place.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {to && (
              <p className="mt-1 text-xs text-muted">
                {to.source === "pin"
                  ? "Position exacte sur la carte"
                  : to.source === "search"
                    ? "Lieu sélectionné"
                    : to.label}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
