export const bonusAwardsKeys = {
  all: ["admin", "bonus-awards"] as const,
  list: (params?: unknown) => [...bonusAwardsKeys.all, "list", params] as const,
};
