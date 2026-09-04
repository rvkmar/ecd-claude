// server/routes/__tests__/d47ItemDelivery.test.js
//
// D47. The cutover that makes the measurement core reachable, and the
// tests that pin down what "server-authoritative" actually means here.
//
// The finding this closes (F3) turned out to be more precise than the
// plan stated, and the distinction matters:
//
//   - The ITEM path never reads the client's `scoredValue`. It builds a
//     work product from `rawAnswer` alone and calls identifyEvidence().
//     That was designed correctly on D28 and is asserted below so it
//     cannot regress.
//   - The LEGACY path stores `scoredValue` verbatim from the request
//     body. THAT is where F3 actually lives. It is asserted below too —
//     not because it is acceptable, but because a known vulnerability
//     that is pinned by a test is one that cannot be forgotten, and the
//     assertion will fail loudly the day someone retires that path.

import { describe, it, expect, beforeEach, vi } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../config/jwt.js";

const tokenFor = (role) =>
  jwt.sign({ username: `${role}1`, role }, JWT_SECRET, { expiresIn: "1h" });

const dbState = { current: {} };
vi.mock("../../../src/utils/db-server.js", () => ({
  loadDB: () => dbState.current,
  saveDB: (next) => {
    dbState.current = next;
  },
}));

async function appFor(mountPath, importer) {
  const { default: router } = await importer();
  const app = express();
  app.use(express.json());
  app.use(mountPath, router);
  return app;
}

const tasksApp = () => appFor("/api/tasks", () => import("../tasksRoutes.js"));

const TASK_MODEL = {
  id: "tm1",
  name: "Fractions",
  status: "operational",
  locked: true,
  versionNumber: 1,
  evidenceModelIds: ["em1"],
  expectedObservations: [{ observationId: "obs1", evidenceModelId: "em1" }],
};

const ITEM = {
  id: "item1",
  taskModelId: "tm1",
  observationId: "obs1",
  evidenceModelId: "em1",
  status: "confirmed",
  stimulus: { layout: "single", blocks: [{ type: "text", content: "2/4 = ?" }] },
  interaction: {
    type: "mcq",
    responseComponents: [
      { id: "opt_a", label: "1/2" },
      { id: "opt_b", label: "3/8" },
    ],
  },
};

beforeEach(() => {
  dbState.current = {
    tasks: [],
    items: [structuredClone(ITEM)],
    taskModels: [structuredClone(TASK_MODEL)],
    evidenceModels: [],
    sessions: [],
    questions: [],
  };
});

describe("a task can name the item it presents (D47)", () => {
  it("accepts a valid itemId and stores it as a pointer", async () => {
    const app = await tasksApp();
    const res = await request(app)
      .post("/api/tasks/")
      .set("Authorization", `Bearer ${tokenFor("teacher")}`)
      .send({ taskModelId: "tm1", itemId: "item1" });

    expect(res.status).toBe(201);
    expect(res.body.itemId).toBe("item1");
    expect(res.body.questionId).toBeNull();
  });

  it("refuses a task naming BOTH a questionId and an itemId", async () => {
    // Ambiguity on the delivery path is the quiet failure this cutover
    // exists to remove: the player and the scorer could disagree about
    // which record was answered.
    const app = await tasksApp();
    const res = await request(app)
      .post("/api/tasks/")
      .set("Authorization", `Bearer ${tokenFor("teacher")}`)
      .send({ taskModelId: "tm1", itemId: "item1", questionId: "q1" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not both/i);
  });

  it("refuses an itemId that does not exist", async () => {
    const app = await tasksApp();
    const res = await request(app)
      .post("/api/tasks/")
      .set("Authorization", `Bearer ${tokenFor("teacher")}`)
      .send({ taskModelId: "tm1", itemId: "nope" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid itemId/);
  });

  it("refuses an item belonging to a DIFFERENT task model", async () => {
    // Day 30's adversarial-review finding, enforced at authoring time so
    // a task cannot be created that the delivery path would later refuse:
    // otherwise an item's evidence is attributed to the wrong Task Model
    // instance with no error at all.
    dbState.current.items.push({ ...structuredClone(ITEM), id: "item2", taskModelId: "tm-other" });
    const app = await tasksApp();
    const res = await request(app)
      .post("/api/tasks/")
      .set("Authorization", `Bearer ${tokenFor("teacher")}`)
      .send({ taskModelId: "tm1", itemId: "item2" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/belongs to Task Model/);
  });

  it.each(["suspended", "archived"])(
    "refuses an item that is '%s' (deliberately pulled from service)",
    async (status) => {
      dbState.current.items[0].status = status;
      const app = await tasksApp();
      const res = await request(app)
        .post("/api/tasks/")
        .set("Authorization", `Bearer ${tokenFor("teacher")}`)
        .send({ taskModelId: "tm1", itemId: "item1" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/cannot be delivered/);
    }
  );

  it("still allows a draft item — preview/test delivery, per D29", async () => {
    dbState.current.items[0].status = "draft";
    const app = await tasksApp();
    const res = await request(app)
      .post("/api/tasks/")
      .set("Authorization", `Bearer ${tokenFor("teacher")}`)
      .send({ taskModelId: "tm1", itemId: "item1" });
    expect(res.status).toBe(201);
  });

  it("applies the same rules on PUT, against the MERGED record", async () => {
    const app = await tasksApp();
    const created = await request(app)
      .post("/api/tasks/")
      .set("Authorization", `Bearer ${tokenFor("teacher")}`)
      .send({ taskModelId: "tm1", itemId: "item1" });
    expect(created.status).toBe(201);

    // Adding a questionId to a task that already has an itemId must be
    // refused — the ambiguity check has to see the merged record, not
    // just the payload.
    const res = await request(app)
      .put(`/api/tasks/${created.body.id}`)
      .set("Authorization", `Bearer ${tokenFor("teacher")}`)
      .send({ questionId: "q1" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not both/i);
  });

  it("leaves a legacy question-only task working exactly as before", async () => {
    const app = await tasksApp();
    const res = await request(app)
      .post("/api/tasks/")
      .set("Authorization", `Bearer ${tokenFor("teacher")}`)
      .send({ taskModelId: "tm1", questionId: "q1" });

    expect(res.status).toBe(201);
    expect(res.body.questionId).toBe("q1");
    expect(res.body.itemId).toBeNull();
  });
});

describe("F3 — where client-asserted scoring actually lives", () => {
  it("the ITEM path in sessionRoutes never reads scoredValue from the body", async () => {
    // A static assertion rather than a live submit, because standing up a
    // full scoreable session here would duplicate sessionWalkthrough's
    // fixtures. The claim under test is narrow and structural: within the
    // item branch, `scoredValue` is not consulted. If someone later
    // "helpfully" honours the client's value there, this fails.
    const fs = await import("fs");
    const path = await import("path");
    const src = fs.readFileSync(
      path.resolve(__dirname, "../sessionRoutes.js"),
      "utf8"
    );

    const start = src.indexOf("if (ITEM_DELIVERY_ENABLED && itemId)");
    expect(start, "item branch not found in sessionRoutes.js").toBeGreaterThan(-1);

    // The item branch ends where the legacy response record is built.
    const end = src.indexOf("questionId: questionId || null", start);
    expect(end).toBeGreaterThan(start);

    const itemBranch = src.slice(start, end);
    const codeLines = itemBranch
      .split("\n")
      .filter((l) => !l.trim().startsWith("//") && !l.trim().startsWith("*"));

    expect(
      codeLines.join("\n"),
      "the item delivery path must derive its value from identifyEvidence(), never from a client-supplied scoredValue"
    ).not.toMatch(/scoredValue/);
    expect(codeLines.join("\n")).toMatch(/identifyEvidence\(/);
  });

  it("the LEGACY path still stores the client's scoredValue verbatim — pinned, not endorsed", async () => {
    // This is F3, stated exactly. It is asserted so that the day the
    // legacy path is retired or hardened, this test fails and forces the
    // finding to be closed deliberately rather than drifting shut.
    const fs = await import("fs");
    const path = await import("path");
    const src = fs.readFileSync(
      path.resolve(__dirname, "../sessionRoutes.js"),
      "utf8"
    );
    expect(src).toMatch(/scoredValue:\s*scoredValue !== undefined \? scoredValue : null/);
  });
});
