// /ecd/vocabulary/evidencePatternLibrary.js
// 🧠 Evidence Pattern Library
// ----------------------------------------------------
// Structured templates used to generate high-quality
// ECD warrants.
//
// Inspired by operational evidence models used in
// ETS / Pearson / SmarterBalanced.
//
// Each pattern describes:
//  • evidence behavior
//  • cognitive attribute
//  • reasoning rule
//  • theoretical backing
//  • rebuttal condition
//
// These patterns prevent repetitive or weak warrants
// generated from raw verbs.


/* =====================================================
   Procedural Evidence Pattern
===================================================== */

export const proceduralPattern = {

  id: "procedural",

  attributes: [
    "procedural fluency",
    "procedural execution skill"
  ],

  behaviors: (facet) => [

    `correctly executes procedures involving ${facet}`,
    `produces correct symbolic manipulations involving ${facet}`,
    `applies procedures accurately in tasks involving ${facet}`

  ],

  rules: (facet) => [

    `successful performance requires procedural fluency in ${facet}`,
    `accurate responses depend on correct procedural execution in ${facet}`

  ],

  backing: [

    "research in mathematics cognition linking procedural skill to task performance",
    "learning progression research describing development of procedural fluency"

  ],

  rebuttal: [

    "responses result from guessing",
    "procedural shortcuts bypass conceptual reasoning"

  ]

};


/* =====================================================
   Conceptual Evidence Pattern
===================================================== */

export const conceptualPattern = {

  id: "conceptual",

  attributes: [
    "conceptual understanding",
    "conceptual knowledge"
  ],

  behaviors: (facet) => [

    `explains relationships within ${facet}`,
    `interprets symbolic structures involving ${facet}`,
    `identifies conceptual relationships in ${facet}`

  ],

  rules: (facet) => [

    `correct responses require conceptual understanding of ${facet}`,
    `interpreting tasks requires understanding relationships within ${facet}`

  ],

  backing: [

    "research on conceptual development in mathematics",
    "cognitive theory describing conceptual knowledge structures"

  ],

  rebuttal: [

    "students rely on memorized patterns",
    "tasks permit correct answers without conceptual reasoning"

  ]

};


/* =====================================================
   Representation Evidence Pattern
===================================================== */

export const representationPattern = {

  id: "representation",

  attributes: [
    "representation competence",
    "representation translation ability"
  ],

  behaviors: (facet) => [

    `constructs valid representations involving ${facet}`,
    `translates problems into representations involving ${facet}`,
    `interprets representations involving ${facet}`

  ],

  rules: (facet) => [

    `constructing correct solutions requires translating problems into representations of ${facet}`,
    `successful performance requires constructing valid representations involving ${facet}`

  ],

  backing: [

    "research on representational competence in mathematics learning",
    "studies on representation use in problem solving"

  ],

  rebuttal: [

    "representations are explicitly provided in the task",
    "tasks allow solving without constructing representations"

  ]

};


/* =====================================================
   Reasoning Evidence Pattern
===================================================== */

export const reasoningPattern = {

  id: "reasoning",

  attributes: [
    "logical reasoning ability",
    "analytical reasoning"
  ],

  behaviors: (facet) => [

    `constructs logically valid arguments involving ${facet}`,
    `justifies solutions using reasoning about ${facet}`,
    `derives conclusions using reasoning involving ${facet}`

  ],

  rules: (facet) => [

    `valid solutions require logical reasoning involving ${facet}`,
    `deriving correct answers requires structured reasoning processes`

  ],

  backing: [

    "research on mathematical reasoning development",
    "cognitive theory describing reasoning processes"

  ],

  rebuttal: [

    "tasks permit guessing strategies",
    "tasks provide answer cues reducing reasoning demands"

  ]

};


/* =====================================================
   Strategy Evidence Pattern
===================================================== */

export const strategyPattern = {

  id: "strategy",

  attributes: [
    "strategic problem solving",
    "solution strategy selection"
  ],

  behaviors: (facet) => [

    `selects appropriate strategies for problems involving ${facet}`,
    `decomposes complex problems involving ${facet}`,
    `organizes solution steps strategically in ${facet}`

  ],

  rules: (facet) => [

    `successful performance requires selecting effective solution strategies`,
    `correct solutions depend on strategic decomposition of problems`

  ],

  backing: [

    "research on strategic competence in problem solving",
    "studies on problem-solving strategies in mathematics education"

  ],

  rebuttal: [

    "tasks prescribe solution procedures",
    "problem structure eliminates need for strategy selection"

  ]

};


/* =====================================================
   Master Pattern Library
===================================================== */

export const evidencePatterns = {

  procedural: proceduralPattern,

  conceptual: conceptualPattern,

  representation: representationPattern,

  reasoning: reasoningPattern,

  strategy: strategyPattern

};