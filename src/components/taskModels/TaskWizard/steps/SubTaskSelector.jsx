// steps/SubTaskSelector.jsx
// Composite Task Composition (Structural Only)
// ---------------------------------------------------------
// Mounted inside Step4TaskStructure whenever taskCompositionType is
// "composite". It used to be an orphan file -- never imported by the
// wizard's step container -- which is why `subTaskIds` had no authoring
// path at all despite SessionPlayer and TaskDetails both reading it.
// Defines composite task structure through ordered components.
// This step is strictly structural:
// - No claims
// - No task intent
// - No pedagogical labels
// - Evidence alignment shown for review only

import React, { useState, useMemo } from "react";
import { GripVertical, X, Plus, Check, ChevronDown, ChevronUp } from "lucide-react";
import { useTaskModels } from "@/api/queries/taskModels";

const sectionBase =
    "space-y-6 max-w-3xl mx-auto " +
    "[&>h3]:text-lg [&>h3]:font-semibold [&>h3]:text-slate-900 " +
    "[&>h3]:tracking-tight " +
    "[&>p]:text-sm [&>p]:text-slate-500 [&>p]:leading-relaxed";

export default function SubTaskSelector({
    disabled,
    value = [],
    onChange,
    currentTaskId,
    parentEvidenceModelIds = [],
    parentObservationIds = [],
    parentObservationMap = {},
}) {
    const { data: allTaskModels = [], isLoading: loading } = useTaskModels();
    const [dragIndex, setDragIndex] = useState(null);
    const [showAlignment, setShowAlignment] = useState(false);

    // Never offer this task as its own component (the server rejects it),
    // and never offer an archived model: it accepts no new links.
    const available = allTaskModels.filter(
        (tm) => tm.id !== currentTaskId && tm.status !== "archived"
    );

    /* ---------------- Structural Ordering ---------------- */

    const move = (from, to) => {
        if (disabled || from === to) return;
        const next = [...value];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        onChange(next);
    };

    const addComponent = (id) => {
        if (disabled || value.includes(id)) return;
        onChange([...value, id]);
    };

    const removeComponent = (id) => {
        if (disabled) return;
        onChange(value.filter((x) => x !== id));
    };

    /* ---------------- Evidence Overlap (Advisory Only) ---------------- */

    const evidenceHint = (tm) => {
        if (!parentEvidenceModelIds?.length) return null;
        const overlap = (tm.evidenceModelIds || []).some((id) =>
            parentEvidenceModelIds.includes(id)
        );

        return overlap
            ? { ok: true, text: "Evidence overlap" }
            : { ok: false, text: "No evidence overlap" };
    };

    /* ---------------- Observation Alignment Matrix ---------------- */

    const coverage = useMemo(() => {
        const matrix = {};
        for (const id of value) {
            const tm = allTaskModels.find((t) => t.id === id);
            const obs = (tm?.expectedObservations || []).map(
                (o) => o.observationId
            );
            matrix[id] = new Set(obs);
        }
        return matrix;
    }, [value, allTaskModels]);

    if (loading) {
        return <p className="text-sm text-slate-500">Loading task models…</p>;
    }

    return (
        <section className={sectionBase}>
            {/* -------------------------------------------------- */}
            {/* Ordered Structural Components */}
            {/* -------------------------------------------------- */}
            <div>
                <h3 className="text-lg font-semibold text-slate-900">Task Composition</h3>
                <p>
                    Components define execution or dependency order only. Ordering is
                    structural and does not imply instructional sequencing or intent.
                </p>

                {value.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                        {value.map((id, index) => {
                            const tm = allTaskModels.find((t) => t.id === id);
                            return (
                                <li
                                    key={id}
                                    draggable={!disabled}
                                    onDragStart={() => !disabled && setDragIndex(index)}
                                    onDragOver={(e) => !disabled && e.preventDefault()}
                                    onDrop={() => {
                                        if (!disabled) {
                                            move(dragIndex, index);
                                            setDragIndex(null);
                                        }
                                    }}
                                    className={`flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm ${disabled ? "cursor-default" : "cursor-move"
                                        }`}
                                >
                                    <span className="flex items-center gap-2 text-sm text-slate-700">
                                        {!disabled && (
                                            <GripVertical size={14} strokeWidth={2} className="shrink-0 text-slate-400" />
                                        )}
                                        {index + 1}. {tm?.name || id}
                                        <span className="ml-2 text-slate-400">({id})</span>
                                    </span>

                                    {!disabled && (
                                        <button
                                            onClick={() => removeComponent(id)}
                                            className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 transition hover:text-red-700"
                                        >
                                            <X size={14} strokeWidth={2} />
                                            Remove
                                        </button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="mt-2 text-sm text-slate-400">
                        No structural components selected.
                    </p>
                )}
            </div>

            {/* -------------------------------------------------- */}
            {/* Collapsible Observation Alignment (Advisory) */}
            {/* -------------------------------------------------- */}
            {parentObservationIds.length > 0 && value.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                    <button
                        type="button"
                        onClick={() => setShowAlignment((s) => !s)}
                        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-medium text-slate-700"
                    >
                        {showAlignment
                            ? "Hide Observation Alignment"
                            : "Show Observation Alignment"}
                        {showAlignment ? (
                            <ChevronUp size={16} strokeWidth={2} className="text-slate-400" />
                        ) : (
                            <ChevronDown size={16} strokeWidth={2} className="text-slate-400" />
                        )}
                    </button>

                    {showAlignment && (
                        <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 px-6 py-6">
                            <div className="overflow-x-auto rounded-lg border border-slate-200">
                                <table className="min-w-full divide-y divide-slate-200 text-xs">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Component</th>
                                            {parentObservationIds.map((oid) => {
                                                const obs = parentObservationMap[oid];
                                                // Evidence observables name this field `statement`;
                                                // reading `label`/`text` rendered every column as a
                                                // raw observable id.
                                                const label = obs?.statement || oid;
                                                return (
                                                    <th
                                                        key={oid}
                                                        className="max-w-[160px] whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                                                        title={oid}
                                                    >
                                                        {label}
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {value.map((id) => {
                                            const tm = allTaskModels.find((t) => t.id === id);
                                            return (
                                                <tr key={id} className="hover:bg-slate-50">
                                                    <td className="px-3 py-2 font-medium text-slate-700">
                                                        {tm?.name || id}
                                                    </td>
                                                    {parentObservationIds.map((oid) => {
                                                        const hit = coverage[id]?.has(oid);
                                                        return (
                                                            <td
                                                                key={oid}
                                                                className={`px-3 py-2 text-center ${hit
                                                                        ? "bg-emerald-100 text-emerald-700"
                                                                        : "text-slate-300"
                                                                    }`}
                                                            >
                                                                {hit ? (
                                                                    <Check size={12} strokeWidth={2.5} className="mx-auto" />
                                                                ) : (
                                                                    "–"
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-xs text-slate-500">
                                Alignment is informational only and does not alter claims or
                                measurement logic.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* -------------------------------------------------- */}
            {/* Available Task Models */}
            {/* -------------------------------------------------- */}
            {!disabled && (
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Available Task Models</h3>
                    <p>
                        These models may be used as structural components within a
                        composite task.
                    </p>

                    {available.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-400">None available.</p>
                    ) : (
                        <ul className="mt-3 space-y-2">
                            {available.map((tm) => {
                                const selected = value.includes(tm.id);
                                const hint = evidenceHint(tm);

                                return (
                                    <li
                                        key={tm.id}
                                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
                                    >
                                        <span className="text-sm text-slate-700">
                                            {tm.name}
                                            <span className="ml-2 text-slate-400">({tm.id})</span>
                                            {hint && (
                                                <span
                                                    className={`ml-2 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${hint.ok
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : "bg-amber-100 text-amber-700"
                                                        }`}
                                                >
                                                    {hint.text}
                                                </span>
                                            )}
                                        </span>

                                        <button
                                            disabled={selected}
                                            onClick={() => addComponent(tm.id)}
                                            className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition ${selected
                                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                                                    : "bg-slate-900 text-white hover:bg-slate-800"
                                                }`}
                                        >
                                            {selected ? (
                                                <>
                                                    <Check size={14} strokeWidth={2.25} />
                                                    Added
                                                </>
                                            ) : (
                                                <>
                                                    <Plus size={14} strokeWidth={2.25} />
                                                    Add
                                                </>
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}
        </section>
    );
}
