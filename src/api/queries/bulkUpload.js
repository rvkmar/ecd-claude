// src/api/queries/bulkUpload.js
//
// Generic React Query hook backing every Settings > Bulk Upload card.
// Each of the six bulk endpoints (users/policies/competency models/
// evidence models/task models/items) accepts a JSON array and returns
// { created, failed, results: [{ index, ok, ...}] } with HTTP 207
// (Multi-Status) -- fetch treats 207 as `res.ok`, so apiFetch's normal
// success path returns that body directly, no special-casing needed here.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../apiClient";
import { useAuth } from "../../auth/AuthProvider";

export function useBulkUpload(endpoint, invalidateKey) {
  const { auth } = useAuth() || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rows) =>
      apiFetch(endpoint, { method: "POST", body: JSON.stringify(rows) }, auth),
    onSuccess: () => {
      if (invalidateKey) queryClient.invalidateQueries({ queryKey: invalidateKey });
    },
  });
}
