import type {
  PaginatedResponse,
  PaginationMeta,
} from '../types/paginated-response';

export function toOffset(page: number, pageSize: number): number {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  return (safePage - 1) * safePageSize;
}

export function buildPaginationMeta(
  page: number,
  pageSize: number,
  total: number,
): PaginationMeta {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const safeTotal = Math.max(0, total);
  return {
    page: safePage,
    pageSize: safePageSize,
    total: safeTotal,
    pageCount: safePageSize === 0 ? 0 : Math.ceil(safeTotal / safePageSize),
  };
}

export function toPaginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number,
): PaginatedResponse<T> {
  return {
    data,
    meta: buildPaginationMeta(page, pageSize, total),
  };
}
