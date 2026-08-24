// /ecd/vocabulary/cognitiveActionLexicon.js
// 🧠 Cognitive Action Lexicon
// Maps verbs appearing in claim statements to cognitive process types
// Used by Claim Builder, Warrant Builder, and Evidence Diagnostics

export const cognitiveActionLexicon = {

  /* =========================================================
     Procedural Processes
     Execution of learned procedures
  ========================================================= */

  procedural: {

    label: "Procedural Execution",

    verbs: [
      "solve",
      "apply",
      "compute",
      "calculate",
      "execute",
      "perform",
      "implement",
      "use",
      "carry out"
    ],

    inferenceType: "procedural_ability",

    typicalAttributes: [
      "procedural fluency",
      "procedural competence",
      "execution accuracy"
    ]

  },


  /* =========================================================
     Conceptual Understanding
     Meaning-based reasoning
  ========================================================= */

  conceptual: {

    label: "Conceptual Understanding",

    verbs: [
      "interpret",
      "explain",
      "describe",
      "summarize",
      "identify",
      "recognize",
      "classify",
      "differentiate"
    ],

    inferenceType: "conceptual_understanding",

    typicalAttributes: [
      "conceptual understanding",
      "knowledge of relationships",
      "structural comprehension"
    ]

  },


  /* =========================================================
     Analytical Reasoning
     Logical analysis of structures
  ========================================================= */

  reasoning: {

    label: "Analytical Reasoning",

    verbs: [
      "analyze",
      "reason",
      "deduce",
      "infer",
      "derive",
      "determine",
      "justify",
      "prove"
    ],

    inferenceType: "reasoning_ability",

    typicalAttributes: [
      "logical reasoning ability",
      "analytical reasoning",
      "deductive reasoning"
    ]

  },


  /* =========================================================
     Modeling / Representation
  ========================================================= */

  modeling: {

    label: "Model Construction",

    verbs: [
      "model",
      "represent",
      "formulate",
      "construct",
      "translate",
      "encode"
    ],

    inferenceType: "modeling_competence",

    typicalAttributes: [
      "representation construction ability",
      "modeling competence",
      "translation between representations"
    ]

  },


  /* =========================================================
     Strategic Thinking
  ========================================================= */

  strategic: {

    label: "Strategic Problem Solving",

    verbs: [
      "evaluate",
      "compare",
      "select",
      "choose",
      "optimize",
      "design",
      "plan",
      "critique"
    ],

    inferenceType: "strategic_competence",

    typicalAttributes: [
      "strategic reasoning ability",
      "decision-making competence",
      "problem decomposition ability"
    ]

  }

};


/* =========================================================
   Extract Cognitive Action From Claim
========================================================= */

export function detectCognitiveAction(claimText = "") {

  const claim = claimText.toLowerCase();

  for (const [type, config] of Object.entries(cognitiveActionLexicon)) {

    for (const verb of config.verbs) {

      if (claim.includes(verb)) {

        return {
          actionType: type,
          actionVerb: verb,
          config
        };

      }

    }

  }

  return {
    actionType: "general",
    actionVerb: null,
    config: null
  };

}