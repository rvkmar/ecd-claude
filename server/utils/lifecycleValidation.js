// server/utils/lifecycleValidation.js

// Updated lifecycle validation aligned with latest ECD Task Model architecture
import { canTransition } from "../utils/lifecycleMatrix.js";
import {
  liveSessionsForTaskModel,
  liveSessionsBlockMessage,
} from "./sessionDependencies.js";

export const STATUS_ORDER = [
  "draft",
  "reviewed",
  "confirmed",
  "operational",
  "suspended",
  "archived",
];

// -------------------------------------
// Helper: compare lifecycle progression
// -------------------------------------
export function isPromotion(prevStatus, nextStatus) {
  const prev = prevStatus || "draft";
  const next = nextStatus || prev;

  if (!canTransition(prev, next)) {
    return false;
  }

  return STATUS_ORDER.indexOf(next) > STATUS_ORDER.indexOf(prev);
}

// -------------------------------------
// TASK MODEL lifecycle validation
// -------------------------------------
// `db` is required for the activation rule below, which has to look at the
// item bank. It is optional so the structural rules stay callable without
// one (the client-side readiness checks do exactly that); when it is
// omitted the item rule is skipped, so every SERVER call site must pass it.
export function validateTaskModelLifecycle(taskModel, db = null, options = {}) {
  const errors = [];
  const status = taskModel.status || "draft";

  /* --------------------------------------------------
     REVIEWED
     Structural completeness required
  -------------------------------------------------- */
  if (["reviewed", "confirmed", "operational", "suspended"].includes(status)) {

    if (!taskModel.name || !taskModel.description) {
      errors.push("Reviewed tasks must define name and description.");
    }

    /* The primary-competency gate was removed here.

       A Task Model has never had a competency field in the schema; the
       wizard wrote one into `taskPurpose.primaryCompetencyId` and this
       check was the only thing that enforced it. That made the competency
       a second, unvalidated declaration of the construct, free to
       contradict the one that actually governs the inference:
       evidenceModel.competencyId on the bound Evidence Model.

       A Task Model now binds Evidence Models and derives its construct
       from them. `primaryEvidenceModelId` takes the place of the primary
       claim -- and because it is a pointer INTO evidenceModelIds, it
       cannot disagree with the binding. */

    if (!Array.isArray(taskModel.evidenceModelIds) || taskModel.evidenceModelIds.length === 0) {
      errors.push("Reviewed tasks must link at least one Evidence Model.");
    } else if (!taskModel.primaryEvidenceModelId) {
      errors.push("Reviewed tasks must nominate a primary Evidence Model.");
    } else if (!taskModel.evidenceModelIds.includes(taskModel.primaryEvidenceModelId)) {
      errors.push("primaryEvidenceModelId must be one of the linked Evidence Models.");
    }

    if (!Array.isArray(taskModel.expectedObservations) || taskModel.expectedObservations.length === 0) {
      errors.push("Reviewed tasks must define at least one expected observation.");
    }
  }

  /* --------------------------------------------------
     CONFIRMED
     Structural integrity of what is about to be locked.

     taskCompositionType now HAS an authoring path (Step4TaskStructure),
     as does subTaskIds (SubTaskSelector, previously an orphan file the
     wizard never mounted), so both can be enforced here.

     itemMappings deliberately stays unenforced. Items are normally
     authored AFTER the Task Model they instantiate, so requiring
     coverage at confirmation would make the ordinary authoring order
     impossible. Step6ItemMapping surfaces coverage gaps as guidance and
     the client-side readiness checklist agrees -- keep the two in step.
  -------------------------------------------------- */
  if (["confirmed", "operational", "suspended"].includes(status)) {

    if (!taskModel.taskCompositionType) {
      errors.push("Confirmed tasks must declare a composition type.");
    }

    if (
      taskModel.taskCompositionType === "composite" &&
      (!Array.isArray(taskModel.subTaskIds) || taskModel.subTaskIds.length === 0)
    ) {
      errors.push("Composite tasks must declare at least one sub-task.");
    }

    if (!Array.isArray(taskModel.actions) || taskModel.actions.length === 0) {
      errors.push("Confirmed tasks must declare at least one student action.");
    }
  }

  /* --------------------------------------------------
     DEACTIVATION — no live sessions may depend on it

     Taking a Task Model out of delivery while a student is mid-session
     against it breaks that session: the next task it asks for is gone.

     This is the one gate on `suspended` and `archived`, and it is only
     safe to have because Force Deactivate exists
     (POST /api/taskModels/:id/force-deactivate). Without an escape hatch
     this would trap a Task Model in service exactly when someone most
     needs it out — which is why every OTHER activation rule deliberately
     leaves suspension ungated. Do not add a second gate here without a
     forced path through it.

     A PAUSED session counts as live: pausing is a break, not an ending,
     and /resume puts it straight back into delivery.
  -------------------------------------------------- */
  if (["suspended", "archived"].includes(status) && db && !options.force) {

    const live = liveSessionsForTaskModel(taskModel.id, db);

    if (live.length) {
      errors.push(
        liveSessionsBlockMessage(
          status === "archived" ? "Archiving this Task Model" : "Deactivating this Task Model",
          live
        )
      );
    }
  }

  /* --------------------------------------------------
     ACTIVATION — the evidence must be live first

     Activating a TaskModel puts it into service, and everything it
     produces is scored against its bound Evidence Models. Those models
     are only live once they are OPERATIONAL: a merely `confirmed`
     evidence model is structurally frozen but has not been activated, and
     a `suspended` one has been deliberately taken out of service, usually
     because its calibration is in question. Delivering a task whose
     scoring model is not live means collecting responses no one can score.

     So the chain has to be activated bottom-up:
       Evidence Model → operational
       TaskModel      → confirmed, then items authored and confirmed
       TaskModel      → operational

     ALL bound models must be operational, not just the primary. A task
     that also targets observables on a secondary model is not deliverable
     while that model is paused -- the observables it declares would go
     nowhere.

     Nothing here blocks a TaskModel from being CONFIRMED against a merely
     confirmed evidence model; that is the normal authoring order, and it
     is what isLinkableEvidenceModel already permits.
  -------------------------------------------------- */
  if (status === "operational" && db) {

    const notLive = [];

    for (const emId of taskModel.evidenceModelIds || []) {
      const em = db.evidenceModels?.find(e => e.id === emId);

      if (!em) {
        notLive.push(`${emId} (not found)`);
      } else if (em.status !== "operational") {
        notLive.push(`${em.name || emId} (${em.status})`);
      }
    }

    if (notLive.length) {
      errors.push(
        `TaskModel cannot be activated: every bound Evidence Model must be operational first. Not live: ${notLive.join(", ")}.`
      );
    }
  }

  /* --------------------------------------------------
     ACTIVATION — items must exist

     A TaskModel is a blueprint. Activating one means "this blueprint is
     live for delivery", and delivery happens through Items. A TaskModel
     with no Item instantiating it is live in name only: a session that
     selected it would have nothing to present.

     Version-matched deliberately. A cloned v2 starts with zero items --
     every existing item still declares taskModelVersion 1, and the item
     validator rejects a mismatch. Activating v2 on the strength of v1's
     items would put a blueprint into service that nothing can deliver, so
     the migrated items have to exist first.

     Confirmed-or-beyond deliberately. A draft or reviewed item is not
     locked and may never become real, so it cannot be what justifies
     activation. Requiring the items to be OPERATIONAL was considered and
     rejected: it would dictate an ordering the product has not asked for.
     Items can be activated before or after their TaskModel — item
     activation does not depend on the TaskModel's status.

     This applies ONLY to `operational`, never to `suspended`. Suspension
     and archival are the safety valves; if the item bank were later
     emptied, extending this rule to `suspended` would block the very
     transition used to take a broken TaskModel out of service.
  -------------------------------------------------- */
  if (status === "operational" && db) {

    const instantiating = (db.items || []).filter(
      (item) =>
        item.taskModelId === taskModel.id &&
        item.taskModelVersion === taskModel.versionNumber
    );

    const usable = instantiating.filter((item) =>
      ["confirmed", "operational", "suspended"].includes(item.status)
    );

    if (instantiating.length === 0) {
      errors.push(
        `TaskModel cannot be activated: no Item instantiates version ${taskModel.versionNumber} of it. Author and confirm at least one Item against this TaskModel first.`
      );
    } else if (usable.length === 0) {
      const states = [...new Set(instantiating.map((i) => i.status || "draft"))].join(", ");
      errors.push(
        `TaskModel cannot be activated: ${instantiating.length} Item(s) reference version ${taskModel.versionNumber}, but none is confirmed (found: ${states}). Confirm at least one.`
      );
    }
  }

  /* --------------------------------------------------
     OPERATIONAL
     Deployment readiness checks
  -------------------------------------------------- */
  if (["operational", "suspended"].includes(status)) {

    /* `accessibilityAssumptions` is an object the wizard always sends,
       so a bare truthiness test passed on `{}` -- an empty object is
       truthy. Require at least one populated field, which is what the
       client-side operationalReadiness() check reports. */
    const accessibility = taskModel.accessibilityAssumptions || {};
    const hasAccessibility = Object.values(accessibility).some(
      (v) => String(v ?? "").trim().length > 0
    );

    if (!hasAccessibility) {
      errors.push("Operational tasks must define accessibility assumptions.");
    }

    if (!taskModel.equivalenceGroupId) {
      errors.push("Operational tasks must define equivalenceGroupId.");
    }
  }

  return errors;
}

// -------------------------------------
// ITEM lifecycle validation
// -------------------------------------
// The item-side counterpart of validateTaskModelLifecycle above, and it
// did not exist before: item promotion was gated by a bespoke
// `simulateItemEvidence()` inside itemsRoutes.js that checked a different,
// smaller and partly contradictory set of rules from the ones
// src/utils/schema.js enforced a few lines later in the same request. An
// item could pass the simulation gate and then fail the schema write with
// a completely different message.
//
// One validator, called from the lifecycle route, the confirm path and
// the tests. Structural completeness still lives in schema.js's strict
// mode (that is what `strict` is for); what lives HERE is everything that
// depends on the item's PLACE IN THE SYSTEM rather than its own shape --
// the state of the models it binds, and the sessions that depend on it.
//
// `db` is required for every rule below, so it is not optional in
// practice; it keeps the optional signature only so the client-side
// readiness checks (itemConstants.operationalReadiness) can share the
// shape. MIRROR: itemConstants.operationalReadiness() reports the
// `operational` block to the author before they attempt the transition.

import { isInstantiableTaskModel } from "../../src/utils/schema.js";
import { liveSessionsForItem } from "./sessionDependencies.js";

export function validateItemLifecycle(item, db = null, options = {}) {
  const errors = [];
  const status = item.status || "draft";

  if (!db) return errors;

  const taskModel = (db.taskModels || []).find((t) => t.id === item.taskModelId);
  const evidenceModel = (db.evidenceModels || []).find(
    (e) => e.id === item.evidenceModelId
  );

  /* --------------------------------------------------
     REVIEWED and beyond — the chain must still resolve

     Checked at every non-draft status rather than only on entry to
     `reviewed`, because the models underneath an item can change after
     it was reviewed: a Task Model can be cloned to a new version, an
     Evidence Model can be archived. An item whose chain has since broken
     must not be promotable further on the strength of a review that was
     valid weeks ago.
  -------------------------------------------------- */
  if (status !== "draft") {

    if (!taskModel) {
      errors.push("The Task Model this item instantiates no longer exists.");
    } else {

      if (!isInstantiableTaskModel(taskModel)) {
        errors.push(
          `The bound Task Model is '${taskModel.status}'${
            taskModel.locked ? "" : " and unlocked"
          }; items may only instantiate confirmed, operational or suspended Task Models.`
        );
      }

      if (item.taskModelVersion !== taskModel.versionNumber) {
        errors.push(
          `This item is locked to version ${item.taskModelVersion} of its Task Model, which is now at version ${taskModel.versionNumber}. Clone the item onto the new version.`
        );
      }

      const declared = (taskModel.expectedObservations || []).find(
        (eo) => eo.observationId === item.observationId
      );

      if (!declared) {
        errors.push(
          `The Task Model no longer declares observation '${item.observationId}'.`
        );
      }
    }

    if (!evidenceModel) {
      errors.push("The Evidence Model behind this item's observation no longer exists.");
    }
  }

  /* --------------------------------------------------
     ACTIVATION — the evidence must be live first

     Same rule, and the same reasoning, as the Task Model's activation
     gate: everything this item produces is scored against its Evidence
     Model, and a model that is merely `confirmed` has been frozen but
     never activated, while a `suspended` one has been deliberately taken
     out of service (usually because its calibration is in doubt).
     Delivering an item whose scoring model is not live means collecting
     responses no one can score.

     Deliberately NOT gated on the Task Model's status. The two are
     activated independently and in either order — requiring an
     operational Task Model here while the Task Model's own activation
     rule requires a confirmed item there would be a deadlock neither
     side could break.
  -------------------------------------------------- */
  if (status === "operational") {

    if (evidenceModel && evidenceModel.status !== "operational") {
      errors.push(
        `Item cannot be activated: its Evidence Model '${
          evidenceModel.name || evidenceModel.id
        }' is ${evidenceModel.status}, not operational. Activate it first, or this item collects responses nothing can score.`
      );
    }

    if (!String(item.equivalenceGroupId || "").trim()) {
      errors.push(
        "Operational items must declare an equivalenceGroupId, so an equivalent replacement can be swapped in when this one is retired or over-exposed."
      );
    }

    if (!item.exposureControl?.maxUsageBeforeRetire) {
      errors.push(
        "Operational items must declare exposureControl.maxUsageBeforeRetire. Without a ceiling the item is delivered indefinitely and never retires."
      );
    }

    /* Reactivation ceiling. `reactivationCount` and `maxReactivations`
       have been in the schema since the beginning with nothing reading
       them, because the old lifecycle guard made suspended -> operational
       unreachable in the first place. Now that the transition exists,
       the ceiling it was written for is enforced. */
    const reactivations = item.exposureControl?.reactivationCount || 0;
    const maxReactivations = item.exposureControl?.maxReactivations || 0;

    if (maxReactivations > 0 && reactivations >= maxReactivations) {
      errors.push(
        `This item has been reactivated ${reactivations} time(s), reaching its ceiling of ${maxReactivations}. Clone it rather than returning it to service again.`
      );
    }
  }

  /* --------------------------------------------------
     DEACTIVATION — no live session may depend on it

     Mirrors the Task Model gate, and is safe for the same reason: an
     escape hatch exists ({ force: true }, admin only). A PAUSED session
     counts as live.
  -------------------------------------------------- */
  if (["suspended", "archived"].includes(status) && !options.force) {

    const live = liveSessionsForItem(item.id, db);

    if (live.length) {
      const names = live.slice(0, 3).map((s) => s.id).join(", ");
      errors.push(
        `${
          status === "archived" ? "Archiving this Item" : "Suspending this Item"
        } would break ${live.length} live session(s) (${names}${
          live.length > 3 ? ", …" : ""
        }). Wait for them to finish, or force the transition.`
      );
    }
  }

  return errors;
}
