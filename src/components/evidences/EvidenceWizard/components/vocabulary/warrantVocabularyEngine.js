// /components/vocabulary/warrantVocabularyEngine.js
// 🧠 Enterprise ECD Warrant Vocabulary Engine
// -------------------------------------------------------
// Generates vocabulary for the Warrant Builder using:
//
// • Claim cognitive action
// • Competency model structure
// • Domain vocabulary
// • Evidence pattern library
// • Observable evidence generator
//
// Ensures vocabulary is:
// ✔ grammatically correct
// ✔ observable
// ✔ aligned to ECD argument structures

import { detectCognitiveAction } from "./cognitiveActionLexicon";
import { generateDomainVocabulary } from "./domainLexicon";
import { generateObservableEvidence } from "./observableEvidenceGenerator";
import { evidencePatterns } from "./evidencePatternLibrary";

/* =========================================================
   Utilities
========================================================= */

function unique(arr = []) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function safe(text = "") {
  return String(text || "").trim();
}

function lower(text = "") {
  return safe(text).toLowerCase();
}


/* =========================================================
   Observable Behaviour Vocabulary
========================================================= */

function buildObservableBehaviors({
  competency,
  claimText,
  domainVocabulary
}) {

  const evidenceFromEngine =
    generateObservableEvidence({
      competency,
      claimText
    });

  const domainBehaviors =
    domainVocabulary?.behaviors || [];

  const behaviors = [];

  evidenceFromEngine.forEach(e =>
    behaviors.push(e)
  );

  domainBehaviors.forEach(b =>
    behaviors.push(b)
  );

  return unique(behaviors);

}


/* =========================================================
   Cognitive Attribute Vocabulary
========================================================= */

function buildAttributes({
  actionType,
  actionConfig,
  domainVocabulary
}) {

  const attrs = [];

  /* Attributes from cognitive action */

  if (actionConfig?.typicalAttributes) {

    actionConfig.typicalAttributes
      .forEach(a => attrs.push(a));

  }

  /* Domain-specific attributes */

  (domainVocabulary.attributes || [])
    .forEach(a => attrs.push(a));

  /* Evidence pattern attributes */

  Object.values(evidencePatterns)
    .forEach(pattern => {

      pattern.attributes?.forEach(a =>
        attrs.push(a)
      );

    });

  return unique(attrs);

}


/* =========================================================
   Performance Context Vocabulary
========================================================= */

function buildConditions(domainVocabulary = {}) {

  const contexts =
    domainVocabulary.performanceContexts || [];

  return unique(contexts);

}


/* =========================================================
   Limitation / Rebuttal Vocabulary
========================================================= */

function buildLimitations(domainVocabulary = {}) {

  const limits = [];

  (domainVocabulary.limitations || [])
    .forEach(l => limits.push(l));

  limits.push(

    "responses result from guessing",

    "students rely on superficial pattern recognition",

    "tasks do not require the targeted reasoning process",

    "procedural shortcuts bypass conceptual reasoning",

    "task interpretation errors occur"

  );

  return unique(limits);

}


/* =========================================================
   Warrant Rule Generator
========================================================= */

function buildWarrantRules({
  actionType,
  competency
}) {

  const facet =
    lower(competency?.facet || "the target construct");

  const rules = [];

  /* Procedural inference */

  if (actionType === "procedural") {

    rules.push(

      `successful task performance requires procedural fluency in ${facet}`,

      `correct responses depend on accurate procedural execution in ${facet}`

    );

  }

  /* Conceptual inference */

  if (actionType === "conceptual") {

    rules.push(

      `correct responses require conceptual understanding of ${facet}`,

      `interpreting the task requires understanding relationships within ${facet}`

    );

  }

  /* Reasoning inference */

  if (actionType === "reasoning") {

    rules.push(

      `valid solutions require logical reasoning processes within ${facet}`,

      `deriving correct conclusions requires structured reasoning within ${facet}`

    );

  }

  /* Modeling inference */

  if (actionType === "modeling") {

    rules.push(

      `successful performance requires constructing representations of ${facet}`,

      `solving tasks requires translating situations into representations of ${facet}`

    );

  }

  /* Strategic inference */

  if (actionType === "strategic") {

    rules.push(

      "successful performance requires selecting effective solution strategies",

      "correct solutions depend on strategic decomposition of problems"

    );

  }

  return unique(rules);

}


/* =========================================================
   Backing Evidence Generator
========================================================= */

function buildBackingEvidence(competencyModel) {

  const sources = [];

  if (competencyModel?.constructFramework?.reference) {

    sources.push(
      competencyModel.constructFramework.reference
    );

  }

  sources.push(

    "empirical research on cognitive skill development",

    "learning progression research in the domain",

    "assessment validity research",

    "cognitive theory describing skill acquisition"

  );

  return unique(sources);

}


/* =========================================================
   Warrant Statement Generator
========================================================= */

export function generateWarrantStatement({

  behavior,
  condition,
  attribute,
  rule,
  backing,
  limitation

}) {

return `Observed evidence that the student ${behavior} ${condition} provides support for the inference that the student possesses ${attribute}.

This inference is justified because ${rule}.

This interpretation is supported by ${backing}.

However, this inference may not hold if ${limitation}.`;

}


/* =========================================================
   Main Vocabulary Engine
========================================================= */

export function generateWarrantVocabulary({

  competency,
  competencyModel,
  claimText

}) {

  if (!competency) return null;

  const actionInfo =
    detectCognitiveAction(claimText);

  const domainVocabulary =
    generateDomainVocabulary(competency);


  const behaviors =
    buildObservableBehaviors({

      competency,
      claimText,
      domainVocabulary

    });


  const attributes =
    buildAttributes({

      actionType: actionInfo?.actionType,
      actionConfig: actionInfo?.config,
      domainVocabulary

    });


  const conditions =
    buildConditions(domainVocabulary);


  const limitations =
    buildLimitations(domainVocabulary);


  const warrantRules =
    buildWarrantRules({

      actionType: actionInfo?.actionType,
      competency

    });


  const backingEvidence =
    buildBackingEvidence(competencyModel);


  return {

    actionType: actionInfo?.actionType,

    behaviors,

    attributes,

    conditions,

    limitations,

    warrantRules,

    backingEvidence,

    domainPhrase:
      domainVocabulary.domainPhrase,

    variableInterpretation:
      domainVocabulary.variableInterpretation

  };

}