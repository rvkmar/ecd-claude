// CPTEditorPanel.jsx
// 🧠 Enterprise ECD — Conditional Probability Table Editor (Strict ECD)
// ---------------------------------------------------------------------
// ✔ Uses Competency States as single source of truth
// ✔ Multi-state θ aligned with student model
// ✔ Evidence Rule → Probability mapping
// ✔ Monotonicity + Discrimination validation
// ✔ Interpretability + audit readiness

import React, { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

export default function CPTEditorPanel({

    model,
    observables = [],
    warrants = [],
    selectedCompetency,   // ⭐ REQUIRED (NEW)
    onChange,
    locked

}) {

    const config = model.structureConfig || {};
    const cpt = config.cpt || {};

    /* =====================================================
       STATES — FROM COMPETENCY (CRITICAL FIX)
    ===================================================== */

    const statesMeta = useMemo(() => {

        return (selectedCompetency?.states || [])
            .slice()
            .sort((a, b) => (a.order || 0) - (b.order || 0));

    }, [selectedCompetency]);

    const levels = statesMeta.map(s => s.value);

    const getLabel = (value) =>
        statesMeta.find(s => s.value === value)?.label || value;


    /* =====================================================
       Resolve Evidence Chain
    ===================================================== */

    const enriched = useMemo(() => {

        return observables.map(obs => {

            const warrant = warrants.find(
                w => w.id === obs.warrantId
            );

            const rule = obs.evidenceRule;

            return {
                ...obs,
                warrant,
                rule
            };

        });

    }, [observables, warrants]);


    /* =====================================================
       Default CPT Generator (ECD-aware)
    ===================================================== */

    const generateDefaultParams = (rule) => {

        const base = {};
        const n = levels.length;

        levels.forEach((level, i) => {

            let p = 0.2 + (i / (n - 1 || 1)) * 0.6;

            // adjust by strength
            const strength = rule?.strengthLevel || 3;
            const scale = strength / 5;

            p = 0.5 + (p - 0.5) * scale;

            // invert if weakens
            if (rule?.direction === "weakens") {
                p = 1 - p;
            }

            base[level] = Math.min(Math.max(p, 0.01), 0.99);

        });

        return { levels: base };

    };


    /* =====================================================
       Update CPT
    ===================================================== */

    const updateCPT = (obsId, level, value) => {

        const updated = {
            ...cpt,
            [obsId]: {
                levels: {
                    ...(cpt[obsId]?.levels || {}),
                    [level]: Number(value)
                }
            }
        };

        onChange({
            ...config,
            cpt: updated
        });

    };


    /* =====================================================
       VALIDATION — MONOTONICITY
    ===================================================== */

    const checkMonotonic = (levelsObj) => {

        const values = levels.map(l => levelsObj[l]);

        let increasing = true;
        let decreasing = true;

        for (let i = 1; i < values.length; i++) {

            if (values[i] < values[i - 1]) increasing = false;
            if (values[i] > values[i - 1]) decreasing = false;

        }

        return {
            valid: increasing || decreasing,
            increasing,
            decreasing
        };

    };


    /* =====================================================
       VALIDATION — DISCRIMINATION (NEW)
    ===================================================== */

    const checkDiscrimination = (levelsObj) => {

        const values = levels.map(l => levelsObj[l]);

        const range = Math.max(...values) - Math.min(...values);

        return {
            weak: range < 0.2,
            strong: range > 0.5
        };

    };


    /* =====================================================
       GUARD — NO STATES
    ===================================================== */

    if (!levels.length) {

        return (

            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-800">

                <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />

                <span>

                    CPT is not applicable: this competency does not define discrete states.
                    Use IRT/continuous models instead.

                </span>

            </div>

        );

    }


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <div className="space-y-6">

            {/* Header */}

            <div>

                <h3 className="text-sm font-semibold text-slate-800">
                    Conditional Probability Tables (CPT)
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                    Define P(Observable | Competency State).
                    These probabilities determine how evidence updates belief.
                </p>

            </div>


            {/* CPT TABLE */}

            <div className="space-y-5">

                {enriched.map(obs => {

                    const params =
                        cpt[obs.id] ||
                        generateDefaultParams(obs.rule);

                    const mono = checkMonotonic(params.levels);
                    const disc = checkDiscrimination(params.levels);

                    return (

                        <div
                            key={obs.id}
                            className="rounded-lg border border-slate-200 bg-white shadow-sm p-5 space-y-4"
                        >

                            {/* Observable */}

                            <div>

                                <div className="text-sm font-medium text-slate-900">
                                    {obs.statement}
                                </div>

                                <div className="text-xs text-slate-500">
                                    {obs.id}
                                </div>

                            </div>


                            {/* Evidence Context */}

                            <div className="text-xs text-slate-600 space-y-1">

                                <div>
                                    <strong className="text-slate-700">Warrant:</strong>{" "}
                                    {obs.warrant?.cognitiveAttribute || "—"}
                                </div>

                                <div>
                                    <strong className="text-slate-700">Rule:</strong>{" "}
                                    {obs.rule
                                        ? `${obs.rule.direction} (strength ${obs.rule.strengthLevel})`
                                        : "Missing"}
                                </div>

                            </div>


                            {/* CPT Inputs */}

                            <div className="grid grid-cols-3 gap-3">

                                {levels.map(level => (

                                    <div key={level}>

                                        <label className="mb-1.5 block text-xs font-medium text-slate-700">
                                            P(Correct | {getLabel(level)})
                                        </label>

                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="1"
                                            value={params.levels[level]}
                                            onChange={(e) =>
                                                updateCPT(
                                                    obs.id,
                                                    level,
                                                    e.target.value
                                                )
                                            }
                                            className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                            disabled={locked}
                                        />

                                    </div>

                                ))}

                            </div>


                            {/* Validation Feedback */}

                            {!mono.valid && (
                                <div className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                                    <AlertTriangle size={14} strokeWidth={2} className="shrink-0" />
                                    Non-monotonic CPT — violates ordered proficiency assumption
                                </div>
                            )}

                            {disc.weak && (
                                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                                    <AlertTriangle size={14} strokeWidth={2} className="shrink-0" />
                                    Weak discrimination — evidence provides little information
                                </div>
                            )}

                            {disc.strong && mono.valid && (
                                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                                    <CheckCircle2 size={14} strokeWidth={2} className="shrink-0" />
                                    Strong discriminating evidence
                                </div>
                            )}


                            {/* Interpretation */}

                            <div className="text-xs text-slate-500">

                                Expected pattern:
                                <br />
                                Higher proficiency → higher probability of success (for supportive evidence).
                                <br />
                                Flat curves → weak evidence.
                                <br />
                                Irregular curves → invalid measurement behavior.

                            </div>

                        </div>

                    );

                })}

            </div>


            {/* Guidance */}

            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-800">

                <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0" />

                <div>

                    Design guidance:
                    <ul className="list-disc ml-4 mt-1 space-y-1 text-xs">
                        <li>Align probabilities with competency levels (Novice → Proficient)</li>
                        <li>Ensure monotonic progression</li>
                        <li>Use evidence rule strength to control separation</li>
                        <li>Avoid flat or inconsistent patterns</li>
                    </ul>

                </div>

            </div>

        </div>

    );

}