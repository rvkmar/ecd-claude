// src/utils/__tests__/sessionResponseValidation.test.js
//
// Day 28 (Week 6): schema.js's `collection === "sessions"` response
// provenance checks (evidenceModelId/parameterSetId/version consistency)
// sit right beside an `if (r.itemId) {...}` block for item-version checks,
// but were themselves unscoped -- they ran for EVERY response regardless
// of whether it was item-based, which meant the pre-existing legacy
// db.questions response shape (no evidenceModelId field at all) failed
// this check unconditionally the moment a session went "in_progress".
// Found while wiring the first real caller of the item-based shape
// (sessionRoutes.js /submit) and fixed by scoping the whole block to
// `r.itemId` responses, matching the version checks it already sits beside.

import { describe, it, expect } from "vitest";
import { validateEntity } from "../schema.js";

const evidenceModel = {
  id: "em1",
  versionNumber: 1,
  competencyId: "c1",
  statisticalModels: [
    { id: "sm1", type: "irt", active: true, activeParameterSetId: "ps1" },
  ],
};

const item = { id: "item1", versionNumber: 2, taskModelVersion: 3 };

function makeSession(responses) {
  return {
    id: "s1",
    studentId: "u1",
    taskIds: ["t1"],
    currentTaskIndex: 1,
    responses,
    status: "in_progress",
  };
}

function makeDb(overrides = {}) {
  return { evidenceModels: [evidenceModel], items: [item], ...overrides };
}

function sessionErrors(responses, db = makeDb()) {
  const { errors } = validateEntity("sessions", makeSession(responses), db);
  return errors || [];
}

describe("sessions.responses — provenance checks are scoped to item-based responses", () => {
  it("a legacy response (no itemId, no evidenceModelId) passes cleanly once the session is in_progress", () => {
    const errors = sessionErrors([
      { taskId: "t1", questionId: "q1", rawAnswer: "a", scoredValue: 1, timestamp: "2026-01-01T00:00:00.000Z" },
    ]);
    expect(errors).toEqual([]);
  });

  it("a fully-specified item-based response passes cleanly", () => {
    const errors = sessionErrors([
      {
        taskId: "t1",
        itemId: "item1",
        itemVersion: 2,
        taskModelVersion: 3,
        evidenceModelId: "em1",
        evidenceModelVersion: 1,
        parameterSetId: "ps1",
      },
    ]);
    expect(errors).toEqual([]);
  });

  it("an item-based response missing evidenceModelId is refused", () => {
    const errors = sessionErrors([{ taskId: "t1", itemId: "item1", itemVersion: 2, taskModelVersion: 3 }]);
    expect(errors.join(" ")).toMatch(/Session response missing evidenceModelId/);
  });

  it("an item-based response with a dangling evidenceModelId is refused", () => {
    const errors = sessionErrors([
      { taskId: "t1", itemId: "item1", itemVersion: 2, taskModelVersion: 3, evidenceModelId: "em-ghost" },
    ]);
    expect(errors.join(" ")).toMatch(/Invalid evidenceModelId in session: em-ghost/);
  });

  it("an item-based response with a stale parameterSetId is refused", () => {
    const errors = sessionErrors([
      {
        taskId: "t1",
        itemId: "item1",
        itemVersion: 2,
        taskModelVersion: 3,
        evidenceModelId: "em1",
        evidenceModelVersion: 1,
        parameterSetId: "ps-old",
      },
    ]);
    expect(errors.join(" ")).toMatch(/Session response parameterSetId mismatch/);
  });

  it("an item-based response with a stale itemVersion or taskModelVersion is refused", () => {
    const errors = sessionErrors([
      {
        taskId: "t1",
        itemId: "item1",
        itemVersion: 1, // real item is at version 2
        taskModelVersion: 3,
        evidenceModelId: "em1",
        evidenceModelVersion: 1,
        parameterSetId: "ps1",
      },
    ]);
    expect(errors.join(" ")).toMatch(/Session item version mismatch/);
  });

  it("an item-based response with a stale evidenceModelVersion is refused", () => {
    const errors = sessionErrors([
      {
        taskId: "t1",
        itemId: "item1",
        itemVersion: 2,
        taskModelVersion: 3,
        evidenceModelId: "em1",
        evidenceModelVersion: 99,
        parameterSetId: "ps1",
      },
    ]);
    expect(errors.join(" ")).toMatch(/Session evidenceModelVersion mismatch/);
  });
});
