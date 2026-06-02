export const zonesKeys = {
  all: ["network", "zones"] as const,
  list: () => [...zonesKeys.all, "list"] as const,
};
