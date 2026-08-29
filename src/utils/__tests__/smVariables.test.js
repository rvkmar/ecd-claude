// src/utils/__tests__/smVariables.test.js
//
// Day 16 (Week 4, core schema): competencyModels.smVariables[] and
// psychologicalPerspective. Declared and validated only — no wizard step
// authors these yet, so both fields are optional at every status; these
// tests cover the SHAPE validation that runs whenever entries ARE present.
//
// Exit check: validation passes a continuous fixture, passes a
// binary-vector fixture (the DINA case — a vector of binary SMVs), and
// fails six deliberate mutations, one per independent rule.

import { describe, it, expect } from "vitest";
import { validateEntity } from "../schema.js";

function makeModel(overrides = {}) {
  return {
    id: "cm1",
    name: "Numerical Reasoning Framework",
    description: "Framework for numerical reasoning competencies.",
    measurementIntent: "unidimensional",
    versionNumber: 1,
    status: "draft",
    locked: false,
    ...overrides,
  };
}

function smvErrors(model) {
  const { errors } = validateEntity("competencyModels", model, {});
  return errors || [];
}

const continuousFixture = [
  {
    id: "smv1",
    label: "Numerical Reasoning Ability",
    type: "continuous",
    scale: { min: -4, max: 4 },
    priorDistribution: { family: "normal", params: { mean: 0, sd: 1 } },
  },
];

const binaryVectorFixture = [
  {
    id: "smv1",
    label: "Attribute: Fraction Equivalence",
    type: "binary",
    scale: { states: ["non-mastery", "mastery"] },
    priorDistribution: { family: "bernoulli", params: { p: 0.5 } },
  },
  {
    id: "smv2",
    label: "Attribute: Common Denominators",
    type: "binary",
    scale: { states: ["non-mastery", "mastery"] },
    priorDistribution: { family: "beta", params: { alpha: 2, beta: 2 } },
  },
  {
    id: "smv3",
    label: "Attribute: Simplification",
    type: "binary",
    scale: { states: ["non-mastery", "mastery"] },
    priorDistribution: { family: "bernoulli", params: { p: 0.3 } },
  },
];

describe("competencyModels.smVariables — passing fixtures", () => {
  it("accepts a continuous fixture", () => {
    expect(smvErrors(makeModel({ smVariables: continuousFixture }))).toEqual([]);
  });

  it("accepts a binary-vector fixture (the DINA case)", () => {
    expect(smvErrors(makeModel({ smVariables: binaryVectorFixture }))).toEqual([]);
  });

  it("is optional — a model with no smVariables at all is still valid", () => {
    expect(smvErrors(makeModel())).toEqual([]);
  });

  it("does not require smVariables to promote to confirmed", () => {
    const errors = smvErrors(makeModel({ status: "confirmed", locked: true }));
    expect(errors).toEqual([]);
  });
});

describe("competencyModels.smVariables — six deliberate mutations", () => {
  it("1. rejects an unknown type", () => {
    const mutated = [{ ...continuousFixture[0], type: "gaussian_process" }];
    const errors = smvErrors(makeModel({ smVariables: mutated }));
    expect(errors.join(" ")).toMatch(/invalid type/i);
  });

  it("2. rejects a duplicate id", () => {
    const mutated = [binaryVectorFixture[0], { ...binaryVectorFixture[1], id: binaryVectorFixture[0].id }];
    const errors = smvErrors(makeModel({ smVariables: mutated }));
    expect(errors.join(" ")).toMatch(/Duplicate smVariables id/);
  });

  it("3. rejects a continuous scale where min >= max", () => {
    const mutated = [{ ...continuousFixture[0], scale: { min: 4, max: -4 } }];
    const errors = smvErrors(makeModel({ smVariables: mutated }));
    expect(errors.join(" ")).toMatch(/requires scale\.min < scale\.max/);
  });

  it("4. rejects a binary SMV with the wrong number of states", () => {
    const mutated = [
      { ...binaryVectorFixture[0], scale: { states: ["non-mastery", "partial", "mastery"] } },
    ];
    const errors = smvErrors(makeModel({ smVariables: mutated }));
    expect(errors.join(" ")).toMatch(/requires exactly 2 scale\.states/);
  });

  it("5. rejects a prior family incompatible with the SMV type", () => {
    const mutated = [
      { ...binaryVectorFixture[0], priorDistribution: { family: "normal", params: { mean: 0, sd: 1 } } },
    ];
    const errors = smvErrors(makeModel({ smVariables: mutated }));
    expect(errors.join(" ")).toMatch(/incompatible priorDistribution\.family/);
  });

  it("6. rejects invalid priorDistribution.params for the chosen family", () => {
    const mutated = [
      { ...binaryVectorFixture[1], priorDistribution: { family: "beta", params: { alpha: -1, beta: 2 } } },
    ];
    const errors = smvErrors(makeModel({ smVariables: mutated }));
    expect(errors.join(" ")).toMatch(/invalid priorDistribution\.params/);
  });
});

describe("competencyModels.psychologicalPerspective", () => {
  it("accepts a declared perspective", () => {
    expect(smvErrors(makeModel({ psychologicalPerspective: "information_processing" }))).toEqual([]);
  });

  it("is optional", () => {
    expect(smvErrors(makeModel())).toEqual([]);
  });

  it("rejects a value outside the enum", () => {
    const errors = smvErrors(makeModel({ psychologicalPerspective: "phrenology" }));
    expect(errors.join(" ")).toMatch(/Invalid psychologicalPerspective/);
  });
});
