import { describe, it, expect } from "vitest";
import { measurementStopHeading, measurementStopDetails } from "../measurementStop.js";

describe("measurementStop copy", () => {
  it("names a classification stop as a met target, not an empty form", () => {
    expect(measurementStopHeading({ rule: "targetsMet" })).toBe("Measurement target met");
    expect(measurementStopHeading({ rule: "maxItems" })).toBe("Item limit reached");
  });

  it("lists classification targets that the player can render", () => {
    const details = measurementStopDetails({
      targets: [
        { smvId: "attrA", classification: "master", expectedClassificationAccuracy: 0.9 },
        { smvId: "skip-me" },
      ],
    });
    expect(details).toHaveLength(1);
    expect(details[0].smvId).toBe("attrA");
  });
});
