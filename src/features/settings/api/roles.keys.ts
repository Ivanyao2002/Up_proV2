export const rolesKeys = {
  all: ["roles"] as const,
  list: () => [...rolesKeys.all, "list"] as const,
  detail: (id: string) => [...rolesKeys.all, "detail", id] as const,
};
