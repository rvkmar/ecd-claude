# D53 — Diagnostic (DINA / G-DINA) authoring + DINA pilot path

**Status: DONE** in two named halves. D53a = Evidence Wizard panel. D53b = item-level pilot DINA parameters + F14.

**Exit check (D53a, from `5ef0edc`):** both families appear in the statistical-model picker for a binary competency and nowhere else; a Q-matrix can be bound; a diagnostic Evidence Model reaches confirmed and locked. **Met**, walked live as admin.

**Exit check (D53b, from `530e3d4` / `0281453`):** a `dina`-scored item can be delivered and scored on author-supplied slip/guess before any calibrated set exists; the response snapshots those values. **Built** at `530e3d4` (suite not run that session); **verified** at `0281453` (1023/1023).

> **Restored 2026-09-13** from `5ef0edc`, `074910a`, `530e3d4`, `0281453`, `CHANGELOG.md`, `DINAConfigPanel.jsx`, and `schema.js`. No contemporaneous `claude/day53-*.md` was committed. D53a names three live-walk findings; only F14 is recorded as later fixed.

---

## D53a — configuration panel (`5ef0edc` / `074910a`, 2026-09-10 → 09-11)

`modelGuidanceLibrary.js` had six families and no `dina`/`gdina`, so the picker could not offer the family. `schema.js` has permitted both since D18 (the asymmetry was recorded as deliberate until this panel existed).

**What the panel owns**

- Exactly one writable field: `structureConfig.qMatrixId`.
- Everything else is derived from the bound Q-matrix and read-only:
  - attribute list, each with type and how many items require it
  - graded-lexicographic mastery-pattern ordering (D37) — shown, not configurable, because a G-DINA table is read positionally
  - advisory when the competency model declares a `trait` perspective (classifies, does not scale). Advisory until W30; silent when no perspective is declared
- Slip/guess are **not** authorable on the Evidence Model. The panel said so rather than implying a control. That field is D53b, on the **item**.

**What it deliberately does not do**

- Does not re-implement the server's "all Q-matrix attributes are binary SMVs" rule. The Combobox scopes to the evidence model's competency model (scoping, not a validity rule). A non-binary attribute is **shown** with its type so the schema refusal (`schema.js` ~1049) is actionable.
- Two binaries, different layers: picker gates on the competency's `variableType === "binary"` (`schema.js` ~1386); Q-matrix columns are the competency **model's** binary `smVariables`.

Split into a pure `DINAConfigPanelView` plus a six-line container so the required Storybook story could be written honestly.

**Verification (D53a)**

- Strongest test: ask the real validator, for each of four competency variable types, whether it would admit a DINA model, and assert the picker agrees. Passed for the wrong reason twice first (draft fixture skipped the compatibility block; schema states one rule in three message shapes). Six mutations, all six caught.
- Walked live as admin against the rebuilt stack: picker shows **7 of 8** for a binary competency; binding persists through a real save; attribute table derives correctly; Step 7 audit passes clean; diagnostic Evidence Model reaches confirmed and locked.
- **1005/1005** tests, 56 files, 22 new. Build clean.

**Findings logged, not fixed in D53a**

1. **F14.** A confirmed Evidence Model could cite a draft or archived Q-matrix. No lifecycle check on the pointer. **Fixed in D53b.**
2. `validateEntity` throws on a confirmed model with no `observables` array. Not recorded as fixed in later D51–D57 commits.
3. Step 2's claim gate blocks Next with no rendered message. Not recorded as fixed in later D51–D57 commits.

---

## D53b — item-level pilot DINA (`530e3d4`, 2026-09-11)

D53's fourth spec'd field (per-item slip/guess) is not buildable on the Evidence Model: `evidenceAccumulation.js` had no item-level pilot DINA field, and the IRT analogue already lives on the item.

**What shipped**

- `psychometrics.dinaParams` `{slip, guess, updatedAt, source}` on the item schema. Usable pair: each in `[0, 1)`, `guess < 1 - slip`.
- Item Wizard Step 7 control for that pair.
- `sessionRoutes.js` pilot-fallback branch mirroring the existing IRT one. Snapshot-pins `pilotParams` onto the response so a later calibration or a later edit of the item's own pilot values cannot silently change an already-scored response.
- `evidenceAccumulation.js` dispatch through existing `accumulateAttributeMastery`.
- **`gdina` has no pilot path.** Calibrated parameters are a probability table sized to each item's required-attribute count, not a fixed pair. CHANGELOG Known gaps still say so.

**F14 fix (same commit)**

`schema.js`'s dina/gdina structural check now requires the bound Q-matrix's own lifecycle status to be confirmed / operational / suspended, gated by `allowDraftParents` like every other parent-lifecycle guard.

**Verification**

- `530e3d4`: npm registry returned a confirmed non-transient 403 (`host_not_allowed`) for the whole session. No `npm ci`, vitest, vite build, or Docker walk. `node --check` on `.js`; manual brace/tag review on `.jsx`. The commit cites `claude/day54-d53b-and-d54-built-unverified.md` (also never committed). **Do not treat this commit as the done signal.**
- `0281453`: **1023/1023** passing (full run 1021 + 2 confirmed in isolation). That is the verification close for D53b + D54 together.

**Known gap recorded with D53b (CHANGELOG):** creating an item through the API with pilot DINA values already set in the same request silently drops them — only a follow-up edit persists them. Not believed reachable through the Item Wizard (later-step save). Not fixed in this block.

The Evidence Wizard panel still carries the D53a sentence that slip/guess are "not authorable yet" and that no diagnostic item field exists. D53b put the field on the item; that panel copy was not rewritten in the D53b commit message.

## Next

D54 — Assembly Model wizard (built in the same `530e3d4` session as D53b).
