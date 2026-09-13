// server/delivery/sessionReportMeasurement.js
//
// D59: the measurement fields every session-level report shares.
// Classification is recomputed from stored posteriors (ADR 0004 / D57:
// nothing in attributeClassification.js is persisted as a second source
// of truth). The stop record is the one D58 already wrote on the session.
//
// This is not a second reporting stack and not a second stopping decision.
// reportsRoutes.js is the only HTTP caller.

import { classifyAttributeProfile } from "./attributeClassification.js";

/**
 * @param {object|null|undefined} session
 * @returns {{
 *   stopped: object|null,
 *   attributeProfile: ReturnType<typeof classifyAttributeProfile>,
 * }}
 */
export function sessionMeasurementReport(session) {
  const stopped =
    session?.stopped && typeof session.stopped === "object" && !Array.isArray(session.stopped)
      ? session.stopped
      : null;

  let attributeProfile = classifyAttributeProfile(session?.studentModel?.smvPosteriors);

  // A session that stopped on classification before posteriors were
  // persisted (or whose studentModel was later cleared) can still show
  // the profile D58 stored on the stop record. Prefer the live
  // recompute when it produced anything.
  if (attributeProfile.length === 0 && Array.isArray(stopped?.targets)) {
    attributeProfile = stopped.targets
      .filter((t) => t && t.smvId && t.classification)
      .map((t) => ({
        smvId: t.smvId,
        estimate: t.estimate,
        classification: t.classification,
        expectedClassificationAccuracy: t.expectedClassificationAccuracy ?? null,
        masteryThreshold: t.masteryThreshold,
      }));
  }

  return { stopped, attributeProfile };
}
