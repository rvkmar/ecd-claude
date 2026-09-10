// Standing work order item 1 -- the Competency Model picker in
// QMatrixEditor.jsx must only offer models that declare at least one
// binary Student Model Variable, since a Q-matrix has nothing to bind to
// otherwise (schema.js's qMatrixModels block validates every attributeId
// as a binary-SMV id on the bound model). `hasBinarySmVariable` is the
// exported predicate the picker filters with -- tested directly rather
// than mounting the full React-Query-backed editor, same reasoning
// QMatrixValidity.js gives for its own pure-function tests.
import { describe, it, expect } from "vitest";
import { hasBinarySmVariable } from "../QMatrixEditor";

describe("hasBinarySmVariable", () => {
  it("returns true when the model declares at least one binary smVariable", () => {
    expect(
      hasBinarySmVariable({
        smVariables: [
          { id: "a", type: "continuous" },
          { id: "b", type: "binary" },
        ],
      })
    ).toBe(true);
  });

  it("returns false when the model declares smVariables but none binary", () => {
    expect(
      hasBinarySmVariable({
        smVariables: [{ id: "a", type: "continuous" }],
      })
    ).toBe(false);
  });

  it("returns false when the model declares no smVariables at all", () => {
    expect(hasBinarySmVariable({ smVariables: [] })).toBe(false);
    expect(hasBinarySmVariable({})).toBe(false);
  });

  it("is null/undefined-safe", () => {
    expect(hasBinarySmVariable(null)).toBe(false);
    expect(hasBinarySmVariable(undefined)).toBe(false);
  });
});
