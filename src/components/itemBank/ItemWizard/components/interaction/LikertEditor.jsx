// src/components/itemBank/ItemWizard/components/interaction/LikertEditor.jsx
// ------------------------------------------------------------
// Likert Interaction Editor
// ------------------------------------------------------------
// - Ordered scale labels
// - Preset scale types (5-point, 7-point)
// - Custom scale support
// - Reverse scoring flag
// - Draft-aware
// - Scoring-layer independent
// - IRT-ready (ordinal models)
// ------------------------------------------------------------

import React from "react";
import { Plus, X, Lock } from "lucide-react";

/* =====================================================
   Utility
===================================================== */

function generateComponentId() {
    return `lik_${Date.now()}_${Math.floor(
        Math.random() * 1000
    )}`;
}

const PRESET_SCALES = {
    "5-point": [
        "Strongly Disagree",
        "Disagree",
        "Neutral",
        "Agree",
        "Strongly Agree",
    ],
    "7-point": [
        "Strongly Disagree",
        "Disagree",
        "Somewhat Disagree",
        "Neutral",
        "Somewhat Agree",
        "Agree",
        "Strongly Agree",
    ],
};

/* =====================================================
   Component
===================================================== */

export default function LikertEditor({
    interaction,
    onChange,
    canEdit,
}) {
    const component =
        interaction?.responseComponents?.[0] || null;

    const config = interaction?.config || {
        scaleType: "5-point",
        labels: PRESET_SCALES["5-point"],
        reverseScoring: false,
        shuffle: false,
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
       Ensure Component Exists
    ----------------------------------------------------- */

    const ensureComponent = () => {
        if (component) return;

        updateInteraction({
            responseComponents: [
                {
                    id: generateComponentId(),
                    type: "likert_scale",
                    statement: "",
                },
            ],
        });
    };

    /* -----------------------------------------------------
       Update Statement
    ----------------------------------------------------- */

    const updateStatement = (value) => {
        if (!canEdit) return;

        updateInteraction({
            responseComponents: [
                {
                    ...component,
                    statement: value,
                },
            ],
        });
    };

    /* -----------------------------------------------------
       Change Scale Type
    ----------------------------------------------------- */

    const changeScaleType = (type) => {
        if (!canEdit) return;

        if (type === "custom") {
            updateInteraction({
                config: {
                    ...config,
                    scaleType: "custom",
                    labels: [],
                },
            });
            return;
        }

        updateInteraction({
            config: {
                ...config,
                scaleType: type,
                labels: PRESET_SCALES[type],
            },
        });
    };

    /* -----------------------------------------------------
       Update Custom Label
    ----------------------------------------------------- */

    const updateLabel = (index, value) => {
        if (!canEdit) return;

        const updatedLabels = [...config.labels];
        updatedLabels[index] = value;

        updateInteraction({
            config: {
                ...config,
                labels: updatedLabels,
            },
        });
    };

    const addCustomLabel = () => {
        if (!canEdit) return;

        updateInteraction({
            config: {
                ...config,
                labels: [...config.labels, ""],
            },
        });
    };

    const removeCustomLabel = (index) => {
        if (!canEdit) return;

        const updatedLabels = config.labels.filter(
            (_, i) => i !== index
        );

        updateInteraction({
            config: {
                ...config,
                labels: updatedLabels,
            },
        });
    };

    /* -----------------------------------------------------
       Toggle Reverse Scoring
    ----------------------------------------------------- */

    const toggleReverse = () => {
        if (!canEdit) return;

        updateInteraction({
            config: {
                ...config,
                reverseScoring: !config.reverseScoring,
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
                    Initialize Likert Scale
                </button>
            )}

            {component && (
                <>
                    {/* Statement */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Likert Statement
                        </label>
                        <textarea
                            value={component.statement || ""}
                            disabled={!canEdit}
                            onChange={(e) =>
                                updateStatement(e.target.value)
                            }
                            className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                            placeholder="Enter statement (e.g., I feel confident solving algebra problems.)"
                        />
                    </div>

                    {/* Scale Type */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Scale Type
                        </label>
                        <select
                            value={config.scaleType}
                            disabled={!canEdit}
                            onChange={(e) =>
                                changeScaleType(e.target.value)
                            }
                            className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                        >
                            <option value="5-point">
                                5-point Scale
                            </option>
                            <option value="7-point">
                                7-point Scale
                            </option>
                            <option value="custom">
                                Custom Scale
                            </option>
                        </select>
                    </div>

                    {/* Labels */}
                    <div className="space-y-2">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Scale Labels (Ordered)
                        </label>

                        {config.labels.map((label, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2"
                            >
                                <input
                                    type="text"
                                    value={label}
                                    disabled={
                                        !canEdit ||
                                        config.scaleType !== "custom"
                                    }
                                    onChange={(e) =>
                                        updateLabel(
                                            index,
                                            e.target.value
                                        )
                                    }
                                    className="flex-1 rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                />

                                {canEdit &&
                                    config.scaleType === "custom" && (
                                        <button
                                            onClick={() =>
                                                removeCustomLabel(index)
                                            }
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 transition hover:bg-red-50"
                                        >
                                            <X size={14} strokeWidth={2.25} />
                                        </button>
                                    )}
                            </div>
                        ))}

                        {canEdit &&
                            config.scaleType === "custom" && (
                                <button
                                    onClick={addCustomLabel}
                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800"
                                >
                                    <Plus size={14} strokeWidth={2.25} />
                                    Add Label
                                </button>
                            )}
                    </div>

                    {/* Reverse Scoring */}
                    <label className="flex items-center gap-2 border-t border-slate-100 pt-4 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={
                                config.reverseScoring || false
                            }
                            disabled={!canEdit}
                            onChange={toggleReverse}
                            className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                        />
                        <span>
                            Reverse Score This Item (Handled in
                            Scoring Step)
                        </span>
                    </label>

                    {/* Informational Note */}
                    <div className="text-xs text-slate-500">
                        Reverse scoring affects scoring logic
                        only. UI order remains unchanged.
                    </div>
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
