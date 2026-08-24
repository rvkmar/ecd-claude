// InferentialTraceGraph.jsx
// Enterprise ECD — Inferential Trace Graph (FULL REWRITE)
// ------------------------------------------------------------------
// ✔ Visualizes full inference chain
// ✔ Uses NEW schema: evidenceRules[] (NOT observable.evidenceRule)
// ✔ Highlights inferential strength + direction
// ✔ Flags missing links (warrant / rule / model)
// ✔ Designed for audit-grade interpretability

import React, { useMemo } from "react";
import { AlertCircle } from "lucide-react";

export default function InferentialTraceGraph({ draftModel }) {

    const claim = draftModel?.claimStatement;
    const warrants = draftModel?.warrants || [];
    const observables = draftModel?.observables || [];
    const evidenceRules = draftModel?.evidenceRules || [];
    const models = draftModel?.statisticalModels || [];


    /* =====================================================
       ACTIVE MODEL
    ===================================================== */

    const activeModel = useMemo(() => {
        return models.find(m => m.active);
    }, [models]);


    /* =====================================================
       RULE LOOKUP
    ===================================================== */

    function getRule(observableId) {
        return evidenceRules.find(r => r.observableId === observableId);
    }


    /* =====================================================
       STYLE HELPERS
    ===================================================== */

    function directionColor(dir) {
        if (dir === "supports") return "text-emerald-700";
        if (dir === "weakens") return "text-red-700";
        if (dir === "neutral") return "text-slate-600";
        return "text-amber-700";
    }


    function strengthBars(level = 0) {
        return "■".repeat(level) + "□".repeat(5 - level);
    }


    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-6">

            <h3 className="text-lg font-semibold text-slate-900">
                Inferential Trace Graph
            </h3>


            {/* CLAIM */}

            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Claim
                </div>
                <div className="text-sm text-slate-800 mt-1">
                    {claim || "— Not Defined —"}
                </div>
            </div>


            {/* WARRANT → OBSERVABLE → RULE */}

            <div className="space-y-6">

                {warrants.map(warrant => {

                    const linkedObservables = observables.filter(
                        o => o.warrantId === warrant.id
                    );

                    return (
                        <div key={warrant.id} className="space-y-3">

                            {/* WARRANT */}

                            <div className="ml-2 border-l-4 border-slate-300 pl-3">
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Warrant
                                </div>
                                <div className="text-sm text-slate-800">
                                    {warrant.reasoningStatement}
                                </div>
                            </div>


                            {/* OBSERVABLES */}

                            {linkedObservables.map(obs => {

                                const rule = getRule(obs.id);

                                return (
                                    <div key={obs.id} className="ml-6 space-y-2">

                                        {/* OBS */}

                                        <div className="border-l-4 border-slate-200 pl-3">
                                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Observable
                                            </div>
                                            <div className="text-sm text-slate-800">
                                                {obs.statement}
                                            </div>
                                        </div>


                                        {/* RULE */}

                                        <div className="ml-4 rounded-md border border-slate-200 bg-white p-3 text-xs space-y-2">

                                            {!rule ? (
                                                <div className="flex items-center gap-1.5 text-red-600">
                                                    <AlertCircle size={14} strokeWidth={2.25} />
                                                    Missing EvidenceRule
                                                </div>
                                            ) : (
                                                <>
                                                    <div className={directionColor(rule.direction)}>
                                                        Direction: {rule.direction}
                                                    </div>

                                                    <div className="text-slate-700">
                                                        Strength: {strengthBars(rule.strengthLevel)}
                                                    </div>

                                                    <div className="text-slate-500">
                                                        Activation:
                                                        <div className="text-slate-700">
                                                            {rule.activationCondition}
                                                        </div>
                                                    </div>

                                                    <div className="text-slate-500">
                                                        Justification:
                                                        <div className="text-slate-700">
                                                            {rule.justification}
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                        </div>

                                    </div>
                                );

                            })}

                        </div>
                    );

                })}

            </div>


            {/* MODEL */}

            <div className="border-t border-slate-200 pt-4">

                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Statistical Model
                </div>

                {activeModel ? (
                    <div className="text-sm text-slate-700 mt-2 space-y-1">
                        <div><span className="font-medium text-slate-900">Type:</span> {activeModel.type}</div>
                        {activeModel.subtype && (
                            <div><span className="font-medium text-slate-900">Subtype:</span> {activeModel.subtype}</div>
                        )}
                        <div>
                            <span className="font-medium text-slate-900">Linked Observables:</span>{" "}
                            {activeModel.structureConfig?.observableIds?.length || 0}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 text-red-600 text-sm mt-2">
                        <AlertCircle size={14} strokeWidth={2.25} />
                        No active statistical model
                    </div>
                )}

            </div>

        </div>
    );
}
