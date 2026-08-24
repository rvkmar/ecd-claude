// src/components/itemBank/ItemWizard/components/stimulus/TableBlockEditor.jsx
// ------------------------------------------------------------
// Table Block Editor (Class A - Static)
// ------------------------------------------------------------
// - Rectangular matrix enforcement
// - Add/remove rows & columns
// - Header editing
// - Caption support
// - Immutable updates
// - No scoring logic
// - Accessibility-ready
// ------------------------------------------------------------

import React from "react";
import { Plus, X, Lock } from "lucide-react";

/* =====================================================
   Component Contract
===================================================== */
/*
  Props:
    - block
    - onChange(updatedBlock)
    - canEdit
*/

export default function TableBlockEditor({
    block,
    onChange,
    canEdit,
}) {
    if (!block || block.type !== "table") {
        return null;
    }

    const content = block.content || {
        headers: [],
        rows: [],
        caption: "",
    };

    const metadata = block.metadata || {};

    const headers = content.headers || [];
    const rows = content.rows || [];

    /* -----------------------------------------------------
       Safe Update
    ----------------------------------------------------- */

    const updateContent = (newContent) => {
        if (!canEdit) return;

        onChange({
            ...block,
            content: newContent,
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
       Header Operations
    ----------------------------------------------------- */

    const updateHeader = (index, value) => {
        const updatedHeaders = [...headers];
        updatedHeaders[index] = value;

        updateContent({
            ...content,
            headers: updatedHeaders,
        });
    };

    const addColumn = () => {
        if (!canEdit) return;

        const updatedHeaders = [...headers, ""];
        const updatedRows = rows.map((row) => [
            ...row,
            "",
        ]);

        updateContent({
            ...content,
            headers: updatedHeaders,
            rows: updatedRows,
        });
    };

    const removeColumn = (colIndex) => {
        if (!canEdit) return;

        const updatedHeaders = headers.filter(
            (_, i) => i !== colIndex
        );

        const updatedRows = rows.map((row) =>
            row.filter((_, i) => i !== colIndex)
        );

        updateContent({
            ...content,
            headers: updatedHeaders,
            rows: updatedRows,
        });
    };

    /* -----------------------------------------------------
       Row Operations
    ----------------------------------------------------- */

    const updateCell = (
        rowIndex,
        colIndex,
        value
    ) => {
        const updatedRows = rows.map((row, r) => {
            if (r !== rowIndex) return row;

            const updatedRow = [...row];
            updatedRow[colIndex] = value;
            return updatedRow;
        });

        updateContent({
            ...content,
            rows: updatedRows,
        });
    };

    const addRow = () => {
        if (!canEdit) return;

        const emptyRow = headers.map(() => "");

        updateContent({
            ...content,
            rows: [...rows, emptyRow],
        });
    };

    const removeRow = (rowIndex) => {
        if (!canEdit) return;

        const updatedRows = rows.filter(
            (_, i) => i !== rowIndex
        );

        updateContent({
            ...content,
            rows: updatedRows,
        });
    };

    /* -----------------------------------------------------
       UI
    ----------------------------------------------------- */

    return (
        <div className="space-y-6">
            {/* Caption */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Table Caption (Optional)
                </label>
                <input
                    type="text"
                    value={content.caption || ""}
                    disabled={!canEdit}
                    onChange={(e) =>
                        updateContent({
                            ...content,
                            caption: e.target.value,
                        })
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                />
            </div>

            {/* Accessibility Label */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Accessibility Label (Optional)
                </label>
                <input
                    type="text"
                    value={metadata.accessibilityLabel || ""}
                    disabled={!canEdit}
                    onChange={(e) =>
                        updateMetadata(
                            "accessibilityLabel",
                            e.target.value
                        )
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                />
            </div>

            {/* Table Grid */}
            <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            {headers.map((header, colIndex) => (
                                <th
                                    key={colIndex}
                                    className="px-4 py-3 text-left align-top"
                                >
                                    <input
                                        type="text"
                                        value={header}
                                        disabled={!canEdit}
                                        onChange={(e) =>
                                            updateHeader(
                                                colIndex,
                                                e.target.value
                                            )
                                        }
                                        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                    />

                                    {canEdit && (
                                        <button
                                            onClick={() =>
                                                removeColumn(colIndex)
                                            }
                                            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-red-600 transition hover:text-red-700"
                                        >
                                            <X size={12} strokeWidth={2.25} />
                                            Remove Column
                                        </button>
                                    )}
                                </th>
                            ))}

                            {canEdit && (
                                <th className="px-4 py-3 text-left">
                                    <button
                                        onClick={addColumn}
                                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition hover:text-slate-800"
                                    >
                                        <Plus size={12} strokeWidth={2.25} />
                                        Column
                                    </button>
                                </th>
                            )}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-slate-50">
                                {row.map((cell, colIndex) => (
                                    <td
                                        key={colIndex}
                                        className="px-4 py-3 text-slate-700"
                                    >
                                        <input
                                            type="text"
                                            value={cell}
                                            disabled={!canEdit}
                                            onChange={(e) =>
                                                updateCell(
                                                    rowIndex,
                                                    colIndex,
                                                    e.target.value
                                                )
                                            }
                                            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                        />
                                    </td>
                                ))}

                                {canEdit && (
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() =>
                                                removeRow(rowIndex)
                                            }
                                            className="inline-flex items-center gap-1 text-xs font-medium text-red-600 transition hover:text-red-700"
                                        >
                                            <X size={12} strokeWidth={2.25} />
                                            Remove Row
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}

                        {canEdit && (
                            <tr>
                                <td
                                    colSpan={
                                        headers.length + 1
                                    }
                                    className="px-4 py-3 text-center"
                                >
                                    <button
                                        onClick={addRow}
                                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition hover:text-slate-800"
                                    >
                                        <Plus size={12} strokeWidth={2.25} />
                                        Row
                                    </button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
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
