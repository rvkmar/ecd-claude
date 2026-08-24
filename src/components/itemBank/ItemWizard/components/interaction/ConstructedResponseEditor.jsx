// src/components/itemBank/ItemWizard/components/interaction/ConstructedResponseEditor.jsx
// ------------------------------------------------------------
// Constructed Response Interaction Editor
// ------------------------------------------------------------
// - Single text-area component
// - Character and word limits
// - Rich text flag (future support)
// - Manual scoring flag
// - Draft-aware
// - Scoring-layer independent
// ------------------------------------------------------------

import React from "react";
import { Plus, Lock } from "lucide-react";

/* =====================================================
   Utility
===================================================== */

function generateComponentId() {
    return `cr_${Date.now()}_${Math.floor(
        Math.random() * 1000
    )}`;
}

/* =====================================================
   Component
===================================================== */

export default function ConstructedResponseEditor({
    interaction,
    onChange,
    canEdit,
}) {
    const component =
        interaction?.responseComponents?.[0] || null;

    const config = interaction?.config || {
        maxCharacters: 0,
        minCharacters: 0,
        maxWords: 0,
        allowRichText: false,
        manualScoringRequired: true,
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
                    type: "text_area",
                    placeholder: "",
                },
            ],
        });
    };

    /* -----------------------------------------------------
       Update Component Field
    ----------------------------------------------------- */

    const updateComponentField = (field, value) => {
        if (!canEdit) return;

        updateInteraction({
            responseComponents: [
                {
                    ...component,
                    [field]: value,
                },
            ],
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
                    Initialize Constructed Response
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

                    {/* Character Limits */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Minimum Characters
                            </label>
                            <input
                                type="number"
                                value={config.minCharacters || 0}
                                disabled={!canEdit}
                                onChange={(e) =>
                                    updateConfig(
                                        "minCharacters",
                                        parseInt(e.target.value, 10)
                                    )
                                }
                                className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Maximum Characters
                            </label>
                            <input
                                type="number"
                                value={config.maxCharacters || 0}
                                disabled={!canEdit}
                                onChange={(e) =>
                                    updateConfig(
                                        "maxCharacters",
                                        parseInt(e.target.value, 10)
                                    )
                                }
                                className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* Word Limit */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Maximum Words
                        </label>
                        <input
                            type="number"
                            value={config.maxWords || 0}
                            disabled={!canEdit}
                            onChange={(e) =>
                                updateConfig(
                                    "maxWords",
                                    parseInt(e.target.value, 10)
                                )
                            }
                            className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                        />
                    </div>

                    {/* Rich Text Toggle */}
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={config.allowRichText || false}
                            disabled={!canEdit}
                            onChange={(e) =>
                                updateConfig(
                                    "allowRichText",
                                    e.target.checked
                                )
                            }
                            className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                        />
                        <span>
                            Allow Rich Text Formatting
                        </span>
                    </label>

                    {/* Manual Scoring Flag */}
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={
                                config.manualScoringRequired || false
                            }
                            disabled={!canEdit}
                            onChange={(e) =>
                                updateConfig(
                                    "manualScoringRequired",
                                    e.target.checked
                                )
                            }
                            className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                        />
                        <span>
                            Requires Manual Scoring
                        </span>
                    </label>

                    {/* Informational Note */}
                    <div className="border-t border-slate-100 pt-4 text-xs text-slate-500">
                        Rubric and evidence activation rules
                        will be configured in Step 5 (Scoring
                        Mapping).
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
