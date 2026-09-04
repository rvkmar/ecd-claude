// server/routes/__tests__/d49ActivationWiring.test.js
//
// D49a. Finding F4 said buildCompositeLibrary() "has no caller". This is the
// caller, and these are the tests that say what it must do.
//
// The claim under test is not "a record appears". It is that a Task Model
// cannot become `operational` while its delivery package is absent, empty or
// stale-by-construction — because an operational Task Model with no usable
// package is live, selectable and silently undeliverable, which is the exact
// quiet failure the cadence contract exists to prevent.

import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

vi.mock("../../utils/authMiddleware.js", () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { id: "u1", role: "admin" };
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

import { loadDB, saveDB } from "../../../src/utils/db-server.js";
import taskModelsRouter from "../taskModelsRoutes.js";

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/taskModels", taskModelsRouter);
  return app;
}

// Fixtures deliberately mirror taskModelLifecycle.test.js's, so a change to
// what activation requires breaks both files rather than letting this one
// drift into testing a shape the real route no longer accepts.
const makeEvidenceModel = (o = {}) => ({
  id: "em1",
  name: "EM One",
  status: "operational",
  locked: true,
  versionNumber: 1,
  competencyId: "c1",
  observables: [
    {
      id: "o1",
      statement: "Solves",
      evidenceRule: { id: "er1", observableId: "o1", direction: "supports", strengthLevel: 4 },
    },
  ],
  ...o,
});

const makeTaskModel = (o = {}) => ({
  id: "tm1",
  name: "Multi-step equation",
  description: "Solve and justify.",
  status: "confirmed",
  locked: true,
  versionNumber: 1,
  evidenceModelIds: ["em1"],
  primaryEvidenceModelId: "em1",
  expectedObservations: [
    { observationId: "o1", evidenceModelId: "em1", required: true, weight: 3 },
  ],
  taskStructure: {
    presentationMode: "interactive",
    responseFormat: "selected",
    stimulusPolicy: "static",
  },
  blueprintConstraints: { difficultyRange: { min: 0, max: 1 }, exposurePolicy: {} },
  taskCompositionType: "atomic",
  subTaskIds: [],
  actions: ["select"],
  accessibilityAssumptions: { languageLoad: "below target grade band" },
  equivalenceGroupId: "grp-1",
  ...o,
});

const makeItem = (o = {}) => ({
  id: "it1",
  taskModelId: "tm1",
  taskModelVersion: 1,
  evidenceModelId: "em1",
  evidenceModelVersion: 1,
  observationId: "o1",
  status: "confirmed",
  locked: true,
  stimulus: { layout: "single", blocks: [{ type: "text", content: "2x+1=7" }] },
  interaction: { type: "mcq", responseComponents: [{ id: "a", label: "3" }] },
  scoring: {
    method: "dichotomous",
    maxScore: 1,
    evidenceActivationMap: [{ responsePattern: { selected: "a" }, activatesObservable: true }],
  },
  psychometrics: {
    statisticalModelType: "irt",
    irtParams: { a: 1.1, b: 0.2 },
    calibrationStatus: "pilot",
  },
  ...o,
});

function seed(taskModel, items = [makeItem()], compositeLibrary = []) {
  const db = {
    taskModels: [taskModel],
    evidenceModels: [makeEvidenceModel()],
    items,
    sessions: [],
    tasks: [{ id: "t1", taskModelId: "tm1" }],
    compositeLibrary,
  };
  loadDB.mockReturnValue(db);
  return db;
}

beforeEach(() => vi.clearAllMocks());

describe("D49a — promotion to operational compiles the delivery package (F4)", () => {
  it("produces an ACTIVE package when a Task Model goes operational", async () => {
    const db = seed(makeTaskModel());

    const res = await request(makeApp())
      .put("/api/taskModels/tm1")
      .send({ status: "operational" });

    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.status).toBe("operational");

    expect(db.compositeLibrary).toHaveLength(1);
    const pkg = db.compositeLibrary[0];
    expect(pkg.active).toBe(true);
    expect(pkg.taskModelId).toBe("tm1");
    expect(pkg.taskModelVersion).toBe(1);
    expect(pkg.items.map((i) => i.itemId)).toEqual(["it1"]);
    expect(saveDB).toHaveBeenCalledTimes(1);
  });

  it("bakes in the activation map and the weight, but NEVER a calibrated parameter (ADR 0003)", async () => {
    // The package is a delivery artefact, not a parameter store. If a
    // parameter value is ever copied in here, recalibration stops taking
    // effect and every posterior silently uses a frozen value.
    const db = seed(makeTaskModel());
    await request(makeApp()).put("/api/taskModels/tm1").send({ status: "operational" });

    const entry = db.compositeLibrary[0].items[0];
    expect(entry.scoring.evidenceActivationMap).toHaveLength(1);
    expect(entry.weight).toBe(3);
    expect(entry.evidenceRule).toBeTruthy();

    expect(JSON.stringify(entry)).not.toMatch(/irtParams|"a":1\.1|calibrationStatus/);
  });

  it("reports what the compile skipped rather than swallowing it", async () => {
    // An item whose evidenceModelId does not resolve is still compiled in —
    // the builder degrades — but the author must be told at the moment of
    // activation, not discover it when a session scores nothing.
    const db = seed(makeTaskModel(), [makeItem(), makeItem({ id: "it2", evidenceModelId: "ghost" })]);

    const res = await request(makeApp())
      .put("/api/taskModels/tm1")
      .send({ status: "operational" });

    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.compositeLibrary.itemCount).toBe(2);
    expect(res.body.compositeLibrary.warnings.join(" ")).toMatch(/unknown evidenceModelId 'ghost'/);
    expect(db.compositeLibrary[0].active).toBe(true);
  });

  it("does NOT compile on any other transition", async () => {
    // operational -> suspended is a withdrawal from service. It must not mint
    // a package, and it must not disturb the one already there.
    const db = seed(makeTaskModel({ status: "operational" }), [makeItem()], [
      { id: "cl-old", taskModelId: "tm1", taskModelVersion: 1, active: true, items: [], compiledAt: "x" },
    ]);

    const res = await request(makeApp())
      .put("/api/taskModels/tm1")
      .send({ status: "suspended" });

    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(db.compositeLibrary).toHaveLength(1);
    expect(db.compositeLibrary[0].id).toBe("cl-old");
    expect(res.body.compositeLibrary).toBeUndefined();
  });
});

describe("D49a — reactivation recompiles against the CURRENT item bank", () => {
  it("suspended -> operational builds a fresh package and retires the old one", async () => {
    // The item bank moved while the Task Model was out of service: it1 was
    // archived and it2 was confirmed. Serving the pre-suspension package
    // would deliver an item that is no longer in service.
    const db = seed(
      makeTaskModel({ status: "suspended" }),
      [makeItem({ status: "archived" }), makeItem({ id: "it2" })],
      [
        {
          id: "cl-old",
          taskModelId: "tm1",
          taskModelVersion: 1,
          active: true,
          items: [{ itemId: "it1" }],
          compiledAt: "2026-01-01T00:00:00.000Z",
        },
      ]
    );

    const res = await request(makeApp())
      .put("/api/taskModels/tm1")
      .send({ status: "operational" });

    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(db.compositeLibrary).toHaveLength(2);

    const old = db.compositeLibrary.find((r) => r.id === "cl-old");
    const fresh = db.compositeLibrary.find((r) => r.id !== "cl-old");

    // Retired, never deleted: a session scored against it must stay explicable.
    expect(old.active).toBe(false);
    expect(fresh.active).toBe(true);
    expect(fresh.items.map((i) => i.itemId)).toEqual(["it2"]);
  });
});

describe("D49a — an operational Task Model is never left without a package", () => {
  // WHAT THIS SECTION LEARNED, recorded because it changes how the guard
  // should be read: the empty-package 409 is UNREACHABLE through promotion.
  //
  // validateTaskModelLifecycle() refuses to activate a Task Model unless at
  // least one item matches (taskModelId, taskModelVersion) with status in
  // confirmed/operational/suspended, and buildCompositeLibrary() selects with
  // exactly that filter. Remove the items and the lifecycle gate answers 400
  // long before the builder is called.
  //
  // So the 409 is a COHERENCE ASSERTION between two modules that
  // independently define "a deliverable item" — dead weight today, and the
  // only thing that would catch them drifting apart tomorrow. It is tested
  // directly below rather than through a route contorted to reach it.

  it("the lifecycle gate refuses first — activation is never even attempted", async () => {
    const db = seed(makeTaskModel(), []);

    const res = await request(makeApp())
      .put("/api/taskModels/tm1")
      .send({ status: "operational" });

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body.details)).toMatch(/no Item instantiates/i);

    // The three things that matter, in order of how badly they would hurt:
    expect(db.taskModels[0].status).toBe("confirmed"); // did not go live
    expect(db.compositeLibrary).toHaveLength(0); // no package minted
    expect(saveDB).not.toHaveBeenCalled(); // nothing persisted at all
  });

  it("compileAndActivate itself refuses an empty compile (the drift assertion)", async () => {
    const { compileAndActivate } = await import("../../compositeLibrary/activation.js");

    // A Task Model that is not instantiable compiles to an empty package —
    // the builder's documented degradation. Activation must refuse it.
    const db = {
      taskModels: [makeTaskModel({ status: "draft", locked: false })],
      evidenceModels: [makeEvidenceModel()],
      items: [makeItem()],
      compositeLibrary: [],
    };

    const result = compileAndActivate(db.taskModels[0], db);

    expect(result.ok).toBe(false);
    expect(result.status).toBe(409);
    expect(result.error).toMatch(/empty composite library package/i);
    expect(db.compositeLibrary).toHaveLength(0);
  });

  it("does not retire the incumbent package when activation fails", async () => {
    // compileAndActivate deactivates the incumbent BEFORE validating, so a
    // failure afterwards leaves a mutated snapshot. That is safe only because
    // no caller saves on failure — if one ever did, a failed rebuild would
    // silently retire a working package. This pins the contract.
    const incumbent = {
      id: "cl-old",
      taskModelId: "tm1",
      taskModelVersion: 1,
      active: true,
      items: [{ itemId: "it1" }],
      compiledAt: "2026-01-01T00:00:00.000Z",
    };
    const db = seed(makeTaskModel(), [], [incumbent]);

    await request(makeApp()).put("/api/taskModels/tm1").send({ status: "operational" });

    expect(saveDB).not.toHaveBeenCalled();
    expect(db.compositeLibrary[0].active).toBe(true);
  });
});

describe("D49a — an Evidence Model version bump does NOT silently recompile", () => {
  it("promotion is the only thing in this router that writes a package", async () => {
    // The decision recorded in the route comment, pinned so it cannot drift
    // into a silent cross-entity side effect. If a future change makes an
    // Evidence Model write recompile another entity's delivery artefact, the
    // staleness advisory (D48) stops being the mechanism and this fails.
    const fs = await import("fs");
    const path = await import("path");
    const src = fs.readFileSync(
      path.resolve(__dirname, "../taskModelsRoutes.js"),
      "utf8"
    );
    const live = src
      .split("\n")
      .filter((l) => !l.trim().startsWith("//") && !l.trim().startsWith("*"))
      .join("\n");

    const calls = live.match(/compileAndActivate\(/g) || [];
    expect(calls).toHaveLength(1);
    expect(live).toMatch(/nextStatus === "operational"[\s\S]{0,120}compileAndActivate\(/);
  });
});
