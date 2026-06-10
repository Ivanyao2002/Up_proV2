import type { Driver } from "@/shared/types";

/** Ligne tableau — chauffeur suspendu */
export function getDriverTableRowClassName(driver: Driver): string {
  if (driver.account_status === "suspended") {
    return "bg-orange-50/80 border-l-4 border-l-orange-400";
  }
  if (driver.account_status === "banned") {
    return "bg-red-50/60 border-l-4 border-l-red-400";
  }
  if (driver.account_status === "pending") {
    return "bg-amber-50/40";
  }
  return "";
}
