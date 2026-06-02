export const withdrawalsKeys = {
  all: ["finance", "withdrawals"] as const,
  list: () => [...withdrawalsKeys.all, "list"] as const,
};
