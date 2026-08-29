// src/utils/__tests__/compositeLibraryAndProvenance.test.js
//
// Day 19 (Week 4, core schema): the new `compositeLibrary` collection
// (schema only -- the builder is Day 24), and mandatory calibration
// provenance on evidenceModels.statisticalModels[].parameterSets[]. Exit
// check: all three calibration file kinds are declared; provenance is
// mandatory; a non-converged run cannot be stored as a parameter set.

import { describe, it, expect } from "vitest";
import { validateEntity } from "../schema.js";
import { CALIBRATION_FILE_KIND_VALUES } from "../ecdVocabulary.js";

describe("ecdVocabulary — calibration file kinds", () => {
  it("declares all three named kinds", () => {
    expect(CALIBRATION_FILE_KIND_VALUES).toEqual(
      expect.arrayContaining(["ctt-statistics", "irt-parameters", "dina-parameters"])
    );
  });
});

const taskModel = { id: "tm1", name: "Fractions Task", versionNumber: 1, status: "confirmed" };
const items = [
  { id: "i1", taskModelId: "tm1" },
  { id: "i2", taskModelId: "tm1" },
  { id: "i3", taskModelId: "tm-other" },
];

function makeLibrary(overrides = {}) {
  return {
    id: "cl1",
    taskModelId: "tm1",
    taskModelVersion: 1,
    compiledAt: new Date().toISOString(),
    active: true,
    items: [{ itemId: "i1" }, { itemId: "i2" }],
    ...overrides,
  };
}

function makeDb(overrides = {}) {
  return {
    taskModels: [taskModel],
    items,
    compositeLibrary: [],
    ...overrides,
  };
}

function libraryErrors(model, db = makeDb()) {
  const { errors } = validateEntity("compositeLibrary", model, db);
  return errors || [];
}

describe("compositeLibrary — passing fixture", () => {
  it("accepts a well-formed compiled package", () => {
    expect(libraryErrors(makeLibrary())).toEqual([]);
  });
});

describe("compositeLibrary — deliberate mutations", () => {
  it("requires taskModelId", () => {
    const errors = libraryErrors(makeLibrary({ taskModelId: undefined }));
    expect(errors.join(" ")).toMatch(/taskModelId is required/);
  });

  it("requires a numeric taskModelVersion", () => {
    const errors = libraryErrors(makeLibrary({ taskModelVersion: undefined }));
    expect(errors.join(" ")).toMatch(/taskModelVersion is required/);
  });

  it("requires compiledAt", () => {
    const errors = libraryErrors(makeLibrary({ compiledAt: undefined }));
    expect(errors.join(" ")).toMatch(/compiledAt is required/);
  });

  it("rejects a dangling taskModelId", () => {
    const errors = libraryErrors(makeLibrary({ taskModelId: "tm-does-not-exist" }));
    expect(errors.join(" ")).toMatch(/Invalid taskModelId/);
  });

  it("rejects an unknown itemId", () => {
    const errors = libraryErrors(makeLibrary({ items: [{ itemId: "i-does-not-exist" }] }));
    expect(errors.join(" ")).toMatch(/references unknown itemId/);
  });

  it("rejects an item that belongs to a different Task Model", () => {
    const errors = libraryErrors(makeLibrary({ items: [{ itemId: "i3" }] }));
    expect(errors.join(" ")).toMatch(/belongs to taskModelId 'tm-other', not this library's 'tm1'/);
  });

  it("refuses a second active package for the same Task Model", () => {
    const existing = makeLibrary({ id: "cl-existing" });
    const db = makeDb({ compositeLibrary: [existing] });
    const errors = libraryErrors(makeLibrary({ id: "cl-new" }), db);
    expect(errors.join(" ")).toMatch(/already has an active composite library package/);
  });

  it("allows two INACTIVE packages for the same Task Model", () => {
    const existing = makeLibrary({ id: "cl-existing", active: false });
    const db = makeDb({ compositeLibrary: [existing] });
    const errors = libraryErrors(makeLibrary({ id: "cl-new", active: false }), db);
    expect(errors).toEqual([]);
  });
});

// The "requires taskModelId" / "rejects a dangling taskModelId" mutations
// above reuse `makeLibrary()`'s default `items` (both pointing at "tm1"),
// so mutating taskModelId ALSO makes every item entry disagree with the
// library's (now different/missing) taskModelId and fire the
// "belongs to taskModelId ... not this library's ..." rule too. The
// `.toMatch()` assertions above still pass because they only check that
// the expected substring is present, not that it's the ONLY error — so
// they don't actually prove the taskModelId checks are isolated from the
// items[] cross-check. These fixtures strip `items` to confirm each rule
// really does fire alone.
describe("compositeLibrary — rule isolation (items[] cascade)", () => {
  it("requires taskModelId, and ONLY that, when items[] is empty", () => {
    const errors = libraryErrors(makeLibrary({ taskModelId: undefined, items: [] }));
    expect(errors).toEqual(["taskModelId is required."]);
  });

  it("flags a dangling taskModelId, and ONLY that, when items[] is empty", () => {
    const errors = libraryErrors(makeLibrary({ taskModelId: "tm-does-not-exist", items: [] }));
    expect(errors).toEqual(["Invalid taskModelId: tm-does-not-exist"]);
  });

  it("demonstrates the cascade the two tests above don't isolate against", () => {
    // Same mutation as "requires taskModelId", but keeping the default
    // items[] (which reference tm1). Documents that clearing taskModelId
    // does NOT just produce one error against this fixture.
    const errors = libraryErrors(makeLibrary({ taskModelId: undefined }));
    expect(errors).toEqual(
      expect.arrayContaining([
        "taskModelId is required.",
        expect.stringMatching(/belongs to taskModelId 'tm1', not this library's 'undefined'/),
      ])
    );
    expect(errors.length).toBeGreaterThan(1);
  });
});

describe("compositeLibrary — items[] structural edge cases", () => {
  it("rejects a non-array items value", () => {
    const errors = libraryErrors(makeLibrary({ items: "not-an-array" }));
    expect(errors.join(" ")).toMatch(/items should be array/);
  });

  it("treats items[] as optional: omitting it entirely is valid", () => {
    const lib = makeLibrary();
    delete lib.items;
    expect(libraryErrors(lib)).toEqual([]);
  });

  it("treats an empty items[] array as valid", () => {
    expect(libraryErrors(makeLibrary({ items: [] }))).toEqual([]);
  });

  it("rejects an items[] entry that is null", () => {
    const errors = libraryErrors(makeLibrary({ items: [null] }));
    expect(errors.join(" ")).toMatch(/items\[0\] requires an itemId/);
  });

  it("rejects an items[] entry that is not an object (e.g. a bare itemId string)", () => {
    const errors = libraryErrors(makeLibrary({ items: ["i1"] }));
    expect(errors.join(" ")).toMatch(/items\[0\] requires an itemId/);
  });

  it("rejects an items[] entry that is an object missing itemId", () => {
    const errors = libraryErrors(makeLibrary({ items: [{}] }));
    expect(errors.join(" ")).toMatch(/items\[0\] requires an itemId/);
  });

  it("does NOT reject duplicate itemId entries within items[] (no dedup rule exists)", () => {
    // Documents current permissive behavior. If a dedup rule is ever added
    // deliberately, update this test rather than treating its failure as a
    // regression.
    const errors = libraryErrors(makeLibrary({ items: [{ itemId: "i1" }, { itemId: "i1" }] }));
    expect(errors).toEqual([]);
  });
});

describe("compositeLibrary — taskModelVersion numeric edge cases", () => {
  it("accepts taskModelVersion 0 (falsy but numerically valid)", () => {
    expect(libraryErrors(makeLibrary({ taskModelVersion: 0 }))).toEqual([]);
  });

  it("does not reject a negative taskModelVersion (no range check exists)", () => {
    expect(libraryErrors(makeLibrary({ taskModelVersion: -1 }))).toEqual([]);
  });

  it("reports taskModelVersion twice when it is present but the wrong type", () => {
    // The generic per-field type loop (schema.js's plain-shape pass) and
    // the compositeLibrary-specific block both independently check
    // taskModelVersion's type, so a present-but-wrong-type value produces
    // two distinct error strings rather than one. Documented here so a
    // future dedup of that redundancy is a deliberate choice, not a
    // silent behavior change this suite fails to notice.
    const errors = libraryErrors(makeLibrary({ taskModelVersion: "1" }));
    expect(errors).toEqual(
      expect.arrayContaining([
        "taskModelVersion should be number",
        "taskModelVersion is required and must be a number.",
      ])
    );
  });
});

describe("compositeLibrary — compiledAt format", () => {
  it("flags a present but unparseable compiledAt as an invalid date, not as missing", () => {
    // `!obj.compiledAt` is false for a non-empty (if garbage) string, so the
    // compositeLibrary-specific "compiledAt is required" branch does not
    // fire here -- it's the generic per-field 'date' type check that
    // catches this, with a different message.
    const errors = libraryErrors(makeLibrary({ compiledAt: "not-a-date" }));
    expect(errors).toEqual(["compiledAt should be date"]);
  });
});

describe("compositeLibrary — validating without a db", () => {
  it("degrades gracefully (no crash, no referential-integrity errors) when db is omitted", () => {
    // Every db-dependent check in the compositeLibrary block is guarded by
    // `db && ...`, so calling validateEntity with no db must not throw and
    // must skip taskModelId/itemId/active-uniqueness referential checks
    // rather than crashing on `db.taskModels` of null.
    expect(() => validateEntity("compositeLibrary", makeLibrary(), null)).not.toThrow();
    const { valid, errors } = validateEntity("compositeLibrary", makeLibrary(), null);
    expect(valid).toBe(true);
    expect(errors).toEqual([]);
  });

  it("still catches non-db-dependent structural errors when db is omitted", () => {
    const { errors } = validateEntity("compositeLibrary", makeLibrary({ taskModelId: undefined, items: [] }), null);
    expect(errors).toEqual(["taskModelId is required."]);
  });
});

describe("compositeLibrary — active field type", () => {
  it("rejects a non-boolean active value", () => {
    const errors = libraryErrors(makeLibrary({ active: "yes" }));
    expect(errors.join(" ")).toMatch(/active should be boolean/);
  });
});

describe("evidenceModels.statisticalModels[].parameterSets[] — provenance", () => {
  const db = { competencies: [{ id: "c1", modelId: "cm1", variableType: "continuous" }] };

  function modelWithParameterSet(psOverrides = {}) {
    return {
      id: "em1",
      competencyId: "c1",
      statisticalModels: [
        {
          id: "sm1",
          type: "irt",
          active: true,
          structureConfig: {},
          parameterSets: [
            {
              parameterSetId: "ps1",
              parameters: { a: 1 },
              packageVersion: "mirt-1.42.1",
              converged: true,
              sampleSize: 500,
              calibratedAt: new Date().toISOString(),
              ...psOverrides,
            },
          ],
        },
      ],
    };
  }

  function errorsFor(model) {
    const { errors } = validateEntity("evidenceModels", model, db, { strict: false });
    return errors || [];
  }

  it("accepts a fully-provenanced parameter set", () => {
    expect(errorsFor(modelWithParameterSet())).toEqual([]);
  });

  it("requires packageVersion", () => {
    const errors = errorsFor(modelWithParameterSet({ packageVersion: undefined }));
    expect(errors.join(" ")).toMatch(/requires packageVersion/);
  });

  it("requires a positive sampleSize", () => {
    const errors = errorsFor(modelWithParameterSet({ sampleSize: 0 }));
    expect(errors.join(" ")).toMatch(/requires a positive sampleSize/);
  });

  it("requires calibratedAt", () => {
    const errors = errorsFor(modelWithParameterSet({ calibratedAt: undefined }));
    expect(errors.join(" ")).toMatch(/requires calibratedAt/);
  });

  it("requires converged to be declared", () => {
    const errors = errorsFor(modelWithParameterSet({ converged: undefined }));
    expect(errors.join(" ")).toMatch(/must declare converged/);
  });

  it("refuses to store a non-converged run as a parameter set", () => {
    const errors = errorsFor(modelWithParameterSet({ converged: false }));
    expect(errors.join(" ")).toMatch(/did not converge and cannot be stored as a parameter set/);
  });

  it("accepts a calibrationKind consistent with the statistical model's type", () => {
    const errors = errorsFor(modelWithParameterSet({ calibrationKind: "irt-parameters" }));
    expect(errors).toEqual([]);
  });

  it("rejects an unknown calibrationKind", () => {
    const errors = errorsFor(modelWithParameterSet({ calibrationKind: "not-a-real-kind" }));
    expect(errors.join(" ")).toMatch(/invalid calibrationKind/);
  });

  it("rejects a calibrationKind that does not apply to the model's type", () => {
    const errors = errorsFor(modelWithParameterSet({ calibrationKind: "dina-parameters" }));
    expect(errors.join(" ")).toMatch(/does not apply to statistical model type 'irt'/);
  });

  // ADR 0002 (Day 20): standardErrors/fitStatistics are optional additions
  // to the calibration response contract, reconciled onto Day 19's shape.
  it("accepts a parameter set with standardErrors and fitStatistics", () => {
    const errors = errorsFor(modelWithParameterSet({
      standardErrors: { a: 0.05 },
      fitStatistics: { RMSEA: 0.03, M2: 12.4 },
    }));
    expect(errors).toEqual([]);
  });

  it("does not require standardErrors or fitStatistics", () => {
    expect(errorsFor(modelWithParameterSet())).toEqual([]);
  });

  it("rejects a non-object standardErrors", () => {
    const errors = errorsFor(modelWithParameterSet({ standardErrors: "not an object" }));
    expect(errors.join(" ")).toMatch(/invalid standardErrors/);
  });

  it("rejects a non-object fitStatistics", () => {
    const errors = errorsFor(modelWithParameterSet({ fitStatistics: [1, 2, 3] }));
    expect(errors.join(" ")).toMatch(/invalid fitStatistics/);
  });
});
