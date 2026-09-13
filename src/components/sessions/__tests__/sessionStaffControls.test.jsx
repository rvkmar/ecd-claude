import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SessionList from "../SessionList.jsx";

describe("Staff session list Play / Pause / Operate", () => {
  it("shows Play without Pause on a ready session", () => {
    render(
      <SessionList
        sessions={[{ id: "s1", status: "ready", studentId: "stud1", taskIds: [], responses: [] }]}
      />
    );
    expect(screen.getByText("Play")).toBeInTheDocument();
    expect(screen.queryByText("Pause")).toBeNull();
    expect(screen.queryByText("Operate")).toBeNull();
  });

  it("shows Pause and Operate without Play once in progress", () => {
    render(
      <SessionList
        sessions={[{ id: "s1", status: "in_progress", studentId: "stud1", taskIds: [], responses: [] }]}
      />
    );
    expect(screen.getByText("Pause")).toBeInTheDocument();
    expect(screen.getByText("Operate")).toBeInTheDocument();
    expect(screen.queryByText("Play")).toBeNull();
  });

  it("Play and Pause are mutually exclusive and call the persist handlers, not each other", async () => {
    const onPlay = vi.fn();
    const onPause = vi.fn();
    const onOperate = vi.fn();
    const { rerender } = render(
      <SessionList
        sessions={[{ id: "s1", status: "ready", studentId: "stud1", taskIds: [], responses: [] }]}
        onPlay={onPlay}
        onPause={onPause}
        onOperate={onOperate}
      />
    );
    await userEvent.click(screen.getByText("Play"));
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onPause).not.toHaveBeenCalled();
    expect(onOperate).not.toHaveBeenCalled();

    rerender(
      <SessionList
        sessions={[{ id: "s1", status: "in_progress", studentId: "stud1", taskIds: [], responses: [] }]}
        onPlay={onPlay}
        onPause={onPause}
        onOperate={onOperate}
      />
    );
    expect(screen.queryByText("Play")).toBeNull();
    await userEvent.click(screen.getByText("Pause"));
    expect(onPause).toHaveBeenCalledWith("s1");
    expect(onOperate).not.toHaveBeenCalled();
  });

  it("Operate is the only list action that opens the player surface", async () => {
    const onOperate = vi.fn();
    render(
      <SessionList
        sessions={[{ id: "s1", status: "in_progress", studentId: "stud1", taskIds: [], responses: [] }]}
        onOperate={onOperate}
      />
    );
    await userEvent.click(screen.getByText("Operate"));
    expect(onOperate).toHaveBeenCalledWith(expect.objectContaining({ id: "s1" }));
  });
});
