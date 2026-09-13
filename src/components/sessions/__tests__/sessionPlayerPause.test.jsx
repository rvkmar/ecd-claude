import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("react-hot-toast", () => ({
  default: Object.assign(() => {}, { success: () => {}, error: () => {} }),
}));

vi.mock("../../../api/queries/policies", () => ({
  usePolicies: () => ({ data: [], isLoading: false }),
}));

beforeEach(() => {
  global.fetch = vi.fn((url) => {
    const href = String(url);
    let body = {};
    if (href.includes("/next-task")) {
      body = { taskId: null };
    } else if (href.includes("/api/sessions/")) {
      body = {
        id: "s-play",
        status: "in_progress",
        taskIds: ["t1"],
        responses: [],
        studentId: "stud1",
      };
    } else {
      body = [];
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(JSON.stringify(body)),
    });
  });
});

import SessionPlayer from "../SessionPlayer.jsx";

describe("SessionPlayer — Pause on an in-progress session", () => {
  it("shows Pause once the playable session has loaded", async () => {
    render(
      <MemoryRouter>
        <SessionPlayer sessionId="s-play" />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText("Pause")).toBeInTheDocument());
  });
});
