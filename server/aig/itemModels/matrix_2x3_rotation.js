// itemModels/matrix_2x3_rotation.js
// Model 2 – Paper-faithful (Sayın et al., 2023)

export const matrix2x3RotationModel = {
  id: "matrix_2x3_rotation_model2",

  // Must match rewritten cognitive model
  cognitiveModelId: "nonverbal_visual_reasoning_sayin_2023",

  // Model 2: 2 columns × 3 rows
  layout: {
    rows: 3,
    columns: 2,
  },

  // Missing bottom-right cell
  missingCell: {
    row: 2,
    column: 1,
  },

  // Rotation rule is fixed per paper
  ruleApplication: {
    direction: "row-wise",       // progression across columns
    rotationDirection: "left",   // fixed for Model 2
    appliesTo: "shape_rotation",
  },

  // Prompt used in the paper
  prompt: "Select the figure that completes the matrix.",

  // Options layout (paper-consistent)
  options: {
    count: 4,
    layout: "grid",
  },

  // Paper semantics: two parallel sequences with different shapes
  modelSemantics: {
    modelType: "Model-2",
    difficulty: "easier",
    structure: "two-parallel-sequences",

    // Shape roles are fixed per row (Shape x / Shape y)
    shapeRoles: {
      row0: "shape_x",
      row1: "shape_y",
    },
  },
};
