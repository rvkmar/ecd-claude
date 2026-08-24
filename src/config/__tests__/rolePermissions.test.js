// src/config/__tests__/rolePermissions.test.js
//
// Pure unit tests for can(role, action, entity). The `student` role was
// entirely missing before the Phase 1 fix — can("student", ...) fell
// through to the `if (!r) return false` branch for every check, silently
// denying by omission rather than by design. This file locks in that it
// now exists with the intended (narrow, view-only) permissions.

import { describe, it, expect } from "vitest";
import { can, rolePermissions } from "../rolePermissions.js";

describe("student role", () => {
  it("exists", () => {
    expect(rolePermissions.student).toBeDefined();
  });

  it("can view sessions and reports", () => {
    expect(can("student", "view", "sessions")).toBe(true);
    expect(can("student", "view", "reports")).toBe(true);
  });

  it("cannot view authoring entities", () => {
    expect(can("student", "view", "questions")).toBe(false);
    expect(can("student", "view", "competencyModels")).toBe(false);
  });

  it("cannot edit, create, delete, or approve anything", () => {
    expect(can("student", "edit", "sessions")).toBe(false);
    expect(can("student", "create", "sessions")).toBe(false);
    expect(can("student", "delete", "sessions")).toBe(false);
    expect(can("student", "approve", "questions")).toBe(false);
  });
});

describe("existing roles are unaffected by the student addition", () => {
  it("admin can still edit/delete/approve questions", () => {
    expect(can("admin", "edit", "questions")).toBe(true);
    expect(can("admin", "delete", "questions")).toBe(true);
    expect(can("admin", "approve", "questions")).toBe(true);
  });

  it("teacher can create/edit sessions and tasks but not delete them", () => {
    expect(can("teacher", "create", "sessions")).toBe(true);
    expect(can("teacher", "edit", "tasks")).toBe(true);
    expect(can("teacher", "delete", "tasks")).toBe(false);
  });

  it("district can approve questions and edit tasks/taskModels", () => {
    expect(can("district", "approve", "questions")).toBe(true);
    expect(can("district", "edit", "taskModels")).toBe(true);
  });
});

describe("unknown input", () => {
  it("returns false for a role that doesn't exist", () => {
    expect(can("superuser", "view", "sessions")).toBe(false);
  });

  it("returns false for a null/undefined role", () => {
    expect(can(null, "view", "sessions")).toBe(false);
    expect(can(undefined, "view", "sessions")).toBe(false);
  });

  it("returns false for an unrecognized action", () => {
    expect(can("admin", "teleport", "sessions")).toBe(false);
  });
});
