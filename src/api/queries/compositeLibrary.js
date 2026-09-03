// src/api/queries/compositeLibrary.js
//
// React Query hooks for /api/compositeLibrary — the compiled, versioned
// delivery package built at Task Model activation.
//
// READ-ONLY BY DESIGN, mirroring the router. There is no create or
// update hook here and that is deliberate: schema.js declares this
// collection as a build artifact with no lifecycle ("not an authored
// entity a human drafts/reviews/revises"), and ADR 0003 puts the
// compile boundary at structural facts. The only mutation exposed is a
// REBUILD, which names a Task Model to compile and never supplies the
// package's contents.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../apiClient";
import { useAuth } from "../../auth/AuthProvider";

export const compositeLibraryKey = ["compositeLibrary"];
export const activeCompositeLibraryKey = (taskModelId) => [
  "compositeLibrary",
  "active",
  taskModelId,
];

export function useCompositeLibrary({ taskModelId, activeOnly } = {}, options = {}) {
  const { auth } = useAuth() || {};
  const params = new URLSearchParams();
  if (taskModelId) params.set("taskModelId", taskModelId);
  if (activeOnly) params.set("active", "true");
  const qs = params.toString() ? `?${params.toString()}` : "";
  return useQuery({
    queryKey: [...compositeLibraryKey, { taskModelId, activeOnly }],
    queryFn: () => apiFetch(`/api/compositeLibrary${qs}`, {}, auth),
    ...options,
  });
}

// The delivery-path read: the one package currently served for a Task
// Model. At most one may be active per taskModelId, so this is a single
// record — or a 404, which apiFetch surfaces as a thrown Error with the
// server's message attached for apiErrorMessage() to read.
export function useActiveCompositeLibrary(taskModelId, options = {}) {
  const { auth } = useAuth() || {};
  return useQuery({
    queryKey: activeCompositeLibraryKey(taskModelId),
    queryFn: () => apiFetch(`/api/compositeLibrary/active/${taskModelId}`, {}, auth),
    enabled: Boolean(taskModelId),
    ...options,
  });
}

// Advisory only — never mutates. Stale on a Task Model or Evidence Model
// version change, and explicitly NOT on recalibration alone (ADR 0003,
// proven by Day 25).
export function useCompositeLibraryStaleness(id, options = {}) {
  const { auth } = useAuth() || {};
  return useQuery({
    queryKey: [...compositeLibraryKey, id, "staleness"],
    queryFn: () => apiFetch(`/api/compositeLibrary/${id}/staleness`, {}, auth),
    enabled: Boolean(id),
    ...options,
  });
}

// Admin escape hatch for a stale package. D49 wires the same builder
// call into Task Model promotion so a package normally appears without
// anyone asking; this is the manual path, not the primary one.
export function useRebuildCompositeLibrary() {
  const { auth } = useAuth() || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskModelId) =>
      apiFetch(`/api/compositeLibrary/rebuild/${taskModelId}`, { method: "POST" }, auth),
    onSuccess: (_data, taskModelId) => {
      queryClient.invalidateQueries({ queryKey: compositeLibraryKey });
      queryClient.invalidateQueries({ queryKey: activeCompositeLibraryKey(taskModelId) });
    },
  });
}
