export const pricingKeys = {
  all: ["pricing"] as const,
  list: () => [...pricingKeys.all, "list"] as const,
  detail: (id: string) => [...pricingKeys.all, "detail", id] as const,
};
