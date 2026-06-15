import { env } from "@/core/config/env";

/** URL publique d'un fichier sous `public/` (préfixe basePath si défini, ex. /pro/assets/…). */
export function publicAsset(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const base = env.basePath;
  if (!base || normalized.startsWith(`${base}/`)) return normalized;
  return `${base}${normalized}`;
}
