import type { Paginated } from "@/shared/types";

export interface PaginateParams {
  page?: number;
  per_page?: number;
}

export function paginate<T>(
  items: T[],
  params: PaginateParams = {}
): Paginated<T> {
  const perPage = Math.max(1, Math.min(500, params.per_page ?? 25));
  const total = items.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(
    Math.max(1, params.page ?? 1),
    lastPage
  );
  const start = (currentPage - 1) * perPage;

  return {
    data: items.slice(start, start + perPage),
    meta: {
      total,
      per_page: perPage,
      current_page: currentPage,
      last_page: lastPage,
    },
  };
}
