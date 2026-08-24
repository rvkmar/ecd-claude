// attributeAlignment.js
// 🧠 Shared vocabulary bridge for the Evidence Wizard's diagnostics
// -----------------------------------------------------------------------------
// WHY THIS EXISTS
//
// Three engines judge whether the warrants an author has written actually
// cover what the claim promises:
//
//   • diagnostics/evidenceDiagnostics.js  -> "Evidence Coverage" score card
//   • engines/warrantCoverageOptimizer.js -> "Evidence Structure Health"
//   • engines/evidenceGapEngine.js        -> "Evidence Gap Recommendations"
//
// All three used to compare an EXPECTED attribute phrase against a warrant's
// cognitiveAttribute with plain string equality, and each carried its own
// hand-written list of expected phrases ("procedural fluency", "conceptual
// understanding", "representation competence", ...).
//
// Warrants never carry those phrases. CognitiveAttributeSelector writes the
// LABEL of an attribute from cognitiveAttributeOntology.js -- "Concept
// Identification", "Algorithm Execution", "Deductive Inference" -- so the
// comparison could not match even when the warrant was squarely on target.
// The result was a panel that disagreed with the warrants on screen:
// coverage stuck low, an attribute-gap recommendation for every phrase in the
// hard-coded list, and a structure-health score pinned near zero however good
// the evidence set was.
//
// The fix is to compare at the level both sides can actually agree on: the
// cognitive PROCESS FAMILY. Every ontology attribute belongs to a domain,
// every claim verb in cognitiveActionLexicon.js belongs to a process type,
// and the two map onto the same six families below. A warrant tagged
// "Algorithm Execution" and a claim saying "solve" now meet in `procedural`.
//
// Free-text attributes (the suggestion engine writes prose like "conceptual
// understanding") resolve through keyword matching, so both authoring paths
// land in the same family.
//
// The other half of the misalignment was literal substring matching for
// state / construct / prerequisite coverage -- `reasoningStatement.includes(
// stateLabel)` is false unless the author quoted the label verbatim. See
// `mentions()` below.

import { cognitiveAttributeOntology } from "../vocabulary/cognitiveAttributeOntology";
import { cognitiveActionLexicon } from "../vocabulary/cognitiveActionLexicon";

/* =====================================================
   Text utilities
===================================================== */

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "of", "to", "in", "on", "for", "with", "at",
  "by", "from", "is", "are", "be", "being", "been", "as", "that", "this",
  "these", "those", "it", "its", "can", "will", "student", "students",
  "learner", "learners", "level", "stage"
]);

export function normalizeText(value = "") {
  return String(value == null ? "" : value)
    .toLowerCase()
    .replace(/[‐-―]/g, "-")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function contentTokens(value = "") {
  return normalizeText(value)
    .split(" ")
    .filter(t => t.length > 2 && !STOPWORDS.has(t));
}

/* Does `haystack` refer to `needle`?

   Literal `includes()` was the old test and it almost never fired: an author
   writing a warrant about the "Developing" state says "partially correct
   procedures", not the word "Developing". This accepts an exact phrase match
   OR a majority overlap of the needle's content words, which is close enough
   to "this warrant is talking about that thing" without demanding a quote.

   A needle with no content words at all (an unlabelled state) matches
   nothing rather than everything -- reporting a gap the author can see is
   better than silently marking it covered. */
export function mentions(haystack = "", needle = "", ratio = 0.6) {
  const hay = normalizeText(haystack);
  const need = normalizeText(needle);

  if (!need) return false;
  if (!hay) return false;
  if (hay.includes(need)) return true;

  const needTokens = contentTokens(need);
  if (!needTokens.length) return false;

  const hayTokens = new Set(contentTokens(hay));
  const hit = needTokens.filter(t => hayTokens.has(t)).length;

  return hit / needTokens.length >= ratio;
}

/* Everything an author actually typed into a warrant. State / construct /
   prerequisite coverage used to look only at `reasoningStatement`, which is
   auto-generated from the other fields and therefore the LEAST likely place
   for a domain term the author typed once in, say, the performance
   condition. */
export function warrantText(warrant = {}) {
  return [
    warrant?.reasoningStatement,
    warrant?.observableEvidence,
    warrant?.performanceCondition,
    warrant?.warrantRule,
    warrant?.backingEvidence,
    warrant?.limitationClause || warrant?.rebuttalCondition,
    warrant?.cognitiveAttribute
  ]
    .filter(Boolean)
    .join(" . ");
}

/* =====================================================
   Cognitive process families
===================================================== */

export const ATTRIBUTE_FAMILIES = {

  conceptual: {
    id: "conceptual",
    label: "Conceptual Understanding",
    description: "Meaning, structure and relationships between ideas.",
    domains: ["KNOW"],
    keywords: [
      "concept", "conceptual", "understand", "comprehen", "meaning",
      "knowledge", "definition", "schema", "interpret", "recogni",
      "classif", "differentiat", "relationship"
    ]
  },

  procedural: {
    id: "procedural",
    label: "Procedural Execution",
    description: "Carrying out learned procedures accurately and fluently.",
    domains: ["PROC"],
    keywords: [
      "procedur", "fluenc", "algorithm", "comput", "calculat", "execut",
      "manipulat", "technical skill", "accuracy", "automatic", "apply",
      "application"
    ]
  },

  reasoning: {
    id: "reasoning",
    label: "Analytical Reasoning",
    description: "Logical inference, argument and explanation.",
    domains: ["REASON"],
    keywords: [
      "reason", "logic", "deduc", "induc", "infer", "argument", "justif",
      "explan", "explain", "proof", "prove", "analy", "critique",
      "counterexample"
    ]
  },

  modeling: {
    id: "modeling",
    label: "Model Construction & Representation",
    description: "Building and translating between representations.",
    domains: [],
    categories: ["representation_transformation", "model_construction"],
    keywords: [
      "model", "represent", "translat", "encod", "formulat", "diagram",
      "symbolic translation", "notation", "abstraction"
    ]
  },

  strategic: {
    id: "strategic",
    label: "Strategic Problem Solving",
    description: "Choosing, planning and evaluating approaches.",
    domains: ["STRAT", "PROB"],
    keywords: [
      "strateg", "plan", "decision", "decompos", "optimi", "heuristic",
      "problem", "solution", "select", "evaluat", "compar", "design"
    ]
  },

  metacognitive: {
    id: "metacognitive",
    label: "Metacognitive Regulation",
    description: "Monitoring, checking and adjusting one's own work.",
    domains: ["META"],
    keywords: [
      "metacog", "monitor", "regulat", "reflect", "self ", "self-",
      "error detection", "error correction", "progress tracking", "awareness"
    ]
  }

};

/* Deterministic order used to break keyword-score ties, most specific first.
   Without it, an attribute matching two families equally would resolve
   differently depending on object key order. */
const FAMILY_PRIORITY = [
  "metacognitive",
  "modeling",
  "reasoning",
  "strategic",
  "procedural",
  "conceptual"
];

/* cognitiveActionLexicon process key -> family id. The lexicon is what the
   claim text is read through; the ontology is what warrants are tagged from.
   This is the join between them. */
const LEXICON_TO_FAMILY = {
  procedural: "procedural",
  conceptual: "conceptual",
  reasoning: "reasoning",
  modeling: "modeling",
  strategic: "strategic"
};

/* =====================================================
   Ontology index
===================================================== */

function familyForOntologyNode(domainId, categoryId) {
  for (const family of Object.values(ATTRIBUTE_FAMILIES)) {
    if ((family.categories || []).includes(categoryId)) return family.id;
  }
  for (const family of Object.values(ATTRIBUTE_FAMILIES)) {
    if ((family.domains || []).includes(domainId)) return family.id;
  }
  return null;
}

/* label/id (normalized) -> { attributeId, label, categoryId, domainId, familyId } */
const ONTOLOGY_INDEX = (() => {
  const index = new Map();

  (cognitiveAttributeOntology?.domains || []).forEach(domain => {
    (domain.categories || []).forEach(category => {
      (category.attributes || []).forEach(attribute => {
        const entry = {
          attributeId: attribute.id,
          label: attribute.label,
          categoryId: category.id,
          categoryName: category.name,
          domainId: domain.id,
          domainName: domain.name,
          familyId: familyForOntologyNode(domain.id, category.id)
        };
        index.set(normalizeText(attribute.label), entry);
        index.set(normalizeText(attribute.id), entry);
      });

      // Category and domain names are legal answers too -- an author may tag
      // a warrant at that grain rather than picking a leaf attribute.
      const categoryEntry = {
        attributeId: null,
        label: category.name,
        categoryId: category.id,
        categoryName: category.name,
        domainId: domain.id,
        domainName: domain.name,
        familyId: familyForOntologyNode(domain.id, category.id)
      };
      if (!index.has(normalizeText(category.name))) {
        index.set(normalizeText(category.name), categoryEntry);
      }
    });

    const domainEntry = {
      attributeId: null,
      label: domain.name,
      categoryId: null,
      categoryName: null,
      domainId: domain.id,
      domainName: domain.name,
      familyId: familyForOntologyNode(domain.id, null)
    };
    if (!index.has(normalizeText(domain.name))) {
      index.set(normalizeText(domain.name), domainEntry);
    }
  });

  return index;
})();

export function lookupOntologyAttribute(value) {
  return ONTOLOGY_INDEX.get(normalizeText(value)) || null;
}

/* =====================================================
   Family resolution
===================================================== */

function familyByKeyword(value) {
  const text = normalizeText(value);
  if (!text) return null;

  let best = null;
  let bestScore = 0;

  FAMILY_PRIORITY.forEach(id => {
    const family = ATTRIBUTE_FAMILIES[id];
    const score = (family.keywords || [])
      .filter(k => text.includes(normalizeText(k)))
      .length;

    if (score > bestScore) {
      bestScore = score;
      best = id;
    }
  });

  return best;
}

/* Resolve any attribute expression -- an ontology label, an ontology id, a
   category or domain name, or free prose -- to a cognitive family id.
   Returns null when nothing matches, which callers must treat as "not
   comparable", never as "does not match". */
export function resolveAttributeFamily(value) {
  if (!value) return null;

  const known = lookupOntologyAttribute(value);
  if (known?.familyId) return known.familyId;

  return familyByKeyword(value);
}

export function familyLabel(familyId) {
  return ATTRIBUTE_FAMILIES[familyId]?.label || familyId || "";
}

/* Do two attribute expressions describe the same cognitive process?
   Falls back to normalized equality when either side is unresolvable, so an
   exact textual match is still honoured. */
export function attributesAlign(a, b) {
  if (!a || !b) return false;

  const normA = normalizeText(a);
  const normB = normalizeText(b);
  if (normA && normA === normB) return true;

  const famA = resolveAttributeFamily(a);
  const famB = resolveAttributeFamily(b);

  return Boolean(famA && famB && famA === famB);
}

/* =====================================================
   Claim -> expected families
===================================================== */

function matchesVerb(text, verb) {
  // Word-boundary match so "use" does not fire on "because".
  return new RegExp(`(^| )${normalizeText(verb).replace(/ /g, " ")}(e|es|ed|ing|s)?( |$)`)
    .test(text);
}

/* Every process family the claim's verbs point at.

   detectCognitiveAction() in the lexicon returns only the FIRST match, which
   is fine for picking a sentence template but wrong for coverage: a claim
   that says "solve and justify" expects two different kinds of evidence. */
export function inferExpectedFamiliesFromText(text = "") {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  const found = new Set();

  Object.entries(cognitiveActionLexicon).forEach(([processKey, config]) => {
    const familyId = LEXICON_TO_FAMILY[processKey];
    if (!familyId) return;

    if ((config.verbs || []).some(verb => matchesVerb(normalized, verb))) {
      found.add(familyId);
    }
  });

  return FAMILY_PRIORITY.filter(id => found.has(id));
}

/* Families the current warrant set actually provides evidence for. */
export function coveredFamilies(warrants = []) {
  const covered = new Set();

  (Array.isArray(warrants) ? warrants : []).forEach(w => {
    const family = resolveAttributeFamily(w?.cognitiveAttribute);
    if (family) covered.add(family);
  });

  return covered;
}

/* familyId -> number of warrants supporting it. Unresolvable attributes are
   grouped under their own normalized text so they are still counted rather
   than silently dropped. */
export function familyCounts(warrants = []) {
  const counts = {};

  (Array.isArray(warrants) ? warrants : []).forEach(w => {
    const raw = w?.cognitiveAttribute;
    if (!raw) return;

    const key = resolveAttributeFamily(raw) || normalizeText(raw);
    counts[key] = (counts[key] || 0) + 1;
  });

  return counts;
}
