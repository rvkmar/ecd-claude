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
  IN_PROGRESS: "in_progress",
  PAUSED: "paused",
  REOPENED: "reopened",
  SUBMITTED: "submitted",
});

// A session that still counts as "the student could come back to this".
// Paused is included deliberately: pausing is a break, not an ending, and
// resume puts it straight back into delivery.
export const LIVE_SESSION_STATUSES = [
  SESSION_STATUS.IN_PROGRESS,
  SESSION_STATUS.REOPENED,
  SESSION_STATUS.PAUSED,
];
