// /ecd/vocabulary/domainLexicon.js
// 🧠 Domain Lexicon Generator
// Extracts vocabulary from the Competency Model structure
// Used by Claim Builder, Warrant Builder, Observable Generator

/* =========================================================
   Utility: Safe String
========================================================= */

function safe(text) {
  if (!text) return "";
  return String(text).trim();
}

/* =========================================================
   Utility: Title Case
========================================================= */

export function toTitleCase(text = "") {
  return text.replace(/\w\S*/g, (w) =>
    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  );
}

/* =========================================================
   Domain Phrase Generator
========================================================= */

export function buildDomainPhrase(competency) {

  if (!competency) return "";

  const facet = safe(competency.facet).toLowerCase();
  const strand = safe(competency.strand).toLowerCase();

  if (!facet && !strand) return "";

  if (facet && strand) {
    return `${facet} contexts in ${strand}`;
  }

  if (facet) return `${facet} contexts`;

  if (strand) return `${strand} contexts`;

  return "";
}

/* =========================================================
   Title Domain Phrase
========================================================= */

export function buildTitleDomainPhrase(competency) {

  const phrase = buildDomainPhrase(competency);
  return toTitleCase(phrase);

}

/* =========================================================
   Facet Vocabulary
========================================================= */

export function extractFacetTokens(competency) {

  const facet = safe(competency?.facet).toLowerCase();

  if (!facet) return [];

  return facet
    .split(/\s+/)
    .filter(t => t.length > 3);

}

/* =========================================================
   Generate Observable Behaviour Vocabulary
========================================================= */

export function generateFacetBehaviors(competency) {

  const facet = safe(competency?.facet).toLowerCase();

  if (!facet) return [];

  return [

    `correctly performs tasks involving ${facet}`,

    `demonstrates competence in ${facet}`,

    `applies procedures within ${facet}`,

    `produces valid responses in ${facet}`,

    `interprets structures involved in ${facet}`

  ];

}

/* =========================================================
   Generate Attribute Vocabulary
========================================================= */

export function generateFacetAttributes(competency) {

  const facet = safe(competency?.facet).toLowerCase();
  const strand = safe(competency?.strand).toLowerCase();

  const attrs = [];

  if (facet) {

    attrs.push(`${facet} competence`);
    attrs.push(`${facet} reasoning ability`);

  }

  if (strand) {

    attrs.push(`${strand} proficiency`);

  }

  return attrs;

}

/* =========================================================
   Performance Context Vocabulary
========================================================= */

export function generatePerformanceContexts() {

  return [

    "across routine tasks",

    "across increasingly complex tasks",

    "across multiple representations",

    "within unfamiliar contexts",

    "across varied problem formats"

  ];

}

/* =========================================================
   Inference Limitation Clauses
========================================================= */

export function generateInferenceLimitations() {

  return [

    "responses reflect genuine reasoning rather than guessing",

    "tasks require the targeted cognitive processes",

    "students interpret task instructions correctly",

    "responses reflect independent reasoning",

    "task difficulty aligns with the intended construct"

  ];

}

/* =========================================================
   Variable Type Interpretation
========================================================= */

export function interpretVariableType(competency) {

  const type = competency?.variableType;

  if (!type) return null;

  switch (type) {

    case "binary":
      return {
        levelClause: "at mastery level",
        measurementType: "mastery"
      };

    case "ordinal":
      return {
        levelClause: "across developmental proficiency levels",
        measurementType: "developmental"
      };

    case "continuous":

      if (
        typeof competency?.scale?.min === "number" &&
        typeof competency?.scale?.max === "number"
      ) {

        return {
          levelClause: `along a continuous proficiency continuum (${competency.scale.min} to ${competency.scale.max})`,
          measurementType: "continuous"
        };

      }

      return {
        levelClause: "along a continuous proficiency continuum",
        measurementType: "continuous"
      };

    case "categorical":
      return {
        levelClause: "as a dominant strategy profile",
        measurementType: "classification"
      };

    default:
      return null;

  }

}

/* =========================================================
   Main Domain Vocabulary Engine
========================================================= */

export function generateDomainVocabulary(competency) {

  return {

    domainPhrase: buildDomainPhrase(competency),

    titleDomainPhrase: buildTitleDomainPhrase(competency),

    facetTokens: extractFacetTokens(competency),

    behaviors: generateFacetBehaviors(competency),

    attributes: generateFacetAttributes(competency),

    performanceContexts: generatePerformanceContexts(),

    limitations: generateInferenceLimitations(),

    variableInterpretation: interpretVariableType(competency)

  };

}