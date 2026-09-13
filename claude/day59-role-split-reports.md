# D59 — role-split reports, attribute profile, examinee leak

**Status: DONE.**

**Exit check:** *An examinee cannot retrieve teacher-report data; `SessionReport` / `reportsRoutes` are split by role; D57 classification and the D58 stop reason appear on the report surfaces D58 left out (session detail, report header, session-list badge, learner and teacher reports).* **Met** — in tests. No live browser walk this session (player ending screen remains D58's; this unit is the report stack).

D60 (never-compress adversarial review of selection/stopping) was **not** started.

---

## Where the plan was right, and what was already true

The calendar said: split existing `SessionReport` / `reportsRoutes` by role; add the D57 classification to the report; stop fetching teacher content for an examinee.

What was already true at `84f6cd1` (PR #9 on main, after D58):

- There is one reporting stack: `server/routes/reportsRoutes.js` and `src/components/sessions/SessionReport.jsx`. No second stack was invented.
- `GET /api/reports/session/:id/teacher-report` required a token and **nothing else**. A student who knew a session id received the staff payload (responses with competency/evidence ids, model summary, group recommendations).
- `SessionReport` always `Promise.all`'d the generic report, learner-feedback, **and** teacher-report, then showed a Teacher tab to everyone.
- Classification is a pure function of a stored posterior (`attributeClassification.js`). D58 persists `{ stopped }` (including `targets[].classification` when the stop was diagnostic) and shows it on the **player** ending screen only.
- PR #9 already requires every *declared* Assembly Model target to be scored before `targetsMet` fires. The D58 “reported vs declared” finding is closed on that point; it is not re-opened here.

D59 therefore gated the existing teacher routes, stopped the client asking for them as an examinee, and attached the existing measurement fields to the existing report payloads/surfaces.

---

## What was delivered

- **Examinee leak closed.** `authorizeRole(["admin", "district", "teacher"])` on
  `GET /session/:id/teacher-report`, `GET /teacher/class/:classId`, and
  `GET /teacher/district/:districtId`. Matches `rolePermissions.js` `teacherReports`
  (admin / district / teacher; student omitted by design). Learner-feedback and
  the generic session report stay open to any authenticated role.
- **Dashboard role is the token, not `?role=`.** The query string used to let any
  authenticated caller request the teacher/admin dashboard shape.
- **`classifyAttributeProfile()`** is now a real export of `attributeClassification.js`
  (the D57 note said to promote it in the same change as the caller). Reports
  recompute from `session.studentModel.smvPosteriors`; they fall back to
  `stopped.targets` only when no posterior is stored.
- Session-level report payloads carry `stopped` and `attributeProfile`. Learner
  feedback also folds masters/nonmasters into strengths/focus areas.
- **UI:** `SessionReport` fetches teacher-report only when
  `can(role, "view", "teacherReports")` and hides the Teacher tab otherwise.
  Report header, learner tab, and teacher tab show the stop reason and the
  attribute profile. Session list gets a stop badge. Session-player header
  (session detail) shows the stop line; the ending screen is unchanged from D58.

**Code commit:** this branch.

---

## Verification

| | |
|---|---|
| D59 files | role-split route tests; SessionReport + SessionList render tests; classification profile unit tests; `rolePermissions` leak assertion |
| Relevant vitest | see close notes / CI |
| Browser | not walked this session — report UI is covered by component tests; the live player stop screen remains D58's `s1789288381307` walk |
| D60 | not started |

---

## What remains

- **D60** — never-compress adversarial review of selection/stopping. Own session, different agent. Do not re-open the declared-vs-reported `targetsMet` point unless a regression is found (PR #9 / `84f6cd1`).
- Ownership-scoping (a student may only read *their* session) is still the gap `sessionRoutes.js` already names. D59 closed the *role* leak, not the *scope* leak.
- D50 district/teacher pass, D56 adaptive-selection live ranking walk — still D71.
- D55 WCAG audit never run (standing risk: missed W11 close).
- Student "My Sessions" tab is still a placeholder.
- Mastery cut still fixed at 0.5.
- Session still not bound to a specific Assembly Model.

---

## Next

D60 (never-compress): adversarial review of the selection/stopping chain. Own session.
