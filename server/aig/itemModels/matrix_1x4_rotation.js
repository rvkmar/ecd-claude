// itemModels/matrix_1x4_rotation.js
// Model 1 – Paper-faithful (Sayın et al., 2023)

export const matrix1x4RotationModel = {
  id: "matrix_1x4_rotation_model1",

  // Must match rewritten cognitive model
  cognitiveModelId: "nonverbal_visual_reasoning_sayin_2023",

  // Model 1: 1 column × 4 rows
  // This *forces* a vertical layout.
  layout: {
    rows: 1,
    columns: 4,
  },

  // Missing last cell
  missingCell: {
    row: 0,
    column: 3,
  },

  // Rotation rule is fixed and explicit
  ruleApplication: {
    direction: "row-wise",   // sequence progression
    rotationDirection: "right",
    appliesTo: "shape_rotation",
  },

  // Prompt used in the paper
  prompt: "Select the figure that completes the sequence.",

  // Options are homogeneous
  options: {
    count: 4,
    layout: "horizontal",
  },

  // Paper semantics (informational, not used by generator)
  modelSemantics: {
    modelType: "Model-1",
    difficulty: "harder",
    structure: "single-sequence",
  },
};
