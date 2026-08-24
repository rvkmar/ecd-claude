// src/api/queries/taskModels.js
//
// React Query hooks for /api/taskModels.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../apiClient";
import { useAuth } from "../../auth/AuthProvider";

export const taskModelsKey = ["taskModels"];
export const taskModelKey = (id) => ["taskModels", id];
export const taskModelDependentsKey = (id) => ["taskModels", id, "dependents"];

export function useTaskModels(options = {}) {
  const { auth } = useAuth() || {};
  return useQuery({
    queryKey: taskModelsKey,
    queryFn: () => apiFetch("/api/taskModels", {}, auth),
    ...options,
  });
}

export function useTaskModel(taskModelId, options = {}) {
  const { auth } = useAuth() || {};
  return useQuery({
    queryKey: taskModelKey(taskModelId),
    queryFn: () => apiFetch(`/api/taskModels/${taskModelId}`, {}, auth),
    enabled: !!taskModelId,
    ...options,
  });
}

export function useCreateTaskModel() {
  const { auth } = useAuth() || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      apiFetch("/api/taskModels", { method: "POST", body: JSON.stringify(payload) }, auth),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskModelsKey }),
  });
}

export function useUpdateTaskModel() {
  const { auth } = useAuth() || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) =>
      apiFetch(`/api/taskModels/${id}`, { method: "PUT", body: JSON.stringify(payload) }, auth),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: taskModelsKey });
      queryClient.invalidateQueries({ queryKey: taskModelKey(id) });
    },
  });
}

export function useConfirmTaskModel() {
  const { auth } = useAuth() || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiFetch(`/api/taskModels/${id}/confirm`, { method: "POST" }, auth),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: taskModelsKey });
      queryClient.invalidateQueries({ queryKey: taskModelKey(id) });
    },
  });
}

export function useCloneTaskModel() {
  const { auth } = useAuth() || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiFetch(`/api/taskModels/${id}/clone`, { method: "POST" }, auth),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskModelsKey }),
  });
}

export function useDeleteTaskModel() {
  const { auth } = useAuth() || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiFetch(`/api/taskModels/${id}`, { method: "DELETE" }, auth),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskModelsKey }),
  });
}

/* What deactivating this Task Model would affect — live sessions above
   all. Read by the Force Deactivate dialog so it can state the cost
   before the user commits rather than after. `enabled` is off by default:
   this is only worth fetching when the dialog opens. */
export function useTaskModelDependents(taskModelId, options = {}) {
  const { auth } = useAuth() || {};
  return useQuery({
    queryKey: taskModelDependentsKey(taskModelId),
    queryFn: () => apiFetch(`/api/taskModels/${taskModelId}/dependents`, {}, auth),
    enabled: !!taskModelId,
    ...options,
  });
}

/* Closes every live session depending on this Task Model, then
   deactivates it — one server-side transaction, so the sessions can never
   be closed by a call that then fails to deactivate.

   Sessions are invalidated too: this mutation ends other people's
   sessions, and any open session list is now stale. */
export function useForceDeactivateTaskModel() {
  const { auth } = useAuth() || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) =>
      apiFetch(
        `/api/taskModels/${id}/force-deactivate`,
        { method: "POST", body: JSON.stringify({ reason }) },
        auth
      ),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: taskModelsKey });
      queryClient.invalidateQueries({ queryKey: taskModelKey(id) });
      queryClient.invalidateQueries({ queryKey: taskModelDependentsKey(id) });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}
