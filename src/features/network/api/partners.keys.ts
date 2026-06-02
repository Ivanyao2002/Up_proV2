export const partnersKeys = {
  all: ["network", "partners"] as const,
  list: () => [...partnersKeys.all, "list"] as const,
};
