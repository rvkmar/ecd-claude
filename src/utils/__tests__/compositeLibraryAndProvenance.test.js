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
});
