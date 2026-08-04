import {
  buildPaginationMeta,
  toOffset,
  toPaginatedResponse,
} from './pagination';

describe('pagination utils', () => {
  it('computes offset from page and pageSize', () => {
    expect(toOffset(1, 20)).toBe(0);
    expect(toOffset(3, 20)).toBe(40);
  });

  it('builds pagination meta and response envelope', () => {
    expect(buildPaginationMeta(2, 20, 45)).toEqual({
      page: 2,
      pageSize: 20,
      total: 45,
      pageCount: 3,
    });

    expect(toPaginatedResponse([{ id: 1 }], 1, 20, 1)).toEqual({
      data: [{ id: 1 }],
      meta: { page: 1, pageSize: 20, total: 1, pageCount: 1 },
    });
  });
});
