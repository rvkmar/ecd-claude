// server/routes/calibrationRoutes.js
import express from "express";
import { authenticateToken, authorizeRole } from "../utils/authMiddleware.js";
import { loadDB, saveDB } from "../../src/utils/db-server.js";

const router = express.Router();

// Every endpoint in this router requires a valid, logged-in session.
// (Previously this file had no auth check at all — added as part of the
// Phase 1 security hardening pass; see AUTH_SECURITY_FIXES.md.)
router.use(authenticateToken);

// Calibration writes parameters onto an Evidence Model, which
// rolePermissions.js declares admin-only editing -- same gate as
// evidenceModels.js's recalibrate/decision-rule/activate-parameter-set.
const canAuthor = authorizeRole(["admin"]);

// ------------------------------
// POST /api/calibrate/:evidenceModelId
// ------------------------------
// body: { responses: [ { studentId, answers: { q1: 1, q2: 0 } }, ... ] }
router.post("/:evidenceModelId", canAuthor, async (req, res) => {
  const { evidenceModelId } = req.params;
  const { responses } = req.body;

  const db = loadDB();
  const evModel = db.evidenceModels?.find(em => em.id === evidenceModelId);
  if (!evModel) {
    return res.status(404).json({ error: `EvidenceModel ${evidenceModelId} not found` });
  }

  if (!responses || responses.length === 0) {
    return res.status(400).json({ error: "No responses provided for calibration" });
  }

  try {
    const fetch = (await import("node-fetch")).default;
    const R_BACKEND_URL = process.env.R_BACKEND_URL || "http://r-backend:8000";

    const result = await fetch(`${R_BACKEND_URL}/irt/calibrate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        responses,
        evidenceModel: {
          id: evModel.id,
          measurementModel: evModel.measurementModel
        }
      })
    }).then(r => r.json());

    if (result.error) {
      return res.status(400).json(result);
    }

    // 🔹 Update local questions collection with new item parameters
    let updatedCount = 0;
    for (const item of result.items || []) {
      const idx = db.questions?.findIndex(q => q.id === item.id);
      if (idx !== -1) {
        const q = db.questions[idx];
        q.metadata = q.metadata || {};
        q.metadata.a = item.a;
        q.metadata.b = item.b;
        q.metadata.c = item.c;
        q.updatedAt = new Date().toISOString();
        db.questions[idx] = q;
        updatedCount++;
      }
    }

    // 🔹 Add calibration log entry
    db.calibrationLogs = db.calibrationLogs || [];
    const logEntry = {
      id: `cal${Date.now()}`,
      evidenceModelId: evModel.id,
      evidenceModelName: evModel.name || null,
      modelType: result.model,
      updatedItems: updatedCount,
      timestamp: new Date().toISOString()
    };
    db.calibrationLogs.push(logEntry);

    saveDB(db);

    res.json({
      model: result.model,
      items: result.items,
      updatedQuestions: updatedCount,
      log: logEntry
    });
  } catch (err) {
    console.error("Calibration failed:", err);
    res.status(500).json({ error: "Calibration request failed", details: err.message });
  }
});

// ------------------------------
// GET /api/calibrate/logs
// ------------------------------
// Retrieve calibration logs
router.get("/logs", (req, res) => {
  const db = loadDB();
  res.json(db.calibrationLogs || []);
});

export default router;
