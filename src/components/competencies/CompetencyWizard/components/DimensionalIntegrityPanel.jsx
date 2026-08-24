// CompetencyWizard/components/DimensionalIntegrityPanel.jsx
// 🧠 Dimensional Integrity Panel (Production Refactor)
// - Tailwind UI
// - Clear diagnostic grouping
// - Strict dimensional validation logic
// - Explicit separation: hard failures vs advisory warnings
// - No inline styles

import React, { useMemo } from "react";
import { Check, X, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function DimensionalIntegrityPanel({
    model,
    competencies = [],
}) {
    /* =====================================================
       🔹 DIMENSIONAL ANALYSIS
    ===================================================== */

    const analysis = useMemo(() => {
        const measurementIntent = model?.measurementIntent;

        const checklist = [];

        // 1️⃣ Measurement intent defined
        checklist.push({
            label: "Measurement intent defined",
            passed: ["unidimensional", "multidimensional"].includes(
                measurementIntent
            ),
        });

        // 2️⃣ At least one competency
        checklist.push({
            label: "At least one latent variable defined",
            passed: competencies.length > 0,
        });

        // 3️⃣ Unidimensional constraint
        if (measurementIntent === "unidimensional") {
            checklist.push({
                label: "Exactly one latent variable (unidimensional constraint)",
                passed: competencies.length === 1,
            });
        }

        // 4️⃣ Variable type declared
        const variableTypes = competencies
            .map((c) => c.variableType)
            .filter(Boolean);

        checklist.push({
            label: "All competencies declare variable type",
            passed: variableTypes.length === competencies.length,
        });

        // 5️⃣ Mixed type advisory (not failure)
        const hasContinuous = variableTypes.includes("continuous");
        const hasDiscrete = variableTypes.some((t) =>
            ["binary", "ordinal", "categorical"].includes(t)
        );

        const mixedTypesWarning = hasContinuous && hasDiscrete;

        return {
            checklist,
            mixedTypesWarning,
        };
    }, [model, competencies]);

    const allPassed = analysis.checklist.every((r) => r.passed);

    /* =====================================================
       🔹 RENDER
    ===================================================== */

    return (
        <div className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            {/* Header */}
            <div>
                <h3 className="text-lg font-semibold text-slate-900">
                    Dimensional Integrity Analysis
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                    Evaluates structural coherence of the latent variable architecture.
                </p>
            </div>

            {/* Checklist */}
            <ul className="space-y-2">
                {analysis.checklist.map((item, index) => (
                    <li
                        key={index}
                        className={`flex items-center gap-2 text-sm ${item.passed ? "text-emerald-700" : "text-red-600"
                            }`}
                    >
                        {item.passed ? (
                            <Check size={16} strokeWidth={2.25} className="shrink-0" />
                        ) : (
                            <X size={16} strokeWidth={2.25} className="shrink-0" />
                        )}
                        {item.label}
                    </li>
                ))}
            </ul>

            {/* Advisory Warning */}
            {analysis.mixedTypesWarning && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-800">
                    <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
                    <span>
                        <strong>Advisory:</strong> Mixed continuous and discrete latent
                        variables detected. Ensure your intended statistical engine supports
                        hybrid dimensional structures.
                    </span>
                </div>
            )}

            {/* Overall Status */}
            <div
                className={`flex items-start gap-3 rounded-lg border px-4 py-3.5 text-sm font-semibold ${allPassed
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-red-200 bg-red-50 text-red-700"
                    }`}
            >
                {allPassed ? (
                    <CheckCircle2 size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
                ) : (
                    <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
                )}
                <span>
                    {allPassed
                        ? "Dimensional integrity satisfied."
                        : "Dimensional violations detected. Resolve before confirmation."}
                </span>
            </div>

            {/* Governance Note */}
            <div className="border-t border-slate-100 pt-4 text-xs text-slate-500">
                <strong className="text-slate-600">ECD Note:</strong> Dimensional integrity ensures the Student
                Model layer remains statistically coherent. Structural confirmation
                permanently freezes this architecture.
            </div>
        </div>
    );
}
