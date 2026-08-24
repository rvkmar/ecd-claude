// src/api/queries/questions.js
//
// React Query hooks for /api/questions.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../apiClient";
import { useAuth } from "../../auth/AuthProvider";

export const questionsKey = ["questions"];
export const questionKey = (id) => ["questions", id];

export function useQuestions(options = {}) {
  const { auth } = useAuth() || {};
  return useQuery({
    queryKey: questionsKey,
    queryFn: () => apiFetch("/api/questions", {}, auth),
    ...options,
  });
}

export function useQuestion(questionId, options = {}) {
  const { auth } = useAuth() || {};
  return useQuery({
    queryKey: questionKey(questionId),
    queryFn: () => apiFetch(`/api/questions/${questionId}`, {}, auth),
    enabled: !!questionId,
    ...options,
  });
}

export function useCreateQuestion() {
  const { auth } = useAuth() || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      apiFetch("/api/questions", { method: "POST", body: JSON.stringify(payload) }, auth),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: questionsKey }),
  });
}

export function useUpdateQuestion() {
  const { auth } = useAuth() || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) =>
      apiFetch(`/api/questions/${id}`, { method: "PUT", body: JSON.stringify(payload) }, auth),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: questionsKey });
      queryClient.invalidateQueries({ queryKey: questionKey(id) });
    },
  });
}

export function useDeleteQuestion() {
  const { auth } = useAuth() || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiFetch(`/api/questions/${id}`, { method: "DELETE" }, auth),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: questionsKey }),
  });
}

export function useQuestionLifecycle() {
  const { auth } = useAuth() || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, userId, role }) =>
      apiFetch(
        `/api/questions/${id}/lifecycle`,
        { method: "PATCH", body: JSON.stringify({ action, userId, role }) },
        auth
      ),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: questionsKey });
      queryClient.invalidateQueries({ queryKey: questionKey(id) });
    },
  });
}

export function useSyncQuestionIrt() {
  const { auth } = useAuth() || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiFetch(`/api/questions/${id}/sync-irt`, { method: "POST" }, auth),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: questionKey(id) });
    },
  });
}
