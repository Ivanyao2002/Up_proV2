export const transactionsKeys = {
  all: ["finance", "transactions"] as const,
  list: () => [...transactionsKeys.all, "list"] as const,
};
