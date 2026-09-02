// server/delivery/__tests__/assemblyProgress.test.js
//
// Day 34 (Week 7): resolveAssemblyProgress is read-only enrichment, never a
// stopping decision -- these tests pin the "refuse rather than guess"
// behaviour (zero or ambiguous Assembly Models -> omitted, not an error)
// as carefully as the accumulation math itself.

import { describe, it, expect } from "vitest";
import { resolveAssemblyProgress } from "../assemblyProgress.js";

function posterior(overrides = {}) {
  return {
    smvId: "smv1",
    competencyModelId: "cm1",
    supported: true,
    estimate: 0.5,
    precision: 0.3,
    // Day 39: the theta-scale check now gates on `method`, not `smvType`
    // (see assemblyProgress.js's own comment) -- "eap" is the continuous
    // IRT/Rasch branch's method and is the realistic default for a
    // fixture that otherwise looks like a continuous posterior.
    method: "eap",
    modelFamily: "irt",
    ...overrides,
  };
}

function assemblyModel(overrides = {}) {
  return {
    id: "am1",
    competencyModelId: "cm1",
    targetsBySMV: [{ smvId: "smv1", requiredSEM: 0.4 }],
    ...overrides,
  };
}

describe("resolveAssemblyProgress", () => {
  it("reports met when precision is within the required SEM", () => {
    const result = resolveAssemblyProgress([posterior({ precision: 0.3 })], { assemblyModels: [assemblyModel()] });
    expect(result).toEqual([{
      smvId: "smv1",
      assemblyModelId: "am1",
      estimate: 0.5,
      precision: 0.3,
      requiredSEM: 0.4,
      stoppingCriterionMet: true,
    }]);
  });

  it("reports not-met when precision is coarser than the required SEM", () => {
    const result = resolveAssemblyProgress([posterior({ precision: 0.5 })], { assemblyModels: [assemblyModel()] });
    expect(result[0].stoppingCriterionMet).toBe(false);
  });

  it("treats an exact match at the boundary as met (<=, not <)", () => {
    const result = resolveAssemblyProgress([posterior({ precision: 0.4 })], { assemblyModels: [assemblyModel()] });
    expect(result[0].stoppingCriterionMet).toBe(true);
  });

  it("surfaces a classification-accuracy target as visible but unevaluated", () => {
    const am = assemblyModel({ targetsBySMV: [{ smvId: "smv1", requiredClassificationAccuracy: 0.85 }] });
    const result = resolveAssemblyProgress([posterior()], { assemblyModels: [am] });
    expect(result[0].requiredClassificationAccuracy).toBe(0.85);
    expect(result[0].stoppingCriterionMet).toBeNull();
  });

  it("omits an SMV with no Assembly Model targeting its Competency Model", () => {
    const result = resolveAssemblyProgress([posterior()], { assemblyModels: [] });
    expect(result).toEqual([]);
  });

  it("refuses to guess when several Assembly Models target the same Competency Model", () => {
    const result = resolveAssemblyProgress(
      [posterior()],
      { assemblyModels: [assemblyModel({ id: "am1" }), assemblyModel({ id: "am2" })] }
    );
    expect(result).toEqual([]);
  });

  it("omits an SMV the matched Assembly Model doesn't target", () => {
    const am = assemblyModel({ targetsBySMV: [{ smvId: "smv-other", requiredSEM: 0.4 }] });
    const result = resolveAssemblyProgress([posterior()], { assemblyModels: [am] });
    expect(result).toEqual([]);
  });

  it("skips a refused (unsupported) posterior entirely", () => {
    const result = resolveAssemblyProgress(
      [{ smvId: "smv1", competencyModelId: "cm1", supported: false, reason: "mixed parameter sets" }],
      { assemblyModels: [assemblyModel()] }
    );
    expect(result).toEqual([]);
  });

  it("skips a posterior with no resolvable competencyModelId (refused before SMV resolution)", () => {
    const result = resolveAssemblyProgress(
      [{ smvId: undefined, supported: false, reason: "unimplemented family" }],
      { assemblyModels: [assemblyModel()] }
    );
    expect(result).toEqual([]);
  });

  it("handles multiple SMVs independently in one call", () => {
    const am = assemblyModel({
      targetsBySMV: [
        { smvId: "smv1", requiredSEM: 0.4 },
        { smvId: "smv2", requiredSEM: 0.2 },
      ],
    });
    const result = resolveAssemblyProgress(
      [posterior({ smvId: "smv1", precision: 0.3 }), posterior({ smvId: "smv2", precision: 0.3 })],
      { assemblyModels: [am] }
    );
    expect(result).toHaveLength(2);
    expect(result.find((r) => r.smvId === "smv1").stoppingCriterionMet).toBe(true);
    expect(result.find((r) => r.smvId === "smv2").stoppingCriterionMet).toBe(false);
  });

  it("returns [] for an empty posteriors array without touching db", () => {
    expect(resolveAssemblyProgress([], {})).toEqual([]);
    expect(resolveAssemblyProgress(undefined, { assemblyModels: [] })).toEqual([]);
  });

  it("refuses to compare a requiredSEM target against a non-EAP posterior's precision (attribute mastery)", () => {
    const result = resolveAssemblyProgress(
      [posterior({ smvType: "binary", method: "attribute-mastery-posterior", modelFamily: "dina", precision: 0.1 })],
      { assemblyModels: [assemblyModel()] }
    );
    expect(result).toEqual([{
      smvId: "smv1",
      assemblyModelId: "am1",
      estimate: 0.5,
      precision: 0.1,
      requiredSEM: 0.4,
      stoppingCriterionMet: null,
      note: "A requiredSEM target is defined on the theta scale and cannot be compared to a 'dina' model's precision (method: 'attribute-mastery-posterior').",
    }]);
  });

  // Day 39 (adversarial review, P1-6): a raw-score (CTT/sum/threshold)
  // model is explicitly allowed on a `continuous` SMV (RAW_SCORE_SMV_TYPES
  // in evidenceAccumulation.js), so `smvType === "continuous"` alone does
  // NOT mean the precision is on the theta scale -- its "weighted-
  // proportion" method must still be refused the same way attribute
  // mastery is, which the old smvType-only gate missed entirely.
  it("refuses to compare a requiredSEM target against a raw-score posterior's precision, even though its smvType is 'continuous'", () => {
    const result = resolveAssemblyProgress(
      [posterior({ smvType: "continuous", method: "weighted-proportion", modelFamily: "sum", precision: 0.2 })],
      { assemblyModels: [assemblyModel()] }
    );
    expect(result[0].stoppingCriterionMet).toBeNull();
    expect(result[0].note).toMatch(/cannot be compared to a 'sum' model's precision/);
  });

  it("still evaluates a requiredSEM target normally for an EAP (continuous IRT/Rasch) posterior", () => {
    const withType = resolveAssemblyProgress(
      [posterior({ smvType: "continuous", method: "eap", precision: 0.3 })],
      { assemblyModels: [assemblyModel()] }
    );
    expect(withType[0].stoppingCriterionMet).toBe(true);

    const withoutType = resolveAssemblyProgress(
      [posterior({ precision: 0.3 })], // helper's default is already method: "eap"
      { assemblyModels: [assemblyModel()] }
    );
    expect(withoutType[0].stoppingCriterionMet).toBe(true);
  });
});
