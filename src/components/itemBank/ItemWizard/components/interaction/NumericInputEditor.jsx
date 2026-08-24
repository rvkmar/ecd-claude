// src/components/itemBank/ItemWizard/components/interaction/NumericInputEditor.jsx
// ------------------------------------------------------------
// Numeric Input Interaction Editor
// ------------------------------------------------------------
// - Supports exact / tolerance / range answer types
// - Decimal precision control
// - Unit support
// - Negative number control
// - Draft-aware
// - Scoring-layer independent
// ------------------------------------------------------------

import React from "react";
import { Plus, Lock } from "lucide-react";

/* =====================================================
   Utility
===================================================== */

function generateComponentId() {
    return `num_${Date.now()}_${Math.floor(
        Math.random() * 1000
    )}`;
}

/* =====================================================
   Component
===================================================== */

export default function NumericInputEditor({
    interaction,
    onChange,
    canEdit,
}) {
    const component =
        interaction?.responseComponents?.[0] || null;

    const config = interaction?.config || {
        answerType: "exact",
        decimalPlaces: 0,
        allowNegative: false,
    };

    /* -----------------------------------------------------
       Safe Update
    ----------------------------------------------------- */

    const updateInteraction = (updated) => {
        if (!canEdit) return;

        onChange({
            ...interaction,
            ...updated,
        });
    };

    /* -----------------------------------------------------
       Ensure Single Component Exists
    ----------------------------------------------------- */

    const ensureComponent = () => {
        if (component) return;

        updateInteraction({
            responseComponents: [
                {
                    id: generateComponentId(),
                    type: "numeric_input",
                    placeholder: "",
                    unit: "",
                },
            ],
        });
    };

    /* -----------------------------------------------------
       Update Component Field
    ----------------------------------------------------- */

    const updateComponentField = (field, value) => {
        if (!canEdit) return;

        const updatedComponent = {
            ...component,
            [field]: value,
        };

        updateInteraction({
            responseComponents: [updatedComponent],
        });
    };

    /* -----------------------------------------------------
       Update Config
    ----------------------------------------------------- */

    const updateConfig = (field, value) => {
        if (!canEdit) return;

        updateInteraction({
            config: {
                ...config,
                [field]: value,
            },
        });
    };

    /* -----------------------------------------------------
       UI
    ----------------------------------------------------- */

    return (
        <div className="space-y-6">
            {!component && canEdit && (
                <button
                    onClick={ensureComponent}
                    className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                    <Plus size={16} strokeWidth={2.25} />
                    Initialize Numeric Input
                </button>
            )}

            {component && (
                <>
                    {/* Placeholder */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Placeholder Text
                        </label>
                        <input
                            type="text"
                            value={component.placeholder || ""}
                            disabled={!canEdit}
                            onChange={(e) =>
                                updateComponentField(
                                    "placeholder",
                                    e.target.value
                                )
                            }
                            className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                        />
                    </div>

                    {/* Unit */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Unit (optional)
                        </label>
                        <input
                            type="text"
                            value={component.unit || ""}
                            disabled={!canEdit}
                            onChange={(e) =>
                                updateComponentField(
                                    "unit",
                                    e.target.value
                                )
                            }
                            className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                        />
                    </div>

                    {/* Answer Type */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Answer Type
                        </label>
                        <select
                            value={config.answerType}
                            disabled={!canEdit}
                            onChange={(e) =>
                                updateConfig(
                                    "answerType",
                                    e.target.value
                                )
                            }
                            className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                        >
                            <option value="exact">
                                Exact Value
                            </option>
                            <option value="tolerance">
                                Tolerance
                            </option>
                            <option value="range">
                                Range
                            </option>
                        </select>
                    </div>

                    {/* Exact Value */}
                    {config.answerType === "exact" && (
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Correct Value
                            </label>
                            <input
                                type="number"
                                value={config.correctValue || ""}
                                disabled={!canEdit}
                                onChange={(e) =>
                                    updateConfig(
                                        "correctValue",
                                        parseFloat(e.target.value)
                                    )
                                }
                                className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                            />
                        </div>
                    )}

                    {/* Tolerance */}
                    {config.answerType === "tolerance" && (
                        <>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Correct Value
                                </label>
                                <input
                                    type="number"
                                    value={config.correctValue || ""}
                                    disabled={!canEdit}
                                    onChange={(e) =>
                                        updateConfig(
                                            "correctValue",
                                            parseFloat(e.target.value)
                                        )
                                    }
                                    className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Tolerance (±)
                                </label>
                                <input
                                    type="number"
                                    value={config.tolerance || ""}
                                    disabled={!canEdit}
                                    onChange={(e) =>
                                        updateConfig(
                                            "tolerance",
                                            parseFloat(e.target.value)
                                        )
                                    }
                                    className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                />
                            </div>
                        </>
                    )}

                    {/* Range */}
                    {config.answerType === "range" && (
                        <>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Minimum Value
                                </label>
                                <input
                                    type="number"
                                    value={config.minValue || ""}
                                    disabled={!canEdit}
                                    onChange={(e) =>
                                        updateConfig(
                                            "minValue",
                                            parseFloat(e.target.value)
                                        )
                                    }
                                    className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Maximum Value
                                </label>
                                <input
                                    type="number"
                                    value={config.maxValue || ""}
                                    disabled={!canEdit}
                                    onChange={(e) =>
                                        updateConfig(
                                            "maxValue",
                                            parseFloat(e.target.value)
                                        )
                                    }
                                    className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                />
                            </div>
                        </>
                    )}

                    {/* Decimal Places */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Decimal Places Allowed
                        </label>
                        <input
                            type="number"
                            value={config.decimalPlaces || 0}
                            disabled={!canEdit}
                            onChange={(e) =>
                                updateConfig(
                                    "decimalPlaces",
                                    parseInt(e.target.value, 10)
                                )
                            }
                            className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                        />
                    </div>

                    {/* Allow Negative */}
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={config.allowNegative || false}
                            disabled={!canEdit}
                            onChange={(e) =>
                                updateConfig(
                                    "allowNegative",
                                    e.target.checked
                                )
                            }
                            className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                        />
                        <span>Allow Negative Values</span>
                    </label>
                </>
            )}

            {!canEdit && (
                <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800">
                    <Lock size={16} strokeWidth={2.25} className="mt-0.5 shrink-0" />
                    <span>Interaction locked (confirmed item).</span>
                </div>
            )}
        </div>
    );
}
