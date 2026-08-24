// src/utils/ecdVocabulary.js
// ------------------------------------------------------------
// The shared ECD response vocabulary: observable response modes,
// item interaction types, scoring methods, and the compatibility
// relations between them.
//
// WHY THIS FILE EXISTS
//
// These three vocabularies used to live in three places that had to be
// kept in step by hand:
//
//   observable.type        -> ObservableCard.observableTypes  (evidence wizard)
//   interaction.type       -> ResponseComponentEditor.INTERACTION_REGISTRY
//                             + taskModelConstants.INTERACTION_TYPES
//   scoring.method         -> ScoringMethodSelector.deriveAllowedScoringMethods
//                             + taskModelConstants.SCORING_METHODS
//
// They drifted, and the drift was fatal. src/utils/schema.js enforced
//
//     item.interaction.type === observable.type
//
// while the two enums had *no value in common*: observables are authored as
// selected_response / constructed_response / numeric_response / performance /
// artifact / behavior / process_trace, and interactions as
// mcq / multiselect / numeric / constructed / likert. Every item ever
// authored failed with "interaction.type must match observable.type", and
// no choice the author could make in the wizard would ever satisfy it.
//
// The equality rule was the real mistake, not just the drift. An
// observable's `type` is an EVIDENCE-level statement -- what kind of
// performance is being captured. An interaction's `type` is a DELIVERY-level
// statement -- which widget captures it. They sit at different levels of
// abstraction, so the relation between them is one-to-many compatibility,
// never identity: a `selected_response` observable is legitimately elicited
// by an MCQ, a multi-select or a Likert scale.
//
// This module is that relation, in one place, imported by BOTH sides
// (src/utils/* is bundled for the browser by vite and loaded directly by
// node, which is why schema.js already lives here). Nothing mirrors it.
// ------------------------------------------------------------

/* =====================================================
   1. Observable response modes (evidence-model level)
   Keep in step with ObservableCard's picker -- it renders from here.
===================================================== */

export const OBSERVABLE_RESPONSE_MODES = [
  {
    value: "selected_response",
    label: "Selected Response",
    hint: "Examinee chooses from presented options.",
  },
  {
    value: "constructed_response",
    label: "Constructed Response",
    hint: "Examinee authors free text, working or an explanation.",
  },
  {
    value: "numeric_response",
    label: "Numeric Response",
    hint: "Examinee supplies a number or quantity.",
  },
  {
    value: "performance",
    label: "Performance",
    hint: "Observed performance, rated against a rubric by an assessor.",
  },
  {
    value: "artifact",
    label: "Artifact",
    hint: "A produced work product is submitted and rated.",
  },
  {
    value: "behavior",
    label: "Behavior",
    hint: "A discrete observed behaviour is recorded.",
  },
  {
    value: "process_trace",
    label: "Process Trace",
    hint: "The sequence of actions taken is itself the evidence.",
  },
];

export const OBSERVABLE_RESPONSE_MODE_VALUES = OBSERVABLE_RESPONSE_MODES.map(
  (m) => m.value
);

/* =====================================================
   2. Interaction types (item / delivery level)
   Keep in step with ResponseComponentEditor.INTERACTION_REGISTRY --
   that registry supplies the EDITOR for each type; this list is the
   vocabulary. A type present here with no registry entry renders no
   editor, so add both together.
===================================================== */

export const INTERACTION_TYPES = [
  { value: "mcq", label: "Multiple Choice" },
  { value: "multiselect", label: "Multi Select" },
  { value: "numeric", label: "Numeric Input" },
  { value: "constructed", label: "Constructed Response" },
  { value: "likert", label: "Likert Scale" },
];

export const INTERACTION_TYPE_VALUES = INTERACTION_TYPES.map((t) => t.value);

export function interactionLabel(value) {
  return INTERACTION_TYPES.find((t) => t.value === value)?.label || value || "—";
}

/* =====================================================
   3. Compatibility: which interactions may elicit which observable
   -----------------------------------------------------
   An empty list means "no on-screen interaction can capture this
   observable" -- performance, artifact, behavior and process_trace are
   rated or logged, not answered, and the platform has no rater workflow
   yet. Those are deliberately NOT silently mapped onto `constructed`:
   pretending a rated performance is a text box would let an author
   confirm an item that collects the wrong evidence entirely. The wizard
   says so plainly instead and blocks the binding.
===================================================== */

export const INTERACTION_COMPATIBILITY = {
  selected_response: ["mcq", "multiselect", "likert"],
  constructed_response: ["constructed"],
  numeric_response: ["numeric"],
  performance: [],
  artifact: [],
  behavior: [],
  process_trace: [],
};

export function interactionTypesForObservable(observableType) {
  if (!observableType) return [];
  return INTERACTION_COMPATIBILITY[observableType] || [];
}

export function isInteractionCompatible(observableType, interactionType) {
  if (!observableType || !interactionType) return false;
  return interactionTypesForObservable(observableType).includes(interactionType);
}

/* Human-readable explanation of an incompatibility, used verbatim by both
   the wizard advisory and the server error so the author reads the same
   sentence in both places. */
export function interactionCompatibilityMessage(observableType, interactionType) {
  const allowed = interactionTypesForObservable(observableType);

  if (!observableType) {
    return "No observable is bound, so no interaction type can be checked.";
  }

  if (allowed.length === 0) {
    return `Observables of type '${observableType}' are rated or logged rather than answered on screen, so no interaction type can capture them yet. Bind an observable with a selected, constructed or numeric response mode.`;
  }

  if (!interactionType) {
    return `Choose an interaction type. '${observableType}' can be elicited by: ${allowed
      .map(interactionLabel)
      .join(", ")}.`;
  }

  return `Interaction '${interactionLabel(
    interactionType
  )}' cannot elicit a '${observableType}' observable. Allowed here: ${allowed
    .map(interactionLabel)
    .join(", ")}.`;
}

/* =====================================================
   4. Scoring methods, derived from the ACTIVE statistical model
   -----------------------------------------------------
   Single definition. ScoringMethodSelector and taskModelConstants both
   import from here; before this they each carried a copy and the comment
   at the top of each told the reader to keep them in step manually.
===================================================== */

export const SCORING_METHODS = [
  { value: "dichotomous", label: "Dichotomous (0 / 1)" },
  { value: "polytomous", label: "Polytomous (Ordered Categories)" },
  { value: "category_map", label: "Category Mapping" },
  { value: "weighted_sum", label: "Weighted Sum" },
  { value: "categorical_activation", label: "Categorical Activation" },
];

export const SCORING_METHOD_VALUES = SCORING_METHODS.map((m) => m.value);

export function scoringLabel(value) {
  return SCORING_METHODS.find((m) => m.value === value)?.label || value || "—";
}

export function deriveAllowedScoringMethods(model) {
  if (!model) return [];

  const { type, subtype } = model;

  switch (type) {
    case "rasch":
      return ["dichotomous"];

    case "irt":
      if (subtype === "graded" || subtype === "grm") return ["polytomous"];
      return ["dichotomous"];

    case "threshold":
      return ["category_map"];

    // Classical Test Theory scores the observable itself, then totals.
    // Which is right depends on the observable, not on the model: a 0/1
    // observable is dichotomous, a weighted contribution is a weighted sum
    // -- so both are offered.
    case "ctt":
      return ["dichotomous", "weighted_sum"];

    case "sum":
      return ["weighted_sum"];

    case "bayesian_network":
      return ["categorical_activation"];

    default:
      return [];
  }
}

/* =====================================================
   5. Response-pattern shape per scoring method
   -----------------------------------------------------
   `scoring.evidenceActivationMap[].responsePattern` is declared as a bare
   'object' in the schema, which meant the editor could write any shape and
   nothing downstream could read it. These descriptors give the editor its
   fields and give validation something to check.
===================================================== */

export const RESPONSE_PATTERN_FIELDS = {
  dichotomous: [
    { key: "equalsCorrect", label: "Response is correct", type: "boolean" },
  ],
  polytomous: [
    { key: "categoryValue", label: "Category value", type: "number" },
  ],
  weighted_sum: [
    { key: "minScore", label: "Minimum raw score", type: "number" },
    { key: "maxScore", label: "Maximum raw score", type: "number" },
  ],
  category_map: [
    { key: "categoryLabel", label: "Category label", type: "string" },
  ],
  categorical_activation: [{ key: "state", label: "State", type: "string" }],
};

export function responsePatternFields(method) {
  return RESPONSE_PATTERN_FIELDS[method] || [];
}

/* True when the pattern has at least one of the fields its method
   declares filled in. An empty `{}` is not a condition -- it matches
   everything and nothing, and used to sail through validation because
   `{}` is truthy. */
export function responsePatternIsSpecified(method, pattern) {
  const fields = responsePatternFields(method);
  if (fields.length === 0) return true;
  if (!pattern || typeof pattern !== "object") return false;

  return fields.some((f) => {
    const v = pattern[f.key];
    if (f.type === "boolean") return typeof v === "boolean";
    if (f.type === "number") return typeof v === "number" && Number.isFinite(v);
    return String(v ?? "").trim().length > 0;
  });
}
