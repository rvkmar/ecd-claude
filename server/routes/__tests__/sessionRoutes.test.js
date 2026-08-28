// server/routes/__tests__/sessionRoutes.test.js
//
// Day 28 (Week 6): wiring Evidence Identification into sessionRoutes.js.
// Exit check: a session scores through an authored Evidence Model for the
// first time in the app's history. Scoped to the new item-based path on
// POST /:id/submit only -- the legacy db.questions path is verified
// UNCHANGED (still reachable, still behaves the same), not re-tested in
// full here (it has no prior test coverage of its own to preserve; this
// file's job is to prove the new path works and the old one is untouched
// by it, not to backfill full legacy coverage).
//
// sessionRoutes.js imports `mathjs` (for `log2`), whose cold import is
// already documented elsewhere in this repo (routeAuth.test.js) as slow
// enough on this memory-constrained sandbox to need a widened timeout.
// Re-importing the router fresh per test (the vi.resetModules() + dynamic
// import pattern evidenceModelLifecycle.test.js uses) pays that cost once
// per test; with 7+ tests that compounds into real flakiness. Only the one
// test that actually needs a fresh env-var read (ITEM_DELIVERY_ENABLED) does
// that; everything else imports the router once, statically, up front.

import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

vi.mock("../../utils/authMiddleware.js", () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { id: "u1", role: "student" };
    next();
  },
  authorizeRole: (roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return res.sendStatus(403);
    next();
  },
}));

vi.mock("../../../src/utils/db-server.js", () => ({
  loadDB: vi.fn(),
  saveDB: vi.fn(),
  finishSession: vi.fn(),
}));

const { loadDB, saveDB } = await import("../../../src/utils/db-server.js");
const { default: router } = await import("../sessionRoutes.js");

// Carries an active, calibrated statisticalModel -- src/utils/schema.js's
// sessions validation (a pre-existing contract, not new today) requires
// every response to reference the parameterSetId that was active when it
// was scored, once the session is live. An Evidence Model authored but
// never calibrated cannot deliver; this fixture represents one that can.
const evidenceModel = {
  id: "em1",
  versionNumber: 1,
  observables: [
    {
      id: "o1",
      type: "selected_response",
      evidenceRule: { direction: "supports", strengthLevel: 4, activationCondition: "any", justification: "x" },
    },
  ],
  statisticalModels: [
    {
      id: "sm1",
      type: "irt",
      active: true,
      structureConfig: {},
      parameterSets: [{
        parameterSetId: "ps1",
        parameters: { o1: { a: 1, b: 0 } },
        packageVersion: "pilot-1",
        converged: true,
        sampleSize: 1,
        calibratedAt: "2026-01-01T00:00:00.000Z",
      }],
      activeParameterSetId: "ps1",
    },
  ],
};

const item = {
  id: "item1",
  versionNumber: 1,
  taskModelVersion: 1,
  observationId: "o1",
  evidenceModelId: "em1",
  scoring: {
    method: "dichotomous",
    evidenceActivationMap: [
      { responsePattern: { selected: "opt_a" }, activatesObservable: true, strengthOverride: 4, rationale: "Correct." },
      { responsePattern: { selected: ["opt_b", "opt_c"] }, activatesObservable: false, rationale: "Distractor." },
    ],
  },
};

function makeSession(overrides = {}) {
  return {
    id: "s1",
    studentId: "u1",
    taskIds: ["t1"],
    currentTaskIndex: 0,
    responses: [],
    studentModel: {},
    selectionStrategy: "fixed",
    status: "in_progress",
    isCompleted: false,
    ...overrides,
  };
}

function makeTask(overrides = {}) {
  return {
    id: "t1",
    taskModelId: "tm1",
    generatedObservationIds: [],
    generatedEvidenceIds: [],
    ...overrides,
  };
}

function makeDb(overrides = {}) {
  return {
    sessions: [makeSession()],
    tasks: [makeTask()],
    taskModels: [{ id: "tm1", evidenceModelIds: ["em1"] }],
    evidenceModels: [evidenceModel],
    items: [item],
    ...overrides,
  };
}

function buildApp(db) {
  loadDB.mockReturnValue(db);
  saveDB.mockImplementation(() => {});
  const app = express();
  app.use(express.json());
  app.use("/api/sessions", router);
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /:id/submit — item-based delivery (Day 28)", () => {
  it("scores through the authored Evidence Model: an activating response produces an Observable Variable value, not a score", async () => {
    const db = makeDb();
    const app = buildApp(db);

    const res = await request(app)
      .post("/api/sessions/s1/submit")
      .send({ taskId: "t1", itemId: "item1", rawAnswer: "opt_a" });

    expect(res.status).toBe(200);
    const response = res.body.responses[0];
    expect(response).toMatchObject({
      taskId: "t1",
      itemId: "item1",
      evidenceModelId: "em1",
      evidenceModelVersion: 1,
      parameterSetId: "ps1",
      observationId: "o1",
      observableId: "o1",
      activated: true,
      direction: "supports",
      strength: 4,
      rationale: "Correct.",
    });
    expect(response).not.toHaveProperty("scoredValue");
    expect(response).not.toHaveProperty("score");
  });

  it("records a non-activating response correctly", async () => {
    const db = makeDb();
    const app = buildApp(db);

    const res = await request(app)
      .post("/api/sessions/s1/submit")
      .send({ taskId: "t1", itemId: "item1", rawAnswer: "opt_b" });

    expect(res.status).toBe(200);
    expect(res.body.responses[0].activated).toBe(false);
  });

  it("advances currentTaskIndex and records the observationId on the task instance", async () => {
    const db = makeDb();
    const app = buildApp(db);

    await request(app).post("/api/sessions/s1/submit").send({ taskId: "t1", itemId: "item1", rawAnswer: "opt_a" });

    expect(db.sessions[0].currentTaskIndex).toBe(1);
    expect(db.tasks[0].generatedObservationIds).toContain("o1");
    expect(saveDB).toHaveBeenCalled();
  });

  it("rejects an unknown itemId with 400, without touching the legacy path", async () => {
    const db = makeDb();
    const app = buildApp(db);

    const res = await request(app)
      .post("/api/sessions/s1/submit")
      .send({ taskId: "t1", itemId: "item-does-not-exist", rawAnswer: "opt_a" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid itemId/);
  });

  it("refuses to score against an Evidence Model with no active calibrated parameter set yet", async () => {
    const uncalibratedEvidenceModel = { ...evidenceModel, statisticalModels: [] };
    const db = makeDb({ evidenceModels: [uncalibratedEvidenceModel] });
    const app = buildApp(db);

    const res = await request(app)
      .post("/api/sessions/s1/submit")
      .send({ taskId: "t1", itemId: "item1", rawAnswer: "opt_a" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/has no active calibrated parameter set yet/);
  });

  it("accepts a structured work product object as rawAnswer, passed through as-is", async () => {
    const db = makeDb();
    const app = buildApp(db);

    const res = await request(app)
      .post("/api/sessions/s1/submit")
      .send({ taskId: "t1", itemId: "item1", rawAnswer: { selected: "opt_a" } });

    expect(res.status).toBe(200);
    expect(res.body.responses[0].activated).toBe(true);
  });

  it("still processes a legacy questionId request identically (the old path is untouched)", async () => {
    const db = makeDb({
      evidenceModels: [{ id: "em1", observations: [], evidences: [] }],
    });
    const app = buildApp(db);

    const res = await request(app)
      .post("/api/sessions/s1/submit")
      .send({ taskId: "t1", questionId: "q1", rawAnswer: "opt_a", scoredValue: 1 });

    expect(res.status).toBe(200);
    const response = res.body.responses[0];
    expect(response.questionId).toBe("q1");
    expect(response.scoredValue).toBe(1);
    expect(response).not.toHaveProperty("activated");
  });
});

describe("POST /:id/submit — ITEM_DELIVERY_ENABLED rollback flag", () => {
  it(
    "falls back to the legacy path when ITEM_DELIVERY_ENABLED=false, even if itemId is sent",
    async () => {
      vi.resetModules();
      process.env.ITEM_DELIVERY_ENABLED = "false";
      try {
        const { loadDB: freshLoadDB, saveDB: freshSaveDB } = await import("../../../src/utils/db-server.js");
        const { default: freshRouter } = await import("../sessionRoutes.js");

        const db = makeDb();
        freshLoadDB.mockReturnValue(db);
        freshSaveDB.mockImplementation(() => {});
        const app = express();
        app.use(express.json());
        app.use("/api/sessions", freshRouter);

        const res = await request(app)
          .post("/api/sessions/s1/submit")
          .send({ taskId: "t1", itemId: "item1", rawAnswer: "opt_a" });

        // The legacy path has no `db.items` awareness at all, so it just
        // records whatever was sent verbatim -- proving the flag genuinely
        // routes around the new code, not just relabels it.
        expect(res.status).toBe(200);
        const response = res.body.responses[0];
        expect(response).not.toHaveProperty("observableId");
        expect(response).not.toHaveProperty("activated");
        expect(response.rawAnswer).toBe("opt_a");
      } finally {
        delete process.env.ITEM_DELIVERY_ENABLED;
      }
    },
    20000
  );
});
