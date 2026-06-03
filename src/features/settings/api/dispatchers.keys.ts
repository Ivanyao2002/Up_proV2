export const dispatchersKeys = {
  all: ["dispatchers"] as const,
  list: () => [...dispatchersKeys.all, "list"] as const,
  detail: (id: string) => [...dispatchersKeys.all, "detail", id] as const,
};
