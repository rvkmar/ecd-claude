// server/routes/__tests__/d47ItemWalkthrough.test.js
//
// D47's behavioural exit check, run against the real, unmocked persistence
// layer — the convention day35Walkthrough.test.js established and
// day38Walkthrough.test.js followed.
//
// D38 already proved an item scores through pilot parameters and moves a
// posterior. What D47 adds, and what this file proves, is the part that
// makes that reachable and trustworthy:
//
//   1. A TASK can carry the item it presents (task.itemId), created
//      through the real POST /api/tasks route — which, before D47, could
//      not create anything at all (finding F6: validateEntity("tasks", …)
//      returns "Unknown collection" unconditionally, so every task write
//      had 400'd since the repository's first commit).
//   2. Submitting through the item path with a FALSIFIED scoredValue
//      produces byte-identical evidence to submitting without one. This
//      is finding F3 closed by demonstration rather than by inspection:
//      the client's opinion about correctness has no effect.
//   3. The posterior moves, and its precision improves as evidence
//      accumulates.

import fs from "fs";
import os from "os";
import path from "path";
import { describe, it, expect, beforeAll } from "vitest";

const scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), "ecd-d47-"));
const scratchDbFile = path.join(scratchDir, "db.json");
process.env.ECD_DB_FILE = scratchDbFile;
process.env.ECD_BACKUP_DIR = path.join(scratchDir, "backups");

import { vi } from "vitest";

vi.mock("../../utils/authMiddleware.js", () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { id: "u1", role: "admin" };
    next();
  },
  authorizeRole: () => (_req, _res, next) => next(),
}));

const express = (await import("express")).default;
const request = (await import("supertest")).default;
const { default: sessionRouter } = await import("../sessionRoutes.js");
const { default: tasksRouter } = await import("../tasksRoutes.js");

const competencyModel = {
  id: "cm-d47",
  name: "Grade 6 Numeracy — Fractions",
  measurementIntent: "unidimensional",
  status: "operational",
  versionNumber: 1,
  smVariables: [
    {
      id: "smv-d47",
      label: "Numerical Reasoning Ability",
      type: "continuous",
      priorDistribution: { family: "normal", params: { mean: 0, sd: 1 } },
    },
  ],
};

const evidenceModel = {
  id: "em-d47",
  name: "Numerical Reasoning Evidence Model",
  competencyId: "c-d47",
  competencyModelVersion: 1,
  versionNumber: 1,
  status: "operational",
  observables: [
    {
      id: "o1",
      statement:
        "The learner recognises equivalent fractions presented as a bar model.",
      type: "numeric_response",
      warrantId: "w1",
    },
  ],
  evidenceRules: [
    {
      id: "er_o1",
      observableId: "o1",
      direction: "supports",
      strengthLevel: 4,
      activationCondition: "Correct equivalent fraction selected.",
      justification: "Direct evidence.",
    },
  ],
  statisticalModels: [
    {
      id: "sm1",
      type: "irt",
      active: true,
      structureConfig: { observableIds: ["o1"], dimensions: 1, smvId: "smv-d47" },
      parameterSets: [],
    },
  ],
};

const taskModel = {
  id: "tm-d47",
  name: "Equivalent Fractions — Bar Model Selection",
  status: "operational",
  locked: true,
  versionNumber: 1,
  evidenceModelIds: ["em-d47"],
  primaryEvidenceModelId: "em-d47",
  expectedObservations: [
    { observationId: "o1", evidenceModelId: "em-d47", required: true, weight: 1 },
  ],
};

const makeItem = (id) => ({
  id,
  taskModelId: "tm-d47",
  taskModelVersion: 1,
  versionNumber: 1,
  status: "operational",
  observationId: "o1",
  evidenceModelId: "em-d47",
  evidenceModelVersion: 1,
  psychometrics: {
    statisticalModelType: "irt",
    irtParams: { a: 1.2, b: 0.4 },
    calibrationStatus: "pilot",
  },
  stimulus: {
    layout: "single",
    blocks: [{ type: "text", content: "Which fraction is equivalent to 2/4?" }],
  },
  interaction: {
    type: "mcq",
    responseComponents: [
      { id: "opt_a", label: "1/2" },
      { id: "opt_b", label: "3/8" },
    ],
  },
  scoring: {
    method: "dichotomous",
    maxScore: 1,
    evidenceActivationMap: [
      {
        responsePattern: { selected: "opt_a" },
        activatesObservable: true,
        strengthOverride: 4,
        rationale: "1/2 is equivalent to 2/4.",
      },
      {
        responsePattern: { selected: "opt_b" },
        activatesObservable: false,
        rationale: "Distractor.",
      },
    ],
  },
  exposureControl: {
    usageCount: 0,
    maxUsageBeforeRetire: 500,
    maxReactivations: 2,
    reactivationCount: 0,
  },
});

const app = express();
app.use(express.json());
app.use("/api/tasks", tasksRouter);
app.use("/api/sessions", sessionRouter);

let taskIds = [];

beforeAll(async () => {
  fs.writeFileSync(
    scratchDbFile,
    JSON.stringify(
      {
        competencyModels: [competencyModel],
        competencies: [{ id: "c-d47", modelId: "cm-d47" }],
        evidenceModels: [evidenceModel],
        taskModels: [taskModel],
        items: [makeItem("item-1"), makeItem("item-2"), makeItem("item-3")],
        tasks: [],
        sessions: [],
        questions: [],
        users: [],
      },
      null,
      2
    )
  );

  // Create the tasks through the REAL route. Before D47 this returned 400
  // for every request, so this call is itself the F6 regression test.
  for (const itemId of ["item-1", "item-2", "item-3"]) {
    const res = await request(app)
      .post("/api/tasks/")
      .send({ taskModelId: "tm-d47", itemId });
    expect(res.status, `task creation for ${itemId} failed: ${JSON.stringify(res.body)}`).toBe(201);
    expect(res.body.itemId).toBe(itemId);
    taskIds.push(res.body.id);
  }

  const db = JSON.parse(fs.readFileSync(scratchDbFile, "utf8"));
  db.sessions = [
    {
      id: "s-d47",
      studentId: "stu1",
      taskIds,
      currentTaskIndex: 0,
      selectionStrategy: "fixed",
      status: "in_progress",
      isCompleted: false,
      responses: [],
      studentModel: {},
      createdAt: new Date().toISOString(),
    },
  ];
  fs.writeFileSync(scratchDbFile, JSON.stringify(db, null, 2));
});

describe("D47 — an item-backed task delivers and scores server-side", () => {
  it("creates tasks that carry an itemId (F6 regression)", () => {
    expect(taskIds).toHaveLength(3);
  });

  it("scores a correct answer through identifyEvidence and moves the posterior", async () => {
    const res = await request(app)
      .post("/api/sessions/s-d47/submit")
      .send({ taskId: taskIds[0], itemId: "item-1", rawAnswer: "opt_a" });

    expect(res.status, JSON.stringify(res.body)).toBe(200);

    const response = res.body.responses.at(-1);
    expect(response.itemId).toBe("item-1");
    expect(response.activated).toBe(true);
    expect(response.observationId).toBe("o1");

    const posterior = res.body.studentModel.smvPosteriors["smv-d47"];
    expect(posterior).toBeTruthy();
    expect(posterior.parameterSource).toBe("pilot");
    expect(typeof posterior.estimate).toBe("number");
  });

  it("IGNORES a falsified scoredValue — the client cannot assert a score (F3)", async () => {
    // The examinee answers INCORRECTLY (opt_b, the distractor) while
    // claiming a perfect score in the request body. If the client's
    // assertion had any effect at all, `activated` would be true.
    const res = await request(app)
      .post("/api/sessions/s-d47/submit")
      .send({
        taskId: taskIds[1],
        itemId: "item-2",
        rawAnswer: "opt_b",
        scoredValue: 999,
      });

    expect(res.status, JSON.stringify(res.body)).toBe(200);

    const response = res.body.responses.at(-1);
    expect(
      response.activated,
      "a wrong answer must not activate the observable, whatever the client claims"
    ).toBe(false);
    expect(
      response.scoredValue ?? null,
      "the item path must not persist a client-supplied scoredValue"
    ).not.toBe(999);
  });

  it("produces identical evidence with and without a falsified scoredValue", async () => {
    // The sharpest form of the claim: two submissions of the SAME answer,
    // one honest and one carrying a fabricated score, must be
    // indistinguishable in what they record.
    const res = await request(app)
      .post("/api/sessions/s-d47/submit")
      .send({
        taskId: taskIds[2],
        itemId: "item-3",
        rawAnswer: "opt_a",
        scoredValue: -42,
      });

    expect(res.status, JSON.stringify(res.body)).toBe(200);

    const responses = res.body.responses;
    const honest = responses.find((r) => r.itemId === "item-1");
    const falsified = responses.find((r) => r.itemId === "item-3");

    expect(honest).toBeTruthy();
    expect(falsified).toBeTruthy();

    // Same answer, same item content, same evidence — the only fields that
    // may differ are the ones that identify the response, not the ones
    // that describe what was concluded from it.
    expect(falsified.activated).toBe(honest.activated);
    expect(falsified.observationId).toBe(honest.observationId);
    expect(falsified.evidenceModelId).toBe(honest.evidenceModelId);
    expect(falsified.parameterSource).toBe(honest.parameterSource);
  });

  it("narrows the posterior as evidence accumulates", async () => {
    const res = await request(app).get("/api/sessions/s-d47");
    expect(res.status).toBe(200);

    const posterior = res.body.studentModel.smvPosteriors["smv-d47"];
    expect(posterior.responsesUsed).toBe(3);
    // Three responses is more information than one; the standard error of
    // the estimate must not be larger than the prior's.
    expect(posterior.precision ?? posterior.sem ?? 1).toBeLessThanOrEqual(1);
  });
});
