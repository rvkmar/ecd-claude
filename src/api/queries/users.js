// src/api/queries/users.js
//
// React Query hooks for /api/users.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../apiClient";
import { useAuth } from "../../auth/AuthProvider";

export const usersKey = ["users"];
// Scoped key for a role-filtered list (matches the ?role= query param), so
// a "just teachers" view and a "just students" view can be cached
// independently without one invalidating the other's data unnecessarily.
export const usersByRoleKey = (role) => ["users", { role: role || "all" }];

export function useUsers(role, options = {}) {
  const { auth } = useAuth() || {};
  return useQuery({
    queryKey: usersByRoleKey(role),
    queryFn: () =>
      apiFetch(role ? `/api/users?role=${encodeURIComponent(role)}` : "/api/users", {}, auth),
    ...options,
  });
}

export function useCreateUser() {
  const { auth } = useAuth() || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      apiFetch("/api/users", { method: "POST", body: JSON.stringify(payload) }, auth),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKey }),
  });
}

export function useUpdateUser() {
  const { auth } = useAuth() || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ username, payload }) =>
      apiFetch(`/api/users/${encodeURIComponent(username)}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }, auth),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKey }),
  });
}

export function useResetUserPassword() {
  const { auth } = useAuth() || {};
  return useMutation({
    mutationFn: ({ username, newPassword }) =>
      apiFetch(`/api/users/${encodeURIComponent(username)}/reset-password`, {
        method: "POST",
        body: JSON.stringify(newPassword ? { newPassword } : {}),
      }, auth),
  });
}

export function useDeleteUser() {
  const { auth } = useAuth() || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (username) =>
      apiFetch(`/api/users/${encodeURIComponent(username)}`, { method: "DELETE" }, auth),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKey }),
  });
}
