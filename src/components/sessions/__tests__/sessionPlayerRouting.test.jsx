// src/components/sessions/__tests__/sessionPlayerRouting.test.jsx
//
// D50, finding F7. The W10 block gate — "a student, in a browser, answers an
// item" — was blocked not by scoring, delivery or auth, but by NAVIGATION:
// SessionPlayer could not obtain a session id from any route the app defines.
//
// It derived the id from one source: a regex on window.location.pathname for
// `/sessions/(s\d+)/player`. No route produced that shape. `/student/*`
// rendered StudentDashboard for every path with no nested routes at all, the
// Play tab rendered <SessionPlayer /> with no prop, and the component never
// read useParams(). Verified in a running browser before the fix: navigating
// to /student/sessions/<id>/player fell through to the dashboard.
//
// D47 closed the half of F1 that happens AFTER an item is delivered. This is
// the half that happens before it. These tests pin both halves of the fix so
// neither the route shape nor the id derivation can regress silently.

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import fs from "fs";
import path from "path";

vi.mock("react-hot-toast", () => ({
  default: Object.assign(() => {}, { success: () => {}, error: () => {} }),
}));

vi.mock("../../../api/queries/policies", () => ({
  usePolicies: () => ({ data: [], isLoading: false }),
}));

// The component fetches the session on mount; this test is about whether it
// ASKS for one, not about what comes back.
const fetchCalls = [];
beforeEach(() => {
  fetchCalls.length = 0;
  global.fetch = vi.fn((url) => {
    fetchCalls.push(String(url));
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: "s1", tasks: [], responses: [], status: "in_progress" }),
    });
  });
});

import SessionPlayer from "../SessionPlayer.jsx";

const NOT_PROVIDED = /session id not provided/i;

describe("SessionPlayer — obtaining a session id (F7)", () => {
  it("takes the id from the ROUTE, not from a pathname pattern", async () => {
    render(
      <MemoryRouter initialEntries={["/student/sessions/s1788530196992/player"]}>
        <Routes>
          <Route path="/student/sessions/:sessionId/player" element={<SessionPlayer />} />
        </Routes>
      </MemoryRouter>
    );

    // The failure this guards against is silent: the player renders a bland
    // message instead of a session, and nothing errors.
    expect(screen.queryByText(NOT_PROVIDED)).toBeNull();
    expect(
      fetchCalls.some((u) => u.includes("/api/sessions/s1788530196992")),
      `expected the player to request its session; fetches were:\n${fetchCalls.join("\n")}`
    ).toBe(true);
  });

  it("also accepts the review route's param, which had the same defect", async () => {
    render(
      <MemoryRouter initialEntries={["/teacher/sessions/s42/review"]}>
        <Routes>
          <Route path="/teacher/sessions/:sessionId/review" element={<SessionPlayer mode="teacher" />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.queryByText(NOT_PROVIDED)).toBeNull();
    expect(fetchCalls.some((u) => u.includes("/api/sessions/s42"))).toBe(true);
  });

  it("still honours an explicit prop, and still refuses when there is genuinely no id", async () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={["/student"]}>
        <SessionPlayer sessionId="s99" />
      </MemoryRouter>
    );
    expect(fetchCalls.some((u) => u.includes("/api/sessions/s99"))).toBe(true);
    unmount();

    // No prop, no route param: the honest message is correct here.
    render(
      <MemoryRouter initialEntries={["/student/sessions/play"]}>
        <Routes>
          <Route path="/student/sessions/play" element={<SessionPlayer />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(NOT_PROVIDED)).toBeInTheDocument();
  });
});

describe("App routing — a student can be routed to a session (F7)", () => {
  const appSrc = fs.readFileSync(path.resolve(__dirname, "../../../App.jsx"), "utf8");
  const live = appSrc
    .split("\n")
    .filter((l) => !l.trim().startsWith("//") && !l.trim().startsWith("*") && !l.trim().startsWith("{/*"))
    .join("\n");

  it("registers a student route that carries a session id", () => {
    // Static, deliberately: the defect was the ABSENCE of a route, which no
    // amount of rendering the component can detect.
    expect(
      live,
      "no /student route carries a :sessionId — the player cannot be reached with a session"
    ).toMatch(/path="sessions\/:sessionId\/player"/);
  });

  it("does not render StudentDashboard for every /student/* path", () => {
    // The original shape was `path="/student/*" element={<ProtectedRoute...>
    // <StudentDashboard /></ProtectedRoute>}` with no nested <Routes>, which
    // swallowed every deeper URL.
    const block = live.slice(live.indexOf('path="/student/*"'));
    const end = block.indexOf("/>");
    expect(
      block.slice(0, end),
      "/student/* must nest its own <Routes>, or every deeper path renders the dashboard"
    ).toMatch(/<Routes>/);
  });
});
