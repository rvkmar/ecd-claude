// server/routes/compositeLibraryRoutes.js
// ------------------------------------------------------------------
// Composite library: the compiled, versioned delivery package built at
// Task Model activation. Per item: its presentation material, its
// interaction parameters, its evidence-activation mapping and the
// weights of evidence it contributes.
//
// THIS ROUTER IS DELIBERATELY READ-ONLY. That is a design decision, not
// an unfinished one, and it has two independent reasons:
//
//   1. schema.js declares this collection with NO status and no
//      lifecycle, and says why: "a build ARTIFACT keyed by
//      (taskModelId, taskModelVersion), not an authored entity a human
//      drafts/reviews/revises." A generic POST/PUT here would let a
//      human hand-author a delivery package that no Task Model
//      compiles to -- which is precisely the class of contradiction
//      the schema's own note exists to prevent.
//
//   2. ADR 0003 puts the compile boundary at structural facts. The
//      builder (compositeLibrary/builder.js, Day 24) is the only thing
//      that may produce one of these, and D49 is the unit that gives
//      it a caller at Task Model promotion. Exposing a write endpoint
//      now would create a second, uncompiled path into the same
//      collection before the first one exists.
//
// So: reads here, writes from the activation path in D49. The one
// mutating endpoint below is an explicit, admin-only REBUILD, which
// delegates to the builder rather than accepting a body -- the caller
// says which Task Model to compile, never what the package contains.
// ------------------------------------------------------------------
import express from "express";
import { authenticateToken, authorizeRole } from "../utils/authMiddleware.js";
import { loadDB, saveDB } from "../../src/utils/db-server.js";
import { validateEntity } from "../../src/utils/schema.js";
import {
  buildCompositeLibrary,
  isCompositeLibraryStale,
} from "../compositeLibrary/builder.js";

const router = express.Router();

router.use(authenticateToken);

const canRebuild = authorizeRole(["admin"]);

let idCounter = 0;
const genId = () => `cl${Date.now()}${(idCounter++ % 1000).toString().padStart(3, "0")}`;

// ------------------------------
// GET /api/compositeLibrary            ?taskModelId= filters
//                                      ?active=true  only live packages
// ------------------------------
router.get("/", (req, res) => {
  const db = loadDB();
  let rows = db.compositeLibrary || [];
  const { taskModelId, active } = req.query;
  if (taskModelId) rows = rows.filter((r) => r.taskModelId === taskModelId);
  if (active === "true") rows = rows.filter((r) => r.active === true);
  res.json(rows);
});

// ------------------------------
// GET /api/compositeLibrary/active/:taskModelId
// The delivery-path read: the one package currently served for a Task
// Model. schema.js enforces at most one active package per taskModelId,
// so this is a single record or a 404.
// ------------------------------
router.get("/active/:taskModelId", (req, res) => {
  const db = loadDB();
  const row = (db.compositeLibrary || []).find(
    (r) => r.taskModelId === req.params.taskModelId && r.active === true
  );
  if (!row) {
    return res.status(404).json({
      error: `No active composite library for task model '${req.params.taskModelId}'.`,
    });
  }
  res.json(row);
});

// ------------------------------
// GET /api/compositeLibrary/:id
// ------------------------------
router.get("/:id", (req, res) => {
  const db = loadDB();
  const row = (db.compositeLibrary || []).find((r) => r.id === req.params.id);
  if (!row) return res.status(404).json({ error: "Composite library package not found" });
  res.json(row);
});

// ------------------------------
// GET /api/compositeLibrary/:id/staleness
// Reports whether a package still reflects its sources, using the same
// isCompositeLibraryStale() the activation path uses. Advisory: it never
// mutates. Day 25 proved the boundary this rests on -- a package is stale
// on a Task Model or Evidence Model VERSION change, and explicitly NOT on
// recalibration alone (ADR 0003).
// ------------------------------
router.get("/:id/staleness", (req, res) => {
  const db = loadDB();
  const row = (db.compositeLibrary || []).find((r) => r.id === req.params.id);
  if (!row) return res.status(404).json({ error: "Composite library package not found" });

  const taskModel = (db.taskModels || []).find((t) => t.id === row.taskModelId);
  if (!taskModel) {
    return res.status(409).json({
      error: `Package references task model '${row.taskModelId}', which no longer exists.`,
    });
  }

  const evidenceModels = (db.evidenceModels || []).filter((em) =>
    (taskModel.evidenceModelIds || []).includes(em.id)
  );

  try {
    const stale = isCompositeLibraryStale(row, { taskModel, evidenceModels });
    res.json({ id: row.id, taskModelId: row.taskModelId, stale });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ------------------------------
// POST /api/compositeLibrary/rebuild/:taskModelId
// Compile a fresh package from the CURRENT state of a Task Model. Takes
// no body: the package's contents are derived, never supplied. The
// previous active package for the same Task Model is deactivated rather
// than deleted, so a session that resolved against it can still be
// explained after the fact.
//
// D49 wires this same builder call into Task Model promotion so a
// package appears without anyone asking. This endpoint is the manual
// escape hatch for a stale package, not the primary path.
// ------------------------------
router.post("/rebuild/:taskModelId", canRebuild, (req, res) => {
  const db = loadDB();
  const taskModel = (db.taskModels || []).find((t) => t.id === req.params.taskModelId);
  if (!taskModel) return res.status(404).json({ error: "TaskModel not found" });

  // The builder DEGRADES rather than throwing: a Task Model that is not
  // yet instantiable compiles to an EMPTY package plus a warning, and it
  // throws only for programmer errors (missing arguments). So the try/catch
  // covers the latter, and the empty-package case is handled explicitly
  // below rather than being activated silently.
  let built;
  try {
    built = buildCompositeLibrary(taskModel, db);
  } catch (e) {
    return res.status(500).json({ error: "Composite library build failed", details: e.message });
  }

  const { record: compiled, warnings } = built;

  // Refusing rather than guessing, in the house style. Activating an empty
  // package would make a Task Model look delivery-ready while resolving to
  // nothing at request time — a quiet failure of exactly the kind the
  // delivery path must not have. The warnings say why it was empty.
  if (!Array.isArray(compiled.items) || compiled.items.length === 0) {
    return res.status(409).json({
      error:
        "Refusing to activate an empty composite library package. The Task Model compiled to zero items.",
      details: warnings,
    });
  }

  const now = new Date().toISOString();
  const record = {
    ...compiled,
    id: genId(),
    active: true,
    createdAt: now,
    updatedAt: now,
  };

  const { valid, errors } = validateEntity("compositeLibrary", record, db);
  if (!valid) {
    return res
      .status(400)
      .json({ error: "Composite library validation failed", details: errors });
  }

  db.compositeLibrary = db.compositeLibrary || [];
  // At most one active package per taskModelId — schema.js enforces this
  // too; deactivating here keeps the write valid rather than relying on
  // the validator to reject it.
  db.compositeLibrary = db.compositeLibrary.map((r) =>
    r.taskModelId === record.taskModelId && r.active
      ? { ...r, active: false, updatedAt: now }
      : r
  );
  db.compositeLibrary.push(record);
  saveDB(db);

  // Warnings are returned alongside the package rather than swallowed: a
  // package can compile successfully and still have skipped an item whose
  // evidenceModelId did not resolve, and the caller needs to see that.
  res.status(201).json({ ...record, warnings });
});

export default router;
