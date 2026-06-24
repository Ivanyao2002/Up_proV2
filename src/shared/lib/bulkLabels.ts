/** Libellé avec accord simple (singulier / pluriel). */
export function pluralLabel(
  count: number,
  singular: string,
  plural: string
): string {
  return count === 1 ? singular : plural;
}

export function driverBulkStatusMessage(
  count: number,
  status: "online" | "offline"
): string {
  if (status === "online") {
    return pluralLabel(
      count,
      "1 chauffeur marqué en ligne",
      `${count} chauffeurs marqués en ligne`
    );
  }
  return pluralLabel(
    count,
    "1 chauffeur marqué hors ligne",
    `${count} chauffeurs marqués hors ligne`
  );
}

export function driverBulkSuspendMessage(count: number): string {
  return pluralLabel(
    count,
    "1 chauffeur suspendu",
    `${count} chauffeurs suspendus`
  );
}

export function driverBulkReactivateMessage(count: number): string {
  return pluralLabel(
    count,
    "1 chauffeur réactivé",
    `${count} chauffeurs réactivés`
  );
}
