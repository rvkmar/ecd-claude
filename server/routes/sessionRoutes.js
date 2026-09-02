import express from "express";
import { authenticateToken, authorizeRole } from "../utils/authMiddleware.js";
import { loadDB, saveDB, finishSession } from "../../src/utils/db-server.js";
import { validateEntity } from "../../src/utils/schema.js";
import { SESSION_STATUS } from "../../src/utils/sessionStatus.js";
import { identifyEvidence } from "../delivery/evidenceIdentification.js";
import {
  accumulateEvidence,
  applyPosteriorsToSession,
  CONTINUOUS_MODEL_FAMILIES,
  RAW_SCORE_MODEL_FAMILIES,
  itemParametersAreUsable,
} from "../delivery/evidenceAccumulation.js";
import { resolveAssemblyProgress } from "../delivery/assemblyProgress.js";
import { recordItemUsage } from "../utils/itemExposure.js";
import { log2 } from "mathjs"; // if not available, define inline

// Day 28 (Week 6): a session scores through an authored Evidence Model,
// via server/delivery/evidenceIdentification.js, when the client opts in
// by sending `itemId` instead of `questionId` on /submit. The legacy
// db.questions path below this flag is completely UNCHANGED -- this is a
// rollback lever, not a migration switch: SessionPlayer.jsx does not send
// `itemId` yet (a separate, later task), so this defaults to true with
// zero effect on real traffic today, and can be forced off in production
// if the new path misbehaves, for one release, per the plan.
const ITEM_DELIVERY_ENABLED = process.env.ITEM_DELIVERY_ENABLED !== "false";

function entropy(p) {
  if (p <= 0 || p >= 1) return 0;
  return -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
}

const router = express.Router();

// Every endpoint in this router requires a valid, logged-in session.
// (Previously this file had no auth check at all — added as part of the
// Phase 1 security hardening pass; see AUTH_SECURITY_FIXES.md.)
router.use(authenticateToken);

// Most routes below are deliberately left open to any authenticated
// role: creating, submitting, pausing and finishing a session is a
// student's own self-service flow, not a privileged action, and
// rolePermissions.js has no per-role session ownership model to gate
// against yet (that's a real gap, but a scope-based one, not a role-list
// one -- see the RBAC sweep notes). DELETE is the one exception: it was
// already commented "For admin use only" but never enforced.
const adminOnly = authorizeRole(["admin"]);

const R_BACKEND = process.env.R_BACKEND_URL || "http://localhost:4000";

// ------------------------------
// POST /api/sessions
// ------------------------------
// body: { taskIds, studentId, selectionStrategy?, nextTaskPolicy? }
router.post("/", (req, res) => {
  const { taskIds, studentId, selectionStrategy, nextTaskPolicy } = req.body;
  const db = loadDB();

  if (!Array.isArray(taskIds) || taskIds.length === 0) {
    return res.status(400).json({ error: "taskIds must be a non-empty array" });
  }

  // Ensure tasks exist
  for (const tid of taskIds) {
    if (!db.tasks.find(t => t.id === tid)) {
      return res.status(400).json({ error: `Invalid taskId: ${tid}` });
    }
  }


  // ✅ Policy validation
  let strategy = selectionStrategy || "fixed";
  let policyConfig = nextTaskPolicy || {};

  // Check against /api/policies
  const availablePolicies = db.policies || [];
  const foundPolicy = availablePolicies.find((p) => p.type === strategy);

  if (!foundPolicy) {
    return res.status(400).json({
      error: `Invalid selectionStrategy: ${strategy}. No matching policy found in /api/policies`,
    });
  }

  // If caller passed explicit policyId in nextTaskPolicy, check it
  if (policyConfig.policyId) {
    const exists = availablePolicies.some((p) => p.id === policyConfig.policyId);
    if (!exists) {
      return res.status(400).json({
        error: `Invalid nextTaskPolicy.policyId: ${policyConfig.policyId}. Not found in /api/policies`,
      });
    }
  } else {
    // If no explicit policyId, default to matched strategy policy
    policyConfig = { policyId: foundPolicy.id, ...policyConfig };
  }

  const newSession = {
    id: `s${Date.now()}`,
    studentId: studentId || null,
    taskIds,
    currentTaskIndex: 0,
    responses: [],

    // Adaptive state
    studentModel: {},
    selectionStrategy: strategy,
    nextTaskPolicy: policyConfig,

    // Lifecycle
    status: SESSION_STATUS.IN_PROGRESS,
    isCompleted: false,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // ✅ Schema validation
  const { valid, errors } = validateEntity("sessions", newSession, db);
  if (!valid) {
    return res.status(400).json({ error: "Schema validation failed", details: errors });
  }

  if (!db.sessions) db.sessions = [];
  db.sessions.push(newSession);
  saveDB(db);

  res.status(201).json(newSession);
});


// ------------------------------
// GET /api/sessions
// ------------------------------
router.get("/", (req, res) => {
  const db = loadDB();
  res.json(db.sessions || []);
});

// ------------------------------
// GET /api/sessions/active
// ------------------------------
router.get("/active", (req, res) => {
  const db = loadDB();
  if (!db.sessions) db.sessions = [];
  const active = db.sessions.filter((s) => s.status !== "archived");
  res.json(active);
});

// ------------------------------
// GET /api/sessions/archived
// ------------------------------
router.get("/archived", (req, res) => {
  const db = loadDB();
  if (!db.sessions) db.sessions = [];
  const archived = db.sessions.filter((s) => s.status === "archived");
  res.json(archived);
});

// ------------------------------
// GET /api/sessions/:id
// ------------------------------
router.get("/:id", (req, res) => {
  const db = loadDB();
  const session = db.sessions.find(s => s.id === req.params.id);
  if (!session) return res.status(404).json({ error: "Session not found" });
  res.json(session);
});

// ------------------------------
// POST /api/sessions/:id/submit
// ------------------------------
// body: { taskId, questionId?, itemId?, rawAnswer, observationId?, scoredValue?, evidenceId?, rubricLevel? }
router.post("/:id/submit", async (req, res) => {
  const { id } = req.params;
  const { taskId, questionId, itemId, rawAnswer, observationId, scoredValue, evidenceId, rubricLevel } = req.body;

  const db = loadDB();
  const session = db.sessions.find(s => s.id === id && !s.isCompleted);
  if (!session) return res.status(404).json({ error: "Session not found or already completed" });

  if (!session.taskIds.includes(taskId)) {
    return res.status(400).json({ error: `Task ${taskId} not part of this session` });
  }

  const task = db.tasks.find(t => t.id === taskId);

  // 🔹 Day 28: item-based delivery, scoring through an authored Evidence
  // Model via identifyEvidence() -- an Observable Variable value, not a
  // score. Opt in per-request with `itemId` instead of `questionId`;
  // everything below this block (the legacy db.questions path) is
  // untouched and still runs exactly as before for a `questionId` request.
  // Deliberately narrow: only /submit is wired today (the exit check is
  // about scoring). /next-task's item-based selection is a separate,
  // larger Activity Selection undertaking, not attempted here.
  if (ITEM_DELIVERY_ENABLED && itemId) {
    const item = db.items?.find(it => it.id === itemId);
    if (!item) {
      return res.status(400).json({ error: `Invalid itemId: ${itemId}` });
    }

    // Day 30 (adversarial review finding): the legacy path below validates
    // that a submitted observation/evidence belongs to the task's own
    // Task Model; this block had dropped that check entirely -- any item
    // could be submitted against any task in the session, attributing its
    // evidence to the wrong Task Model instance with no error at all.
    if (!task) {
      return res.status(400).json({ error: `Task ${taskId} has no task instance record.` });
    }
    if (item.taskModelId !== task.taskModelId) {
      return res.status(400).json({
        error: `Item '${itemId}' belongs to Task Model '${item.taskModelId}', not this task's '${task.taskModelId}'.`,
      });
    }

    // Day 30 (adversarial review finding): an item already suspended
    // (auto-retired for exceeding its exposure ceiling) or archived kept
    // being delivered and scored through this path with no check at all --
    // defeating the entire point of the ceiling recordItemUsage() enforces.
    // A draft/reviewed/confirmed item is still deliberately deliverable
    // here (Day 29's own preview/test-delivery design: it scores correctly,
    // it just accrues no exposure) -- only a status that means "this item
    // has been deliberately pulled from service" is refused.
    if (["suspended", "archived"].includes(item.status)) {
      return res.status(409).json({ error: `Item '${itemId}' is '${item.status}' and cannot be delivered.` });
    }

    // Day 30 (adversarial review finding): resubmitting the same taskId
    // (a client retry, a double-click) used to silently duplicate the
    // response, double-count exposure, and over-advance currentTaskIndex
    // past a task that was never actually reached -- a session-ending bug
    // for the `fixed` strategy, which is purely index-driven. Refused
    // outright rather than silently accepted twice.
    if (session.responses.some(r => r.taskId === taskId)) {
      return res.status(409).json({ error: `Task ${taskId} already has a recorded response for this session.` });
    }

    // src/utils/schema.js's `collection === "sessions"` validation (a
    // pre-existing contract this route never previously had a caller for)
    // requires every response, once a session is live, to carry calibration
    // provenance: which Evidence Model + version, and -- for a CALIBRATED
    // response -- which calibrated parameterSet was active when the
    // response was scored -- a pointer, never a cached parameter value,
    // matching ADR 0003's "resolve live" boundary.
    //
    // Day 38 (Week 8): before this day, an Evidence Model with no active
    // calibrated parameterSet yet genuinely could not deliver, full stop --
    // which made the build reference's own dependency chain (Part 0.2)
    // circular: R calibration needs a real item-level response matrix,
    // that matrix needs items to be deliverable, and items could not be
    // delivered until calibration had already happened. The fix is the
    // PILOT-VS-CALIBRATED split the build reference names as the way out:
    // a continuous (IRT/Rasch) item falls back to the Item Wizard's own
    // pilot `psychometrics.irtParams` (Step 7) when no calibrated set
    // exists, and a raw-score item (CTT/sum/threshold) never needed
    // calibrated numbers to begin with -- `accumulateRawScoreFamily` in
    // evidenceAccumulation.js has never read a parameterSet, only Task
    // Model weights. DINA/G-DINA has no item-level pilot field yet (no
    // `psychometrics.dinaParams` the way IRT has `irtParams`), so it is
    // deliberately NOT given a pilot fallback here -- inventing one would
    // be the kind of confidently-wrong number this whole pipeline exists
    // to refuse. `CONTINUOUS_MODEL_FAMILIES` / `RAW_SCORE_MODEL_FAMILIES`
    // are imported from evidenceAccumulation.js rather than re-listed here,
    // so this gate and that file's own dispatch can never drift apart.
    const evidenceModelRecord = db.evidenceModels?.find(em => em.id === item.evidenceModelId);

    if (!evidenceModelRecord) {
      return res.status(400).json({ error: `Item '${itemId}' references unknown evidenceModelId '${item.evidenceModelId}'.` });
    }

    const activeStatModel = evidenceModelRecord.statisticalModels?.find(sm => sm.active);

    if (!activeStatModel) {
      return res.status(400).json({
        error: `Evidence model '${item.evidenceModelId}' has no active statistical model; item '${itemId}' cannot be scored through it.`,
      });
    }

    const family = activeStatModel.type;
    const calibratedParameterSetId = activeStatModel.activeParameterSetId || null;

    let parameterSetId = null;
    let parameterSource = null;

    if (RAW_SCORE_MODEL_FAMILIES.includes(family)) {
      // Never needed a calibrated parameterSet; a weighted proportion over
      // Task Model weights, nothing more.
      parameterSource = "not-applicable";
    } else if (calibratedParameterSetId) {
      parameterSetId = calibratedParameterSetId;
      parameterSource = "calibrated";
    } else if (CONTINUOUS_MODEL_FAMILIES.includes(family)) {
      const pilotParams = item.psychometrics?.irtParams;

      if (!itemParametersAreUsable(pilotParams)) {
        return res.status(400).json({
          error: `Evidence model '${item.evidenceModelId}' has no active calibrated parameter set, and item '${itemId}' carries no usable pilot IRT parameters (psychometrics.irtParams needs at least a > 0 and a finite b) for a '${family}' model to fall back on.`,
        });
      }

      parameterSource = "pilot";
    } else {
      return res.status(400).json({
        error: `Evidence model '${item.evidenceModelId}' has no active calibrated parameter set yet; item '${itemId}' cannot be scored through it. Pilot parameters are not yet supported for the '${family}' family.`,
      });
    }

    // Day 30 (adversarial review finding): observationId is only required
    // under strict/confirm-time validation (src/utils/schema.js), so a
    // draft item with none would reach identifyEvidence() and hit its
    // "requires an item with an observationId" throw -- a data-quality
    // problem surfacing as an uncaught 500, not the clear 4xx every other
    // malformed-reference case in this block gets.
    if (!item.observationId) {
      return res.status(400).json({ error: `Item '${itemId}' has no observationId; it cannot be scored.` });
    }

    // A structured work product is passed through as-is; a bare scalar
    // (the common case -- an option id, a numeric value) is wrapped into
    // the `{ selected: ... }` shape identifyEvidence's matching expects,
    // matching the repo's own worked example (samples/sample-items.json).
    // An ARRAY is also "not yet structured" for this purpose (Day 30
    // finding): `typeof [] === "object"` made a multi-select rawAnswer like
    // `["opt_a","opt_b"]` pass through unwrapped, so identifyEvidence tried
    // to match pattern keys against numeric array indices and never
    // matched anything real.
    const workProduct =
      rawAnswer && typeof rawAnswer === "object" && !Array.isArray(rawAnswer)
        ? rawAnswer
        : { selected: rawAnswer };

    const evidence = identifyEvidence(workProduct, item, db);

    const response = {
      taskId,
      itemId,
      itemVersion: item.versionNumber,
      taskModelVersion: item.taskModelVersion,
      evidenceModelId: item.evidenceModelId,
      evidenceModelVersion: evidenceModelRecord.versionNumber,
      parameterSetId,
      parameterSource,
      rawAnswer: rawAnswer ?? null,
      observationId: evidence.observationId,
      observableId: evidence.observableId,
      activated: evidence.activated,
      direction: evidence.direction,
      strength: evidence.strength,
      rationale: evidence.rationale,
      timestamp: new Date().toISOString(),
    };
    if (evidence.warning) response.warning = evidence.warning;

    session.responses.push(response);
    session.currentTaskIndex = Math.min(session.currentTaskIndex + 1, session.taskIds.length);
    session.updatedAt = new Date().toISOString();

    // Day 30: defensive -- a task instance record predating this field, or
    // authored by hand, should not crash delivery over a missing array.
    if (!Array.isArray(task.generatedObservationIds)) {
      task.generatedObservationIds = [];
    }
    if (evidence.observationId && !task.generatedObservationIds.includes(evidence.observationId)) {
      task.generatedObservationIds.push(evidence.observationId);
    }
    task.updatedAt = new Date().toISOString();

    // Day 29: this is the seam server/utils/itemExposure.js's own header
    // comment names -- the moment an item is actually delivered to a
    // student, not the record-usage HTTP route (author-gated, and until
    // today had no caller at all). A no-op for a non-operational item
    // (e.g. delivered in a preview/test context) is not an error here;
    // only a truly operational item accrues real exposure. Day 30
    // (adversarial review finding): the failure case used to be silently
    // swallowed with no `else` branch at all, so an operational item that
    // merely failed strict re-validation (e.g. missing a field required
    // only once `status` reaches "operational") accrued no exposure with
    // zero indication anywhere in the response -- undermining the very
    // "real measurements, not permanent zeros" claim this day exists to
    // make. Surfaced as a response field; never blocks the score itself,
    // since a scoring failure and an exposure-bookkeeping failure are
    // different severities and the student's response is valid either way.
    const itemIndex = db.items.findIndex(it => it.id === itemId);
    const usageResult = recordItemUsage(item, db, {});
    if (usageResult.ok) {
      db.items[itemIndex] = usageResult.item;
    } else {
      response.exposureNote = usageResult.error;
    }

    // Day 34 (Week 7): Evidence Accumulation, run immediately after the
    // response above is scored and pushed. accumulateEvidence() re-derives
    // its posterior from session.responses (already updated) on every
    // call -- there is no incremental state to corrupt, so re-running it
    // over the whole history each submit is the same amount of work as
    // "just this response" would be, and is simpler and more obviously
    // correct than trying to update a posterior in place.
    //
    // Wrapped defensively: by this point the student's response has
    // already been validly scored and exposure-recorded above. A defect
    // in accumulation -- a module explicitly built to REFUSE rather than
    // guess, so a thrown error here should mean a genuine bug, not a
    // plausible data situation -- must never roll back or block a response
    // that already happened. Mirrors recordItemUsage's exposureNote
    // pattern immediately above: a bookkeeping failure is surfaced, not
    // allowed to fail the request.
    let assemblyProgress = [];
    try {
      const accumulation = accumulateEvidence(session, db);
      applyPosteriorsToSession(session, accumulation);
      assemblyProgress = resolveAssemblyProgress(accumulation.posteriors, db);
    } catch (err) {
      response.accumulationNote = `Evidence accumulation failed: ${err.message}`;
    }

    const { valid, errors } = validateEntity("sessions", session, db);
    if (!valid) {
      return res.status(400).json({ error: "Schema validation failed", details: errors });
    }

    saveDB(db);
    // `assemblyProgress` is surfaced in the response only -- see its own
    // module header for why it is never persisted or acted on here.
    return res.json({ ...session, assemblyProgress });
  }

  // 🔹 Validation: observationId & evidenceId
  const taskModel = db.taskModels.find(tm => tm.id === task.taskModelId);

  let validObs = new Map();
  let validEvidenceIds = new Set();

  for (const emId of taskModel.evidenceModelIds || []) {
    const em = db.evidenceModels.find(m => m.id === emId);
    if (em) {
      for (const obs of em.observations || []) validObs.set(obs.id, obs);
      for (const ev of em.evidences || []) validEvidenceIds.add(ev.id);
    }
  }

  if (observationId && !validObs.has(observationId)) {
    return res.status(400).json({ error: `Invalid observationId: ${observationId}` });
  }
  if (evidenceId && !validEvidenceIds.has(evidenceId)) {
    return res.status(400).json({ error: `Invalid evidenceId: ${evidenceId}` });
  }
  // Enhanced rubricLevel validation for both legacy and criteria-based rubrics
    if (rubricLevel && observationId) {
    const obs = validObs.get(observationId);
    if (!obs || !obs.rubric) {
      return res.status(400).json({ error: `Invalid rubricLevel ${rubricLevel} for observation ${observationId}` });
    }
  
    // Check plain levels (legacy rubrics)
    const hasLegacy = Array.isArray(obs.rubric.levels) && obs.rubric.levels.includes(rubricLevel);
  
    // Check criteria-based rubrics (new format)
    const hasCriteria = Array.isArray(obs.rubric.criteria) &&
      obs.rubric.criteria.some(c =>
        Array.isArray(c.levels) && c.levels.some(l => l.name === rubricLevel)
      );
    
    if (!hasLegacy && !hasCriteria) {
      return res.status(400).json({ error: `Invalid rubricLevel ${rubricLevel} for observation ${observationId}` });
    }
  }

  // 🔹 Save response in session
  const response = {
    taskId,
    questionId: questionId || null,
    rawAnswer: rawAnswer || null,
    observationId: observationId || null,
    scoredValue: scoredValue !== undefined ? scoredValue : null,
    evidenceId: evidenceId || null,
    rubricLevel: rubricLevel || null,
    timestamp: new Date().toISOString(),
  };

  session.responses.push(response);
  session.currentTaskIndex = Math.min(session.currentTaskIndex + 1, session.taskIds.length);
  session.updatedAt = new Date().toISOString();

  // 🔹 Update Task Instance: record generated evidence/observations
  if (observationId && !task.generatedObservationIds.includes(observationId)) {
    task.generatedObservationIds.push(observationId);
  }
  if (evidenceId && !task.generatedEvidenceIds.includes(evidenceId)) {
    task.generatedEvidenceIds.push(evidenceId);
  }
  task.updatedAt = new Date().toISOString();

  // 🔹 IRT theta update via R backend (using global fetch)
  if (session.selectionStrategy === "IRT") {
    try {
      const R_BACKEND_URL = process.env.R_BACKEND_URL || "http://r-backend:4000"; // ✅ fix default port

      const response = await fetch(`${R_BACKEND_URL}/irt/estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses: session.responses,
          itemBank: (db.questions || []).map(q => ({
            id: q.id,
            a: q.metadata?.a ?? 1,
            b: q.metadata?.b ?? 0,
            c: q.metadata?.c ?? 0
          }))
        })
      });

      const result = await response.json();

      if (!session.studentModel) session.studentModel = {};
      if (result.theta !== undefined) {
        session.studentModel.irtTheta = result.theta;
        session.studentModel.stderr = result.stderr;
      } else {
        console.warn("IRT backend did not return theta:", result);
      }
    } catch (err) {
      console.error("IRT estimation failed:", err);
    }
  }


  const { valid, errors } = validateEntity("sessions", session, db);
  if (!valid) {
    return res.status(400).json({ error: "Schema validation failed", details: errors });
  }

  saveDB(db);
  res.json(session);
});


// ------------------------------
// GET /api/sessions/:id/next-task
// ------------------------------
router.get("/:id/next-task", (req, res) => {
  const db = loadDB();
  const session = db.sessions.find(s => s.id === req.params.id && !s.isCompleted);
  if (!session) return res.json({});

  // Sequential strategy
  if (session.selectionStrategy === "fixed") {
    if (session.currentTaskIndex < session.taskIds.length) {
      return res.json({
        taskId: session.taskIds[session.currentTaskIndex],
        strategy: "fixed",
        debug: { index: session.currentTaskIndex }
      });
    }
    return res.json({});
  }

  // IRT strategy
  if (session.selectionStrategy === "IRT") {
    const theta = session.studentModel?.irtTheta ?? 0;
    let bestTask = null;
    let bestDiff = Infinity;
    let debugInfo = {};

    for (const tid of session.taskIds) {
      if (session.responses.some(r => r.taskId === tid)) continue;
      const task = db.tasks.find(t => t.id === tid);
      if (!task) continue;

      const q = db.questions.find(qq => qq.id === task.questionId);
      if (!q) continue;

      const b = q.metadata?.b;
      if (typeof b !== "number") continue;

      const diff = Math.abs(b - theta);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestTask = task;
        debugInfo = { theta, b, diff };
      }
    }

    return bestTask
      ? res.json({ taskId: bestTask.id, strategy: "IRT", debug: debugInfo })
      : res.json({});
  }

  // Bayesian Network strategy
  if (session.selectionStrategy === "BayesianNetwork") {
    let bestTask = null;
    let bestGain = -Infinity;
    let debugInfo = {};

    for (const tid of session.taskIds) {
      if (session.responses.some(r => r.taskId === tid)) continue;
      const task = db.tasks.find(t => t.id === tid);
      if (!task) continue;

      const taskModel = db.taskModels.find(tm => tm.id === task.taskModelId);
      if (!taskModel) continue;

      let gain = 0;
      let obsDebug = [];

      for (const emId of taskModel.evidenceModelIds || []) {
        const em = db.evidenceModels.find(m => m.id === emId);
        if (!em || em.measurementModel?.type !== "BayesianNetwork") continue;

        const CPTs = em.measurementModel.bayesianConfig?.CPTs || {};
        for (const eo of taskModel.expectedObservations || []) {
          const obs = em.observations.find(o => o.id === eo.observationId);
          if (!obs) continue;

          const nodeId = obs.id;
          const prior = session.studentModel?.bnPosteriors?.[nodeId] ?? 0.5;
          const nodeCPT = CPTs[nodeId];
          if (!nodeCPT) continue;

          // Prior entropy
          const Hprior = entropy(prior);

          // CPT: { "true": P(obs=1|node=1), "false": P(obs=1|node=0) }
          const pObsGivenNode1 = nodeCPT["true"] ?? 0.8;
          const pObsGivenNode0 = nodeCPT["false"] ?? 0.2;

          // Expected posterior after obs=1 and obs=0
          const likelihood1 = pObsGivenNode1;
          const likelihood0 = pObsGivenNode0;

          // normalize
          const norm = likelihood1 * prior + likelihood0 * (1 - prior);
          const post1 = norm > 0 ? (likelihood1 * prior) / norm : prior;

          const norm2 = (1 - pObsGivenNode1) * prior + (1 - pObsGivenNode0) * (1 - prior);
          const post0 = norm2 > 0 ? ((1 - pObsGivenNode1) * prior) / norm2 : prior;

          // Expected entropy
          const Hexp = 0.5 * entropy(post1) + 0.5 * entropy(post0);
          const infoGain = Hprior - Hexp;

          // Info gain
          gain += Hprior - Hexp;
          obsDebug.push({ nodeId, prior, Hprior, post1, post0, Hexp, infoGain });
        }
      }

      if (gain > bestGain) {
        bestGain = gain;
        bestTask = task;
        debugInfo = { totalGain: gain, observations: obsDebug };
      }
    }

    return bestTask
      ? res.json({ taskId: bestTask.id, strategy: "BayesianNetwork", debug: debugInfo })
      : res.json({});
  }

  return res.json({});
});

// ------------------------------
// POST /api/sessions/:id/pause
// ------------------------------
router.post("/:id/pause", (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  if (!db.sessions) db.sessions = [];
  const idx = db.sessions.findIndex((s) => s.id === id);
  if (idx === -1) return res.status(404).json({ error: "Session not found" });

  db.sessions[idx].status = "paused";
  db.sessions[idx].updatedAt = new Date().toISOString();
  saveDB(db);
  res.json(db.sessions[idx]);
});

// ------------------------------
// POST /api/sessions/:id/resume
// ------------------------------
router.post("/:id/resume", (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  if (!db.sessions) db.sessions = [];
  const idx = db.sessions.findIndex((s) => s.id === id);
  if (idx === -1) return res.status(404).json({ error: "Session not found" });

  if (db.sessions[idx].status !== SESSION_STATUS.PAUSED) {
    return res.status(400).json({ error: "Session is not paused" });
  }

  db.sessions[idx].status = SESSION_STATUS.IN_PROGRESS;
  db.sessions[idx].updatedAt = new Date().toISOString();
  saveDB(db);
  res.json(db.sessions[idx]);
});


// ------------------------------
// POST /api/sessions/:id/finish
// ------------------------------
router.post("/:id/finish", (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  if (!db.sessions) db.sessions = [];
  const idx = db.sessions.findIndex((s) => s.id === id);
  if (idx === -1) return res.status(404).json({ error: "Session not found" });

  db.sessions[idx].status = "completed";   // ✅ mark completed
  db.sessions[idx].isCompleted = true;     // keep legacy flag if used
  db.sessions[idx].updatedAt = new Date().toISOString();

  saveDB(db);
  res.json(db.sessions[idx]);
});

// ------------------------------
// POST /api/sessions/:id/review
// ------------------------------
router.post("/:id/review", (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  if (!db.sessions) db.sessions = [];
  const idx = db.sessions.findIndex((s) => s.id === id);
  if (idx === -1) return res.status(404).json({ error: "Session not found" });

  const session = db.sessions[idx];
  session.status = "reviewed";
  session.isCompleted = true;
  session.reviewedAt = new Date().toISOString();
  session.updatedAt = new Date().toISOString();

  saveDB(db);
  res.json(session);
});

// ------------------------------
// POST /api/sessions/:id/archive
// ------------------------------
router.post("/:id/archive", (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  if (!db.sessions) db.sessions = [];
  const idx = db.sessions.findIndex((s) => s.id === id);
  if (idx === -1) return res.status(404).json({ error: "Session not found" });

  db.sessions[idx].status = "archived";
  db.sessions[idx].updatedAt = new Date().toISOString();
  saveDB(db);
  res.json(db.sessions[idx]);
});

// ------------------------------
// DELETE /api/sessions/:id
// ------------------------------
// For admin use only
router.delete("/:id", adminOnly, (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  if (!db.sessions) db.sessions = [];
  const idx = db.sessions.findIndex((s) => s.id === id);
  if (idx === -1) return res.status(404).json({ error: "Session not found" });

  const deleted = db.sessions.splice(idx, 1)[0];
  saveDB(db);
  res.json({ success: true, deleted });
});

export default router;
