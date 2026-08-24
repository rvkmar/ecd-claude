// CompetencyWizard/components/StateEditorBinary.jsx
// 🧠 Binary State Editor (Production Refactor)
// - Tailwind UI
// - Strict enforcement of exactly two states
// - Controlled synchronization
// - Clean separation of constraint vs editing
// - No inline styles

import React, { useEffect } from "react";
import { Info } from "lucide-react";

const DEFAULT_BINARY_STATES = [
    { value: "0", label: "Non-Mastery", description: "" },
    { value: "1", label: "Mastery", description: "" },
];

export default function StateEditorBinary({
    states = [],
    onChange,
    disabled = false,
}) {
    /* =====================================================
       🔹 ENFORCE EXACTLY TWO STATES
    ===================================================== */
    useEffect(() => {
        if (!states || states.length !== 2) {
            onChange(DEFAULT_BINARY_STATES);
        }
    }, []); // enforce once on mount

    function updateState(index, field, value) {
        if (disabled) return;

        const updated = [...states];

        // Defensive fallback
        if (!updated[index]) return;

        updated[index] = {
            ...updated[index],
            [field]: value,
        };

        onChange(updated);
    }

    const safeStates = states.length === 2 ? states : DEFAULT_BINARY_STATES;

    /* =====================================================
       🔹 RENDER
    ===================================================== */

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h4 className="text-sm font-semibold text-slate-800">Binary State Definition</h4>
                <p className="mt-1 text-sm text-slate-500">
                    Define the two mutually exclusive states of this latent variable.
                </p>
            </div>

            {/* State Cards */}
            <div className="space-y-4">
                {safeStates.slice(0, 2).map((state, index) => (
                    <div
                        key={index}
                        className="rounded-lg border border-slate-200 bg-white shadow-sm p-4 space-y-3"
                    >
                        <div className="text-sm font-semibold text-slate-800">
                            State {index + 1}
                        </div>

                        {/* Value */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">Value</label>
                            <input
                                type="text"
                                value={state?.value || ""}
                                disabled={disabled}
                                onChange={(e) =>
                                    updateState(index, "value", e.target.value)
                                }
                                className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* Label */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">Label</label>
                            <input
                                type="text"
                                value={state?.label || ""}
                                disabled={disabled}
                                onChange={(e) =>
                                    updateState(index, "label", e.target.value)
                                }
                                className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
                            <textarea
                                rows={2}
                                value={state?.description || ""}
                                disabled={disabled}
                                onChange={(e) =>
                                    updateState(index, "description", e.target.value)
                                }
                                className="w-full resize-y rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Constraint Notice */}
            <div className="flex items-start gap-3 border-t border-slate-200 pt-4 text-xs text-slate-500">
                <Info size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-slate-400" />
                <p>
                    <strong className="font-semibold text-slate-700">Constraint:</strong> Binary variables must contain exactly two
                    states. These typically represent mastery vs non-mastery in
                    cognitive diagnostic and Rasch-type models.
                </p>
            </div>
        </div>
    );
}
