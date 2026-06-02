export const tripDetailKeys = {
  all: ["ops", "trip-detail"] as const,
  detail: (id: string) => [...tripDetailKeys.all, id] as const,
};
