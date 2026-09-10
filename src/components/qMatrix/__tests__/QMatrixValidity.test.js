// D52 -- Q-matrix validity rules.
import { describe, it, expect } from "vitest";
import { computeQMatrixValidity, MIN_ITEMS_PER_ATTRIBUTE } from "../QMatrixValidity";

const items = (ids) => ids.map((id) => ({ id }));

describe("computeQMatrixValidity", () => {
  it("flags an item with zero checked attributes as an error", () => {
    const { errors } = computeQMatrixValidity({
      attributeIds: ["a1", "a2"],
      includedItems: items(["i1"]),
      entries: [],
    });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ code: "empty-row", itemId: "i1" });
  });

  it("flags two items with the exact same attribute set as an advisory, not an error (D52 spec: duplicate rows are ADVISORY)", () => {
    const { errors, advisories } = computeQMatrixValidity({
      attributeIds: ["a1", "a2"],
      includedItems: items(["i1", "i2"]),
      entries: [
        { itemId: "i1", attributeId: "a1" },
        { itemId: "i1", attributeId: "a2" },
        { itemId: "i2", attributeId: "a1" },
        { itemId: "i2", attributeId: "a2" },
      ],
    });
    expect(errors.filter((e) => e.code === "duplicate-row")).toHaveLength(0);
    const dup = advisories.find((a) => a.code === "duplicate-row");
    expect(dup).toBeTruthy();
    expect(dup.itemIds.sort()).toEqual(["i1", "i2"]);
  });

  it("does not flag distinct attribute sets as duplicates", () => {
    const { advisories } = computeQMatrixValidity({
      attributeIds: ["a1", "a2"],
      includedItems: items(["i1", "i2"]),
      entries: [
        { itemId: "i1", attributeId: "a1" },
        { itemId: "i2", attributeId: "a2" },
      ],
    });
    expect(advisories.filter((a) => a.code === "duplicate-row")).toHaveLength(0);
  });

  it("warns (advisory) when an attribute is never required by a single item alone", () => {
    const { advisories, errors } = computeQMatrixValidity({
      attributeIds: ["a1", "a2"],
      includedItems: items(["i1"]),
      entries: [
        { itemId: "i1", attributeId: "a1" },
        { itemId: "i1", attributeId: "a2" },
      ],
    });
    expect(errors).toHaveLength(0);
    expect(advisories.some((a) => a.code === "identifiability" && a.attributeId === "a1")).toBe(
      true
    );
    expect(advisories.some((a) => a.code === "identifiability" && a.attributeId === "a2")).toBe(
      true
    );
  });

  it("does not warn on identifiability once an attribute has a pure item", () => {
    const { advisories } = computeQMatrixValidity({
      attributeIds: ["a1"],
      includedItems: items(["i1"]),
      entries: [{ itemId: "i1", attributeId: "a1" }],
    });
    expect(advisories.some((a) => a.code === "identifiability")).toBe(false);
  });

  it("warns (advisory) when an attribute has fewer than the recommended item coverage", () => {
    // Two items both require a1 (below MIN_ITEMS_PER_ATTRIBUTE), but with
    // distinct attribute sets so this doesn't also trip the duplicate-row
    // error -- isolating the coverage rule from the duplicate-row rule.
    expect(MIN_ITEMS_PER_ATTRIBUTE).toBeGreaterThan(2);
    const { advisories, errors } = computeQMatrixValidity({
      attributeIds: ["a1", "a2"],
      includedItems: items(["i0", "i1"]),
      entries: [
        { itemId: "i0", attributeId: "a1" },
        { itemId: "i1", attributeId: "a1" },
        { itemId: "i1", attributeId: "a2" },
      ],
    });
    expect(errors).toHaveLength(0);
    expect(advisories.some((a) => a.code === "low-coverage" && a.attributeId === "a1")).toBe(
      true
    );
  });

  it("does not warn on coverage once an attribute meets the minimum", () => {
    const ids = Array.from({ length: MIN_ITEMS_PER_ATTRIBUTE }, (_, i) => `i${i}`);
    const { advisories } = computeQMatrixValidity({
      attributeIds: ["a1"],
      includedItems: items(ids),
      entries: ids.map((itemId) => ({ itemId, attributeId: "a1" })),
    });
    expect(advisories.some((a) => a.code === "low-coverage")).toBe(false);
  });

  it("returns no errors or advisories for an empty matrix", () => {
    const result = computeQMatrixValidity({ attributeIds: [], includedItems: [], entries: [] });
    expect(result.errors).toHaveLength(0);
    expect(result.advisories).toHaveLength(0);
  });
});
