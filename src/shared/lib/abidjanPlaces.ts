export interface AbidjanPlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

/** Lieux fréquents à Abidjan — recherche + géocodage mock */
export const ABIDJAN_PLACES: AbidjanPlace[] = [
  { id: "cocody-angre", name: "Cocody, Angré", lat: 5.3654, lng: -3.9872 },
  { id: "cocody-riviera", name: "Cocody, Riviera 2", lat: 5.3512, lng: -3.9785 },
  { id: "plateau-bceao", name: "Plateau, BCEAO", lat: 5.3197, lng: -4.0128 },
  { id: "plateau-st-paul", name: "Plateau, Cathédrale St-Paul", lat: 5.3211, lng: -4.0175 },
  { id: "marcory-zone4", name: "Marcory, Zone 4", lat: 5.3012, lng: -3.9856 },
  { id: "yopougon-siporex", name: "Yopougon, Siporex", lat: 5.3389, lng: -4.0712 },
  { id: "adjame-gare", name: "Adjamé, Gare routière", lat: 5.3533, lng: -4.0289 },
  { id: "treichville-marche", name: "Treichville, Grand marché", lat: 5.2987, lng: -4.0123 },
  { id: "abobo-gare", name: "Abobo, Gare", lat: 5.4167, lng: -4.0211 },
  { id: "port-bouet-aeroport", name: "Port-Bouët, Aéroport FHB", lat: 5.2614, lng: -3.9258 },
  { id: "bingerville", name: "Bingerville", lat: 5.3558, lng: -3.8854 },
  { id: "deux-plateaux", name: "Deux Plateaux", lat: 5.3598, lng: -3.9987 },
];

export function searchAbidjanPlaces(query: string): AbidjanPlace[] {
  const q = query.trim().toLowerCase();
  if (!q) return ABIDJAN_PLACES.slice(0, 6);
  return ABIDJAN_PLACES.filter((p) => p.name.toLowerCase().includes(q));
}

export function nearestAbidjanPlace(lat: number, lng: number): AbidjanPlace {
  let best = ABIDJAN_PLACES[0];
  let bestDist = Infinity;
  for (const place of ABIDJAN_PLACES) {
    const dist = (place.lat - lat) ** 2 + (place.lng - lng) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = place;
    }
  }
  return best;
}

export function labelFromCoords(lat: number, lng: number, prefix = "Position"): string {
  const near = nearestAbidjanPlace(lat, lng);
  const dist = Math.sqrt((near.lat - lat) ** 2 + (near.lng - lng) ** 2);
  if (dist < 0.015) return near.name;
  return `${prefix} · ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}
