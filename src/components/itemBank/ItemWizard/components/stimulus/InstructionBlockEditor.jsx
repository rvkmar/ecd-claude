// src/components/itemBank/ItemWizard/components/stimulus/InstructionBlockEditor.jsx
// ------------------------------------------------------------
// Instruction Block Editor (Class A - Static)
// ------------------------------------------------------------
// - Instructional text only
// - Emphasis level support
// - No scoring hints
// - Immutable updates
// - Draft-aware
// - Strictly presentational
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

export default function InstructionBlockEditor({
    block,
    onChange,
    canEdit,
}) {
    if (!block || block.type !== "instruction") {
        return null;
    }

    const content = block.content || {
        text: "",
        emphasisLevel: "normal",
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
            {/* Instruction Text */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Instruction Text
                </label>

                <textarea
                    value={content.text || ""}
                    disabled={!canEdit}
                    onChange={(e) =>
                        updateContent("text", e.target.value)
                    }
                    className="min-h-[120px] w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    placeholder="Enter instructions for the examinee..."
                />

                <p className="mt-1.5 text-xs text-slate-400">
                    Instructions must not reveal scoring
                    criteria or correct responses.
                </p>
            </div>

            {/* Emphasis Level */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Emphasis Level
                </label>

                <select
                    value={
                        content.emphasisLevel || "normal"
                    }
                    disabled={!canEdit}
                    onChange={(e) =>
                        updateContent(
                            "emphasisLevel",
                            e.target.value
                        )
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                    <option value="normal">
                        Normal
                    </option>
                    <option value="important">
                        Important
                    </option>
                    <option value="critical">
                        Critical
                    </option>
                </select>

                <p className="mt-1.5 text-xs text-slate-400">
                    Emphasis affects visual styling only.
                </p>
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
