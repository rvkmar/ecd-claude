import { describe, it, expect } from "vitest";
import {
  sessionPlayerPath,
  studentIdentityKeys,
  sessionAssignedToStudent,
  attendableSessionsForStudent,
  canPauseSession,
  isAttendableStatus,
} from "../sessionPlay.js";

describe("sessionPlayerPath", () => {
  it("builds a role-prefixed player URL for staff and students", () => {
    expect(sessionPlayerPath("teacher", "s1")).toBe("/teacher/sessions/s1/player");
    expect(sessionPlayerPath("district", "s1")).toBe("/district/sessions/s1/player");
    expect(sessionPlayerPath("student", "s1")).toBe("/student/sessions/s1/player");
  });

  it("refuses the unprefixed /sessions/:id/player shape that used to log staff out", () => {
    expect(sessionPlayerPath("teacher", "s1")).not.toBe("/sessions/s1/player");
    expect(sessionPlayerPath("admin", "s1")).toBeNull();
    expect(sessionPlayerPath("teacher", null)).toBeNull();
  });
});

describe("student session matching", () => {
  const user = { username: "stud1", role: "student" };
  const students = [{ id: "stu99", name: "stud1" }];

  it("links a users.username to a students row with the same name", () => {
    const keys = studentIdentityKeys(user, students);
    expect(keys.has("stud1")).toBe(true);
    expect(keys.has("stu99")).toBe(true);
  });

  it("treats a session assigned to that student row as theirs", () => {
    expect(
      sessionAssignedToStudent({ studentId: "stu99" }, user, students)
    ).toBe(true);
    expect(
      sessionAssignedToStudent({ studentId: "someone-else" }, user, students)
    ).toBe(false);
  });

  it("when anything is assigned to this student, hides other live sessions", () => {
    const sessions = [
      { id: "mine", studentId: "stu99", status: "in_progress" },
      { id: "other", studentId: "stu-other", status: "in_progress" },
    ];
    const mine = attendableSessionsForStudent(sessions, user, students);
    expect(mine.map((s) => s.id)).toEqual(["mine"]);
  });

  it("falls back to every live session when users and students are unlinked", () => {
    const sessions = [
      { id: "live", studentId: "stu-other", status: "in_progress" },
      { id: "done", studentId: "stu-other", status: "completed" },
    ];
    const mine = attendableSessionsForStudent(sessions, user, []);
    expect(mine.map((s) => s.id)).toEqual(["live"]);
  });

  it("treats the legacy hyphenated in-progress spelling as attendable", () => {
    expect(isAttendableStatus("in-progress")).toBe(true);
    expect(canPauseSession({ status: "in-progress" })).toBe(true);
    expect(canPauseSession({ status: "in_progress" })).toBe(true);
    expect(canPauseSession({ status: "in_progress" }, { reviewMode: true })).toBe(false);
    expect(canPauseSession({ status: "paused" })).toBe(false);
  });
});
