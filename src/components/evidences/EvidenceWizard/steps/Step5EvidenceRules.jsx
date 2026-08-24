// Step5EvidenceRules.jsx
// 🧠 Enterprise ECD — Step 5: Evidence Rules (STRICT REWRITE)
// ------------------------------------------------------------------
// ✔ Fully aligned with enterprise schema (evidenceRules[])
// ✔ Guarantees 1:1 Observable → EvidenceRule mapping
// ✔ No partial rules allowed
// ✔ Validation is schema-aligned (not UI guesswork)
// ✔ Step validity = TRUE only when inference layer is complete

import { useEffect, useMemo, useState } from "react";
import { useEvidenceWizardContext } from "../EvidenceWizardContext";

import EvidenceRulePanel from "../components/EvidenceRulePanel";
import { runEvidenceDiagnosticsEngine } from "../components/engines/evidenceDiagnosticsEngine";

import { AlertTriangle } from "lucide-react";

export default function Step5EvidenceRules({ onValidityChange, locked }) {

    const {
        draftModel,
        competencies,
        competencyModels,
        addEvidenceRule,
        updateEvidenceRule
    } = useEvidenceWizardContext();

    /* =====================================================
       CORE DATA
    ===================================================== */

    const observables = draftModel?.observables || [];
    const warrants = draftModel?.warrants || [];
    const evidenceRules = draftModel?.evidenceRules || [];

    const [errors, setErrors] = useState({});


    /* =====================================================
       COMPETENCY CONTEXT
    ===================================================== */

    const activeCompetency = useMemo(() => {
        return competencies?.find(c => c.id === draftModel?.competencyId);
    }, [competencies, draftModel?.competencyId]);

    const activeModel = useMemo(() => {
        if (!activeCompetency) return null;
        return competencyModels?.find(m => m.id === activeCompetency.modelId);
    }, [activeCompetency, competencyModels]);


    /* =====================================================
       DIAGNOSTICS ENGINE
    ===================================================== */

    const diagnostics = useMemo(() => {
        return runEvidenceDiagnosticsEngine({ observables, warrants });
    }, [observables, warrants]);


    /* =====================================================
       RULE ACCESS (STRICT)
    ===================================================== */

    function getRule(observableId) {
        return evidenceRules.find(r => r.observableId === observableId);
    }


    /* =====================================================
       INITIALIZATION — GUARANTEE STRUCTURE
    ===================================================== */

    useEffect(() => {

        observables.forEach(obs => {

            const exists = evidenceRules.some(r => r.observableId === obs.id);

            if (!exists) {

                addEvidenceRule({
                    id: `er_${obs.id}`,
                    observableId: obs.id,
                    direction: "supports",
                    strengthLevel: 3,
                    activationCondition: "",
                    justification: ""
                });

            }

        });

    }, [observables]);


    /* =====================================================
       UPDATE HANDLER
    ===================================================== */

    function handleChange(observableId, updatedRule) {

        updateEvidenceRule(updatedRule.id, updatedRule);

    }


    /* =====================================================
       VALIDATION (SCHEMA-ALIGNED)
    ===================================================== */

    useEffect(() => {

        const newErrors = {};

        observables.forEach((obs, index) => {

            const rule = getRule(obs.id);

            if (!rule) {
                newErrors[`missing-${index}`] = "Missing EvidenceRule";
                return;
            }

            if (!rule.direction) {
                newErrors[`direction-${index}`] = "Direction required";
            }

            if (
                typeof rule.strengthLevel !== "number" ||
                rule.strengthLevel < 1 ||
                rule.strengthLevel > 5
            ) {
                newErrors[`strength-${index}`] = "Strength must be 1–5";
            }

            if (!rule.activationCondition || rule.activationCondition.length < 15) {
                newErrors[`condition-${index}`] = "Activation condition must be meaningful";
            }

            if (!rule.justification || rule.justification.length < 25) {
                newErrors[`justification-${index}`] = "Justification must be inferentially valid";
            }

        });

        setErrors(newErrors);

        if (onValidityChange) {
            onValidityChange(Object.keys(newErrors).length === 0);
        }

    }, [observables, evidenceRules]);


    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div className="space-y-8 max-w-6xl">

            {/* HEADER */}

            <div>
                <h2 className="text-lg font-semibold text-slate-900">Evidence Rules</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Define how observable behavior updates belief about the claim.
                </p>
            </div>


            {/* CONTEXT */}

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">

                <div className="text-sm font-semibold text-slate-900">
                    {activeCompetency?.name || "No competency selected"}
                </div>

                <div className="mt-1 text-xs text-slate-500">
                    {activeModel?.name} | {activeCompetency?.variableType}
                </div>

                <div className="mt-3 text-sm text-slate-700">
                    {draftModel?.claimStatement}
                </div>

            </div>


            {/* DIAGNOSTICS */}

            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-800">

                <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />

                <div className="space-y-1">

                    <div className="font-semibold">
                        Evidence Diagnostics
                    </div>

                    <div>
                        Health Score: <strong>{diagnostics.healthScore}</strong>
                    </div>

                    {diagnostics.diagnostics.map((d, i) => (
                        <div key={i}>
                            {d.message}
                        </div>
                    ))}

                </div>

            </div>


            {/* RULE PANELS */}

            <div className="space-y-5 bg-white border border-slate-200 rounded-lg shadow-sm p-6">

                {observables.map((obs, index) => {

                    const rule = getRule(obs.id);

                    return (
                        <EvidenceRulePanel
                            key={obs.id}
                            observable={obs}
                            rule={rule}
                            warrants={warrants}
                            competency={activeCompetency}
                            index={index}
                            errors={errors}
                            onChange={(updatedRule) =>
                                handleChange(obs.id, updatedRule)
                            }
                            locked={locked}
                        />
                    );

                })}

            </div>

        </div>
    );
}
