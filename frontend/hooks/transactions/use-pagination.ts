'use client';

import React from 'react';

export function usePagination(initialLimit = 25) {
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(initialLimit);

  const resetPage = React.useCallback(() => setPage(1), []);

  return {
    page,
    limit,
    setPage,
    setLimit: (nextLimit: number) => {
      setLimit(nextLimit);
      setPage(1);
    },
    resetPage,
  };
}
