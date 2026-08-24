// EvidenceWizard/components/ObservableCard.jsx
// 📊 Enterprise Observable Card (Clean UX)
// ---------------------------------------------------
// Collapsible card triggered by clicking the header
// No duplicate warrant information (since cards live under a warrant section)
// Integrates ObservableBuilder

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
    GripVertical,
    ChevronDown,
    ChevronRight,
    AlertTriangle,
    Trash2
} from "lucide-react";

import ObservableBuilder from "./ObservableBuilder";
import { validateObservable } from "./utils/observableValidator";
import { OBSERVABLE_RESPONSE_MODE_VALUES } from "@/utils/ecdVocabulary";

export default function ObservableCard({
    observable,
    index,
    competency,
    errors = {},
    collapseAll = false,
    dragAttributes,
    dragListeners,
    locked,
    onChange,
    onRemove
}) {

    const [collapsed, setCollapsed] = useState(true);

    useEffect(() => {
        setCollapsed(collapseAll);
    }, [collapseAll]);


    /* =====================================================
       Update Helpers
    ===================================================== */

    function update(field, value) {

        onChange({
            ...observable,
            [field]: value
        });

    }


    function applyBuilderPatch(patch) {

        onChange({
            ...observable,
            ...patch
        });

    }


    /* =====================================================
       Observable Types
    ===================================================== */

    /* The seven response modes come from src/utils/ecdVocabulary.js, which
       src/utils/schema.js and the Item Wizard also import. They used to be
       a bare string array here, and the Item Wizard's interaction registry
       was a DIFFERENT bare array elsewhere, while schema.js required
       `item.interaction.type === observable.type` between them -- two
       vocabularies with no value in common, so the rule was unsatisfiable
       and no item could ever be confirmed. One list, one compatibility
       map. */
    const observableTypes = OBSERVABLE_RESPONSE_MODE_VALUES;

    /* =====================================================
       Type Badge Colors
    ===================================================== */

    function typeColor(type) {

        switch (type) {

            case "selected_response":
                return "bg-emerald-100 text-emerald-700";

            case "constructed_response":
                return "bg-blue-100 text-blue-700";

            case "numeric_response":
                return "bg-indigo-100 text-indigo-700";

            case "performance":
                return "bg-purple-100 text-purple-700";

            case "artifact":
                return "bg-amber-100 text-amber-700";

            case "behavior":
                return "bg-pink-100 text-pink-700";

            case "process_trace":
                return "bg-slate-100 text-slate-600";

            default:
                return "bg-slate-100 text-slate-600";

        }

    }


    /* =====================================================
       Card Toggle
    ===================================================== */

    function toggleCard() {
        setCollapsed(prev => !prev);
    }

    /* =====================================================
       Validation Diagnostics
    ===================================================== */
    const diagnostics = useMemo(() => {

        return validateObservable(
            observable.statement || "No observable statement is defined yet."
        );

    }, [observable.statement]);

    /* =====================================================
       Render
    ===================================================== */

    return (

        <motion.div
            layout
            className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden"
        >

            {/* =======================================
               Card Header (Clickable)
            ======================================= */}

            <div
                className="flex items-center justify-between gap-3 px-5 py-4 text-left cursor-pointer"
                onClick={toggleCard}
            >

                {/* Drag Handle */}

                <div
                    {...(locked ? {} : dragAttributes)}
                    {...(locked ? {} : dragListeners)}
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-grab text-slate-400"
                >
                    <GripVertical size={16} strokeWidth={2} />
                </div>


                {/* Observable Label */}

                <div className="flex-1 min-w-0">

                    <div className="text-sm font-semibold text-slate-900">
                        Observable {index + 1}
                    </div>


                    {observable.statement && (

                        <div className="text-xs text-slate-500 line-clamp-1">
                            {observable.statement}
                        </div>

                    )}

                    {!observable.statement && (

                        <div className="text-xs text-slate-400 line-clamp-1 italic">
                            No observable statement is defined yet.
                        </div>

                    )}

                </div>


                {/* Type Badge */}

                {observable.type && (

                    <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${typeColor(observable.type)}`}
                    >
                        {observable.type}
                    </span>

                )}

                {!observable.type && (

                    <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${typeColor(observable.type)}`}
                    >
                        Undefined
                    </span>

                )}

                <span className="text-slate-400">

                    {collapsed
                        ? <ChevronRight size={16} strokeWidth={2} />
                        : <ChevronDown size={16} strokeWidth={2} />}

                </span>



            </div>


            {/* =======================================
               Collapsed Mode
            ======================================= */}

            {/* {collapsed && (

                <div className="px-4 py-3 text-sm text-gray-600">
                    {observable.statement || "No observable statement defined."}
                </div>

            )}
 */}

            {/* =======================================
               Expanded Mode
            ======================================= */}

            {!collapsed && (

                <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-6 space-y-5">

                    {diagnostics.length > 0 && (

                        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-800">

                            <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />

                            <div className="space-y-1">

                                {diagnostics.map((d, i) => (

                                    <div key={i}>
                                        {d}
                                    </div>

                                ))}

                            </div>

                        </div>

                    )}

                    {/* =======================================
                       Observable Builder
                    ======================================= */}
                    {!locked && (
                        <ObservableBuilder
                            competency={competency}
                            onApply={applyBuilderPatch}
                        />
                    )}

                    {/* =======================================
                       Observable Statement
                    ======================================= */}

                    <div>

                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Observable Statement <span className="text-red-500">*</span>
                        </label>

                        <textarea
                            className={`w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${errors[`statement-${index}`]
                                    ? "border-red-400 focus:ring-red-500/10 focus:border-red-500"
                                    : "border-slate-300 focus:ring-slate-900/10 focus:border-slate-400"
                                }`}
                            rows={3}
                            value={observable.statement || ""}
                            onChange={(e) =>
                                update("statement", e.target.value)
                            }
                            disabled={locked}
                        />

                        {errors[`statement-${index}`] && (

                            <p className="mt-1.5 text-xs font-medium text-red-600">
                                {errors[`statement-${index}`]}
                            </p>

                        )}

                    </div>


                    {/* =======================================
                       Observable Type
                    ======================================= */}

                    <div>

                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Observable Type <span className="text-red-500">*</span>
                        </label>

                        <select
                            className={`w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${errors[`type-${index}`]
                                    ? "border-red-400 focus:ring-red-500/10 focus:border-red-500"
                                    : "border-slate-300 focus:ring-slate-900/10 focus:border-slate-400"
                                }`}
                            value={observable.type || ""}
                            onChange={(e) =>
                                update("type", e.target.value)
                            }
                            disabled={locked}
                        >

                            <option value="">
                                Select observable type
                            </option>

                            {observableTypes.map(type => (

                                <option key={type} value={type}>
                                    {type}
                                </option>

                            ))}

                        </select>

                        {errors[`type-${index}`] && (

                            <p className="mt-1.5 text-xs font-medium text-red-600">
                                {errors[`type-${index}`]}
                            </p>

                        )}

                    </div>


                    {/* =======================================
                       Boundary Note
                    ======================================= */}

                    <div>

                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Boundary / Interpretation Notes
                        </label>

                        <textarea
                            className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                            rows={2}
                            value={observable.boundaryNote || ""}
                            onChange={(e) =>
                                update("boundaryNote", e.target.value)
                            }
                            disabled={locked}
                        />

                        <p className="mt-1.5 text-xs text-slate-400">
                            Clarifies limits of interpretation for this observable.
                        </p>

                    </div>


                    {/* =======================================
                       Remove
                    ======================================= */}
                    {!locked && (
                        <div className="flex justify-end">

                            <button
                                type="button"
                                className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                                onClick={onRemove}
                            >
                                <Trash2 size={14} strokeWidth={2} />
                                Remove Observable
                            </button>

                        </div>
                    )}
                </div>

            )}

        </motion.div>

    );

}
