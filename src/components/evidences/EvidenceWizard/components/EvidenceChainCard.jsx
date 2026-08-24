// EvidenceChainCard.jsx
// Enterprise ECD — Observable Evidence Chain Card (Strict Refactor)
// -------------------------------------------------------------------
// Displays full ECD inference chain:
//
// Observable → Warrant → Evidence Rule → Evidence Variable (Model-ready)
//
// - Strict ECD linkage
// - UI-safe null handling
// - Future-ready for normalization (Step7+)
// - Clean separation of inference layers

import React, { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

export default function EvidenceChainCard({

    observable,
    warrants = [],
    checked = false,
    onToggle,
    locked

}) {

    const [expanded, setExpanded] = useState(false);

    /* =====================================================
       Resolve Warrant (STRICT ECD LINK)
    ===================================================== */

    const warrant = useMemo(() => {

        if (!observable?.warrantId) return null;

        return warrants.find(
            w => w.id === observable.warrantId
        ) || null;

    }, [observable, warrants]);


    /* =====================================================
       Resolve Evidence Rule (CURRENT STRUCTURE)
    ===================================================== */

    const evidenceRule = observable?.evidenceRule || null;


    /* =====================================================
       Helpers
    ===================================================== */

    const truncate = (text, max = 100) => {

        if (!text) return "";

        return text.length > max
            ? text.slice(0, max) + "..."
            : text;

    };


    const strengthLabel = (level) => {

        if (!level) return "—";

        const map = {
            1: "Very Weak",
            2: "Weak",
            3: "Moderate",
            4: "Strong",
            5: "Very Strong"
        };

        return map[level] || level;

    };


    const directionColor = (direction) => {

        if (direction === "supports") return "text-emerald-700";
        if (direction === "weakens") return "text-red-700";

        return "text-slate-600";
    };


    /* =====================================================
       Render
    ===================================================== */

    return (

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">

            {/* =====================================================
                Observable Header
            ===================================================== */}

            <div className="flex items-start gap-3 px-5 py-4">

                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                        onToggle?.(
                            observable.id,
                            e.target.checked
                        )
                    }
                    disabled={locked}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-slate-900"
                />

                <div className="flex-1">

                    <div className="font-medium text-sm text-slate-900">
                        {truncate(observable?.statement)}
                    </div>

                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">

                        <span>
                            ID:
                            <span className="ml-1 font-mono">
                                {observable?.id}
                            </span>
                        </span>

                        {observable?.type && (
                            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-600">
                                {observable.type}
                            </span>
                        )}

                    </div>

                </div>

                <button
                    onClick={() => setExpanded(!expanded)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition hover:text-slate-800"
                >
                    {expanded ? "Hide Evidence" : "Show Evidence"}
                    {expanded ? (
                        <ChevronUp size={14} strokeWidth={2} />
                    ) : (
                        <ChevronDown size={14} strokeWidth={2} />
                    )}
                </button>

            </div>


            {/* =====================================================
                Evidence Chain
            ===================================================== */}

            {expanded && (

                <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-6 space-y-5">

                    {/* =====================================================
                        WARRANT LAYER
                    ===================================================== */}

                    <div>

                        <div className="text-xs font-semibold text-slate-700 mb-1">
                            Warrant
                        </div>

                        {!warrant && (
                            <div className="flex items-start gap-1.5 text-xs text-red-600">
                                <AlertTriangle size={13} strokeWidth={2} className="mt-0.5 shrink-0" />
                                No warrant linked (invalid ECD chain)
                            </div>
                        )}

                        {warrant && (

                            <div className="text-xs bg-white border border-slate-200 rounded-md p-3 space-y-1">

                                <div className="text-slate-800">
                                    {truncate(warrant.reasoningStatement, 160)}
                                </div>

                                <div className="text-slate-500">
                                    Attribute:
                                    <span className="ml-1 font-medium">
                                        {warrant.cognitiveAttribute || "—"}
                                    </span>
                                </div>

                            </div>

                        )}

                    </div>


                    {/* =====================================================
                        EVIDENCE RULE LAYER
                    ===================================================== */}

                    <div>

                        <div className="text-xs font-semibold text-slate-700 mb-1">
                            Evidence Rule
                        </div>

                        {!evidenceRule && (
                            <div className="flex items-start gap-1.5 text-xs text-red-600">
                                <AlertTriangle size={13} strokeWidth={2} className="mt-0.5 shrink-0" />
                                No evidence rule defined
                            </div>
                        )}

                        {evidenceRule && (

                            <div className="text-xs bg-white border border-slate-200 rounded-md p-3 space-y-2">

                                <div>
                                    Direction:
                                    <span className={`ml-1 font-semibold ${directionColor(evidenceRule.direction)}`}>
                                        {evidenceRule.direction}
                                    </span>
                                </div>

                                <div>
                                    Strength:
                                    <span className="ml-1">
                                        {strengthLabel(evidenceRule.strengthLevel)}
                                    </span>
                                </div>

                                {evidenceRule.activationCondition && (
                                    <div>
                                        Condition:
                                        <span className="ml-1 text-slate-700">
                                            {truncate(evidenceRule.activationCondition, 120)}
                                        </span>
                                    </div>
                                )}

                                {evidenceRule.justification && (
                                    <div>
                                        Justification:
                                        <span className="ml-1 text-slate-700">
                                            {truncate(evidenceRule.justification, 140)}
                                        </span>
                                    </div>
                                )}

                            </div>

                        )}

                    </div>


                    {/* =====================================================
                        MODEL-READY VARIABLE (STEP 6 CONTEXT)
                    ===================================================== */}

                    <div>

                        <div className="text-xs font-semibold text-slate-700 mb-1">
                            Evidence Variable
                        </div>

                        <div className="text-xs bg-slate-100 border border-slate-200 rounded-md p-2 space-y-1">

                            <div>
                                Variable ID:
                                <span className="ml-1 font-mono">
                                    {observable.id}
                                </span>
                            </div>

                            <div>
                                Type:
                                <span className="ml-1">
                                    {observable.type || "—"}
                                </span>
                            </div>

                            <div className="text-slate-500">
                                Used as input in statistical model
                            </div>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

}