// src/utils/__tests__/evidenceActivationMapPatterns.test.js
//
// Day 27 (Week 6, Evidence Identification): an exact-duplicate
// responsePattern across two rules in the same evidenceActivationMap is an
// unambiguous authoring mistake -- whichever rule is declared first always
// wins at delivery time (server/delivery/evidenceIdentification.js matches
// the first entry whose pattern fits), so the second, identical rule can
// never fire. Found during an adversarial review of evidenceIdentification.js
// and closed here at the confirm-time validation layer.

import { describe, it, expect } from "vitest";
import { validateEntity } from "../schema.js";

function makeItem(evidenceActivationMap) {
  return {
    id: "i1",
    taskModelId: "tm1",
    taskModelVersion: 1,
    observationId: "o1",
    evidenceModelId: "em1",
    evidenceModelVersion: 1,
    stimulus: { layout: "single", blocks: [{ type: "text", content: "x" }] },
    interaction: { type: "mcq", responseComponents: [{ id: "a" }] },
    scoring: { method: "dichotomous", maxScore: 1, evidenceActivationMap },
    status: "confirmed",
    locked: true,
  };
}

function itemErrors(evidenceActivationMap) {
  const { errors } = validateEntity("items", makeItem(evidenceActivationMap), null, { strict: true });
  return errors || [];
}

describe("evidenceActivationMap — duplicate responsePattern detection", () => {
  it("accepts distinct responsePatterns across rules", () => {
    const errors = itemErrors([
      { responsePattern: { selected: "opt_a" }, activatesObservable: true, rationale: "Correct." },
      { responsePattern: { selected: "opt_b" }, activatesObservable: false, rationale: "Incorrect." },
    ]);
    expect(errors.join(" ")).not.toMatch(/exact same responsePattern/);
  });

  it("refuses two rules with byte-identical responsePatterns", () => {
    const errors = itemErrors([
      { responsePattern: { selected: "opt_a" }, activatesObservable: true, rationale: "Correct." },
      { responsePattern: { selected: "opt_a" }, activatesObservable: false, rationale: "Duplicate by mistake." },
    ]);
    expect(errors.join(" ")).toMatch(/Activation rule 2 has the exact same responsePattern as an earlier rule/);
  });

  it("does not flag two rules whose patterns merely overlap in value (not byte-identical)", () => {
    // Documents the known, deliberately-unaddressed scope boundary: this is
    // still a real overlap (both could match `selected: "opt_a"`), but
    // detecting it needs the pattern's array/membership semantics, which
    // this exact-match guard does not attempt.
    const errors = itemErrors([
      { responsePattern: { selected: "opt_a" }, activatesObservable: true, rationale: "Specific." },
      { responsePattern: { selected: ["opt_a", "opt_b"] }, activatesObservable: false, rationale: "Broader, overlapping." },
    ]);
    expect(errors.join(" ")).not.toMatch(/exact same responsePattern/);
  });

  it("is order-independent about which duplicate is flagged (always the later one)", () => {
    const errors = itemErrors([
      { responsePattern: { selected: "opt_a" }, activatesObservable: true, rationale: "First." },
      { responsePattern: { selected: "opt_b" }, activatesObservable: false, rationale: "Distinct." },
      { responsePattern: { selected: "opt_a" }, activatesObservable: false, rationale: "Duplicate of rule 1." },
    ]);
    expect(errors.join(" ")).toMatch(/Activation rule 3 has the exact same responsePattern/);
  });
});
