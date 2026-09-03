// server/routes/qMatrixModelsRoutes.js
// ------------------------------------------------------------------
// Q-matrix models: an attributes x items matrix binding binary Student
// Model Variables (the columns) to the items that require them (the
// sparse `entries[]` cells). Required by the `dina`/`gdina` statistical
// model types on evidenceModels.
//
// WHY THIS FILE EXISTS ONLY NOW (D48): the collection was declared on
// Day 18 with full schema validation and given a lifecycle validator on
// Day 21 -- but never a route file, a rolePermissions entry or a query
// hook. It was one of three collections that could be validated but not
// reached: artefacts 4 and 6 of the seven-artefact contract were absent
// for all of them. The Q-matrix editor (D51) has nothing to save to
// until this exists.
//
// Referential integrity is NOT re-implemented here. schema.js already
// enforces that every `attributeIds` entry is a `binary`-type smVariable
// on the bound competency model -- a Q-matrix over a continuous SMV is a
// category error, and validateEntity refuses it. This router surfaces
// those errors; it does not duplicate them.
// ------------------------------------------------------------------
import express from "express";
import { authenticateToken, authorizeRole } from "../utils/authMiddleware.js";
import { loadDB, saveDB } from "../../src/utils/db-server.js";
import { validateEntity } from "../../src/utils/schema.js";
import { validateQMatrixModelLifecycle } from "../utils/lifecycleValidation.js";
import { canTransition } from "../utils/lifecycleMatrix.js";

const router = express.Router();

// Same posture as every other router: a valid bearer token for everything,
// then per-route role gates matching rolePermissions.js's declared intent
// (qMatrixModels: admin+district may view, admin may author and delete).
router.use(authenticateToken);

const canAuthor = authorizeRole(["admin"]);
const canDelete = authorizeRole(["admin"]);

// Date.now() alone collides when two records are created inside the same
// millisecond. Same monotonic-counter shape taskModelsRoutes.js uses.
let idCounter = 0;
const genId = () => `qm${Date.now()}${(idCounter++ % 1000).toString().padStart(3, "0")}`;

// ------------------------------
// GET /api/qMatrixModels           ?competencyModelId= filters
// ------------------------------
router.get("/", (req, res) => {
  const db = loadDB();
  let rows = db.qMatrixModels || [];
  const { competencyModelId } = req.query;
  if (competencyModelId) {
    rows = rows.filter((q) => q.competencyModelId === competencyModelId);
  }
  res.json(rows);
});

// ------------------------------
// GET /api/qMatrixModels/:id
// ------------------------------
router.get("/:id", (req, res) => {
  const db = loadDB();
  const row = (db.qMatrixModels || []).find((q) => q.id === req.params.id);
  if (!row) return res.status(404).json({ error: "Q-matrix model not found" });
  res.json(row);
});

// ------------------------------
// POST /api/qMatrixModels
// A new Q-matrix is always a draft. `status`, `locked` and `versionNumber`
// are server-authoritative on create -- a payload cannot arrive already
// confirmed, the same rule taskModelsRoutes.js applies.
// ------------------------------
router.post("/", canAuthor, (req, res) => {
  const db = loadDB();
  const now = new Date().toISOString();

  const record = {
    ...req.body,
    id: genId(),
    status: "draft",
    locked: false,
    versionNumber: req.body?.versionNumber ?? 1,
    attributeIds: Array.isArray(req.body?.attributeIds) ? req.body.attributeIds : [],
    entries: Array.isArray(req.body?.entries) ? req.body.entries : [],
    createdAt: now,
    updatedAt: now,
  };

  const { valid, errors } = validateEntity("qMatrixModels", record, db);
  if (!valid) {
    return res.status(400).json({ error: "Q-matrix validation failed", details: errors });
  }

  const lifecycleErrors = validateQMatrixModelLifecycle(record, db);
  if (lifecycleErrors.length > 0) {
    return res
      .status(400)
      .json({ error: "Q-matrix lifecycle validation failed", details: lifecycleErrors });
  }

  db.qMatrixModels = db.qMatrixModels || [];
  db.qMatrixModels.push(record);
  saveDB(db);
  res.status(201).json(record);
});

// ------------------------------
// PUT /api/qMatrixModels/:id
// Two distinct operations share this verb, exactly as taskModelsRoutes.js
// does: a status-only transition, and a content edit. A locked record
// accepts ONLY the first -- structure is frozen once confirmed, which is
// the property downstream diagnostic models depend on.
// ------------------------------
router.put("/:id", canAuthor, (req, res) => {
  const db = loadDB();
  const idx = (db.qMatrixModels || []).findIndex((q) => q.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Q-matrix model not found" });

  const existing = db.qMatrixModels[idx];
  const prevStatus = existing.status || "draft";
  const nextStatus = req.body?.status || prevStatus;

  if (existing.locked === true) {
    const contentKeys = Object.keys(req.body || {}).filter((k) => k !== "status");
    if (contentKeys.length > 0) {
      return res.status(409).json({
        error: "Q-matrix is locked; only a status transition is permitted.",
        details: contentKeys,
      });
    }
  }

  if (nextStatus !== prevStatus && !canTransition(prevStatus, nextStatus)) {
    return res.status(400).json({
      error: `Illegal Q-matrix status transition: '${prevStatus}' -> '${nextStatus}'.`,
    });
  }

  // Confirmation freezes the record. Mirrors the confirmed-requires-locked
  // check schema.js applies to this collection.
  const becomingLocked =
    ["confirmed", "operational", "suspended"].includes(nextStatus) || existing.locked === true;

  const updated = {
    ...existing,
    ...req.body,
    id: existing.id,
    createdAt: existing.createdAt,
    status: nextStatus,
    locked: becomingLocked,
    updatedAt: new Date().toISOString(),
  };

  const { valid, errors } = validateEntity("qMatrixModels", updated, db);
  if (!valid) {
    return res.status(400).json({ error: "Q-matrix validation failed", details: errors });
  }

  const lifecycleErrors = validateQMatrixModelLifecycle(updated, db);
  if (lifecycleErrors.length > 0) {
    return res
      .status(400)
      .json({ error: "Q-matrix lifecycle validation failed", details: lifecycleErrors });
  }

  db.qMatrixModels[idx] = updated;
  saveDB(db);
  res.json(updated);
});

// ------------------------------
// DELETE /api/qMatrixModels/:id
// Refused while any evidence model's statisticalModels[] points at it.
// A dangling qMatrixId would make a dina/gdina model unvalidatable and
// unscoreable, which is a silent failure rather than a loud one.
// ------------------------------
router.delete("/:id", canDelete, (req, res) => {
  const db = loadDB();
  const row = (db.qMatrixModels || []).find((q) => q.id === req.params.id);
  if (!row) return res.status(404).json({ error: "Q-matrix model not found" });

  const blocking = (db.evidenceModels || []).filter((em) =>
    (em.statisticalModels || []).some((sm) => sm?.qMatrixId === req.params.id)
  );
  if (blocking.length > 0) {
    return res.status(409).json({
      error: "Q-matrix is referenced by one or more evidence models.",
      details: blocking.map((em) => em.name || em.id),
    });
  }

  db.qMatrixModels = (db.qMatrixModels || []).filter((q) => q.id !== req.params.id);
  saveDB(db);
  res.json({ success: true });
});

export default router;
