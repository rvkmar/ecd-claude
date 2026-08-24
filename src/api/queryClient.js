// src/api/queryClient.js
//
// Single shared React Query client for the whole app. Created once here
// (not inline in main.jsx) so test files and any non-component code that
// needs to read/invalidate the cache (e.g. after logout) can import the
// same instance instead of reaching into React context.

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // The old fetch-in-useEffect code always refetched on every mount;
      // keep that behavior familiar rather than surprising people with
      // stale-by-default data while this migration is still in progress.
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
