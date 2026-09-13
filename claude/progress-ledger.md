# ECD progress ledger

Restored 2026-09-13 at D58 close. The file was missing from the repo; this reconstruction is from `git log`, `CHANGELOG.md`, and the day handoffs that *are* in `claude/`. Pre-D50 day files for D51–D57 were cited in the changelog and are still absent from `claude/` — git is the authority for those units.

## Current position

| | |
|---|---|
| Last completed unit | **D58** (revised) — persist + show Assembly Model stop |
| Next queued | **D59** — report split / attribute profile / examinee leak |
| Block | W12 — Activity Selection, stopping, reporting |
| Block gate | Sessions end on an accuracy target, not only on length; attribute-profile report renders |
| Gate status | Stopping **evaluates and persists**; player can **show** the reason (tests). Attribute-profile **report** is D59. Live diagnostic stop in a browser not walked. |
| HEAD at D58 code | `ede5f33` |
| HEAD at this close | see close commit |

## Session log

| Date (IST) | Units | Tier mix | Notes |
|---|---|---|---|
| 2026-09-13 | D58 | 2, alone | Premise rewritten: no new orchestrator. Persist `session.stopped`; player reads `data.stopped`. D57 author copy updated. Full suite this close did not finish (27 worker timeouts); D58 files 55/55; build clean. |

## Compression debt

| Unit | What was compressed | Why | Discharge by | Status |
|---|---|---|---|---|
| D50 | District/teacher browser pass skipped | Human logins | D71 | open |
| D55 | Entire W11 accessibility audit skipped | Never scheduled after Q-matrix/Assembly shipped | Re-date at W12 close or before D73 | **open, past one block close → standing risk** |
| D56 | Adaptive selection not live-browser | Tests only | D71 | open |
| D58 | Live diagnostic-session ending screen not walked | Component + route tests; student login not used this session | D71 | open |
| D57 | Author UI said accuracy was unevaluated | Folded into D58 | D58 | **closed** |
| D46 | Phase-2 `apiFetch` | — | — | **closed** (`e533a77` / PRs #5–#6) |
| D54 | Wizard readiness mirror has no agreement test | Token | W12 close | open |

Debt against the never-compress list is not permitted. **D60** is next on that list — do not start it in the same session as D59.

## Units revised on contact

| Unit | Plan assumed | Code actually was | Became |
|---|---|---|---|
| D58 | Write `sessionOrchestrator.js`; stop on accuracy, length, or coverage | Stop already in `activitySelection.js`; no coverage field | Persist `{ stopped }` on the session; player shows the reason; do not add a second orchestrator |

## Carried-forward gaps

- ~~F4 — `buildCompositeLibrary()` has no caller~~ closed D49a + D49c
- ~~F3 — client computes the score~~ closed D47
- ~~Classification accuracy visible but unevaluated~~ closed D57; persist/show closed D58
- Mastery cut fixed at 0.5 — still true
- Classification on reports — D59
- `gdina` has no pilot path
- Session not bound to a specific Assembly Model (ambiguous match → none applied)
- Adaptive selection: nearest difficulty, not max information (held for benchmark work)
- Chunk >500 kB — D74
- Student My Sessions placeholder
- Dead-export guard can miss unused exports that share a name
