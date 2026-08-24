// itemModels/matrix_3x3_parent_item.js
// Model 3 – Parent Item (Reference Anchor)
// Paper-faithful implementation based on Sayın et al. (2023), Figure 1

export const matrix3x3ParentItemModel = {
  id: "matrix_3x3_parent_item",

  // Same cognitive model, but used in parent (non-generated) mode
  cognitiveModelId: "nonverbal_visual_reasoning_sayin_2023",

  // Parent item: 3 × 3 matrix
  layout: {
    rows: 3,
    columns: 3,
  },

  // Missing bottom-right cell
  missingCell: {
    row: 2,
    column: 2,
  },

  // Parent item uses a fixed rotation rule
  ruleApplication: {
    direction: "row-wise",
    rotationDirection: "right",
    appliesTo: "shape_rotation",
  },

  // Parent item prompt (paper wording)
  prompt: "Select the figure that completes the matrix.",

  // Options: 4 choices, visual only
  options: {
    count: 4,
    layout: "grid",
  },

  // Parent-item–specific semantics
  modelSemantics: {
    modelType: "Parent-Item",
    role: "reference",

    // Parent item uses arrow-based internal elements
    internalMode: "arrow_group",

    // Shapes are fixed by row (as shown in Figure 1)
    shapeRoles: {
      row0: "square",
      row1: "circle",
      row2: "triangle",
    },

    // This item is not part of the generated family
    generatesChildren: true,
  },
};
