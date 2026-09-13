// D58: the player must show why a session stopped.
//
// D56/D57 already return `{ stopped }` from /next-task. Until this unit the
// player treated any response without a taskId as "No more tasks available",
// so a session that met its accuracy target looked identical to an empty
// form. The exit check is behavioural: the reason is on screen. A static
// assertion on SessionPlayer.jsx pins that data.stopped is actually read —
// ignoring that field is the defect, and rendering tests cannot catch a
// component that never looks at it if the mock also omits taskId.
//
// D59 added the same heading to the session-detail header. The ending
// panel is briefly unmounted while loadNextTask sets loadingTask, so a
// findByText("Measurement target met") can resolve on the header (or on
// a panel that then unmounts) and fail toBeInTheDocument. Wait for
// /next-task, then assert the ending panel by test id.

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
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
  reason: "Every declared Assembly Model target is scored and met (1 of 1) at 1 response(s).",
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
      body = { id: "s-stop", status: "in_progress", taskIds: [], responses: [], stopped: STOPPED };
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
    expect(playerSrc).toMatch(/data-testid="measurement-stop-panel"/);
  });

  it("shows the stop reason rather than 'No more tasks available'", async () => {
    render(
      <MemoryRouter>
        <SessionPlayer sessionId="s-stop" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        global.fetch.mock.calls.some(([url]) => String(url).includes("/next-task"))
      ).toBe(true);
    });

    const panel = await screen.findByTestId("measurement-stop-panel");
    expect(panel).toBeInTheDocument();
    expect(within(panel).getByText("Measurement target met")).toBeInTheDocument();
    expect(within(panel).getByText(STOPPED.reason)).toBeInTheDocument();
    expect(within(panel).getByText(/attrA: master/)).toBeInTheDocument();
    expect(screen.getByTestId("session-detail-stop")).toHaveTextContent("Measurement target met");
    expect(screen.queryByText("No more tasks available.")).toBeNull();
  });
});
