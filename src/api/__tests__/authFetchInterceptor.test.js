// src/api/__tests__/authFetchInterceptor.test.js
//
// This is the bridge described in authFetchInterceptor.js's own header
// comment: it exists so turning on server-side auth (Phase 1) didn't
// instantly break every screen that calls fetch() directly instead of
// going through apiClient.js. These tests lock in its behavior so it can
// be safely deleted later (per its own comment) once Phase 2 consolidates
// every call site onto one real client — at which point this whole file
// should be deleted too.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { installAuthFetchInterceptor } from "../authFetchInterceptor.js";

const STORAGE_KEY = "ecd_auth_v1";

describe("installAuthFetchInterceptor", () => {
  let nativeFetchMock;

  beforeEach(() => {
    sessionStorage.clear();
    delete window.__ecdAuthFetchInstalled;
    nativeFetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    window.fetch = nativeFetchMock;
  });

  it("attaches Authorization to /api/* requests when a session token exists", async () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ token: "abc123", username: "teach1", role: "teacher" })
    );
    installAuthFetchInterceptor();

    await window.fetch("/api/sessions");

    expect(nativeFetchMock).toHaveBeenCalledTimes(1);
    const [, init] = nativeFetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer abc123");
  });

  it("does not add a header for a non-/api/ request", async () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token: "abc123" }));
    installAuthFetchInterceptor();

    await window.fetch("/some/other/path");

    const [, init] = nativeFetchMock.mock.calls[0];
    expect(init?.headers?.Authorization).toBeUndefined();
  });

  it("does not add a header when there is no logged-in session", async () => {
    installAuthFetchInterceptor();
    await window.fetch("/api/sessions");
    const [, init] = nativeFetchMock.mock.calls[0];
    expect(init?.headers?.Authorization).toBeUndefined();
  });

  it("does not overwrite a caller-supplied Authorization header", async () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token: "abc123" }));
    installAuthFetchInterceptor();

    await window.fetch("/api/sessions", { headers: { Authorization: "Bearer custom-token" } });

    const [, init] = nativeFetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer custom-token");
  });

  it("falls through to the native fetch unmodified if sessionStorage holds garbage", async () => {
    sessionStorage.setItem(STORAGE_KEY, "{not valid json");
    installAuthFetchInterceptor();

    await expect(window.fetch("/api/sessions")).resolves.toBeDefined();
    expect(nativeFetchMock).toHaveBeenCalledTimes(1);
  });

  it("only wraps fetch once even if install is called twice", () => {
    installAuthFetchInterceptor();
    const wrapped = window.fetch;
    installAuthFetchInterceptor();
    expect(window.fetch).toBe(wrapped);
  });
});
