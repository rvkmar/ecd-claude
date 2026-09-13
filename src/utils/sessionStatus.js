// src/utils/sessionStatus.js
// ------------------------------------------------------------
// The canonical spelling for a session's in-progress status.
//
// The codebase used to write this field two different ways:
// server/routes/sessionRoutes.js created sessions as "in-progress"
// (hyphen), while server/utils/autoFinish.js and src/utils/schema.js both
// tested for "in_progress" (underscore) -- meaning the autoFinish sweep and
// schema's evidence-integrity checks silently never matched a session
// created through the normal flow. SessionPlayer.jsx defensively checked
// both spellings at every read site rather than trust either.
//
// "in_progress" (underscore) is canonical, matching every other status
// value in this codebase (draft, reviewed, confirmed, operational,
// suspended, archived, submitted, paused, reopened, completed -- none of
// which use a hyphen). server/migrations/migrations/001-normalize-session-status.js
// rewrites any on-disk "in-progress" records; this module is the single
// place the value is spelled out so it cannot re-diverge.
// ------------------------------------------------------------

export const SESSION_STATUS = Object.freeze({
  // Created and assigned, not yet opened for delivery. Staff Play persists
  // this to in_progress; Pause is not offered until then.
  READY: "ready",
  IN_PROGRESS: "in_progress",
  PAUSED: "paused",
  REOPENED: "reopened",
  SUBMITTED: "submitted",
});

// A session that still counts as "the student could come back to this".
// Ready is discoverable (assigned, not open). Paused is a break, not an
// ending, and Play/resume puts it straight back into delivery.
export const LIVE_SESSION_STATUSES = [
  SESSION_STATUS.READY,
  SESSION_STATUS.IN_PROGRESS,
  SESSION_STATUS.REOPENED,
  SESSION_STATUS.PAUSED,
];

// Path segments that are collection routes, never session ids. GET /:id
// must not 404 these as "Session not found" — that string is what Student
// My Sessions showed when /mine failed to register.
export const RESERVED_SESSION_COLLECTION_IDS = Object.freeze([
  "mine",
  "active",
  "archived",
]);

// Older records used a hyphen. Compare after this, never against that
// spelling written out — repoGuards scans src/ for the hyphenated literal.
export function normalizeSessionStatus(status) {
  if (status == null || status === "") return status;
  return String(status).replace("-", "_");
}
