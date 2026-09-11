// steps/Step5Review.jsx -- D54 Step 5: readiness panel + Save/Lock&Confirm
// (those controls live in WizardStepContainer's nav bar, not here -- this
// step only surfaces WHY they are or aren't enabled).
//
// Each row mirrors one check from validateAssemblyModelLifecycle
// (server/utils/lifecycleValidation.js) by hand -- see
// AssemblyModelWizardContext.jsx's header comment on why this is a
// hand-written mirror, not an import, and that no mirror-agreement test
// backs it yet (flagged in the D54 handoff).

import React from "react";
import { Check, X } from "lucide-react";
import { useAssemblyModelWizard } from "../AssemblyModelWizardContext";

function ReadinessRow({ ok, label }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? (
        <Check size={15} className="shrink-0 text-emerald-600" />
      ) : (
        <X size={15} className="shrink-0 text-red-500" />
      )}
      <span className={ok ? "text-slate-700" : "text-slate-500"}>{label}</span>
    </div>
  );
}

export default function Step5Review() {
  const { draft } = useAssemblyModelWizard();
  const sr = draft.stoppingRules || {};

  const hasName = Boolean(draft.name);
  const hasCompetencyModel = Boolean(draft.competencyModelId);
  const hasTargets = Array.isArray(draft.targetsBySMV) && draft.targetsBySMV.length > 0;
  const hasPolicy = Boolean(draft.selectionAlgorithm?.policyId);
  const hasStoppingRule =
    sr.maxItems !== undefined || sr.minItems !== undefined || sr.targetsMet !== undefined;

  const reviewedReady = hasName && hasCompetencyModel && hasTargets && hasPolicy;
  const confirmedReady = reviewedReady && hasStoppingRule;

  const accuracyTargets = (draft.targetsBySMV || []).filter(
    (t) => typeof t.requiredClassificationAccuracy === "number"
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Review</h2>
        <p className="mt-1 text-sm text-slate-500">
          Everything below must be checked off before this Assembly Model can
          be saved for review; stopping rules are additionally required
          before it can be locked and confirmed.
        </p>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Required before review
        </p>
        <ReadinessRow ok={hasName} label="Name is set" />
        <ReadinessRow ok={hasCompetencyModel} label="Bound to a competency model" />
        <ReadinessRow ok={hasTargets} label="At least one SMV accuracy target declared" />
        <ReadinessRow ok={hasPolicy} label="Selection algorithm policy bound" />

        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Required before confirmation
        </p>
        <ReadinessRow ok={hasStoppingRule} label="At least one stopping rule declared" />
      </div>

      {accuracyTargets.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {accuracyTargets.length} of {(draft.targetsBySMV || []).length} target(s) use
          requiredClassificationAccuracy, which is stored and served but not
          yet evaluated by any session (no decision rule turns a diagnostic
          posterior into a discrete classification until D57).
        </div>
      )}

      <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <p className="font-medium text-slate-800">{draft.name || "(unnamed)"}</p>
        <p className="mt-1">
          {(draft.targetsBySMV || []).length} SMV target(s) · stopping rule
          {hasStoppingRule ? " declared" : " not yet declared"} · selection
          policy {hasPolicy ? "bound" : "not yet bound"}
        </p>
      </div>

      {!reviewedReady && (
        <p className="text-sm text-red-600">
          Complete every item above under &ldquo;Required before review&rdquo;
          before saving.
        </p>
      )}
      {reviewedReady && !confirmedReady && (
        <p className="text-sm text-amber-600">
          Ready to save for review. A stopping rule is still required before
          this model can be locked and confirmed.
        </p>
      )}
      {confirmedReady && (
        <p className="text-sm text-emerald-700">
          Ready for review and, once reviewed, for confirmation.
        </p>
      )}
    </div>
  );
}
