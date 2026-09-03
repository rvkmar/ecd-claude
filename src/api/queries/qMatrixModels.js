// src/api/queries/qMatrixModels.js
//
// React Query hooks for /api/qMatrixModels — the attributes x items
// matrix that binds binary Student Model Variables to the items
// requiring them. Consumed by the Q-matrix editor (D51) and the
// DINA/G-DINA config panel on the Evidence Wizard (D53).
//
// Follows the established pattern: a key helper, hooks reading `auth`
// from useAuth(), and every call through apiFetch — never a bare fetch.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../apiClient";
import { useAuth } from "../../auth/AuthProvider";

export const qMatrixModelsKey = ["qMatrixModels"];
export const qMatrixModelKey = (id) => ["qMatrixModels", id];

export function useQMatrixModels(competencyModelId, options = {}) {
  const { auth } = useAuth() || {};
  const qs = competencyModelId
    ? `?competencyModelId=${encodeURIComponent(competencyModelId)}`
    : "";
  return useQuery({
    queryKey: competencyModelId
      ? [...qMatrixModelsKey, { competencyModelId }]
      : qMatrixModelsKey,
    queryFn: () => apiFetch(`/api/qMatrixModels${qs}`, {}, auth),
    ...options,
  });
}

export function useQMatrixModel(id, options = {}) {
  const { auth } = useAuth() || {};
  return useQuery({
    queryKey: qMatrixModelKey(id),
    queryFn: () => apiFetch(`/api/qMatrixModels/${id}`, {}, auth),
    enabled: Boolean(id),
    ...options,
  });
}

export function useCreateQMatrixModel() {
  const { auth } = useAuth() || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      apiFetch("/api/qMatrixModels", { method: "POST", body: JSON.stringify(payload) }, auth),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qMatrixModelsKey }),
  });
}

export function useUpdateQMatrixModel() {
  const { auth } = useAuth() || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) =>
      apiFetch(`/api/qMatrixModels/${id}`, { method: "PUT", body: JSON.stringify(payload) }, auth),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: qMatrixModelsKey });
      queryClient.invalidateQueries({ queryKey: qMatrixModelKey(variables?.id) });
    },
  });
}

// A status transition is a PUT with only `status` in the body — the
// router refuses any content key alongside it on a locked record, so
// keeping this separate from useUpdateQMatrixModel makes the two
// operations distinguishable at the call site rather than by inspecting
// the payload.
export function useTransitionQMatrixModel() {
  const { auth } = useAuth() || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) =>
      apiFetch(`/api/qMatrixModels/${id}`, { method: "PUT", body: JSON.stringify({ status }) }, auth),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: qMatrixModelsKey });
      queryClient.invalidateQueries({ queryKey: qMatrixModelKey(variables?.id) });
    },
  });
}

export function useDeleteQMatrixModel() {
  const { auth } = useAuth() || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiFetch(`/api/qMatrixModels/${id}`, { method: "DELETE" }, auth),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qMatrixModelsKey }),
  });
}
