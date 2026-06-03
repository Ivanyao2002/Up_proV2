export const dispatchKeys = {
  all: ["dispatch"] as const,
  console: () => [...dispatchKeys.all, "console"] as const,
};
