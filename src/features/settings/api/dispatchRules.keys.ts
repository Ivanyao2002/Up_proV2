export const dispatchRulesKeys = {
  all: ["dispatch-rules"] as const,
  detail: () => [...dispatchRulesKeys.all, "detail"] as const,
};
