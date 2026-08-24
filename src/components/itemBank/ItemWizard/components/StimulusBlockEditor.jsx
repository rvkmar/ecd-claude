// src/components/itemBank/ItemWizard/components/StimulusBlockEditor.jsx
// ------------------------------------------------------------
// 🧠 Stimulus Block Editor — Phase 1 (Fully Modularized)
// ------------------------------------------------------------
// ✔ Registry-based architecture
// ✔ Modular block editors
// ✔ Immutable updates
// ✔ Draft-aware
// ✔ Strict Class A enforcement
// ✔ Future-ready for taxonomy expansion
// ------------------------------------------------------------

import { STIMULUS_LAYOUTS } from "../../itemConstants";
import React from "react";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

import TextBlockEditor from "./stimulus/TextBlockEditor";
import ImageBlockEditor from "./stimulus/ImageBlockEditor";
import TableBlockEditor from "./stimulus/TableBlockEditor";
import MathBlockEditor from "./stimulus/MathBlockEditor";
import InstructionBlockEditor from "./stimulus/InstructionBlockEditor";

/* =====================================================
   🔹 Utilities
===================================================== */

function generateId() {
    return `blk_${Date.now()}_${Math.floor(
        Math.random() * 1000
    )}`;
}

/* =====================================================
   🔹 Block Registry (Modular)
===================================================== */

const BLOCK_REGISTRY = {
    text: {
        label: "Text",
        create: () => ({
            id: generateId(),
            class: "static",
            type: "text",
            metadata: {},
            content: {
                text: "",
                format: "plain",
            },
        }),
        component: TextBlockEditor,
    },

    image: {
        label: "Image",
        create: () => ({
            id: generateId(),
            class: "static",
            type: "image",
            metadata: {},
            content: {
                url: "",
                altText: "",
                caption: "",
                width: "",
                height: "",
            },
        }),
        component: ImageBlockEditor,
    },

    table: {
        label: "Table",
        create: () => ({
            id: generateId(),
            class: "static",
            type: "table",
            metadata: {},
            content: {
                headers: [],
                rows: [],
                caption: "",
            },
        }),
        component: TableBlockEditor,
    },

    math: {
        label: "Math",
        create: () => ({
            id: generateId(),
            class: "static",
            type: "math",
            metadata: {},
            content: {
                latex: "",
                displayMode: "block",
            },
        }),
        component: MathBlockEditor,
    },

    instruction: {
        label: "Instruction",
        create: () => ({
            id: generateId(),
            class: "static",
            type: "instruction",
            metadata: {},
            content: {
                text: "",
                emphasisLevel: "normal",
            },
        }),
        component: InstructionBlockEditor,
    },
};

/* =====================================================
   🔹 Component
===================================================== */

export default function StimulusBlockEditor({
    stimulus,
    onChange,
    canEdit = true,
}) {
    const layout = stimulus?.layout || "single";
    const blocks = stimulus?.blocks || [];

    /* -----------------------------------------------------
       🔹 Layout Update
    ----------------------------------------------------- */

    const updateLayout = (newLayout) => {
        if (!canEdit) return;

        onChange({
            ...stimulus,
            layout: newLayout,
        });
    };

    /* -----------------------------------------------------
       🔹 Block Operations
    ----------------------------------------------------- */

    const addBlock = (type) => {
        if (!canEdit) return;

        const block = BLOCK_REGISTRY[type].create();

        onChange({
            ...stimulus,
            blocks: [...blocks, block],
        });
    };

    const removeBlock = (id) => {
        if (!canEdit) return;

        onChange({
            ...stimulus,
            blocks: blocks.filter((b) => b.id !== id),
        });
    };

    const moveBlock = (index, direction) => {
        if (!canEdit) return;

        const newBlocks = [...blocks];
        const target =
            direction === "up" ? index - 1 : index + 1;

        if (target < 0 || target >= blocks.length)
            return;

        [newBlocks[index], newBlocks[target]] =
            [newBlocks[target], newBlocks[index]];

        onChange({
            ...stimulus,
            blocks: newBlocks,
        });
    };

    const updateBlock = (updatedBlock) => {
        if (!canEdit) return;

        const updatedBlocks = blocks.map((b) =>
            b.id === updatedBlock.id
                ? updatedBlock
                : b
        );

        onChange({
            ...stimulus,
            blocks: updatedBlocks,
        });
    };

    /* -----------------------------------------------------
       🔹 UI
    ----------------------------------------------------- */

    return (
        <div className="space-y-6">
            {/* Layout Selector -- the ONLY control writing stimulus.layout.
                Options render from the shared STIMULUS_LAYOUTS list rather
                than hardcoded <option>s, so the wording here and anywhere
                else the layout is displayed cannot diverge again. */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Layout
                </label>

                <select
                    value={layout}
                    disabled={!canEdit}
                    onChange={(e) => updateLayout(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                    {STIMULUS_LAYOUTS.map((l) => (
                        <option key={l.value} value={l.value}>
                            {l.label}
                        </option>
                    ))}
                </select>

                <p className="mt-1.5 text-xs text-slate-500">
                    Passage-based layouts share their stimulus across the items
                    in an equivalence group.
                </p>
            </div>

            {/* Blocks */}
            <div className="space-y-4">
                {blocks.map((block, index) => {
                    const registry =
                        BLOCK_REGISTRY[block.type];

                    if (!registry) return null;

                    const BlockComponent =
                        registry.component;

                    return (
                        <div
                            key={block.id}
                            className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-semibold text-slate-800">
                                    {registry.label} Block
                                </div>

                                {canEdit && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() =>
                                                moveBlock(index, "up")
                                            }
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                        >
                                            <ArrowUp size={14} strokeWidth={2} />
                                        </button>

                                        <button
                                            onClick={() =>
                                                moveBlock(index, "down")
                                            }
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                        >
                                            <ArrowDown size={14} strokeWidth={2} />
                                        </button>

                                        <button
                                            onClick={() =>
                                                removeBlock(block.id)
                                            }
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 transition hover:bg-red-50"
                                        >
                                            <Trash2 size={14} strokeWidth={2} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Block Editor */}
                            <BlockComponent
                                block={block}
                                onChange={updateBlock}
                                canEdit={canEdit}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Add Block Buttons */}
            {canEdit && (
                <div className="flex flex-wrap gap-3">
                    {Object.entries(BLOCK_REGISTRY).map(
                        ([type, config]) => (
                            <button
                                key={type}
                                onClick={() => addBlock(type)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                            >
                                <Plus size={14} strokeWidth={2} />
                                Add {config.label}
                            </button>
                        )
                    )}
                </div>
            )}
        </div>
    );
}