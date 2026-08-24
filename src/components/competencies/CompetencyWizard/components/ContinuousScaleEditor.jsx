// CompetencyWizard/components/ContinuousScaleEditor.jsx
// 🧠 Continuous Scale Editor (Production Refactor)
// - Tailwind UI
// - Strict numeric validation
// - Controlled synchronization with parent
// - Accessible + clean architecture

import React, { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

export default function ContinuousScaleEditor({
    scale = {},
    onChange,
    disabled = false,
}) {
    const [localScale, setLocalScale] = useState({
        min: scale?.min ?? "",
        max: scale?.max ?? "",
        interpretationGuide: scale?.interpretationGuide || "",
    });

    const [error, setError] = useState("");

    /* =====================================================
       🔹 SYNC WITH EXTERNAL SCALE (EDIT MODE SUPPORT)
    ===================================================== */
    useEffect(() => {
        setLocalScale({
            min: scale?.min ?? "",
            max: scale?.max ?? "",
            interpretationGuide: scale?.interpretationGuide || "",
        });
    }, [scale]);

    /* =====================================================
       🔹 VALIDATION LOGIC
    ===================================================== */
    function validate(s) {
        if (s.min === "" || s.max === "") {
            setError("Both minimum and maximum must be defined.");
            return false;
        }

        const min = Number(s.min);
        const max = Number(s.max);

        if (Number.isNaN(min) || Number.isNaN(max)) {
            setError("Minimum and maximum must be numeric values.");
            return false;
        }

        if (min >= max) {
            setError("Minimum must be less than maximum.");
            return false;
        }

        setError("");
        return true;
    }

    /* =====================================================
       🔹 FIELD HANDLER
    ===================================================== */
    function handleChange(field, value) {
        if (disabled) return;

        const updated = { ...localScale, [field]: value };
        setLocalScale(updated);

        if (validate(updated)) {
            onChange({
                min: Number(updated.min),
                max: Number(updated.max),
                interpretationGuide: updated.interpretationGuide || "",
            });
        }
    }

    /* =====================================================
       🔹 RENDER
    ===================================================== */
    const fieldClass = (hasError) =>
        `w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${hasError
            ? "border-red-400 focus:ring-red-500/10 focus:border-red-500"
            : "border-slate-300 focus:ring-slate-900/10 focus:border-slate-400"
        }`;

    return (
        <div className="space-y-6">
            <div>
                <h4 className="text-sm font-semibold text-slate-800">
                    Continuous Theta Scale Definition
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                    Define the numeric range used by the latent proficiency variable.
                </p>
            </div>

            {/* Min / Max Inputs */}
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Minimum <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        value={localScale.min}
                        disabled={disabled}
                        onChange={(e) => handleChange("min", e.target.value)}
                        placeholder="e.g., -3"
                        className={fieldClass(!!error)}
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Maximum <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        value={localScale.max}
                        disabled={disabled}
                        onChange={(e) => handleChange("max", e.target.value)}
                        placeholder="e.g., +3"
                        className={fieldClass(!!error)}
                    />
                </div>
            </div>

            {/* Interpretation Guide */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Interpretation Guide
                </label>
                <textarea
                    rows={3}
                    value={localScale.interpretationGuide}
                    disabled={disabled}
                    onChange={(e) =>
                        handleChange("interpretationGuide", e.target.value)
                    }
                    placeholder="Explain how theta values map to proficiency interpretation."
                    className={`${fieldClass(false)} resize-y`}
                />
            </div>

            {/* Validation Error */}
            {error && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
                    <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Guidance */}
            <div className="border-t border-slate-100 pt-4 text-xs text-slate-500">
                <strong className="text-slate-600">Constraint:</strong> Continuous variables require a numeric theta
                range. These bounds define the inferential measurement scale used by
                IRT models.
            </div>
        </div>
    );
}
