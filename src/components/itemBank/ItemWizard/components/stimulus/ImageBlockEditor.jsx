// src/components/itemBank/ItemWizard/components/stimulus/ImageBlockEditor.jsx
// ------------------------------------------------------------
// Image Block Editor (Class A - Static)
// ------------------------------------------------------------
// - URL input
// - Alt text (required)
// - Caption support
// - Optional width / height
// - Accessibility enforced
// - Immutable updates
// - Draft-aware
// - No scoring logic
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
        type: "image",
        metadata: object,
        content: {
          url: string,
          altText: string,
          caption?: string,
          width?: number,
          height?: number
        }
      }

    - onChange(updatedBlock)
    - canEdit: boolean
*/

export default function ImageBlockEditor({
    block,
    onChange,
    canEdit,
}) {
    if (!block || block.type !== "image") {
        return null;
    }

    const content = block.content || {
        url: "",
        altText: "",
        caption: "",
        width: "",
        height: "",
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
        <div className="space-y-4">
            {/* Image URL */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Image URL
                </label>
                <input
                    type="text"
                    value={content.url || ""}
                    disabled={!canEdit}
                    onChange={(e) =>
                        updateContent("url", e.target.value)
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    placeholder="https://example.com/image.png"
                />
            </div>

            {/* Alt Text */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Alt Text <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={content.altText || ""}
                    disabled={!canEdit}
                    onChange={(e) =>
                        updateContent("altText", e.target.value)
                    }
                    className={
                        !content.altText
                            ? "w-full rounded-md border border-red-400 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                            : "w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    }
                    placeholder="Describe the image for accessibility"
                />

                {!content.altText && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                        Alt text is required for accessibility.
                    </p>
                )}
            </div>

            {/* Caption */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Caption (Optional)
                </label>
                <input
                    type="text"
                    value={content.caption || ""}
                    disabled={!canEdit}
                    onChange={(e) =>
                        updateContent("caption", e.target.value)
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    placeholder="Optional caption"
                />
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Width (px)
                    </label>
                    <input
                        type="number"
                        value={content.width || ""}
                        disabled={!canEdit}
                        onChange={(e) =>
                            updateContent(
                                "width",
                                e.target.value
                                    ? parseInt(e.target.value, 10)
                                    : ""
                            )
                        }
                        className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Height (px)
                    </label>
                    <input
                        type="number"
                        value={content.height || ""}
                        disabled={!canEdit}
                        onChange={(e) =>
                            updateContent(
                                "height",
                                e.target.value
                                    ? parseInt(e.target.value, 10)
                                    : ""
                            )
                        }
                        className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    />
                </div>
            </div>

            {/* Optional Metadata Title */}
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
