// src/utils/sessionPlay.js
//
// Role-prefixed player URLs and "this session is for this student" matching.
//
// Play used to do `window.location.href = /sessions/${id}/player`. That path
// has never been registered: App.jsx's catch-all sends it to /login, which
// is the staff Play "logout". Every role that can play must use
// `/${role}/sessions/:sessionId/player`.
//
// Student discovery has a second identity gap: sessions store `studentId`
// from the students collection (`stu…`), while the logged-in user is a
// `users` row (`stud1`). Until enrollment links those, matching is
// username / user id / student name / optional student.username — and if
// none of those hit, live sessions stay visible so a student can still
// attend (the API already returns every session to any authenticated role).

import { LIVE_SESSION_STATUSES, SESSION_STATUS, normalizeSessionStatus } from "./sessionStatus";

export const PLAYABLE_ROLES = Object.freeze(["student", "teacher", "district"]);

export function sessionPlayerPath(role, sessionId) {
  if (!sessionId || !PLAYABLE_ROLES.includes(role)) return null;
  return `/${role}/sessions/${sessionId}/player`;
}

export function studentIdentityKeys(user, students = []) {
  const keys = new Set();
  if (!user) return keys;
  if (user.username) keys.add(String(user.username));
  if (user.id) keys.add(String(user.id));
  for (const s of students || []) {
    if (!s) continue;
    const linked =
      (user.username &&
        (s.username === user.username ||
          s.name === user.username ||
          s.userId === user.username ||
          s.id === user.username)) ||
      (user.id && (s.id === user.id || s.userId === user.id));
    if (linked && s.id) keys.add(String(s.id));
  }
  return keys;
}

export function sessionAssignedToStudent(session, user, students = []) {
  if (!session?.studentId || !user) return false;
  return studentIdentityKeys(user, students).has(String(session.studentId));
}

function isInProgressStatus(status) {
  return normalizeSessionStatus(status) === SESSION_STATUS.IN_PROGRESS;
}

export function isAttendableStatus(status) {
  return LIVE_SESSION_STATUSES.includes(status) || isInProgressStatus(status);
}

export function attendableSessionsForStudent(sessions, user, students = []) {
  const live = (sessions || []).filter((s) => isAttendableStatus(s?.status));
  const assigned = live.filter((s) => sessionAssignedToStudent(s, user, students));
  // If we can resolve this user onto at least one session, only show those.
  // Otherwise show every live session so discovery is not empty solely
  // because users and students are still unlinked collections.
  if (assigned.length > 0) return assigned;
  return live;
}

export function canPauseSession(session, { reviewMode = false } = {}) {
  if (reviewMode || !session) return false;
  if (session.autoFinished || session.isCompleted) return false;
  return isInProgressStatus(session.status) || session.status === SESSION_STATUS.REOPENED;
}
