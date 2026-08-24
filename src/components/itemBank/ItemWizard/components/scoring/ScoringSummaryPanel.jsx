// src/components/itemBank/ItemWizard/components/scoring/ScoringSummaryPanel.jsx
// ------------------------------------------------------------
// 🧠 Scoring Summary Panel
// ------------------------------------------------------------
// ✔ Structural validation
// ✔ ECD integrity checks
// ✔ Activation completeness checks
// ✔ No mutation logic
// ✔ Simulation-precheck friendly
// ------------------------------------------------------------

import React, { useMemo } from "react";
import { scoringLabel } from "@/utils/ecdVocabulary";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

/* =====================================================
   🔹 Component
===================================================== */

export default function ScoringSummaryPanel({
    scoring,
    observable,
    activeStatisticalModel,
}) {
    const validation = useMemo(() => {
        const errors = [];
        const warnings = [];

        if (!scoring?.method) {
            errors.push("Scoring method not selected.");
        }

        const activations =
            scoring?.evidenceActivationMap || [];

        if (activations.length === 0) {
            errors.push(
                "No evidence activation rules defined."
            );
        }

        const activatingRules = activations.filter(
            (a) => a.activatesObservable === true
        );

        if (
            activations.length > 0 &&
            activatingRules.length === 0
        ) {
            errors.push(
                "No rule activates the observable."
            );
        }

        /* -----------------------------------------------------
           🔹 Score Validation
        ----------------------------------------------------- */

        const scores = activations.map(
            (a) => a.score || 0
        );

        const highestScore = Math.max(
            ...scores,
            0
        );

        if (
            typeof scoring.maxScore === "number" &&
            highestScore > scoring.maxScore
        ) {
            errors.push(
                "maxScore is lower than defined activation rule score."
            );
        }

        if (scores.some((s) => s < 0)) {
            warnings.push(
                "Negative scores detected."
            );
        }

        /* -----------------------------------------------------
           🔹 Strength Override Compatibility
        ----------------------------------------------------- */

        const hasStrengthOverride =
            activations.some(
                (a) =>
                    a.strengthOverride !== null &&
                    a.strengthOverride !== undefined
            );

        if (
            hasStrengthOverride &&
            activeStatisticalModel?.type === "rasch"
        ) {
            warnings.push(
                "Strength override used with Rasch model. Verify theoretical consistency."
            );
        }

        /* -----------------------------------------------------
           🔹 Observable Variable Type Compatibility
        ----------------------------------------------------- */

        if (
            observable?.variableType === "binary"
        ) {
            if (
                scores.some(
                    (s) => s !== 0 && s !== 1
                )
            ) {
                errors.push(
                    "Binary observable must use 0/1 scoring."
                );
            }
        }

        return { errors, warnings };
    }, [
        scoring,
        observable,
        activeStatisticalModel,
    ]);

    /* =====================================================
       🔹 UI
    ===================================================== */

    return (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800">
                Scoring Summary
            </h3>

            {/* Summary Info */}
            <div className="space-y-1 text-sm text-slate-700">
                <div>
                    <strong className="text-slate-900">Method:</strong>{" "}
                    {/* The label, matching the dropdown the author picked
                        it from. This read "dichotomous" beside a selector
                        that said "Dichotomous (0 / 1)". */}
                    {scoring?.method ? scoringLabel(scoring.method) : "—"}
                </div>

                <div>
                    <strong className="text-slate-900">Activation Rules:</strong>{" "}
                    {scoring?.evidenceActivationMap
                        ?.length || 0}
                </div>

                <div>
                    <strong className="text-slate-900">Statistical Model:</strong>{" "}
                    {activeStatisticalModel
                        ? `${activeStatisticalModel.type}${activeStatisticalModel.subtype
                            ? ` (${activeStatisticalModel.subtype})`
                            : ""
                        }`
                        : "—"}
                </div>
            </div>

            {/* Errors */}
            {validation.errors.length > 0 && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
                    <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
                    <div className="space-y-1">
                        {validation.errors.map(
                            (err, idx) => (
                                <div key={idx}>
                                    {err}
                                </div>
                            )
                        )}
                    </div>
                </div>
            )}

            {/* Warnings */}
            {validation.warnings.length > 0 && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-800">
                    <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
                    <div className="space-y-1">
                        {validation.warnings.map(
                            (warn, idx) => (
                                <div key={idx}>
                                    {warn}
                                </div>
                            )
                        )}
                    </div>
                </div>
            )}

            {/* Success */}
            {validation.errors.length === 0 &&
                scoring?.method && (
                    <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800">
                        <CheckCircle2 size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
                        <span>Scoring configuration structurally valid.</span>
                    </div>
                )}
        </div>
    );
}