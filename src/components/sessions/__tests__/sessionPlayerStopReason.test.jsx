// D58: the player must show why a session stopped.
//
// D56/D57 already return `{ stopped }` from /next-task. Until this unit the
// player treated any response without a taskId as "No more tasks available",
// so a session that met its accuracy target looked identical to an empty
// form. The exit check is behavioural: the reason is on screen. A static
// assertion on SessionPlayer.jsx pins that data.stopped is actually read —
// ignoring that field is the defect, and rendering tests cannot catch a
// component that never looks at it if the mock also omits taskId.

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import fs from "fs";
import path from "path";

vi.mock("react-hot-toast", () => ({
  default: Object.assign(() => {}, { success: () => {}, error: () => {} }),
}));

vi.mock("../../../api/queries/policies", () => ({
  usePolicies: () => ({ data: [], isLoading: false }),
}));

const STOPPED = {
  rule: "targetsMet",
  assemblyModelId: "am1",
  reason: "Every reported Assembly Model target is met (1 of 1) at 1 response(s).",
  targets: [
    {
      smvId: "attrA",
      classification: "master",
      expectedClassificationAccuracy: 0.818,
      requiredClassificationAccuracy: 0.8,
      masteryThreshold: 0.5,
    },
  ],
  stoppedAt: "2026-09-13T06:00:00.000Z",
};

beforeEach(() => {
  global.fetch = vi.fn((url) => {
    const href = String(url);
    let body = {};
    if (href.includes("/next-task")) {
      body = { stopped: STOPPED, strategy: "BayesianNetwork" };
    } else if (href.includes("/api/sessions/")) {
      body = { id: "s-stop", status: "in_progress", taskIds: [], responses: [] };
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

describe("SessionPlayer — measurement stop copy (D58)", () => {
  const playerSrc = fs.readFileSync(
    path.resolve(__dirname, "../SessionPlayer.jsx"),
    "utf8"
  );

  it("reads data.stopped from next-task (mutation: deleting that read fails this)", () => {
    expect(playerSrc).toMatch(/data\?\.stopped/);
  });

  it("shows the stop reason rather than 'No more tasks available'", async () => {
    render(
      <MemoryRouter>
        <SessionPlayer sessionId="s-stop" />
      </MemoryRouter>
    );

    expect(
      await screen.findByText("Measurement target met")
    ).toBeInTheDocument();
    expect(screen.getByText(STOPPED.reason)).toBeInTheDocument();
    expect(screen.getByText(/attrA: master/)).toBeInTheDocument();
    expect(screen.queryByText("No more tasks available.")).toBeNull();

    await waitFor(() => {
      expect(
        global.fetch.mock.calls.some(([url]) => String(url).includes("/next-task"))
      ).toBe(true);
    });
  });
});
