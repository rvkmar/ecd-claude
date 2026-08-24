// src/components/itemBank/ItemWizard/components/stimulus/MathBlockEditor.jsx
// ------------------------------------------------------------
// Math Block Editor (Class A - Static)
// ------------------------------------------------------------
// - Raw LaTeX input
// - Inline / Block display mode
// - Accessibility label
// - Immutable updates
// - No evaluation logic
// - No scoring contamination
// - Draft-aware
// ------------------------------------------------------------

import React from "react";
import { Lock } from "lucide-react";

/* =====================================================
   Component Contract
===================================================== */
/*
  Props:
    - block
    - onChange(updatedBlock)
    - canEdit
*/

export default function MathBlockEditor({
    block,
    onChange,
    canEdit,
}) {
    if (!block || block.type !== "math") {
        return null;
    }

    const content = block.content || {
        latex: "",
        displayMode: "block",
    };

    const metadata = block.metadata || {};

    /* -----------------------------------------------------
       Safe Update Helpers
    ----------------------------------------------------- */

    const updateContent = (field, value) => {
        if (!canEdit) return;

        onChange({
            ...block,
            content: {
                ...content,
                [field]: value,
            },
        });
    };

    const updateMetadata = (field, value) => {
        if (!canEdit) return;

        onChange({
            ...block,
            metadata: {
                ...metadata,
                [field]: value,
            },
        });
    };

    /* -----------------------------------------------------
       UI
    ----------------------------------------------------- */

    return (
        <div className="space-y-6">
            {/* LaTeX Input */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    LaTeX Expression
                </label>

                <textarea
                    value={content.latex || ""}
                    disabled={!canEdit}
                    onChange={(e) =>
                        updateContent("latex", e.target.value)
                    }
                    className="min-h-[120px] w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    placeholder="Enter LaTeX expression (e.g., \frac{a}{b})"
                />

                <p className="mt-1.5 text-xs text-slate-400">
                    Use standard LaTeX syntax. Rendering will be
                    handled in the delivery environment.
                </p>
            </div>

            {/* Display Mode */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Display Mode
                </label>

                <select
                    value={content.displayMode || "block"}
                    disabled={!canEdit}
                    onChange={(e) =>
                        updateContent(
                            "displayMode",
                            e.target.value
                        )
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                    <option value="block">
                        Block (Centered Equation)
                    </option>
                    <option value="inline">
                        Inline (Within Text)
                    </option>
                </select>
            </div>

            {/* Accessibility Label */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Accessibility Label (Optional)
                </label>

                <input
                    type="text"
                    value={
                        metadata.accessibilityLabel || ""
                    }
                    disabled={!canEdit}
                    onChange={(e) =>
                        updateMetadata(
                            "accessibilityLabel",
                            e.target.value
                        )
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    placeholder="Text description for screen readers"
                />
            </div>

            {/* Internal Title */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Internal Title (Optional)
                </label>

                <input
                    type="text"
                    value={metadata.title || ""}
                    disabled={!canEdit}
                    onChange={(e) =>
                        updateMetadata("title", e.target.value)
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    placeholder="Internal reference title"
                />
            </div>

            {/* Governance Notice */}
            {!canEdit && (
                <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800">
                    <Lock size={16} strokeWidth={2.25} className="mt-0.5 shrink-0" />
                    <span>Block locked (confirmed item).</span>
                </div>
            )}
        </div>
    );
}
