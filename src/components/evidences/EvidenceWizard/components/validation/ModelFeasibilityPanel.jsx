// ModelFeasibilityPanel.jsx
// 🧠 Enterprise ECD — Statistical Model Feasibility Panel
// ------------------------------------------------------
// Evaluates psychometric feasibility of the selected
// statistical models based on observable structure
// and model complexity.

import React from "react";
import { Check, AlertTriangle, X, Info } from "lucide-react";

export default function ModelFeasibilityPanel({
    models = [],
    observables = []
}) {

    /* =====================================================
       Helpers
    ===================================================== */

    const results = [];

    const observableCount = observables.length;

    /* =====================================================
       Feasibility Checks
    ===================================================== */

    models.forEach(model => {

        const type = model.type;

        if (!type) return;

        /* ---------- Rasch ---------- */

        if (type === "rasch") {

            if (observableCount < 3) {

                results.push({
                    type: "warning",
                    message:
                        "Rasch models typically require at least 3 observables for stable ability estimation."
                });

            } else {

                results.push({
                    type: "success",
                    message:
                        "Observable structure supports Rasch measurement."
                });

            }

        }

        /* ---------- IRT ---------- */

        if (type === "irt") {

            results.push({
                type: "warning",
                message:
                    "IRT calibration typically requires 500+ response samples."
            });

            if (observableCount < 4) {

                results.push({
                    type: "warning",
                    message:
                        "IRT models perform better with at least 4–5 observables."
                });

            }

        }

        /* ---------- Bayesian Network ---------- */

        if (type === "bayesian_network") {

            if (observableCount < 2) {

                results.push({
                    type: "error",
                    message:
                        "Bayesian networks require multiple observables."
                });

            } else {

                results.push({
                    type: "warning",
                    message:
                        "Bayesian networks require conditional probability tables (CPTs) and calibration data."
                });

            }

        }

        /* ---------- Classical Test Theory ---------- */

        if (type === "ctt") {

            const scored =
                model.structureConfig?.observableIds?.length ?? observableCount;

            if (scored < 3) {

                results.push({
                    type: "warning",
                    message:
                        "Classical Test Theory scores fewer than three observables here; internal-consistency reliability cannot be estimated meaningfully."
                });

            } else {

                results.push({
                    type: "success",
                    message:
                        `Classical Test Theory over ${scored} observables — reliability estimable from ≈ 100+ responses.`
                });

            }

            results.push({
                type: "warning",
                message:
                    "CTT statistics are sample- and test-dependent: the same total means something different on a different observable set."
            });

        }

        /* ---------- Sum Score ---------- */

        if (type === "sum") {

            results.push({
                type: "success",
                message:
                    "Sum score model is operationally simple and requires no calibration."
            });

        }

        /* ---------- Threshold ---------- */

        if (type === "threshold") {

            results.push({
                type: "success",
                message:
                    "Threshold models provide deterministic mastery classification."
            });

        }

    });

    /* =====================================================
       Adaptive Assessment Readiness
    ===================================================== */

    const adaptiveReady = models.some(m =>
        ["rasch", "irt", "bayesian_network"].includes(m.type)
    );

    if (!adaptiveReady) {

        results.push({
            type: "warning",
            message:
                "Current models may not support adaptive item selection."
        });

    }

    /* =====================================================
       Helper Styling
    ===================================================== */

    const getStyle = (type) => {

        switch (type) {

            case "success":
                return "text-emerald-700";

            case "warning":
                return "text-amber-700";

            case "error":
                return "text-red-600";

            default:
                return "text-slate-700";

        }

    };

    const getIcon = (type) => {

        switch (type) {

            case "success":
                return <Check size={14} strokeWidth={2.25} />;

            case "warning":
                return <AlertTriangle size={14} strokeWidth={2.25} />;

            case "error":
                return <X size={14} strokeWidth={2.25} />;

            default:
                return <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400" />;

        }

    };

    /* =====================================================
       UI
    ===================================================== */

    return (

        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">

            {/* Header */}

            <div>

                <div className="text-sm font-semibold text-slate-800">
                    Model Feasibility Assessment
                </div>

                <div className="mt-1 text-sm text-slate-500">

                    Evaluates whether the selected statistical models
                    are appropriate for the observable evidence structure.

                </div>

            </div>

            {/* Results */}

            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/60 p-4 text-sm">

                {results.map((result, index) => (

                    <div
                        key={index}
                        className={`flex items-start gap-2 ${getStyle(result.type)}`}
                    >

                        <div className="mt-0.5 shrink-0">

                            {getIcon(result.type)}

                        </div>

                        <div>

                            {result.message}

                        </div>

                    </div>

                ))}

            </div>

            {/* Governance Note */}

            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5 text-xs text-amber-800">

                <Info size={14} strokeWidth={2.25} className="mt-0.5 shrink-0" />

                <span>
                    Feasibility warnings highlight potential risks in
                    statistical modeling. They do not block confirmation,
                    but should be considered before operational deployment.
                </span>

            </div>

        </div>

    );

}