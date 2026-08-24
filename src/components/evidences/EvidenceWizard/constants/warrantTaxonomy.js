// ecdWarrantTaxonomy.js
// 🧠 Evidence-Centered Design Warrant Construction Taxonomy
// Vocabulary used by the Warrant Builder Engine
// Designed for operational ECD assessment systems

export const ecdWarrantTaxonomy = {

  /* =========================================================
     Observable Evidence Behaviors
     What we can directly observe from student responses
  ========================================================= */

  evidenceBehaviors: [
    "correctly solves algebraic equations",
    "produces logically valid reasoning steps",
    "constructs mathematically valid representations",
    "applies algebraic procedures accurately",
    "identifies relevant mathematical relationships",
    "interprets symbolic expressions correctly",
    "justifies solution strategies using mathematical reasoning",
    "demonstrates consistent reasoning across problems",
    "constructs algebraic models of contextual situations",
    "translates contextual descriptions into equations",
    "selects appropriate problem-solving strategies",
    "recognizes structural patterns in expressions",
    "verifies the correctness of derived solutions",
    "connects multiple mathematical representations",
    "interprets solution meaning within contextual problems"
  ],

  /* =========================================================
     Cognitive Attributes
     Latent capabilities inferred from evidence
  ========================================================= */

  cognitiveAttributes: [
    "procedural fluency in algebraic manipulation",
    "conceptual understanding of algebraic relationships",
    "symbolic reasoning ability",
    "ability to manipulate algebraic expressions",
    "strategic problem-solving capability",
    "mathematical modeling competence",
    "logical reasoning ability",
    "structural pattern recognition ability",
    "ability to translate between mathematical representations",
    "ability to decompose complex problems into solvable components",
    "ability to interpret mathematical structures",
    "ability to apply algebraic reasoning in contextual situations",
    "ability to justify mathematical conclusions using valid reasoning"
  ],

  /* =========================================================
     Performance Conditions
     Contexts where the evidence is considered valid
  ========================================================= */

  performanceConditions: [
    "across routine algebraic problems",
    "across problems involving varied mathematical representations",
    "across increasingly complex algebraic problems",
    "within unfamiliar problem contexts",
    "across multiple problem formats",
    "within contextualized real-world tasks",
    "across both symbolic and graphical representations",
    "within problems requiring multi-step reasoning",
    "across tasks requiring representation translation",
    "within problems requiring strategic solution planning",
    "across problems requiring interpretation of symbolic structures"
  ],

  /* =========================================================
     Validity Assumptions / Limitation Clauses
     Conditions under which the inference may fail
  ========================================================= */

  limitationClauses: [
    "task performance reflects genuine reasoning rather than guessing",
    "tasks require the targeted cognitive processes",
    "the student interprets task instructions correctly",
    "responses reflect the student's independent reasoning",
    "procedural shortcuts do not mask conceptual misunderstandings",
    "task difficulty lies within the intended construct scope",
    "the observed behavior cannot be produced by superficial pattern matching",
    "students are not relying solely on memorized answer patterns",
    "tasks adequately represent the targeted construct domain",
    "task performance is not substantially influenced by reading difficulty"
  ]
};