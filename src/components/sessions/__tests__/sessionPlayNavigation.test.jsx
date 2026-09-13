// Staff Play used to set window.location to /sessions/:id/player — an
// unrouted path whose catch-all is /login. These tests pin the replacement:
// Play stays inside the role prefix, auth is not cleared, and the legacy
// URL forwards instead of bouncing to login.

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import fs from "fs";
import path from "path";
import { AuthProvider } from "../../../auth/AuthProvider.jsx";
import SessionBuilder from "../SessionBuilder.jsx";
import SessionPlayRedirect from "../SessionPlayRedirect.jsx";

vi.mock("react-hot-toast", () => ({
  default: Object.assign(() => {}, { success: () => {}, error: () => {} }),
}));

vi.mock("../../../api/queries/policies", () => ({
  usePolicies: () => ({ data: [], isLoading: false }),
}));

const STORAGE_KEY = "ecd_auth_v1";

function base64url(obj) {
  const json = JSON.stringify(obj);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fakeJwt(payload) {
  return `${base64url({ alg: "HS256", typ: "JWT" })}.${base64url(payload)}.fakesignature`;
}

function seedTeacherAuth() {
  const token = fakeJwt({
    username: "teach1",
    role: "teacher",
    exp: Math.floor(Date.now() / 1000) + 3600,
  });
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ username: "teach1", role: "teacher", token })
  );
}

function LocationProbe() {
  const loc = useLocation();
  return <div data-testid="location">{loc.pathname}</div>;
}

function jsonOk(body) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

beforeEach(() => {
  sessionStorage.clear();
  const live = [
    {
      id: "s1788",
      studentId: "stu1",
      status: "in_progress",
      taskIds: ["t1"],
      responses: [],
    },
  ];
  global.fetch = vi.fn((url) => {
    const href = String(url);
    if (href.includes("/api/sessions/archived")) return jsonOk([]);
    if (href.includes("/api/sessions")) return jsonOk(live);
    if (href.includes("/api/students")) return jsonOk([{ id: "stu1", name: "Pat" }]);
    if (href.includes("/api/tasks")) return jsonOk([]);
    return jsonOk([]);
  });
});

describe("Staff Play navigation (D50 leftover)", () => {
  it("SessionBuilder no longer hard-navigates to the unprefixed Play URL", () => {
    const src = fs.readFileSync(path.resolve(__dirname, "../SessionBuilder.jsx"), "utf8");
    expect(src).not.toMatch(/window\.location\.href\s*=\s*[`'"]\/sessions\//);
    expect(src).toMatch(/sessionPlayerPath/);
  });

  it("Play opens the teacher player without bouncing to /login or clearing auth", async () => {
    seedTeacherAuth();
    render(
      <MemoryRouter initialEntries={["/teacher"]}>
        <AuthProvider>
          <LocationProbe />
          <Routes>
            <Route path="/login" element={<div>Login page</div>} />
            <Route path="/teacher" element={<SessionBuilder />} />
            <Route
              path="/teacher/sessions/:sessionId/player"
              element={<div>Teacher player loaded</div>}
            />
            <Route path="/sessions/:sessionId/player" element={<SessionPlayRedirect />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("Play")).toBeInTheDocument());
    await userEvent.click(screen.getByText("Play"));

    await waitFor(() => {
      expect(screen.getByText("Teacher player loaded")).toBeInTheDocument();
    });
    expect(screen.queryByText("Login page")).toBeNull();
    expect(screen.getByTestId("location")).toHaveTextContent("/teacher/sessions/s1788/player");
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeTruthy();
  });

  it("the legacy /sessions/:id/player URL forwards to the role player, not login", async () => {
    seedTeacherAuth();
    render(
      <MemoryRouter initialEntries={["/sessions/s1788/player"]}>
        <AuthProvider>
          <LocationProbe />
          <Routes>
            <Route path="/login" element={<div>Login page</div>} />
            <Route
              path="/teacher/sessions/:sessionId/player"
              element={<div>Teacher player loaded</div>}
            />
            <Route path="/sessions/:sessionId/player" element={<SessionPlayRedirect />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Teacher player loaded")).toBeInTheDocument();
    });
    expect(screen.queryByText("Login page")).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeTruthy();
  });
});
