import type { Request } from "express";

export interface PaginationParams {
  page: number;
  perPage: number;
  offset: number;
  sortColumn: string;
  sortDirection: "ASC" | "DESC";
}

/**
 * Parse query param standar: ?page=1&per_page=20&sort=-created_at
 * Prefix "-" pada sort berarti DESC.
 * allowedSortColumns adalah whitelist untuk mencegah SQL injection lewat kolom sort.
 */
export function parsePagination(
  req: Request,
  allowedSortColumns: string[],
  defaultSort = "created_at"
): PaginationParams {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const perPageRaw = parseInt(String(req.query.per_page ?? "20"), 10) || 20;
  const perPage = Math.min(100, Math.max(1, perPageRaw));

  let sortRaw = String(req.query.sort ?? `-${defaultSort}`);
  let sortDirection: "ASC" | "DESC" = "ASC";
  if (sortRaw.startsWith("-")) {
    sortDirection = "DESC";
    sortRaw = sortRaw.slice(1);
  }
  const sortColumn = allowedSortColumns.includes(sortRaw) ? sortRaw : defaultSort;

  return {
    page,
    perPage,
    offset: (page - 1) * perPage,
    sortColumn,
    sortDirection,
  };
}

export function buildMeta(page: number, perPage: number, total: number) {
  return {
    page,
    per_page: perPage,
    total,
    total_pages: Math.max(1, Math.ceil(total / perPage)),
  };
}
