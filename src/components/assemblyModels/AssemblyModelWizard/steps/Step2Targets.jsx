// steps/Step2Targets.jsx -- D54 Step 2: per-SMV accuracy target.
// One row per Student Model Variable declared on the bound competency
// model. schema.js's assemblyModels validation (src/utils/schema.js
// ~line 4330) requires exactly one of requiredSEM (continuous SMVs) or
// requiredClassificationAccuracy (binary/ordinal/categorical) per target
// -- the control shown per row follows that same type split, not a
// generic "pick a number" field, so the wizard can never produce a
// shape the server would reject on this axis.
//
// requiredClassificationAccuracy is evaluated by D57 (ADR 0004) and can
// end a session when the Assembly Model's targetsMet rule is on (D56/D58).
// The control still does not claim a population classification-accuracy
// rate -- that number is not computed anywhere yet.

import React from "react";
import { Input } from "@/components/ui/input";
import { smVariableTypeLabel } from "@/utils/ecdVocabulary";
import { useAssemblyModelWizard } from "../AssemblyModelWizardContext";

export default function Step2Targets() {
  const { draft, smVariables, competencyModel, setTargetForSmv, clearTargetForSmv } =
    useAssemblyModelWizard();

  const locked = draft.locked;
  const targetsById = new Map((draft.targetsBySMV || []).map((t) => [t.smvId, t]));

  if (!draft.competencyModelId) {
    return (
      <p className="text-sm text-amber-600">
        Select a competency model on Step 1 before declaring SMV targets.
      </p>
    );
  }

  if (smVariables.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        {competencyModel?.name || "This competency model"} declares no Student
        Model Variables yet -- nothing to target.
      </p>
    );
  }

  function handleToggle(smv, checked) {
    if (locked) return;
    if (!checked) {
      clearTargetForSmv(smv.id);
      return;
    }
    if (smv.type === "continuous") {
      setTargetForSmv(smv.id, { requiredSEM: 0.3 });
    } else {
      setTargetForSmv(smv.id, { requiredClassificationAccuracy: 0.8 });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Targets by SMV</h2>
        <p className="mt-1 text-sm text-slate-500">
          For each Student Model Variable this Assembly Model reports on, set
          how precisely it must be estimated before a session built on this
          spec may stop.
        </p>
      </div>

      <div className="space-y-3">
        {smVariables.map((smv) => {
          const target = targetsById.get(smv.id);
          const isTargeted = Boolean(target);
          const isContinuous = smv.type === "continuous";

          return (
            <div
              key={smv.id}
              className={`rounded-md border px-4 py-3 ${
                isTargeted ? "border-slate-300 bg-white" : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isTargeted}
                    disabled={locked}
                    onChange={(e) => handleToggle(smv, e.target.checked)}
                  />
                  <span className="text-sm font-medium text-slate-800">{smv.label}</span>
                  <span className="text-xs text-slate-400">{smVariableTypeLabel(smv.type)}</span>
                </label>

                {isTargeted && (
                  <div className="flex items-center gap-2">
                    {isContinuous ? (
                      <>
                        <span className="text-xs text-slate-500">Required SEM ≤</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-24"
                          disabled={locked}
                          value={target.requiredSEM ?? ""}
                          onChange={(e) =>
                            setTargetForSmv(smv.id, {
                              requiredSEM: e.target.value === "" ? undefined : Number(e.target.value),
                            })
                          }
                        />
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-slate-500">Required accuracy ≥</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          className="w-24"
                          disabled={locked}
                          value={target.requiredClassificationAccuracy ?? ""}
                          onChange={(e) =>
                            setTargetForSmv(smv.id, {
                              requiredClassificationAccuracy:
                                e.target.value === "" ? undefined : Number(e.target.value),
                            })
                          }
                        />
                      </>
                    )}
                  </div>
                )}
              </div>

              {isTargeted && !isContinuous && (
                <p className="mt-2 text-xs text-slate-500">
                  Sessions stop once every targeted attribute is classified with
                  at least this confidence (the probability that the assigned
                  class is the true one for this student). The number is not
                  the test&apos;s overall classification-accuracy rate.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {(draft.targetsBySMV || []).length === 0 && (
        <p className="text-sm text-amber-600">
          At least one SMV target is required before this model can be saved
          for review.
        </p>
      )}
    </div>
  );
}
