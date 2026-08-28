// src/utils/__tests__/cognitiveDemandVocabulary.test.js
//
// Day 22 (Week 5, vocabulary consolidation): BLOOM_LEVELS/REASONING_TYPES
// moved into ecdVocabulary.js, and schema.js now validates
// cognitiveDemand.bloomLevel/reasoningType against them -- previously bare
// 'string' fields with no enum check at all. Covers both the item-level
// field and the Task Model blueprintConstraints.cognitiveDemand mirror.

import { describe, it, expect } from "vitest";
import { validateEntity } from "../schema.js";

describe("items.cognitiveDemand — enum validity", () => {
  function itemErrors(overrides = {}) {
    const { errors } = validateEntity(
      "items",
      { id: "i1", taskModelId: "tm1", ...overrides },
      null,
      { strict: false }
    );
    return errors || [];
  }

  it("accepts a known bloomLevel and reasoningType", () => {
    const errors = itemErrors({ cognitiveDemand: { bloomLevel: "apply", reasoningType: "procedural" } });
    expect(errors.join(" ")).not.toMatch(/Unknown cognitiveDemand/);
  });

  it("rejects an unknown bloomLevel", () => {
    const errors = itemErrors({ cognitiveDemand: { bloomLevel: "not-a-real-level" } });
    expect(errors.join(" ")).toMatch(/Unknown cognitiveDemand\.bloomLevel/);
  });

  it("rejects an unknown reasoningType", () => {
    const errors = itemErrors({ cognitiveDemand: { reasoningType: "not-a-real-type" } });
    expect(errors.join(" ")).toMatch(/Unknown cognitiveDemand\.reasoningType/);
  });

  it("does not require cognitiveDemand at all", () => {
    const errors = itemErrors({});
    expect(errors.join(" ")).not.toMatch(/cognitiveDemand/);
  });
});

describe("taskModels.blueprintConstraints.cognitiveDemand — enum validity", () => {
  function taskModelErrors(bc) {
    const { errors } = validateEntity(
      "taskModels",
      { id: "tm1", blueprintConstraints: bc },
      null,
      { strict: false }
    );
    return errors || [];
  }

  it("accepts a known bloomLevel and reasoningType", () => {
    const errors = taskModelErrors({ cognitiveDemand: { bloomLevel: "evaluate", reasoningType: "evaluative" } });
    expect(errors.join(" ")).not.toMatch(/Unknown blueprintConstraints\.cognitiveDemand/);
  });

  it("rejects an unknown bloomLevel", () => {
    const errors = taskModelErrors({ cognitiveDemand: { bloomLevel: "not-a-real-level" } });
    expect(errors.join(" ")).toMatch(/Unknown blueprintConstraints\.cognitiveDemand\.bloomLevel/);
  });

  it("rejects an unknown reasoningType", () => {
    const errors = taskModelErrors({ cognitiveDemand: { reasoningType: "not-a-real-type" } });
    expect(errors.join(" ")).toMatch(/Unknown blueprintConstraints\.cognitiveDemand\.reasoningType/);
  });
});
