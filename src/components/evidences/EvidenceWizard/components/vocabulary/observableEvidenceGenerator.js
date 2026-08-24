// /components/vocabulary/observableEvidenceGenerator.js
// 🧠 Observable Evidence Generator (Enterprise ECD)
// ------------------------------------------------------------------
// Generates high-quality observable student behaviour statements
// used for constructing warrants in Evidence-Centered Design.
//
// Evidence statements are derived from:
// • Claim cognitive action
// • Competency structure (domain → strand → facet)
// • Domain vocabulary
// • Evidence Pattern Library
//
// Design goals:
// ✔ Observable student behaviour
// ✔ Avoid vague "solve problems" phrasing
// ✔ Align evidence with claim cognitive action
// ✔ Support multiple evidence types (procedural / conceptual / reasoning / representation / strategic)

import { detectCognitiveAction } from "./cognitiveActionLexicon";
import { generateDomainVocabulary } from "./domainLexicon";
import { evidencePatterns } from "./evidencePatternLibrary";


/* =====================================================
   Utilities
===================================================== */

function unique(arr = []) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function lower(text = "") {
  return String(text || "").toLowerCase();
}

function safe(text = "") {
  return String(text || "").trim();
}


/* =====================================================
   Resolve Evidence Pattern From Action
===================================================== */

function resolvePatterns(actionType) {

  const patterns = [];

  if (actionType && evidencePatterns[actionType]) {
    patterns.push(evidencePatterns[actionType]);
  }

  // representation evidence is almost always useful

  if (evidencePatterns.representation) {
    patterns.push(evidencePatterns.representation);
  }

  // reasoning evidence for conceptual tasks

  if (actionType === "conceptual" || actionType === "reasoning") {

    if (evidencePatterns.reasoning) {
      patterns.push(evidencePatterns.reasoning);
    }

  }

  return patterns;

}


/* =====================================================
   Expand Pattern Evidence
===================================================== */

function expandPatternEvidence(pattern, facet) {

  if (!pattern || !pattern.behaviors) return [];

  try {

    return pattern.behaviors(facet);

  } catch (e) {

    return [];

  }

}


/* =====================================================
   Domain Vocabulary Evidence
===================================================== */

function expandDomainEvidence(domainVocabulary = {}) {

  const evidence = [];

  const behaviors = domainVocabulary.behaviors || [];

  behaviors.forEach(b => {

    const phrase = lower(b);

    evidence.push(

      `produces valid ${phrase}`,

      `interprets ${phrase} correctly`,

      `constructs ${phrase} appropriately`,

      `explains meaning of ${phrase}`

    );

  });

  return evidence;

}


/* =====================================================
   Facet Evidence
===================================================== */

function expandFacetEvidence(facet) {

  const f = lower(facet);

  return [

    `correctly interprets ${f}`,

    `explains relationships represented in ${f}`,

    `constructs valid ${f}`,

    `translates problems into ${f}`,

    `uses ${f} appropriately in mathematical reasoning`

  ];

}


/* =====================================================
   Observable Evidence Generator
===================================================== */

export function generateObservableEvidence({

  competency,
  claimText

}) {

  if (!competency) return [];


  const actionInfo = detectCognitiveAction(claimText);

  const actionType = actionInfo?.actionType;


  const domainVocabulary = generateDomainVocabulary(competency);


  const facet = (

    safe(competency.facet) ||

    safe(domainVocabulary.domainPhrase)

  ).toLowerCase();

  /* ---------------------------------------------
     Evidence Patterns
  --------------------------------------------- */

  const patterns = resolvePatterns(actionType);


  const patternEvidence = [];

  patterns.forEach(pattern => {

    patternEvidence.push(

      ...expandPatternEvidence(pattern, facet)

    );

  });


  /* ---------------------------------------------
     Domain Evidence
  --------------------------------------------- */

  const domainEvidence = expandDomainEvidence(domainVocabulary);


  /* ---------------------------------------------
     Facet Evidence
  --------------------------------------------- */

  const facetEvidence = expandFacetEvidence(facet);


  /* ---------------------------------------------
     Combine Evidence
  --------------------------------------------- */

  return unique([

    ...patternEvidence,

    ...domainEvidence,

    ...facetEvidence

  ]);

}


/* =====================================================
   Convert Evidence → Warrant Behaviors
===================================================== */

export function generateEvidenceBehaviors({

  competency,
  claimText

}) {

  const evidence = generateObservableEvidence({

    competency,

    claimText

  });


  return evidence.map(e => `the student ${e}`);

}
