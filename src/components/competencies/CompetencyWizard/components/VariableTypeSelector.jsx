// CompetencyWizard/components/VariableTypeSelector.jsx
// 🧠 Variable Type Selector (Production-Grade Refactor)
// Strictly controls allowed latent variable types
// - Tailwind UI
// - No alert() usage
// - Measurement intent gating
// - Clear inferential guidance
// - Accessible selection cards

import React from "react";
import { AlertTriangle, Check } from "lucide-react";

const VARIABLE_TYPES = [
    {
        value: "binary",
        label: "Binary",
        description:
            "Two-state mastery variable (e.g., Mastery / Non-Mastery). Suitable for DINA/DINO models.",
    },
    {
        value: "ordinal",
        label: "Ordinal",
        description:
            "Ordered proficiency levels (e.g., Level 1 → Level 4). Suitable for partial credit IRT models.",
    },
    {
        value: "categorical",
        label: "Categorical",
        description:
            "Unordered latent classes. Suitable for latent class or diagnostic models.",
    },
    {
        value: "continuous",
        label: "Continuous",
        description:
            "Continuous theta scale. Suitable for Rasch or 2PL/3PL IRT models.",
    },
];

export default function VariableTypeSelector({
    value,
    onChange,
    measurementIntent,
    disabled = false,
}) {
    function handleSelect(type) {
        if (disabled) return;
        if (!measurementIntent) return; // UI safeguard only

        onChange(type);
    }

    const measurementIntentMissing = !measurementIntent;

    return (
        <div className="space-y-4">
            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Variable Type <span className="text-red-500">*</span>
                </label>
                {measurementIntentMissing && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-amber-700">
                        <AlertTriangle size={14} strokeWidth={2} className="shrink-0" />
                        Select measurement intent before defining variable type.
                    </p>
                )}
            </div>

            <div className="grid gap-3">
                {VARIABLE_TYPES.map((type) => {
                    const isSelected = value === type.value;
                    const isDisabled = disabled || measurementIntentMissing;

                    return (
                        <button
                            key={type.value}
                            type="button"
                            onClick={() => handleSelect(type.value)}
                            disabled={isDisabled}
                            className={`flex items-start justify-between gap-3 rounded-lg border p-4 text-left shadow-sm transition ${isSelected
                                    ? "border-slate-900 bg-slate-50"
                                    : "border-slate-200 bg-white hover:border-slate-300"
                                } ${isDisabled ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                            <div>
                                <div className="font-semibold text-slate-800">
                                    {type.label}
                                </div>
                                <div className="mt-1 text-sm text-slate-500">
                                    {type.description}
                                </div>
                            </div>
                            {isSelected && (
                                <Check size={16} strokeWidth={2.25} className="mt-0.5 shrink-0 text-slate-900" />
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="pt-2 text-xs text-slate-500">
                <strong className="font-semibold text-slate-700">Statistical Note:</strong> Variable type determines allowable
                evidence models and statistical engines. This choice becomes immutable
                after confirmation.
            </div>
        </div>
    );
}