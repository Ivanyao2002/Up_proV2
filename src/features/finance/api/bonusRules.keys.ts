export const bonusRulesKeys = {
  all: ["admin", "bonus-rules"] as const,
  list: (params?: unknown) => [...bonusRulesKeys.all, "list", params] as const,
};
