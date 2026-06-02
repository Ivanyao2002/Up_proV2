export const kycKeys = {
  all: ["fleet", "kyc"] as const,
  queue: () => [...kycKeys.all, "queue"] as const,
};
