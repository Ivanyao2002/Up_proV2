"use client";

interface ZonePolygonMapProps {
  polygon?: {
    type: "Polygon";
    coordinates: number[][][];
  };
  zoneName: string;
}

/** Projection simplifiée lng/lat → % pour aperçu polygone */
function ringToPoints(ring: number[][]): string {
  const lngs = ring.map((c) => c[0]);
  const lats = ring.map((c) => c[1]);
  const lngMin = Math.min(...lngs);
  const lngMax = Math.max(...lngs);
  const latMin = Math.min(...lats);
  const latMax = Math.max(...lats);

  return ring
    .map(([lng, lat]) => {
      const x = ((lng - lngMin) / (lngMax - lngMin || 1)) * 80 + 10;
      const y = (1 - (lat - latMin) / (latMax - latMin || 1)) * 70 + 15;
      return `${x},${y}`;
    })
    .join(" ");
}

export function ZonePolygonMap({ polygon, zoneName }: ZonePolygonMapProps) {
  const ring = polygon?.coordinates?.[0];
  const points = ring ? ringToPoints(ring) : "30,70 70,20 85,55 50,85";

  return (
    <div className="relative h-64 overflow-hidden rounded-card border border-border bg-[#e8eaf0]">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(64,81,137,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(64,81,137,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "28px 28px",
        }}
      />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polygon
          points={points}
          fill="rgba(10,179,156,0.2)"
          stroke="#0ab39c"
          strokeWidth="0.8"
        />
      </svg>
      <p className="absolute bottom-3 left-3 rounded bg-surface/90 px-2 py-1 text-xs font-medium text-navy shadow-sm">
        {zoneName} · polygone actif
      </p>
    </div>
  );
}
