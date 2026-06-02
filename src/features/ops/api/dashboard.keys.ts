export const dashboardKeys = {
  all: ["ops", "dashboard"] as const,
  admin: () => [...dashboardKeys.all, "admin"] as const,
};
