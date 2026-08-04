export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};
