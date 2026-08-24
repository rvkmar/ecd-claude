// src/components/itemBank/ItemWizard/components/stimulus/TextBlockEditor.jsx
// ------------------------------------------------------------
// Text Block Editor (Class A - Static)
// ------------------------------------------------------------
// - Plain / Markdown toggle
// - Pure content editing
// - No scoring logic
// - Immutable updates
// - Draft-aware
// - Future-ready for rich text extension
// ------------------------------------------------------------

import React from "react";
import { Lock } from "lucide-react";

/* =====================================================
   Component Contract
===================================================== */
/*
  Props:
    - block: {
        id: string,
        class: "static",
        type: "text",
        metadata: object,
        content: {
          text: string,
          format: "plain" | "markdown"
        }
      }

    - onChange(updatedBlock)
    - canEdit: boolean
*/

export default function TextBlockEditor({
    block,
    onChange,
    canEdit,
}) {
    if (!block || block.type !== "text") {
        return null;
    }

    const content = block.content || {
        text: "",
        format: "plain",
    };

    /* -----------------------------------------------------
       Update Content Safely
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

    /* -----------------------------------------------------
       UI
    ----------------------------------------------------- */

    return (
        <div className="space-y-4">
            {/* Format Selector */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Text Format
                </label>
                <select
                    value={content.format || "plain"}
                    disabled={!canEdit}
                    onChange={(e) =>
                        updateContent("format", e.target.value)
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                    <option value="plain">
                        Plain Text
                    </option>
                    <option value="markdown">
                        Markdown
                    </option>
                </select>
            </div>

            {/* Text Area */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Content
                </label>

                <textarea
                    value={content.text || ""}
                    disabled={!canEdit}
                    onChange={(e) =>
                        updateContent("text", e.target.value)
                    }
                    className="min-h-[150px] w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    placeholder="Enter stimulus text..."
                />

                {content.format === "markdown" && (
                    <p className="mt-1.5 text-xs text-slate-400">
                        Markdown formatting supported. Ensure
                        content is sanitized before rendering in
                        delivery environment.
                    </p>
                )}
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
