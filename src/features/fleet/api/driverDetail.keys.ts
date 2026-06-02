export const driverDetailKeys = {
  all: ["fleet", "driver-detail"] as const,
  detail: (id: string | number) => [...driverDetailKeys.all, id] as const,
};
