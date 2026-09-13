// D58: how a measurement stop is shown.
//
// selectNextActivity already decides when to stop and returns `{ stopped }`.
// This module does not re-decide. It turns that object into the copy the
// player must show instead of the generic "No more tasks available" ending,
// which treated a met accuracy target the same as an empty task list.

const RULE_HEADINGS = {
  targetsMet: "Measurement target met",
  maxItems: "Item limit reached",
};

export function measurementStopHeading(stopped) {
  if (!stopped?.rule) return "Session stopped";
  if (stopped.rule === "targetsMet") {
    const n = Array.isArray(stopped.targets) ? stopped.targets.length : 0;
    return n > 1 ? "Measurement targets met" : RULE_HEADINGS.targetsMet;
  }
  return RULE_HEADINGS[stopped.rule] || "Session stopped";
}

export function measurementStopDetails(stopped) {
  if (!Array.isArray(stopped?.targets)) return [];
  return stopped.targets.filter((t) => t && (t.classification || t.requiredSEM !== undefined));
}
