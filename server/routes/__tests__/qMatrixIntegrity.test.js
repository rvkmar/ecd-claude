// server/routes/__tests__/qMatrixIntegrity.test.js
//
// D52 completion: the two Q-matrix referential-integrity guards, and the
// readiness-mirror agreement the UI change specification requires of
// every new surface.
//
// Spec §0.5: "The readiness mirror must agree with the strict validator.
// A UI that shows a green tick the server will reject is artefact 6 of
// the seven-artefact contract failing. A test asserts they agree."
// Spec §6.3 repeats it as a condition of a surface being done at all.
//
// The precedent this file follows is taskModelStructure.test.js's
// "is rejected server-side at confirmation but tolerated while drafting":
// ONE fixture, BOTH implementations, one assertion that they land in the
// same place. The mirror is not shared code -- deliberately. Two
// independent implementations plus a test proving they do not drift is
// what this codebase already does, and it is stronger than a shared
// helper, which can only prove the two callers agree with themselves.

import { describe, it, expect, beforeEach, vi } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";

import { JWT_SECRET } from "../../config/jwt.js";
import { validateQMatrixModelLifecycle } from "../../utils/lifecycleValidation.js";
import { computeQMatrixValidity } from "../../../src/components/qMatrix/QMatrixValidity.js";

const adminToken = jwt.sign({ username: "admin1", role: "admin" }, JWT_SECRET, {
  expiresIn: "1h",
});

const dbState = { current: {} };
vi.mock("../../../src/utils/db-server.js", () => ({
  loadDB: () => dbState.current,
  saveDB: (next) => {
    dbState.current = next;
  },
}));

async function app() {
  const { default: router } = await import("../qMatrixModelsRoutes.js");
  const a = express();
  a.use(express.json());
  a.use("/api/qMatrixModels", router);
  return a;
}

/* A world in which one diagnostic Evidence Model binds one Q-matrix, and
   two confirmed items are delivered under that Evidence Model. Every
   fixture below is a variation on this one shape. */
function makeWorld({ entries, itemStatuses = ["confirmed", "confirmed"], bindQMatrix = true } = {}) {
  return {
    qMatrixModels: [
      {
        id: "qm1",
        name: "Fractions",
        competencyModelId: "cm1",
        attributeIds: ["attr_a", "attr_b"],
        entries,
        status: "confirmed",
        locked: true,
      },
    ],
    competencyModels: [
      {
        id: "cm1",
        name: "CM One",
        status: "operational",
        versionNumber: 1,
        smVariables: [
          { id: "attr_a", type: "binary" },
          { id: "attr_b", type: "binary" },
        ],
      },
    ],
    evidenceModels: [
      {
        id: "em1",
        name: "EM One",
        statisticalModels: [
          {
            id: "sm1",
            type: "dina",
            active: true,
            // The pointer lives NESTED. Anything reading `sm.qMatrixId`
            // flat sees nothing at all -- which is precisely the defect
            // the delete guard carried.
            structureConfig: bindQMatrix ? { qMatrixId: "qm1" } : {},
          },
        ],
      },
    ],
    items: [
      { id: "it1", evidenceModelId: "em1", status: itemStatuses[0] },
      { id: "it2", evidenceModelId: "em1", status: itemStatuses[1] },
    ],
  };
}

const BOTH_PLACED = [
  { itemId: "it1", attributeId: "attr_a" },
  { itemId: "it2", attributeId: "attr_b" },
];

// it2 is delivered by the bound model but the matrix never places it.
const ONE_UNPLACED = [{ itemId: "it1", attributeId: "attr_a" }];

beforeEach(() => {
  dbState.current = makeWorld({ entries: BOTH_PLACED });
});

describe("DELETE guard: a Q-matrix bound by a diagnostic model", () => {
  // This guard read `sm.qMatrixId` (flat) while schema.js and
  // attributeAccumulation.js both write and read
  // `sm.structureConfig.qMatrixId` (nested). It therefore matched
  // nothing, ever: `blocking` was always [], and a Q-matrix underwriting
  // a live DINA model deleted cleanly. No test had ever watched it fail.
  it("refuses deletion while an evidence model points at it (409)", async () => {
    dbState.current = makeWorld({ entries: BOTH_PLACED });
    dbState.current.qMatrixModels[0].locked = false; // isolate THIS guard

    const res = await request(await app())
      .delete("/api/qMatrixModels/qm1")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/referenced by one or more evidence models/i);
    expect(res.body.details).toContain("EM One");
  });

  it("still deletes an unbound, unlocked Q-matrix", async () => {
    // The guard has to admit as well as refuse, or it is just a wall.
    dbState.current = makeWorld({ entries: BOTH_PLACED, bindQMatrix: false });
    dbState.current.qMatrixModels[0].locked = false;

    const res = await request(await app())
      .delete("/api/qMatrixModels/qm1")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(dbState.current.qMatrixModels).toHaveLength(0);
  });

  it("is not fooled by the flat pointer shape it used to read", async () => {
    // A mutation guard. If someone "simplifies" the lookup back to
    // sm.qMatrixId, the nested fixture above stops matching and the
    // refusal test fails. This asserts the converse: a record carrying
    // ONLY the flat key is not a real binding and must not block.
    dbState.current = makeWorld({ entries: BOTH_PLACED, bindQMatrix: false });
    dbState.current.qMatrixModels[0].locked = false;
    dbState.current.evidenceModels[0].statisticalModels[0].qMatrixId = "qm1";

    const res = await request(await app())
      .delete("/api/qMatrixModels/qm1")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});

describe("DELETE guard: a confirmed Q-matrix is not destroyable", () => {
  // itemsRoutes.js already refuses to delete a locked item, because "the
  // responses it collected still have to be interpretable." A Q-matrix
  // is the structure of the Measurement Model itself, so the same
  // reasoning binds harder: delete it and every attribute-mastery
  // posterior ever stored against it loses its meaning.
  it("refuses deletion of a locked (confirmed) Q-matrix (409)", async () => {
    dbState.current = makeWorld({ entries: BOTH_PLACED, bindQMatrix: false });

    const res = await request(await app())
      .delete("/api/qMatrixModels/qm1")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/cannot be deleted/i);
    expect(res.body.error).toMatch(/archive/i);
    expect(dbState.current.qMatrixModels).toHaveLength(1);
  });
});

describe("server-side strict rule: no item a bound model will score is left unplaced", () => {
  it("accepts a matrix that places every deliverable item it will score", () => {
    const db = makeWorld({ entries: BOTH_PLACED });
    expect(validateQMatrixModelLifecycle(db.qMatrixModels[0], db)).toEqual([]);
  });

  it("refuses confirmation when a bound model's item has no row", () => {
    const db = makeWorld({ entries: ONE_UNPLACED });
    const errors = validateQMatrixModelLifecycle(db.qMatrixModels[0], db);

    expect(errors.some((e) => /does not place/.test(e))).toBe(true);
    expect(errors.some((e) => /it2/.test(e))).toBe(true);
  });

  it("ignores draft items, which may still be abandoned or re-pointed", () => {
    const db = makeWorld({ entries: ONE_UNPLACED, itemStatuses: ["confirmed", "draft"] });
    expect(validateQMatrixModelLifecycle(db.qMatrixModels[0], db)).toEqual([]);
  });

  it("is vacuous while no evidence model binds the matrix", () => {
    // Correct, not a hole: nothing scores against it, so nothing can be
    // missing from it. It is also what keeps the editor usable before
    // D53 builds the panel that creates the binding.
    const db = makeWorld({ entries: ONE_UNPLACED, bindQMatrix: false });
    expect(validateQMatrixModelLifecycle(db.qMatrixModels[0], db)).toEqual([]);
  });

  it("does not fire against a draft or reviewed matrix", () => {
    // Still being authored: the rows are exactly what the author is in
    // the middle of deciding, so gating here would block the work rather
    // than the mistake. The stored record has to be draft too, or the
    // validator's own (correct) transition check fires first on
    // confirmed -> draft and masks what this test is asking about.
    const db = makeWorld({ entries: ONE_UNPLACED });
    db.qMatrixModels[0] = { ...db.qMatrixModels[0], status: "draft", locked: false };

    expect(validateQMatrixModelLifecycle(db.qMatrixModels[0], db)).toEqual([]);

    const reviewed = { ...db.qMatrixModels[0], status: "reviewed" };
    expect(validateQMatrixModelLifecycle(reviewed, db)).toEqual([]);
  });
});

describe("readiness mirror agrees with the strict validator", () => {
  /* The correspondence being asserted.
     -------------------------------------------------------------------
     The client rule (QMatrixValidity.js rule 1) runs over the rows the
     editor is showing. The server rule runs over the items a bound
     diagnostic model will actually score. Those are the SAME set when
     the editor is showing the right rows -- which is exactly what the
     editor should show once a binding exists -- so feeding the server's
     derived set to the client validator is the honest way to put the two
     verdicts side by side.

     Each case asserts one thing: blocking on the client iff blocking on
     the server. If either implementation drifts, this fails. */
  const cases = [
    { name: "every scored item placed", entries: BOTH_PLACED, expectBlocking: false },
    { name: "one scored item left unplaced", entries: ONE_UNPLACED, expectBlocking: true },
  ];

  it.each(cases)("$name", ({ entries, expectBlocking }) => {
    const db = makeWorld({ entries });
    const qMatrix = db.qMatrixModels[0];

    // The items the bound diagnostic model will score -- the server's own
    // scope, handed to the client validator as its grid rows.
    const scoredItems = db.items.filter(
      (it) => it.evidenceModelId === "em1" && it.status === "confirmed"
    );

    const clientBlocks =
      computeQMatrixValidity({
        attributeIds: qMatrix.attributeIds,
        includedItems: scoredItems,
        entries: qMatrix.entries,
      }).errors.length > 0;

    const serverBlocks = validateQMatrixModelLifecycle(qMatrix, db).length > 0;

    expect(clientBlocks).toBe(expectBlocking);
    expect(serverBlocks).toBe(expectBlocking);
    expect(clientBlocks).toBe(serverBlocks);
  });

  it("both name the same offending item", () => {
    const db = makeWorld({ entries: ONE_UNPLACED });
    const qMatrix = db.qMatrixModels[0];
    const scoredItems = db.items.filter((it) => it.status === "confirmed");

    const clientError = computeQMatrixValidity({
      attributeIds: qMatrix.attributeIds,
      includedItems: scoredItems,
      entries: qMatrix.entries,
    }).errors.find((e) => e.code === "empty-row");

    const serverError = validateQMatrixModelLifecycle(qMatrix, db).find((e) =>
      /does not place/.test(e)
    );

    // Agreeing that something is wrong is not enough for a reviewer
    // acting on it -- they have to agree on WHICH row.
    expect(clientError.itemId).toBe("it2");
    expect(serverError).toMatch(/it2/);
  });

  it("advisory-only rules never reach the server gate", () => {
    // D52's severity split is load-bearing: duplicate rows,
    // identifiability and low coverage are ADVISORY, so a matrix
    // carrying all three must still confirm. If a future change promotes
    // one to blocking on the client, this test records that the server
    // deliberately does not follow.
    const db = makeWorld({
      entries: [
        { itemId: "it1", attributeId: "attr_a" },
        { itemId: "it2", attributeId: "attr_a" }, // duplicate row + attr_b uncovered
      ],
    });
    const qMatrix = db.qMatrixModels[0];
    const scoredItems = db.items.filter((it) => it.status === "confirmed");

    const validity = computeQMatrixValidity({
      attributeIds: qMatrix.attributeIds,
      includedItems: scoredItems,
      entries: qMatrix.entries,
    });

    expect(validity.advisories.length).toBeGreaterThan(0);
    expect(validity.errors).toEqual([]);
    expect(validateQMatrixModelLifecycle(qMatrix, db)).toEqual([]);
  });
});
