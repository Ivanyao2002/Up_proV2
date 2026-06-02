export const franchisesKeys = {
  all: ["network", "franchises"] as const,
  list: () => [...franchisesKeys.all, "list"] as const,
};
