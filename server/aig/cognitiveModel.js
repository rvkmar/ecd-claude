// cognitiveModel.js
// Paper-faithful cognitive model
// Source: Sayın et al. (2023) – Automatic Item Generation for Non‑Verbal Reasoning Items

export const cognitiveModel = {
  id: "nonverbal_visual_reasoning_sayin_2023",

  description:
    "Cognitive model strictly aligned with Sayın et al. (2023) for non‑verbal matrix reasoning items.",

  // ----------------------------
  // Element definitions (Table 1 in the paper)
  // ----------------------------
  elements: {
    // ----------------------------
    // Shapes used across all models
    // ----------------------------
    shapes: ["square", "triangle", "circle", "hexagon"],

    // ----------------------------
    // Rotation angles (shape‑dependent)
    // ----------------------------
    rotationAngles: {
      square: [45, 90, 180],
      triangle: [60, 90, 120, 180],
      circle: [45, 90, 180],
      hexagon: [60, 90, 120, 180],
    },

    // Clockwise / counter‑clockwise progression
    rotationDirections: ["right", "left"],

    // ----------------------------
    // Division counts per shape (core cognitive feature)
    // ----------------------------
    divisions: {
      square: 4,
      triangle: 3,
      circle: 4,
      hexagon: 6,
    },

    // ----------------------------
    // Direction rule (CRITICAL – latent cognitive rule)
    // ----------------------------
    directionRule: {
      id: "sector_arrow_direction",

      // What the learner must infer
      ruleType: "direction",

      // Correct rule definition
      correct: {
        value: +1,                 // +1 = outward / clockwise, -1 = inward / anticlockwise
        reference: "sector",      // direction is relative to sector orientation
        consistency: "global",    // same for all sectors
      },

      // How incorrect options are generated
      distractors: [
        {
          type: "reverse",
          value: -1,               // invert direction
        },
      ],

      // Scope of the rule
      scope: {
        appliesTo: "all-sectors",
        variesAcross: null,
      },

      // Cognitive metadata (ECD / psychometrics)
      cognitiveDemand: {
        operation: "mental-rotation",
        relation: "direction-consistency",
        ruleCount: 1,
      },
    },

    // ----------------------------
    // Internal element definitions (non‑arrow items)
    // ----------------------------
    internalElements: {
      // Generated items use crosshair or small square
      types: ["crosshair", "small_square"],

      // Exactly one internal element per item
      counts: [1],

      // Colors used in the paper
      colors: ["transparent", "blue", "green", "red"],
    },
  },

  // ----------------------------
  // Constraints (paper‑level, not engine‑level)
  // ----------------------------
  constraints: {
    // Rotation must follow a single consistent rule
    singleRotationRule: true,

    // Internal elements move across divisions
    divisionBasedPlacement: true,

    // No visual variation beyond what is listed in the paper
    fixedSize: true,
    fixedStroke: true,
    fixedFill: true,

    // Parent item uses arrows (handled separately, not here)
    parentItemInternal: "arrow_group",
  },

  // ----------------------------
  // Metadata for downstream systems
  // ----------------------------
  metadata: {
    source: "Sayın et al. (2023)",
    domain: "Non‑verbal reasoning",
    itemType: "Matrix completion",
  },
};
