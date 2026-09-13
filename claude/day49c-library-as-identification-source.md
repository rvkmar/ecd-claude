# D49c — library as the Identification / scoring source

**Status: DONE.** Closes F4's remaining half. D56 already re-pointed Activity
Selection; this unit re-points Evidence Identification and writes the
snapshot-vs-live decision ADR 0003 left as a Consequence.

**Exit check:** Identification/scoring structural reads come from the active
`compositeLibrary` package; calibrated parameters stay live; missing /
inactive / stale packages refuse rather than score against the live graph;
happy path matches the authoring graph when the package does; a live
structural edit without rebuild does not change the score; a parameter flip
without rebuild does. **Met.**

D56's browser walk and D58 are not claimed.

---

## The decision

`docs/adr/0003a-identification-reads-the-active-package.md` adopts ADR 0003's
boundary for Identification:

| Baked into the package | Live forever |
|---|---|
| `scoring.evidenceActivationMap`, resolved `evidenceRule`, weights | `parameterSets` / `activeParameterSetId`, usage, per-session posteriors |

Missing, inactive, or version-stale package → **409**, no recorded response.
A live structural edit that does not bump a version is scored against the
**package snapshot**, not the new live map. Recalibration does not stale the
package and takes effect on the next score.

Recording a null identification for a missing package would have looked like
"the work product matched no pattern" and quietly dropped the response from
accumulation. Those are different facts.

## What was built

- `server/compositeLibrary/activePackage.js` — one `activePackageFor` lookup
  (D56's local helper moved here) plus `resolveIdentificationStructure`,
  which is the refuse-if-missing/inactive/stale gate. Selection and
  Identification cannot now disagree about which package is live.
- `identifyEvidence` reads the package entry. It no longer touches
  `db.evidenceModels` or `item.scoring` for structural facts. A source-level
  guard would fail if those reads came back.
- Submit turns `evidence.refused` into 409.
- Raw-score weight resolution prefers the package-baked weight whenever an
  active package contains the item, so a live Task Model edit cannot quietly
  reweight a compiled observable.

No auto-rebuild on Evidence Model writes. No parameters baked into the
package.

## What remains

- A live browser walk of adaptive selection (D56) is still outstanding.
- D58 is untouched.
- Draft items that were never compiled into a package are now refused at
  score time rather than scored against the live graph. Preview delivery of
  unpublished items would need its own compile; that is not this unit.
