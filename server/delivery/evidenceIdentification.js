// server/delivery/evidenceIdentification.js
//
// Day 27 (Week 6): "Evidence Identification — the break that makes
// everything upstream inert" (build reference Part 2, Step 25). Applies an
// item's `scoring.evidenceActivationMap[]` against the bound Evidence
// Model's observable to turn a raw work product into an OBSERVABLE
// VARIABLE VALUE. The output is deliberately NOT a score, NOT a
// correct/incorrect flag, and NOT a point value -- Evidence Accumulation
// (Week 7-8) is where a measurement model turns this into a posterior
// update. Conflating the two here is exactly the bug Day 26's map found:
// SessionPlayer.jsx computes "correctness" client-side today by comparing
// a `correctOptionId` field questionsRoutes.js never writes, so every MCQ
// submission silently scores 0 regardless of the answer. This module
// replaces that comparison outright, not ports it.
//
// Pure computation (no persistence), matching the style already
// established for compositeLibrary/builder.js and
// classicalCalibration.js: takes data in, returns data out.
//
// What this deliberately does NOT touch, and why: statisticalModels[] /
// parameterSets[] (calibration is Accumulation's concern, and per ADR 0003
// + the Day 26 migration map's recommendation, whichever step DOES read
// calibrated parameters should read them live from parameterSets[], never
// from a cached item-level copy). Identification only needs the Evidence
// Model's observable + evidenceRule, never its statistical model.

/**
 * True if `pattern`'s keys all match the corresponding keys on
 * `workProduct`. Both the pattern's value and the work product's value are
 * normalized to arrays and compared for overlap ("any of these matches any
 * of those") -- so a single-value pattern against a single-value response
 * is an equality check (the common MCQ case, unchanged from the original
 * design), a multi-valued PATTERN against a single-value response is "any
 * of these" (`{ selected: ["opt_b","opt_c"] }` matches `selected: "opt_c"`
 * -- the literal shape samples/sample-items.json uses), and -- Day 30, an
 * adversarial-review finding -- a single-valued pattern against a
 * multi-select RESPONSE (`selected: ["opt_a","opt_c"]`) or a multi-valued
 * pattern against a multi-select response both now resolve by the same
 * overlap rule, rather than the multi-select response silently never
 * matching anything at all (arrays being compared by reference always
 * failed strict equality, and never appeared inside another array either).
 *
 * An empty pattern (`{}`, or no keys at all) NEVER matches, regardless of
 * work product. `Object.entries({}).every(...)` is vacuously true, which
 * would otherwise make an empty pattern match every possible response --
 * exactly the "matches everything and nothing" footgun this codebase
 * already flags for the authoring side (ecdVocabulary.js's
 * RESPONSE_PATTERN_FIELDS comments) but had not, before this check, guarded
 * against on the matching side too. Caught by an adversarial review of this
 * module (Day 27).
 */
function matchesResponsePattern(pattern, workProduct) {
  if (!pattern || typeof pattern !== "object") return false;
  if (Object.keys(pattern).length === 0) return false;
  if (!workProduct || typeof workProduct !== "object") return false;

  return Object.entries(pattern).every(([key, expected]) => {
    const actual = workProduct[key];
    const expectedValues = Array.isArray(expected) ? expected : [expected];
    const actualValues = Array.isArray(actual) ? actual : [actual];
    return actualValues.some((a) => expectedValues.includes(a));
  });
}

/**
 * Identify the Observable Variable value a work product provides for one
 * Item, by matching it against the Item's evidenceActivationMap and
 * resolving the bound Evidence Model's observable + evidenceRule.
 *
 * Degrades gracefully (returns a result carrying a `warning`, never
 * throws) for data-quality problems it can't resolve: an unknown
 * evidenceModelId, a missing observable, or a work product that matches
 * none of the item's declared response patterns -- that last case is
 * itself a real, reportable outcome (the item's evidenceActivationMap is
 * incomplete), not a crash. Only throws for programmer errors (missing
 * required arguments), matching compositeLibrary/builder.js's convention.
 *
 * @param {object} workProduct - the raw response, e.g. `{ selected: "opt_a" }`
 * @param {object} item - a full items record (needs observationId,
 *   evidenceModelId, scoring.evidenceActivationMap)
 * @param {object} db - the full db snapshot (needs .evidenceModels)
 * @returns {{
 *   observationId: string,
 *   observableId: string|null,
 *   activated: boolean|null,
 *   direction: string|null,
 *   strength: number|null,
 *   rationale: string|null,
 *   warning?: string,
 * }}
 */
export function identifyEvidence(workProduct, item, db) {
  if (!item || !item.observationId) {
    throw new Error("identifyEvidence requires an item with an observationId.");
  }
  if (!db) {
    throw new Error("identifyEvidence requires a db snapshot to resolve the bound evidenceModel.");
  }

  const evidenceModel = (db.evidenceModels || []).find((em) => em.id === item.evidenceModelId);

  if (!evidenceModel) {
    return {
      observationId: item.observationId,
      observableId: null,
      activated: null,
      direction: null,
      strength: null,
      rationale: null,
      warning: `Item '${item.id}' references unknown evidenceModelId '${item.evidenceModelId}'.`,
    };
  }

  const observable = evidenceModel.observables?.find((o) => o.id === item.observationId);

  if (!observable) {
    return {
      observationId: item.observationId,
      observableId: null,
      activated: null,
      direction: null,
      strength: null,
      rationale: null,
      warning: `Evidence model '${evidenceModel.id}' has no observable '${item.observationId}'.`,
    };
  }

  // The same dual-location fallback schema.js's own validator and
  // compositeLibrary/builder.js both use: an evidenceRule may be embedded
  // on the observable, or looked up from the evidence model's top-level
  // evidenceRules[] keyed by observableId.
  const evidenceRuleByObservableId = new Map(
    (evidenceModel.evidenceRules || []).map((r) => [r.observableId, r])
  );
  const evidenceRule = observable.evidenceRule || evidenceRuleByObservableId.get(observable.id) || null;

  const activationMap = item.scoring?.evidenceActivationMap || [];
  const matchedEntry = activationMap.find((entry) => matchesResponsePattern(entry.responsePattern, workProduct));

  if (!matchedEntry) {
    return {
      observationId: item.observationId,
      observableId: observable.id,
      activated: null,
      direction: evidenceRule?.direction ?? null,
      strength: null,
      rationale: null,
      warning: `Work product did not match any declared responsePattern on item '${item.id}'.`,
    };
  }

  // A matched entry missing `activatesObservable` (an authoring mistake --
  // schema.js requires it be a strict boolean at confirm-time, but this
  // function accepts any item argument and shouldn't silently coerce
  // `undefined` to `false`, indistinguishable from a deliberate
  // non-activating rule). Caught by an adversarial review of this module.
  if (typeof matchedEntry.activatesObservable !== "boolean") {
    return {
      observationId: item.observationId,
      observableId: observable.id,
      activated: null,
      direction: evidenceRule?.direction ?? null,
      strength: null,
      rationale: matchedEntry.rationale ?? null,
      warning: `Item '${item.id}''s matched activation rule does not declare activatesObservable as a boolean.`,
    };
  }

  return {
    observationId: item.observationId,
    observableId: observable.id,
    activated: matchedEntry.activatesObservable,
    direction: evidenceRule?.direction ?? null,
    strength: matchedEntry.strengthOverride ?? evidenceRule?.strengthLevel ?? null,
    rationale: matchedEntry.rationale ?? evidenceRule?.justification ?? null,
  };
}
