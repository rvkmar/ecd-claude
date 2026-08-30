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
});
