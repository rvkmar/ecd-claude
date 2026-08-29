// src/aig/index.js

import { generateFromModel } from "./generateFromModel.js";

import { matrix1x4RotationModel } from "./itemModels/matrix_1x4_rotation.js";
import { matrix2x3RotationModel } from "./itemModels/matrix_2x3_rotation.js";

// matrix_3x3_rotation_v1 (a generative 3x3 rotation family) was never written —
// only matrix_3x3_parent_item.js (a fixed reference item, not a generator)
// exists. AIG as a whole is unmounted (see server/index.js) and is rebuilt
// properly on templates at Step 18, so this is shelved rather than stubbed.

/**
 * Central AIG registry
 * This is the ONLY entry point the app should use
 */
const ITEM_MODEL_REGISTRY = {
  matrix_1x4_rotation_v1: matrix1x4RotationModel,
  matrix_2x3_rotation_v1: matrix2x3RotationModel,
};

/**
 * Public AIG API
 */
export function generateAIGItem({
  templateId,
  seed = Date.now(),
}) {
  const itemModel = ITEM_MODEL_REGISTRY[templateId];

  if (!itemModel) {
    throw new Error(`Unknown AIG templateId: ${templateId}`);
  }

  return generateFromModel({
    itemModel,
    seed,
  });
}
