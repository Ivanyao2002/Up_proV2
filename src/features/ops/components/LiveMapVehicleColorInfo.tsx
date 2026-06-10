import type { LiveMapDriver } from "@/shared/types";
import {
  getLiveMapVehicleColorLabel,
  resolveLiveMapVehicleColorHex,
} from "../lib/liveMapDriverDisplay";

type VehicleColorSource = Pick<
  LiveMapDriver,
  "vehicle_color" | "vehicle_color_label" | "vehicle_color_hex"
>;

export function LiveMapVehicleColorInfo({
  driver,
  className = "",
}: {
  driver: VehicleColorSource;
  className?: string;
}) {
  const label = getLiveMapVehicleColorLabel(driver);
  if (!label) return null;

  const hex = resolveLiveMapVehicleColorHex(driver) ?? "#9ca3af";

  return (
    <p className={`flex items-center gap-1.5 truncate text-xs text-muted ${className}`}>
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full border border-border/80 shadow-sm"
        style={{ backgroundColor: hex }}
        aria-hidden
      />
      <span>Couleur : {label}</span>
    </p>
  );
}
