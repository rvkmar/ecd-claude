// server/routes/api/aigRoutes.js
// 🔹 ECD-Compliant AIG Item Generator

import express from "express";
import { loadDB, saveDB } from "../../src/utils/db-server.js";
import { validateEntity, isLinkableEvidenceModel } from "../../src/utils/schema.js";
import { generateFromModel } from "../aig/generateFromModel.js";

const router = express.Router();
const genId = (prefix = "it") => `${prefix}${Date.now()}`;

/* =====================================================
   POST /api/aig/generate
   Body:
   {
     evidenceModelId,
     observationId,
     templateId,
     count,
     difficulty
   }
===================================================== */

router.post("/generate", (req, res) => {

  const {
    evidenceModelId,
    observationId,
    templateId,
    count = 1,
    difficulty = "medium"
  } = req.body;

  const db = loadDB();

  const em = db.evidenceModels?.find(
    m => m.id === evidenceModelId
  );

  if (!isLinkableEvidenceModel(em)) {
    return res.status(400).json({
      error: "Invalid or unconfirmed evidenceModelId"
    });
  }

  const observable = em.observables?.find(
    o => o.id === observationId
  );

  if (!observable) {
    return res.status(400).json({
      error: "Invalid observationId"
    });
  }

  const createdIds = [];
  const errors = [];

  for (let i = 0; i < count; i++) {

    const seed = Date.now() + i;

    let generated;
    try {
      generated = generateFromModel({
        templateId,
        seed
      });
    } catch (err) {
      errors.push({ seed, error: err.message });
      continue;
    }

    const item = {
      id: genId(),
      status: "draft",
      locked: false,
      versionNumber: 1,
      parentItemId: null,

      evidenceModelId,
      competencyId: em.competencyId,
      observationId,

      stimulus: {
        layout: "single",
        blocks: [
          {
            type: "text",
            content: generated.prompt
          }
        ]
      },

      interaction: {
        type: observable.type,
        responseComponents: generated.options.map(opt => ({
          id: opt.id,
          label: opt.label,
          value: opt.value
        }))
      },

      scoring: {
        method: "binary",
        maxScore: 1
      },

      learningDomain: "cognitive",

      metadata: {
        subject: "Auto",
        grade: "Auto",
        topic: templateId,
        difficulty
      },

      exposureControl: {
        usageCount: 0,
        maxUsageBeforeRetire: 5,
        reactivationCount: 0,
        maxReactivations: 2
      },

      psychometrics: {
        calibrationStatus: "uncalibrated",
        irtParams: {}
      },

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { valid, errors: validationErrors } =
      validateEntity("items", item, db);

    if (!valid) {
      errors.push({ seed, validationErrors });
      continue;
    }

    db.items = db.items || [];
    db.items.push(item);
    createdIds.push(item.id);
  }

  saveDB(db);

  res.json({
    created: createdIds.length,
    itemIds: createdIds,
    skipped: errors.length,
    errors
  });

});

export default router;