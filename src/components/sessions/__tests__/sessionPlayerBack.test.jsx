import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";

vi.mock("react-hot-toast", () => ({
  default: Object.assign(() => {}, { success: () => {}, error: () => {} }),
}));

vi.mock("../../../api/queries/policies", () => ({
  usePolicies: () => ({ data: [], isLoading: false }),
}));

vi.mock("../../../auth/AuthProvider.jsx", () => ({
  useAuth: () => ({ auth: { username: "teach1", role: "teacher", token: "t" } }),
}));

beforeEach(() => {
  global.fetch = vi.fn((url) => {
    const href = String(url);
    let body = {};
    if (href.includes("/next-task")) body = { taskId: null };
    else if (href.includes("/api/sessions/")) {
      body = {
        id: "s-play",
        status: "in_progress",
        taskIds: ["t1"],
        responses: [],
        studentId: "stud1",
      };
    } else body = [];
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(JSON.stringify(body)),
    });
  });
});

import SessionPlayer from "../SessionPlayer.jsx";

function LocationProbe() {
  const loc = useLocation();
  return <div data-testid="location">{loc.pathname}</div>;
}

describe("SessionPlayer Back / Close", () => {
  it("returns to the sessions list without posting /finish", async () => {
    render(
      <MemoryRouter initialEntries={["/teacher/sessions/s-play/player"]}>
        <LocationProbe />
        <Routes>
          <Route path="/teacher" element={<div>Teacher sessions list</div>} />
          <Route path="/teacher/sessions/:sessionId/player" element={<SessionPlayer />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByTestId("session-player-back")).toBeInTheDocument());
    await userEvent.click(screen.getByTestId("session-player-back"));
    expect(screen.getByText("Teacher sessions list")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/teacher");
    expect(
      global.fetch.mock.calls.some(([url, opts]) =>
        String(url).includes("/finish") && (opts?.method || "").toUpperCase() === "POST"
      )
    ).toBe(false);
  });
});
