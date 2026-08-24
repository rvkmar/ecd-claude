// src/api/queries/policies.js
//
// React Query hooks for the /api/policies resource. Written first in the
// Phase 2 migration because three components (SessionPlayer, SessionReport,
// SessionForm) each independently re-implemented the exact same
// "fetch policies to resolve an id to a display name" useEffect — this
// collapses all three onto one cached query, so a policy list only needs
// to be fetched once per staleTime window no matter how many of those
// components are mounted at once.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../apiClient";
import { useAuth } from "../../auth/AuthProvider";

export const policiesKey = ["policies"];

export function usePolicies(options = {}) {
  const { auth } = useAuth() || {};
  return useQuery({
    queryKey: policiesKey,
    queryFn: () => apiFetch("/api/policies", {}, auth),
    ...options,
  });
}

// Convenience hook for the common "just need the display name" case that
// SessionPlayer/SessionReport/SessionForm all had their own copy of.
export function usePolicyName(policyId) {
  const { data: policies } = usePolicies();
  if (!policyId) return null;
  const match = (policies || []).find((pol) => pol.id === policyId);
  return match ? match.name : policyId;
}

export function useCreatePolicy() {
  const { auth } = useAuth() || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      apiFetch("/api/policies", { method: "POST", body: JSON.stringify(payload) }, auth),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: policiesKey }),
  });
}

export function useUpdatePolicy() {
  const { auth } = useAuth() || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) =>
      apiFetch(`/api/policies/${id}`, { method: "PUT", body: JSON.stringify(payload) }, auth),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: policiesKey }),
  });
}

export function useDeletePolicy() {
  const { auth } = useAuth() || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiFetch(`/api/policies/${id}`, { method: "DELETE" }, auth),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: policiesKey }),
  });
}
