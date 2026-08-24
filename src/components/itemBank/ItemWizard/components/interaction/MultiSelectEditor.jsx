// src/components/itemBank/ItemWizard/components/interaction/MultiSelectEditor.jsx
// ------------------------------------------------------------
// Multi-Select Interaction Editor
// ------------------------------------------------------------
// - Multiple correct options allowed
// - Stable option IDs
// - Optional min/max selection constraints
// - Shuffle support
// - Draft-aware
// - Scoring-layer independent
// ------------------------------------------------------------

import React from "react";
import { Plus, Trash2, Lock } from "lucide-react";

/* =====================================================
   Utility
===================================================== */

function generateOptionId() {
    return `opt_${Date.now()}_${Math.floor(
        Math.random() * 1000
    )}`;
}

/* =====================================================
   Component
===================================================== */

export default function MultiSelectEditor({
    interaction,
    onChange,
    canEdit,
}) {
    const options = interaction?.responseComponents || [];
    const config = interaction?.config || {
        shuffle: false,
        minSelections: 0,
        maxSelections: 0,
    };

    /* -----------------------------------------------------
       Safe Update Helper
    ----------------------------------------------------- */

    const updateInteraction = (updated) => {
        if (!canEdit) return;

        onChange({
            ...interaction,
            ...updated,
        });
    };

    /* -----------------------------------------------------
       Add Option
    ----------------------------------------------------- */

    const addOption = () => {
        if (!canEdit) return;

        const newOption = {
            id: generateOptionId(),
            type: "option",
            label: "",
            value: "",
            isCorrect: false,
        };

        updateInteraction({
            responseComponents: [...options, newOption],
        });
    };

    /* -----------------------------------------------------
       Remove Option
    ----------------------------------------------------- */

    const removeOption = (id) => {
        if (!canEdit) return;

        updateInteraction({
            responseComponents: options.filter(
                (opt) => opt.id !== id
            ),
        });
    };

    /* -----------------------------------------------------
       Update Option
    ----------------------------------------------------- */

    const updateOption = (id, field, value) => {
        if (!canEdit) return;

        const updatedOptions = options.map((opt) =>
            opt.id === id
                ? { ...opt, [field]: value }
                : opt
        );

        updateInteraction({
            responseComponents: updatedOptions,
        });
    };

    /* -----------------------------------------------------
       Toggle Correct (Multiple Allowed)
    ----------------------------------------------------- */

    const toggleCorrect = (id) => {
        if (!canEdit) return;

        const updatedOptions = options.map((opt) =>
            opt.id === id
                ? { ...opt, isCorrect: !opt.isCorrect }
                : opt
        );

        updateInteraction({
            responseComponents: updatedOptions,
        });
    };

    /* -----------------------------------------------------
       Toggle Shuffle
    ----------------------------------------------------- */

    const toggleShuffle = () => {
        if (!canEdit) return;

        updateInteraction({
            config: {
                ...config,
                shuffle: !config.shuffle,
            },
        });
    };

    /* -----------------------------------------------------
       Update Min/Max Selections
    ----------------------------------------------------- */

    const updateSelectionConstraint = (
        field,
        value
    ) => {
        if (!canEdit) return;

        const numericValue = parseInt(value, 10);

        updateInteraction({
            config: {
                ...config,
                [field]: isNaN(numericValue)
                    ? 0
                    : numericValue,
            },
        });
    };

    /* -----------------------------------------------------
       UI
    ----------------------------------------------------- */

    return (
        <div className="space-y-6">
            {/* Options List */}
            <div className="space-y-4">
                {options.length === 0 && (
                    <div className="text-sm text-slate-500">
                        No options added yet.
                    </div>
                )}

                {options.map((opt, index) => (
                    <div
                        key={opt.id}
                        className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-slate-800">
                                Option {index + 1}
                            </div>

                            {canEdit && (
                                <button
                                    onClick={() =>
                                        removeOption(opt.id)
                                    }
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 transition hover:bg-red-50"
                                >
                                    <Trash2 size={14} strokeWidth={2.25} />
                                </button>
                            )}
                        </div>

                        {/* Label */}
                        <input
                            type="text"
                            value={opt.label}
                            disabled={!canEdit}
                            onChange={(e) =>
                                updateOption(
                                    opt.id,
                                    "label",
                                    e.target.value
                                )
                            }
                            className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                            placeholder="Display text"
                        />

                        {/* Value */}
                        <input
                            type="text"
                            value={opt.value}
                            disabled={!canEdit}
                            onChange={(e) =>
                                updateOption(
                                    opt.id,
                                    "value",
                                    e.target.value
                                )
                            }
                            className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                            placeholder="Scoring value"
                        />

                        {/* Correct Toggle */}
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                                type="checkbox"
                                checked={opt.isCorrect}
                                disabled={!canEdit}
                                onChange={() =>
                                    toggleCorrect(opt.id)
                                }
                                className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                            />
                            <span>Mark as Correct</span>
                        </label>
                    </div>
                ))}
            </div>

            {/* Add Option */}
            {canEdit && (
                <button
                    onClick={addOption}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                    <Plus size={14} strokeWidth={2.25} />
                    Add Option
                </button>
            )}

            {/* Constraints */}
            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Minimum Selections
                    </label>
                    <input
                        type="number"
                        value={config.minSelections || 0}
                        disabled={!canEdit}
                        onChange={(e) =>
                            updateSelectionConstraint(
                                "minSelections",
                                e.target.value
                            )
                        }
                        className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Maximum Selections
                    </label>
                    <input
                        type="number"
                        value={config.maxSelections || 0}
                        disabled={!canEdit}
                        onChange={(e) =>
                            updateSelectionConstraint(
                                "maxSelections",
                                e.target.value
                            )
                        }
                        className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    />
                </div>
            </div>

            {/* Shuffle */}
            <label className="flex items-center gap-2 border-t border-slate-100 pt-4 text-sm text-slate-700">
                <input
                    type="checkbox"
                    checked={config.shuffle}
                    disabled={!canEdit}
                    onChange={toggleShuffle}
                    className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                />
                <span>Shuffle Options During Delivery</span>
            </label>

            {!canEdit && (
                <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800">
                    <Lock size={16} strokeWidth={2.25} className="mt-0.5 shrink-0" />
                    <span>Interaction locked (confirmed item).</span>
                </div>
            )}
        </div>
    );
}
