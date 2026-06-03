export const driverDetailKeys = {
  all: ["fleet", "driver-detail"] as const,
  detail: (id: string | number) => [...driverDetailKeys.all, id] as const,
  trips: (id: string | number) => [...driverDetailKeys.detail(id), "trips"] as const,
  walletTransactions: (id: string | number) =>
    [...driverDetailKeys.detail(id), "wallet-transactions"] as const,
};
