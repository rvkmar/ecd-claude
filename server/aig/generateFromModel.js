// generateFromModel.js
// FIXED & REGENERATED — Sayın et al. (2023) paper‑faithful AIG engine
// Authoritative rules come from cognitiveModel + itemModel

import { cognitiveModel } from "./cognitiveModel.js";

// ----------------------------
// Deterministic RNG
// ----------------------------
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ----------------------------
// Main generator
// ----------------------------
export function generateFromModel({ itemModel, seed = Date.now() }) {
  const rng = mulberry32(seed);

  const {
    layout,
    missingCell,
    ruleApplication,
    prompt,
    options,
    modelSemantics,
  } = itemModel;

  // ----------------------------
  // Rotation rule (itemModel authoritative)
  // ----------------------------
  const rotationDirection = ruleApplication.rotationDirection; // "left" | "right"

  // ----------------------------
  // Direction rule (cognitive model authoritative)
  // ----------------------------
  const directionRule = cognitiveModel.elements.directionRule;
  const correctArrowDirection = directionRule.correct.value; // +1 or -1
  const distractorArrowDirections = directionRule.distractors.map(d => d.value);

  // ----------------------------
  // Shape selection
  // ----------------------------
  const shapes = cognitiveModel.elements.shapes;

  let shapeX = null;
  let shapeY = null;

  if (modelSemantics?.shapeRoles) {
    shapeX = shapes[Math.floor(rng() * shapes.length)];
    do {
      shapeY = shapes[Math.floor(rng() * shapes.length)];
    } while (shapeY === shapeX);
  }

  const baseShape = shapeX || shapes[Math.floor(rng() * shapes.length)];

  // ----------------------------
  // Rotation step (shape‑constrained)
  // ----------------------------
  const rotationAngles = cognitiveModel.elements.rotationAngles;
  const rotationStep = rotationAngles[baseShape][
    Math.floor(rng() * rotationAngles[baseShape].length)
  ];

  // ----------------------------
  // Internal element (non‑arrow items)
  // ----------------------------
  const internalTypes = cognitiveModel.elements.internalElements.types;
  const internalColors = cognitiveModel.elements.internalElements.colors;

  const internalType = internalTypes[Math.floor(rng() * internalTypes.length)];
  const internalColor = internalColors[Math.floor(rng() * internalColors.length)];

  // ----------------------------
  // Parent item detection
  // ----------------------------
  const isParentItem =
    modelSemantics?.modelType === "Parent-Item" ||
    modelSemantics?.internalMode === "arrow_group";

  // ----------------------------
  // Grid construction
  // ----------------------------
  const grid = [];
  const totalCells = layout.rows * layout.columns;

  const divisionsFor = (shape) => cognitiveModel.elements.divisions[shape];

  const baseDivisionIndex = Math.floor(
    rng() * divisionsFor(baseShape)
  );

  for (let index = 0; index < totalCells; index++) {
    const row = Math.floor(index / layout.columns);
    const col = index % layout.columns;

    if (row === missingCell.row && col === missingCell.column) {
      grid.push(null);
      continue;
    }

    let shape = baseShape;
    if (modelSemantics?.shapeRoles) {
      if (row === 0) shape = shapeX;
      if (row === 1) shape = shapeY;
    }

    const stepIndex = ruleApplication.direction === "row-wise" ? col : row;
    const signedStep = stepIndex * (rotationDirection === "left" ? -1 : 1);

    const rotation = rotationStep * signedStep;

    const divisionCount = divisionsFor(shape);
    const divisionIndex =
      (baseDivisionIndex + signedStep + divisionCount) % divisionCount;

    grid.push({
      shape,
      rotation,
      internal: isParentItem
        ? {
            type: "arrow_group",
            direction: correctArrowDirection,
          }
        : {
            type: internalType,
            color: internalColor,
            divisionIndex,
          },
    });
  }

  // ----------------------------
  // Correct option
  // ----------------------------
  const finalStep =
    ruleApplication.direction === "row-wise"
      ? layout.columns - 1
      : layout.rows - 1;

  const signedFinalStep = finalStep * (rotationDirection === "left" ? -1 : 1);

  const correctRotation = rotationStep * signedFinalStep;

  const correctDivisionIndex =
    (baseDivisionIndex + signedFinalStep + divisionsFor(baseShape)) %
    divisionsFor(baseShape);

  const correctOption = {
    shape: baseShape,
    rotation: correctRotation,
    internal: isParentItem
      ? {
          type: "arrow_group",
          direction: correctArrowDirection,
        }
      : {
          type: internalType,
          color: internalColor,
          divisionIndex: correctDivisionIndex,
        },
  };

  // ----------------------------
  // Distractors — violate direction rule (paper‑faithful)
  // ----------------------------
  const distractors = [];

  distractorArrowDirections.forEach((wrongDir) => {
    distractors.push({
      shape: baseShape,
      rotation: correctRotation,
      internal: isParentItem
        ? { type: "arrow_group", direction: wrongDir }
        : {
            type: internalType,
            color: internalColor,
            divisionIndex: correctDivisionIndex,
          },
    });
  });

  while (distractors.length < options.count - 1) {
    const extraRotation = rotationStep * (Math.floor(rng() * 3) + 1);
    distractors.push({
      shape: baseShape,
      rotation: correctRotation + extraRotation,
      internal: isParentItem
        ? { type: "arrow_group", direction: correctArrowDirection }
        : {
            type: internalType,
            color: internalColor,
            divisionIndex: correctDivisionIndex,
          },
    });
  }

  const allOptions = shuffle([correctOption, ...distractors], rng);
  const correctIndex = allOptions.indexOf(correctOption);

  // ----------------------------
  // Return item
  // ----------------------------
  return {
    id: `aig-${itemModel.id}-${seed}`,
    type: "mcq",
    prompt,
    grid,
    options: allOptions.map((opt, i) => ({
      id: `opt-${seed}-${i}`,
      visual: opt,
      isCorrect: i === correctIndex,
    })),
    correctOptionIds: [`opt-${seed}-${correctIndex}`],
    metadata: {
      cognitiveModelId: cognitiveModel.id,
      itemModelId: itemModel.id,
      rule: "rotation+direction",
      rotationStep,
      arrowDirection: correctArrowDirection,
      seed,
    },
  };
}
