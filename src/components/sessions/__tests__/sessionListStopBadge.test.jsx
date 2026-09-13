import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SessionList from "../SessionList.jsx";

describe("SessionList — stop badge (D59)", () => {
  it("shows the measurement-stop heading next to status when session.stopped is set", () => {
    render(
      <SessionList
        sessions={[
          {
            id: "s-d59",
            status: "in_progress",
            studentId: "stu1",
            taskIds: [],
            responses: [],
            stopped: {
              rule: "targetsMet",
              assemblyModelId: "am1",
              reason: "Every declared Assembly Model target is scored and met (1 of 1) at 2 response(s).",
            },
          },
        ]}
      />
    );
    expect(screen.getByTestId("session-stop-badge-s-d59")).toHaveTextContent("Measurement target met");
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  it("does not invent a stop badge when the session never stopped", () => {
    render(
      <SessionList
        sessions={[
          {
            id: "s-open",
            status: "in_progress",
            studentId: "stu1",
            taskIds: [],
            responses: [],
          },
        ]}
      />
    );
    expect(screen.queryByTestId("session-stop-badge-s-open")).toBeNull();
  });
});
