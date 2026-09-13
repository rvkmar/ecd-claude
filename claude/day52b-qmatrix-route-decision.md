# D52b — Q-matrix editor stays an Admin tab

**Status: DECISION RECORDED.** Not a code unit.

> **Restored 2026-09-13** from `CHANGELOG.md` Known gaps, `8ef0313`, and the current `App.jsx` / `AdminPage.jsx` layout. The contemporaneous note was cited and never committed. The rationale below is only what those sources plus the shipped routes support.

---

## Decision

The Q-matrix **authoring** surface stays a tab on the Admin page (`AdminPage` → `TabsTrigger value="qmatrix"` → `QMatrixModelBuilder`). It does **not** get a dedicated `/admin/q-matrices` route.

CHANGELOG: *"a deliberate decision, not an oversight."*

---

## What the spec asked for, and what shipped

`8ef0313` listed "no dedicated route" among the first-land divergences from the calendar spec. The UI specification names `/district/q-matrices` (read-only for district) explicitly (`9870634`, `App.jsx`, `QMatrixReadOnly.test.jsx`). It does not, in any committed source, force a matching admin URL.

Admin authoring for Competency / Evidence / Task Model / Item Bank is already tabbed on `AdminPage`. Q-matrix followed that shell: `QMatrixModelBuilder` is list ↔ editor only, no Dashboard sub-tab (`QMatrixModelBuilder.jsx`: nothing in D51's exit check called for one).

Assembly Models later took a dedicated `/admin/assembly-models` route (D54). That is a different collection, added after this decision, and is not a reversal of it.

---

## District is the contrast, not the counter-example

`9870634` gave district users **both** a dashboard "Q-Matrix" tab **and** the spec-named `/district/q-matrices`. `/district/competencies`, `/district/tasks`, and `/district/questions` were already routed with no inbound link — "nothing but a typed URL reaches them." A route alone would have reproduced F7 (D50: a player URL that nothing in the app could navigate to). The tab is the reachable entry; the route is the addressable one.

Admin already had the reachable entry (the new tab). Adding a second admin URL without a new inbound need was the speculative half.

---

## What this is not

- Not a refusal of district read-only access. That surface shipped later the same day.
- Not a claim that `/admin/q-matrices` would be wrong if a later unit added it. The decision is that D51/D52 did not owe that route to be done.
