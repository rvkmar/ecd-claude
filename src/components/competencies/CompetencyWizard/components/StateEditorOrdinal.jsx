// CompetencyWizard/components/StateEditorOrdinal.jsx
// 🧠 Ordinal State Editor (Enterprise Strict ECD Implementation — Optimized)
// ✔ Buffered typing (no lag)
// ✔ order always numeric + sequential
// ✔ commit onBlur (not every keystroke)
// ✔ Minimum 2-level constraint
// ✔ Backend-safe payload

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Plus, X, AlertCircle, CheckCircle2, Info } from "lucide-react";

export default function StateEditorOrdinal({
    states = [],
    onChange,
    disabled = false,
}) {
    /* =====================================================
       🔹 NORMALIZATION (STRUCTURAL ONLY)
    ===================================================== */

    const normalizedStates = useMemo(() => {
        return states.map((s, index) => ({
            ...s,
            value: String(index + 1),
            order: index + 1,
        }));
    }, [states]);

    const isValid = normalizedStates.length >= 2;

    /* =====================================================
       🔹 LOCAL BUFFERED STATE (NO LAG)
    ===================================================== */

    const [localStates, setLocalStates] = useState(normalizedStates);

    useEffect(() => {
        setLocalStates(normalizedStates);
    }, [normalizedStates]);

    /* =====================================================
       🔹 COMMIT (ON BLUR ONLY)
    ===================================================== */

    const commit = useCallback(() => {
        const normalized = localStates.map((s, idx) => ({
            ...s,
            value: String(idx + 1),
            order: idx + 1,
        }));

        onChange(normalized);
    }, [localStates, onChange]);

    /* =====================================================
       🔹 UPDATE LOCAL ONLY (SMOOTH TYPING)
    ===================================================== */

    const updateLocal = useCallback(
        (index, field, value) => {
            if (disabled) return;

            setLocalStates((prev) =>
                prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
            );
        },
        [disabled]
    );

    // addState/removeState used to only touch localStates and rely on the
    // "Add Level"/"Remove level" buttons' onBlur to flush the change via
    // commit(). That's fragile -- unlike a text field, a button click
    // doesn't reliably leave focus in a way that guarantees blur fires
    // before something else reads `states` (e.g. clicking Next
    // immediately after "Add Level" without ever focusing elsewhere).
    // StateEditorBinary/Categorical call onChange immediately on
    // add/remove; this now matches that pattern so a level can never be
    // added/removed without the parent knowing.
    const addState = useCallback(() => {
        if (disabled) return;

        const nextLevel = localStates.length + 1;
        const next = [
            ...localStates,
            {
                value: String(nextLevel),
                label: `Level ${nextLevel}`,
                description: "",
                order: nextLevel,
            },
        ];

        setLocalStates(next);
        onChange(next.map((s, idx) => ({ ...s, value: String(idx + 1), order: idx + 1 })));
    }, [disabled, localStates, onChange]);

    const removeState = useCallback(
        (index) => {
            if (disabled) return;
            if (localStates.length <= 2) return;

            const next = localStates.filter((_, i) => i !== index);
            setLocalStates(next);
            onChange(next.map((s, idx) => ({ ...s, value: String(idx + 1), order: idx + 1 })));
        },
        [disabled, localStates, onChange]
    );

    /* =====================================================
       🔹 RENDER
    ===================================================== */

    return (
        <div className="space-y-6">
            <div>
                <h4 className="text-sm font-semibold text-slate-800">
                    Ordinal State Definition (Ordered Levels)
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                    Define strictly ordered proficiency levels. Structural order is
                    enforced and serialized numerically for backend validation.
                </p>
            </div>

            <div className="space-y-4">
                {localStates.map((state, index) => (
                    <div
                        key={index}
                        className="rounded-lg border border-slate-200 bg-white shadow-sm p-4 space-y-3"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold text-slate-800">
                                Level {index + 1}
                            </div>

                            {!disabled && localStates.length > 2 && (
                                <button
                                    type="button"
                                    onClick={() => removeState(index)}
                                    title="Remove level"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 transition hover:bg-red-50"
                                >
                                    <X size={16} strokeWidth={2} />
                                </button>
                            )}
                        </div>

                        {/* Level Order */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Level Order
                            </label>
                            <input
                                type="text"
                                value={index + 1}
                                disabled
                                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-400 shadow-sm cursor-not-allowed"
                            />
                        </div>

                        {/* Label */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Label
                            </label>
                            <input
                                type="text"
                                value={state.label || ""}
                                disabled={disabled}
                                onChange={(e) =>
                                    updateLocal(index, "label", e.target.value)
                                }
                                onBlur={commit}
                                className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                placeholder="e.g., Emerging, Proficient, Advanced"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Description
                            </label>
                            <textarea
                                rows={2}
                                value={state.description || ""}
                                disabled={disabled}
                                onChange={(e) =>
                                    updateLocal(index, "description", e.target.value)
                                }
                                onBlur={commit}
                                className="w-full resize-y rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                placeholder="Describe performance characteristics at this level"
                            />
                        </div>
                    </div>
                ))}
            </div>

            {!disabled && (
                <button
                    type="button"
                    onClick={addState}
                    onBlur={commit}
                    className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                    <Plus size={16} strokeWidth={2} />
                    Add Level
                </button>
            )}

            <div
                className={`flex items-start gap-3 rounded-lg border px-4 py-3.5 text-sm ${isValid
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-red-200 bg-red-50 text-red-700"
                    }`}
            >
                {isValid ? (
                    <CheckCircle2 size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
                ) : (
                    <AlertCircle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
                )}
                <p>
                    <strong className="font-semibold">Constraint:</strong> Ordinal variables must contain at least
                    two ordered levels. Orders are numeric, unique, and strictly
                    sequential.
                </p>
            </div>

            <div className="flex items-start gap-3 text-xs text-slate-500">
                <Info size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-slate-400" />
                <p>
                    <strong className="font-semibold text-slate-700">ECD Governance:</strong> Ordinal structures imply monotonic
                    latent progression. Level ordering defines inferential direction and
                    must remain structurally deterministic.
                </p>
            </div>
        </div>
    );
}
