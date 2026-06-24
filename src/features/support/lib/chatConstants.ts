import type { AdminSupportChat } from "../api/adminChat.types";

export const STATUS_FILTERS: { value: AdminSupportChat["status"] | "all"; label: string }[] = [
  { value: "all",    label: "Tous" },
  { value: "open",   label: "Ouverts" },
  { value: "closed", label: "Clôturés" },
];
