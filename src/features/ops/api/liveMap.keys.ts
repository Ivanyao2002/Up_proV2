export const liveMapKeys = {
  all: ["ops", "live-map"] as const,
  admin: () => [...liveMapKeys.all, "admin"] as const,
};
