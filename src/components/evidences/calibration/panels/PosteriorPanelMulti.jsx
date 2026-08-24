// PosteriorPanelMulti.jsx
// Enterprise ECD — Posterior + Inferential Audit Panel (Strict)
// ----------------------------------------------------------------
// - Uses competency states (single source of truth)
// - Prior vs Posterior with semantic labels
// - Evidence contribution tracing (Step 7)
// - Decision + interpretation layer
// - Audit-ready output

import React, { useMemo, useState } from "react";
import { Brain, Info, Check, X } from "lucide-react";
import { computePosteriorMulti } from "@/components/evidences/EvidenceWizard/components/engines/posteriorEngineMulti";

export default function PosteriorPanelMulti({

    observables = [],
    model,
    selectedCompetency   // REQUIRED

}) {

    const config = model?.structureConfig || {};
    const cpt = config.cpt || {};

    /* =====================================================
       STATES — FROM COMPETENCY (CRITICAL FIX)
    ===================================================== */

    const statesMeta = useMemo(() => {

        return (selectedCompetency?.states || [])
            .slice()
            .sort((a, b) => (a.order || 0) - (b.order || 0));

    }, [selectedCompetency]);

    const states = statesMeta.map(s => s.value);

    const getLabel = (value) =>
        statesMeta.find(s => s.value === value)?.label || value;

    const getDescription = (value) =>
        statesMeta.find(s => s.value === value)?.description || "";


    /* =====================================================
       PRIOR (ALIGNED TO STATES)
    ===================================================== */

    const prior = useMemo(() => {

        if (config.prior) return config.prior;

        // default uniform prior
        const uniform = {};
        const p = 1 / (states.length || 1);

        states.forEach(s => {
            uniform[s] = p;
        });

        return uniform;

    }, [config.prior, states]);


    /* =====================================================
       RESPONSE STATE
    ===================================================== */

    const [responses, setResponses] = useState({});

    const hasEvidence = Object.keys(responses).length > 0;


    /* =====================================================
       POSTERIOR COMPUTATION
    ===================================================== */

    const result = useMemo(() => {

        if (!states.length) return null;

        return computePosteriorMulti({
            observations: responses,
            cpt,
            prior,
            options: { explain: true }
        });

    }, [responses, cpt, prior, states]);

    const posterior = result?.posterior || {};


    /* =====================================================
       DELTA (CHANGE FROM PRIOR)
    ===================================================== */

    const delta = {};

    states.forEach(state => {
        delta[state] = (posterior[state] || 0) - (result?.prior?.[state] || 0);
    });


    /* =====================================================
       DOMINANT STATE
    ===================================================== */

    const dominantState = states.length
        ? states.reduce((best, s) =>
            (posterior[s] || 0) > (posterior[best] || 0) ? s : best
            , states[0])
        : null;


    /* =====================================================
       GUARD — NO STATES
    ===================================================== */

    if (!states.length) {

        return (

            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-800">

                <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0" />

                <span>
                    Posterior inference is not available:
                    this competency uses a continuous scale.
                    Use IRT-based interpretation instead.
                </span>

            </div>

        );

    }


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm space-y-6">

            {/* Header */}

            <div className="flex items-center justify-between gap-3">

                <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                    <Brain size={18} strokeWidth={2} className="text-slate-400" />
                    Posterior Inference
                </div>

                <div className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    {selectedCompetency?.name}
                </div>

            </div>


            {/* ============================
                Evidence Input
            ============================ */}

            <div className="space-y-2">

                <div className="text-sm font-semibold text-slate-800">
                    Observed Responses
                </div>

                {observables.map(obs => (

                    <div key={obs.id} className="flex items-center gap-3">

                        <span className="w-48 truncate text-sm text-slate-700">
                            {obs.statement}
                        </span>

                        <select
                            value={responses[obs.id] ?? ""}
                            onChange={(e) =>
                                setResponses(prev => ({
                                    ...prev,
                                    [obs.id]:
                                        e.target.value === ""
                                            ? undefined
                                            : Number(e.target.value)
                                }))
                            }
                            className="w-full max-w-xs rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                        >
                            <option value="">--</option>
                            <option value="1">Correct</option>
                            <option value="0">Incorrect</option>
                        </select>

                    </div>

                ))}

            </div>


            {/* ============================
                NO EVIDENCE
            ============================ */}

            {!hasEvidence && (

                <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3.5 text-xs text-slate-500">

                    No responses provided yet. Posterior equals prior.

                </div>

            )}


            {/* ============================
                PRIOR
            ============================ */}

            <div className="text-xs text-slate-500">

                <span className="font-semibold text-slate-700">Prior:</span>

                {states.map(s => (
                    <span key={s} className="ml-3">
                        {getLabel(s)}: {result?.prior?.[s]?.toFixed(3)}
                    </span>
                ))}

            </div>


            {/* ============================
                POSTERIOR
            ============================ */}

            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-3">

                <div className="text-sm font-semibold text-slate-800">
                    Posterior Distribution
                </div>

                {states.map(state => {

                    const diff = delta[state];

                    return (

                        <div key={state} className="space-y-1">

                            <div className="flex items-center justify-between text-sm">

                                <div className="font-semibold text-slate-900">
                                    {getLabel(state)}
                                </div>

                                <div className="text-slate-700">
                                    {(posterior[state] || 0).toFixed(3)}

                                    <span className={
                                        diff > 0
                                            ? "ml-2 text-emerald-700"
                                            : "ml-2 text-red-600"
                                    }>
                                        ({diff > 0 ? "+" : ""}{diff.toFixed(3)})
                                    </span>

                                </div>

                            </div>

                            <div className="text-xs text-slate-500">
                                {getDescription(state)}
                            </div>

                        </div>

                    );

                })}

            </div>


            {/* ============================
                INTERPRETATION
            ============================ */}

            {hasEvidence && dominantState && (

                <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3.5 text-sm text-blue-800 space-y-1">

                    <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0" />

                    <div className="space-y-1">

                        <div>
                            Most likely level:
                            <span className="ml-2 font-semibold text-blue-900">
                                {getLabel(dominantState)}
                            </span>
                        </div>

                        <div className="text-xs text-blue-700/80">
                            {getDescription(dominantState)}
                        </div>

                    </div>

                </div>

            )}


            {/* ============================
                EVIDENCE TRACE (STEP 7)
            ============================ */}

            {hasEvidence && result?.trace && (

                <div className="space-y-4">

                    <div className="text-sm font-semibold text-slate-800">
                        Evidence Contribution (Inferential Audit)
                    </div>

                    {states.map(state => (

                        <div key={state} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">

                            <div className="mb-2 text-xs font-semibold text-slate-800">
                                {getLabel(state)}
                            </div>

                            {result.trace[state].map((t, i) => (

                                <div key={i} className="flex items-center justify-between text-xs text-slate-700">

                                    <span className="flex items-center gap-1.5">
                                        {t.observableId}
                                        {t.value === 1 ? (
                                            <Check size={14} strokeWidth={2} className="text-emerald-700" />
                                        ) : (
                                            <X size={14} strokeWidth={2} className="text-red-600" />
                                        )}
                                    </span>

                                    <span>
                                        p={t.probability.toFixed(2)}
                                    </span>

                                </div>

                            ))}

                        </div>

                    ))}

                </div>

            )}

        </div>

    );

}
