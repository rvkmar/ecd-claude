// server/routes/__tests__/bulkDraftChain.test.js
//
// Pins the ONE relaxation the bulk importers get: `allowDraftParents`.
//
// Settings > Data > Upload lands a whole authored ECD chain from JSON in
// one sitting. Before this, it couldn't: a Task Model row was refused
// unless every evidence model it cited was already confirmed + locked, and
// an Item row unless its Task Model was. That forced a Lock & Confirm pass
// in the middle of an import -- an irreversible action, taken before the
// author has seen the imported records.
//
// So the bulk paths (and ONLY the bulk paths) pass allowDraftParents, which
// defers the confirmed+locked requirement to confirmation. What these tests
// hold in place is the boundary:
//
//   - bulk accepts a draft parent
//   - the single-create routes the wizards use still do NOT
//   - referential integrity is untouched either way (a dangling id, an
//     observation the Task Model never declared)
//
// If someone later "simplifies" allowDraftParents into an unconditional
// relaxation, the two single-create cases here fail.
//
// loadDB/saveDB and the auth middleware are mocked. loadDB returns the SAME
// object every call, so a record created by one request is visible to the
// next -- which is the whole point when the chain spans three requests.

import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

vi.mock("../../utils/authMiddleware.js", () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { id: "u1", username: "admin1", role: "admin" };
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
}));

import { loadDB } from "../../../src/utils/db-server.js";
import evidenceModelsRouter from "../evidenceModels.js";
import taskModelsRouter from "../taskModelsRoutes.js";
import itemsRouter from "../itemsRoutes.js";

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/evidenceModels", evidenceModelsRouter);
  app.use("/api/taskModels", taskModelsRouter);
  app.use("/api/items", itemsRouter);
  return app;
}

// A complete, valid draft evidence model: one warrant, one observable, one
// evidence rule for it, one active statistical model. Deliberately minimal
// -- these tests are about the lifecycle gate, not evidence completeness.
function evidenceModelPayload() {
  return {
    name: "Numerical Reasoning EM",
    competencyId: "c1",
    claimStatement:
      "The student can reason about numerical relationships across representations.",
    warrants: [
      {
        id: "w1",
        reasoningStatement:
          "Correct multi-step arithmetic indicates fluent numerical reasoning.",
        cognitiveAttribute: "arithmetic_operation_sequencing",
        performanceCondition: "Multi-step word problems without a calculator.",
        limitationClause: "Does not cover estimation under time pressure.",
      },
    ],
    observables: [
      {
        id: "o1",
        statement: "Selects the correct result of a multi-step computation.",
        type: "product",
        warrantId: "w1",
      },
    ],
    evidenceRules: [
      {
        id: "er1",
        observableId: "o1",
        direction: "supports",
        strengthLevel: 4,
        activationCondition: "Response matches the keyed value.",
        justification: "A correct result under these conditions supports the warrant.",
      },
    ],
    statisticalModels: [
      {
        id: "sm1",
        type: "IRT",
        subtype: "2PL",
        active: true,
        config: {},
      },
    ],
  };
}

let db;

beforeEach(() => {
  db = {
    users: [],
    items: [],
    evidenceModels: [],
    taskModels: [],
    competencyModels: [
      { id: "cm1", name: "CM", status: "draft", locked: false, versionNumber: 1 },
    ],
    competencies: [
      { id: "c1", modelId: "cm1", name: "Numerical Reasoning", variableType: "continuous" },
    ],
    tasks: [],
    sessions: [],
    students: [],
    questions: [],
  };
  loadDB.mockReturnValue(db);
});

describe("bulk import of a whole draft chain", () => {
  // Uploads the evidence model and returns its id + the observable id the
  // Task Model and Item downstream both key on.
  async function uploadEvidenceModel(app) {
    const res = await request(app)
      .post("/api/evidenceModels/bulk")
      .send([evidenceModelPayload()]);

    expect(res.body.created).toBe(1);
    const stored = db.evidenceModels[0];
    // The premise of every test below: what bulk creates is a DRAFT.
    expect(stored.status).toBe("draft");
    expect(stored.locked).toBeFalsy();
    return { emId: stored.id, obsId: stored.observables[0].id };
  }

  function taskModelPayload(emId, obsId) {
    return {
      name: "TM bound to a draft EM",
      evidenceModelIds: [emId],
      primaryEvidenceModelId: emId,
      expectedObservations: [
        { observationId: obsId, evidenceModelId: emId, weight: 1, required: true },
      ],
    };
  }

  it("creates a task model against a still-draft evidence model", async () => {
    const app = makeApp();
    const { emId, obsId } = await uploadEvidenceModel(app);

    const res = await request(app)
      .post("/api/taskModels/bulk")
      .send([taskModelPayload(emId, obsId)]);

    expect(res.body.failed).toBe(0);
    expect(res.body.created).toBe(1);
    expect(db.taskModels[0].status).toBe("draft");
    expect(db.taskModels[0].locked).toBeFalsy();
  });

  it("creates an item against a still-draft task model, deriving its evidence model", async () => {
    const app = makeApp();
    const { emId, obsId } = await uploadEvidenceModel(app);
    await request(app).post("/api/taskModels/bulk").send([taskModelPayload(emId, obsId)]);
    const tmId = db.taskModels[0].id;

    const res = await request(app)
      .post("/api/items/bulk")
      .send([{ taskModelId: tmId, observationId: obsId }]);

    expect(res.body.failed).toBe(0);
    expect(res.body.created).toBe(1);
    expect(db.items[0].status).toBe("draft");
    // Derived server-side from the Task Model's primary binding, never read
    // from the payload -- a draft parent must not break that derivation.
    expect(db.items[0].evidenceModelId).toBe(emId);
  });

  describe("the single-create routes the wizards use are unchanged", () => {
    it("POST /api/taskModels still refuses a draft evidence model", async () => {
      const app = makeApp();
      const { emId, obsId } = await uploadEvidenceModel(app);

      const res = await request(app)
        .post("/api/taskModels")
        .send(taskModelPayload(emId, obsId));

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain("must be confirmed");
      expect(db.taskModels).toHaveLength(0);
    });

    it("POST /api/items still refuses a draft task model", async () => {
      const app = makeApp();
      const { emId, obsId } = await uploadEvidenceModel(app);
      await request(app).post("/api/taskModels/bulk").send([taskModelPayload(emId, obsId)]);

      const res = await request(app)
        .post("/api/items")
        .send({ taskModelId: db.taskModels[0].id, observationId: obsId });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain("items may only instantiate");
      expect(db.items).toHaveLength(0);
    });
  });

  describe("referential integrity is not relaxed", () => {
    it("rejects a task model row citing an evidence model that does not exist", async () => {
      const app = makeApp();

      const res = await request(app)
        .post("/api/taskModels/bulk")
        .send([{ name: "TM", evidenceModelIds: ["nope"], primaryEvidenceModelId: "nope" }]);

      expect(res.body.created).toBe(0);
      expect(JSON.stringify(res.body.results[0])).toContain("Invalid evidenceModelId");
    });

    it("rejects an item row whose observation the task model never declared", async () => {
      const app = makeApp();
      const { emId, obsId } = await uploadEvidenceModel(app);
      await request(app).post("/api/taskModels/bulk").send([taskModelPayload(emId, obsId)]);

      const res = await request(app)
        .post("/api/items/bulk")
        .send([{ taskModelId: db.taskModels[0].id, observationId: "not-declared" }]);

      expect(res.body.created).toBe(0);
      expect(JSON.stringify(res.body.results[0])).toContain("not declared");
    });

    it("rejects an item row citing a task model that does not exist", async () => {
      const app = makeApp();

      const res = await request(app).post("/api/items/bulk").send([{ taskModelId: "nope" }]);

      expect(res.body.created).toBe(0);
      expect(JSON.stringify(res.body.results[0])).toContain("Invalid taskModelId");
    });
  });
});
