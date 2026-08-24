// CompetencyWizard/components/StateEditorCategorical.jsx
// 🧠 Categorical State Editor (Production Refactor)
// - Tailwind UI
// - Enforces minimum 2 states
// - Prevents duplicate value codes
// - Clean add/remove logic
// - No inline styles

import React, { useMemo } from "react";
import { Plus, Trash2, AlertCircle, Info } from "lucide-react";

export default function StateEditorCategorical({
    states = [],
    onChange,
    disabled = false,
}) {
    /* =====================================================
       🔹 DERIVED VALIDATION
    ===================================================== */
    const isValid = states.length >= 2;

    const valueSet = useMemo(() => {
        return new Set(states.map((s) => s.value).filter(Boolean));
    }, [states]);

    /* =====================================================
       🔹 UPDATE STATE
    ===================================================== */
    function updateState(index, field, value) {
        if (disabled) return;

        const updated = [...states];
        if (!updated[index]) return;

        updated[index] = {
            ...updated[index],
            [field]: value,
        };

        onChange(updated);
    }

    /* =====================================================
       🔹 ADD / REMOVE
    ===================================================== */
    function addState() {
        if (disabled) return;

        onChange([
            ...states,
            {
                value: "",
                label: "",
                description: "",
            },
        ]);
    }

    function removeState(index) {
        if (disabled) return;
        if (states.length <= 2) return; // enforce minimum 2

        onChange(states.filter((_, i) => i !== index));
    }

    /* =====================================================
       🔹 RENDER
    ===================================================== */

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h4 className="text-sm font-semibold text-slate-800">
                    Categorical State Definition
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                    Define unordered latent classes (minimum two states required).
                </p>
            </div>

            {/* State Cards */}
            <div className="space-y-4">
                {states.map((state, index) => {
                    const duplicateValue =
                        state.value &&
                        [...valueSet].filter((v) => v === state.value).length > 1;

                    return (
                        <div
                            key={index}
                            className="rounded-lg border border-slate-200 bg-white shadow-sm p-4 space-y-3"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-sm font-semibold text-slate-800">
                                    State {index + 1}
                                </div>

                                {/* Remove Button */}
                                {!disabled && states.length > 2 && (
                                    <button
                                        type="button"
                                        onClick={() => removeState(index)}
                                        title="Remove state"
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 transition hover:bg-red-50"
                                    >
                                        <Trash2 size={16} strokeWidth={2} />
                                    </button>
                                )}
                            </div>

                            {/* Value */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Value (Internal Code)
                                </label>
                                <input
                                    type="text"
                                    value={state?.value || ""}
                                    disabled={disabled}
                                    onChange={(e) =>
                                        updateState(index, "value", e.target.value)
                                    }
                                    placeholder="e.g., A, B, C"
                                    className={`w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${duplicateValue
                                            ? "border-red-400 focus:ring-red-500/10 focus:border-red-500"
                                            : "border-slate-300 focus:ring-slate-900/10 focus:border-slate-400"
                                        }`}
                                />
                                {duplicateValue && (
                                    <p className="mt-1.5 text-xs font-medium text-red-600">
                                        Duplicate state value detected.
                                    </p>
                                )}
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
                                    placeholder="Human-readable name"
                                    className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Description
                                </label>
                                <textarea
                                    rows={2}
                                    value={state?.description || ""}
                                    disabled={disabled}
                                    onChange={(e) =>
                                        updateState(index, "description", e.target.value)
                                    }
                                    placeholder="Describe this latent class"
                                    className="w-full resize-y rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add Button */}
            {!disabled && (
                <button
                    type="button"
                    onClick={addState}
                    className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                    <Plus size={16} strokeWidth={2} />
                    Add State
                </button>
            )}

            {/* Constraint Notice */}
            <div
                className={`flex items-start gap-3 rounded-lg border px-4 py-3.5 text-sm ${isValid
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-red-200 bg-red-50 text-red-700"
                    }`}
            >
                {isValid ? (
                    <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
                ) : (
                    <AlertCircle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
                )}
                <p>
                    <strong className="font-semibold">Constraint:</strong> Categorical variables must contain at
                    least two unordered states.
                </p>
            </div>
        </div>
    );
}
