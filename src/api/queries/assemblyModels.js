// src/api/queries/assemblyModels.js
//
// React Query hooks for /api/assemblyModels — the test specification:
// per-SMV accuracy targets (requiredSEM for continuous SMVs,
// requiredClassificationAccuracy for binary ones), stopping rules, and
// a validated pointer into `policies` naming the selection algorithm.
// Consumed by the Assembly Model wizard (D54) and, once D56/D58 exist,
// by Activity Selection and the session orchestrator.
//
// NOTE: requiredClassificationAccuracy is stored and served faithfully
// but is not yet EVALUATED anywhere — no decision rule turns a
// diagnostic posterior into a discrete mastery classification until
// D57. The authoring UI is required to say so rather than implying the
// target is enforced.
//
// Follows the established pattern: a key helper, hooks reading `auth`
// from useAuth(), and every call through apiFetch — never a bare fetch.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../apiClient";
import { useAuth } from "../../auth/AuthProvider";

export const assemblyModelsKey = ["assemblyModels"];
export const assemblyModelKey = (id) => ["assemblyModels", id];

export function useAssemblyModels(competencyModelId, options = {}) {
  const { auth } = useAuth() || {};
  const qs = competencyModelId
    ? `?competencyModelId=${encodeURIComponent(competencyModelId)}`
    : "";
  return useQuery({
    queryKey: competencyModelId
      ? [...assemblyModelsKey, { competencyModelId }]
      : assemblyModelsKey,
    queryFn: () => apiFetch(`/api/assemblyModels${qs}`, {}, auth),
    ...options,
  });
}

export function useAssemblyModel(id, options = {}) {
  const { auth } = useAuth() || {};
  return useQuery({
    queryKey: assemblyModelKey(id),
    queryFn: () => apiFetch(`/api/assemblyModels/${id}`, {}, auth),
    enabled: Boolean(id),
    ...options,
  });
}

export function useCreateAssemblyModel() {
  const { auth } = useAuth() || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      apiFetch("/api/assemblyModels", { method: "POST", body: JSON.stringify(payload) }, auth),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assemblyModelsKey }),
  });
}

export function useUpdateAssemblyModel() {
  const { auth } = useAuth() || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) =>
      apiFetch(`/api/assemblyModels/${id}`, { method: "PUT", body: JSON.stringify(payload) }, auth),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: assemblyModelsKey });
      queryClient.invalidateQueries({ queryKey: assemblyModelKey(variables?.id) });
    },
  });
}

// A status transition is a PUT with only `status` in the body — the
// router refuses any content key alongside it on a locked record, so
// keeping this separate from useUpdateAssemblyModel makes the two
// operations distinguishable at the call site rather than by inspecting
// the payload.
export function useTransitionAssemblyModel() {
  const { auth } = useAuth() || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) =>
      apiFetch(`/api/assemblyModels/${id}`, { method: "PUT", body: JSON.stringify({ status }) }, auth),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: assemblyModelsKey });
      queryClient.invalidateQueries({ queryKey: assemblyModelKey(variables?.id) });
    },
  });
}

export function useDeleteAssemblyModel() {
  const { auth } = useAuth() || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiFetch(`/api/assemblyModels/${id}`, { method: "DELETE" }, auth),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assemblyModelsKey }),
  });
}
