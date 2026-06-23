"use client";

import { useEffect, useState } from "react";
import {
  searchAbidjanPlaces,
  labelFromCoords,
  type AbidjanPlace,
} from "@/shared/lib/abidjanPlaces";
import { ABIDJAN_MAP_BOUNDS } from "@/shared/lib/mapProjection";
import { SimplePinMap } from "@/shared/components/map/SimplePinMap";

export interface FreightPoint {
  label: string;
  lat: number;
  lng: number;
}

interface FreightLocationPickerProps {
  origin: FreightPoint | null;
  destination: FreightPoint | null;
  onOriginChange: (point: FreightPoint) => void;
  onDestinationChange: (point: FreightPoint) => void;
}

type ActivePoint = "origin" | "destination";

export function FreightLocationPicker({
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
}: FreightLocationPickerProps) {
  const [active, setActive] = useState<ActivePoint>("origin");
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<AbidjanPlace[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setSuggestions(searchAbidjanPlaces(search));
  }, [search]);

  const applyPoint = (point: FreightPoint) => {
    if (active === "origin") onOriginChange(point);
    else onDestinationChange(point);
  };

  const handleMapClick = (lat: number, lng: number) => {
    applyPoint({
      label: labelFromCoords(lat, lng, active === "origin" ? "Origine" : "Destination"),
      lat,
      lng,
    });
    setSearch("");
    setShowSuggestions(false);
  };

  const selectPlace = (place: AbidjanPlace) => {
    applyPoint({ label: place.name, lat: place.lat, lng: place.lng });
    setSearch("");
    setShowSuggestions(false);
  };

  const mapPins = [
    ...(origin ? [{ lat: origin.lat, lng: origin.lng, color: "#0ab39c", label: "Origine", pulse: true }] : []),
    ...(destination ? [{ lat: destination.lat, lng: destination.lng, color: "#405189", label: "Destination" }] : []),
  ];

  const tabClass = (point: ActivePoint) =>
    `flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
      active === point
        ? "border-teal bg-teal/10 text-teal-dark"
        : "border-border bg-surface text-muted hover:bg-muted/10"
    }`;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button type="button" className={tabClass("origin")} onClick={() => setActive("origin")}>
          Origine {origin ? "✓" : ""}
        </button>
        <button
          type="button"
          className={tabClass("destination")}
          onClick={() => setActive("destination")}
        >
          Destination {destination ? "✓" : ""}
        </button>
      </div>

      <SimplePinMap
        bounds={ABIDJAN_MAP_BOUNDS}
        pins={mapPins}
        overlayLabel={`Abidjan · Cliquez pour placer : ${
          active === "origin" ? "Origine" : "Destination"
        }`}
        cursorCrosshair
        className="h-[min(320px,45vh)] w-full"
        onMapClick={handleMapClick}
      />

      <div className="relative">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          placeholder={`Rechercher un lieu pour : ${
            active === "origin" ? "l'origine" : "la destination"
          }`}
          autoComplete="off"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-30 mt-1 max-h-44 w-full overflow-auto rounded-lg border border-border bg-surface py-1 shadow-lg">
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
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <p className="rounded-lg border border-teal/20 bg-teal/5 px-3 py-2 text-teal-dark">
          <span className="font-semibold">Origine :</span>{" "}
          {origin?.label ?? "Non définie"}
        </p>
        <p className="rounded-lg border border-navy/20 bg-navy/5 px-3 py-2 text-navy">
          <span className="font-semibold">Destination :</span>{" "}
          {destination?.label ?? "Non définie"}
        </p>
      </div>
    </div>
  );
}
