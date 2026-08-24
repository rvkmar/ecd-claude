// src/api/authFetchInterceptor.js
//
// TEMPORARY BRIDGE — read this before deleting or "cleaning up" this file.
//
// As part of the Phase 1 security hardening pass, every backend route now
// requires a valid Bearer token (see server/index.js and the router.use()
// call added to each server/routes/*.js file). Only a handful of frontend
// components ever attached that token to their requests — they went through
// src/api/apiClient.js's apiFetch(), which takes the current `auth` object
// explicitly. The other ~35 components (competency/evidence/task-model/item
// wizards, sessions, questions, reports, policies, etc.) call the native
// fetch() directly with no Authorization header at all.
//
// Turning on server-side auth without addressing that would have instantly
// broken most of the app's screens with 401s. Rewriting every one of those
// call sites to go through a shared client is real, valuable work — it's
// tracked as the "consolidate the data layer" item in the frontend
// architecture audit/roadmap — but it's a large, separate change with its
// own testing surface, not something to bundle silently into an auth-only
// pass.
//
// This file is the stop-gap: it wraps window.fetch once, at app startup, and
// attaches `Authorization: Bearer <token>` (reading the current session from
// the same sessionStorage key AuthProvider uses) to any same-origin request
// to /api/*. Every existing fetch() call site keeps working exactly as
// written; they just stop being silently unauthenticated.
//
// Delete this file (and its import in main.jsx) once every component that
// talks to the API goes through a single real client — at that point this
// becomes redundant rather than useful.

const STORAGE_KEY = "ecd_auth_v1";

export function installAuthFetchInterceptor() {
  if (typeof window === "undefined" || !window.fetch || window.__ecdAuthFetchInstalled) {
    return;
  }
  window.__ecdAuthFetchInstalled = true;

  const nativeFetch = window.fetch.bind(window);

  window.fetch = (input, init = {}) => {
    try {
      const url = typeof input === "string" ? input : input?.url || "";
      if (url.startsWith("/api/")) {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        const token = raw ? JSON.parse(raw)?.token : null;
        if (token && !(init.headers && "Authorization" in init.headers)) {
          init = {
            ...init,
            headers: {
              ...(init.headers || {}),
              Authorization: `Bearer ${token}`,
            },
          };
        }
      }
    } catch {
      // If anything above goes wrong, fall through to the native fetch
      // unmodified rather than breaking the request.
    }
    return nativeFetch(input, init);
  };
}
