// ecdClaimTaxonomy.js
// 🧠 ECD Claim Construction Taxonomy
// Central vocabulary for Claim Builder

export const ecdClaimTaxonomy = {

  /* =========================================================
     Cognitive Processes
     Based on Bloom's Revised Taxonomy + Reasoning Actions
  ========================================================= */

  cognitiveProcesses: {

    reasoning: {
      label: "Reasoning",
      actions: [
        "analyze",
        "compare",
        "evaluate",
        "critique",
        "justify",
        "reason about",
        "verify",
        "differentiate",
        "identify patterns"
      ]
    },

    application: {
      label: "Application",
      actions: [
        "apply",
        "implement",
        "solve",
        "determine",
        "derive",
        "use"
      ]
    },

    construction: {
      label: "Construction",
      actions: [
        "construct",
        "formulate",
        "design",
        "develop",
        "generate",
        "model"
      ]
    },

    investigation: {
      label: "Investigation",
      actions: [
        "investigate",
        "explore",
        "examine",
        "test",
        "probe"
      ]
    },

    understanding: {
      label: "Understanding",
      actions: [
        "interpret",
        "explain",
        "describe",
        "summarize",
        "classify",
        "categorize"
      ]
    }

  },

  /* =========================================================
     Range Selections
     Scope of contexts/tasks where competency is demonstrated
  ========================================================= */

  rangeOptions: [

    // task familiarity
    "routine situations",
    "routine and novel situations",
    "non-routine situations",

    // representation variation
    "varied representations",
    "multiple representations",

    // contextual variation
    "real-world contexts",
    "abstract contexts",
    "familiar and unfamiliar contexts",

    // complexity variation
    "increasingly complex problems",
    "multi-step problems",

    // task diversity
    "diverse problem structures",
    "structured and unstructured tasks",
    "varied task formats"
  ],

  /* =========================================================
     Transfer Conditions
     Independence / generalization expectations
  ========================================================= */

  transferConditions: [

    // independence
    "apply reasoning independently",
    "operate without scaffolding",
    "perform without procedural prompts",
    "perform without external support",

    // generalization
    "generalize to unfamiliar contexts",
    "transfer reasoning across contexts",
    "apply knowledge in novel situations",

    // adaptability
    "adapt strategies to new problems",
    "modify procedures for new contexts",

    // consistency
    "demonstrate consistent reasoning",
    "perform reliably across tasks"
  ]

};