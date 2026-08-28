// src/utils/__tests__/qMatrixAndDina.test.js
//
// Day 18 (Week 4, core schema): the new `qMatrixModels` collection, plus
// `dina`/`gdina` as statistical model types on `evidenceModels`. Structural
// + referential-integrity validation only -- no Q-matrix editor, no DINA
// config panel (both are explicit W10 deliverables). Exit check: a G-DINA
// model validates against a Q-matrix, and refuses a continuous SMV.

import { describe, it, expect } from "vitest";
import { validateEntity } from "../schema.js";

const competencyModel = {
  id: "cm1",
  name: "Fraction Diagnostics",
  measurementIntent: "multidimensional",
  versionNumber: 1,
  status: "confirmed",
  locked: true,
  smVariables: [
    {
      id: "attr-equivalence",
      label: "Attribute: Fraction Equivalence",
      type: "binary",
      scale: { states: ["non-mastery", "mastery"] },
      priorDistribution: { family: "bernoulli", params: { p: 0.5 } },
    },
    {
      id: "attr-simplification",
      label: "Attribute: Simplification",
      type: "binary",
      scale: { states: ["non-mastery", "mastery"] },
      priorDistribution: { family: "beta", params: { alpha: 2, beta: 2 } },
    },
    {
      id: "smv-theta",
      label: "Numerical Reasoning Ability",
      type: "continuous",
      scale: { min: -4, max: 4 },
      priorDistribution: { family: "normal", params: { mean: 0, sd: 1 } },
    },
  ],
};

function makeQMatrix(overrides = {}) {
  return {
    id: "qm1",
    name: "Fraction Diagnostics Q-matrix",
    competencyModelId: "cm1",
    competencyModelVersion: 1,
    attributeIds: ["attr-equivalence", "attr-simplification"],
    entries: [
      { itemId: "i1", attributeId: "attr-equivalence", required: true },
      { itemId: "i1", attributeId: "attr-simplification", required: false },
      { itemId: "i2", attributeId: "attr-simplification", required: true },
    ],
    status: "draft",
    ...overrides,
  };
}

function makeDb(overrides = {}) {
  return {
    competencyModels: [competencyModel],
    items: [{ id: "i1" }, { id: "i2" }],
    qMatrixModels: [],
    policies: [],
    ...overrides,
  };
}

function qMatrixErrors(model, db = makeDb()) {
  const { errors } = validateEntity("qMatrixModels", model, db);
  return errors || [];
}

describe("qMatrixModels — passing fixture", () => {
  it("accepts a well-formed Q-matrix over two binary attributes", () => {
    expect(qMatrixErrors(makeQMatrix())).toEqual([]);
  });
});

describe("qMatrixModels — deliberate mutations", () => {
  it("refuses a continuous SMV as an attribute", () => {
    const mutated = makeQMatrix({ attributeIds: ["attr-equivalence", "smv-theta"] });
    const errors = qMatrixErrors(mutated);
    expect(errors.join(" ")).toMatch(/Q-matrix attributes must be binary/);
  });

  it("rejects an attributeId that does not exist on the competency model", () => {
    const mutated = makeQMatrix({ attributeIds: ["attr-equivalence", "attr-does-not-exist"] });
    const errors = qMatrixErrors(mutated);
    expect(errors.join(" ")).toMatch(/does not exist on competency model/);
  });

  it("rejects duplicate attributeIds", () => {
    const mutated = makeQMatrix({ attributeIds: ["attr-equivalence", "attr-equivalence"] });
    const errors = qMatrixErrors(mutated);
    expect(errors.join(" ")).toMatch(/Duplicate attributeIds entry/);
  });

  it("rejects an entry referencing an undeclared attributeId", () => {
    const mutated = makeQMatrix({
      entries: [{ itemId: "i1", attributeId: "attr-not-declared" }],
    });
    const errors = qMatrixErrors(mutated);
    expect(errors.join(" ")).toMatch(/not declared in attributeIds/);
  });

  it("rejects an entry referencing an unknown itemId", () => {
    const mutated = makeQMatrix({
      entries: [{ itemId: "i-does-not-exist", attributeId: "attr-equivalence" }],
    });
    const errors = qMatrixErrors(mutated);
    expect(errors.join(" ")).toMatch(/references unknown itemId/);
  });

  it("rejects a duplicate (itemId, attributeId) entry pair", () => {
    const mutated = makeQMatrix({
      entries: [
        { itemId: "i1", attributeId: "attr-equivalence" },
        { itemId: "i1", attributeId: "attr-equivalence" },
      ],
    });
    const errors = qMatrixErrors(mutated);
    expect(errors.join(" ")).toMatch(/duplicates the \(itemId, attributeId\) pair/);
  });

  it("rejects a dangling competencyModelId", () => {
    const mutated = makeQMatrix({ competencyModelId: "cm-does-not-exist" });
    const errors = qMatrixErrors(mutated);
    expect(errors.join(" ")).toMatch(/Invalid competencyModelId/);
  });

  it("requires a name", () => {
    const mutated = makeQMatrix({ name: undefined });
    const errors = qMatrixErrors(mutated);
    expect(errors.join(" ")).toMatch(/Q-matrix name is required/);
  });

  // Day 21: lifecycle wiring added `locked`, mirroring competencyModels/
  // assemblyModels' own "confirmed must be locked" rule.
  it("requires a confirmed Q-matrix to be locked", () => {
    const mutated = makeQMatrix({ status: "confirmed", locked: false });
    const errors = qMatrixErrors(mutated);
    expect(errors.join(" ")).toMatch(/Confirmed Q-matrix models must be locked/);
  });
});

describe("evidenceModels.statisticalModels — dina/gdina structural checks", () => {
  const dinaDb = () => ({
    competencyModels: [competencyModel],
    qMatrixModels: [makeQMatrix()],
    competencies: [{ id: "c-mastery", modelId: "cm1", variableType: "binary" }],
  });

  function draftEvidenceModel(overrides = {}) {
    return {
      id: "em1",
      competencyId: "c-mastery",
      statisticalModels: [
        {
          id: "sm1",
          type: "gdina",
          active: true,
          structureConfig: { qMatrixId: "qm1" },
        },
      ],
      ...overrides,
    };
  }

  function evidenceErrors(model, db, options = { strict: false }) {
    const { errors } = validateEntity("evidenceModels", model, db, options);
    return errors || [];
  }

  it("a G-DINA model validates cleanly against a well-formed Q-matrix", () => {
    expect(evidenceErrors(draftEvidenceModel(), dinaDb())).toEqual([]);
  });

  it("a G-DINA model refuses a Q-matrix that references a continuous SMV", () => {
    const badQMatrix = makeQMatrix({ id: "qm-bad", attributeIds: ["attr-equivalence", "smv-theta"] });
    const db = { ...dinaDb(), qMatrixModels: [badQMatrix] };
    const model = draftEvidenceModel({
      statisticalModels: [
        { id: "sm1", type: "gdina", active: true, structureConfig: { qMatrixId: "qm-bad" } },
      ],
    });
    const errors = evidenceErrors(model, db);
    expect(errors.join(" ")).toMatch(/DINA\/G-DINA models require every Q-matrix attribute to be a binary Student Model Variable/);
  });

  it("requires structureConfig.qMatrixId under strict validation", () => {
    const model = draftEvidenceModel({
      statisticalModels: [{ id: "sm1", type: "dina", active: true, structureConfig: {} }],
    });
    const errors = evidenceErrors(model, dinaDb(), { strict: true });
    expect(errors.join(" ")).toMatch(/requires structureConfig\.qMatrixId/);
  });

  it("rejects a dangling qMatrixId", () => {
    const model = draftEvidenceModel({
      statisticalModels: [
        { id: "sm1", type: "dina", active: true, structureConfig: { qMatrixId: "qm-does-not-exist" } },
      ],
    });
    const errors = evidenceErrors(model, dinaDb());
    expect(errors.join(" ")).toMatch(/references unknown qMatrixId/);
  });
});

describe("evidenceModels — confirmed-status compatibility for gdina", () => {
  // Exercises the two OTHER checks touched today (variable-type compatibility
  // and decision-rule/statistical-model coherence), both gated on
  // `status === "confirmed"` rather than `strict` -- {strict:false} skips the
  // unrelated warrant/observable completeness gates so only those two are on.
  function confirmedGdinaModel(overrides = {}) {
    return {
      id: "em1",
      competencyId: "c-mastery",
      competencyModelVersion: 1,
      status: "confirmed",
      observables: [{ id: "o1", evidenceRule: { direction: "supports" } }],
      statisticalModels: [
        {
          id: "sm1",
          type: "gdina",
          active: true,
          structureConfig: { qMatrixId: "qm1" },
          parameterSets: [{
            parameterSetId: "ps1",
            parameters: {},
            packageVersion: "CDM-8.2",
            converged: true,
            sampleSize: 600,
            calibratedAt: new Date().toISOString(),
          }],
          activeParameterSetId: "ps1",
        },
      ],
      decisionRule: {
        type: "mastery",
        threshold: 0.75,
        direction: "above",
        justification: "Cut derived from the 2026 calibration study establishing mastery classification accuracy.",
      },
      ...overrides,
    };
  }

  const db = () => ({
    competencyModels: [competencyModel],
    qMatrixModels: [makeQMatrix()],
    competencies: [{ id: "c-mastery", modelId: "cm1", variableType: "binary" }],
  });

  it("a fully-specified confirmed gdina evidence model on a binary competency validates cleanly", () => {
    const { errors } = validateEntity("evidenceModels", confirmedGdinaModel(), db(), { strict: false });
    expect(errors).toEqual([]);
  });

  it("rejects a gdina mastery decision with a threshold outside a posterior probability", () => {
    const model = confirmedGdinaModel({ decisionRule: { ...confirmedGdinaModel().decisionRule, threshold: 1.5 } });
    const { errors } = validateEntity("evidenceModels", model, db(), { strict: false });
    expect(errors.join(" ")).toMatch(/DINA\/G-DINA mastery decision must use posterior probability between 0 and 1/);
  });
});
