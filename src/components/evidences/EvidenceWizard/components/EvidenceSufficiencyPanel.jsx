// EvidenceSufficiencyPanel.jsx
// 🧠 Enterprise Evidence Sufficiency Dashboard
// ---------------------------------------------------------------------
// Visualizes evidence sufficiency across competency constructs.
//
// This component renders the output of the evidenceSufficiency engine
// and provides:
// • construct‑level evidence counts
// • adequacy status per construct
// • global sufficiency score
// • visual progress indicators
//
// IMPORTANT
// ---------
// The panel relies ONLY on the results returned by
// runEvidenceSufficiency() to avoid analytical inconsistencies.

import { useMemo } from "react";
import { Check, AlertTriangle, X } from "lucide-react";

import { runEvidenceSufficiency } from "../components/diagnostics/evidenceSufficiency";


/* =====================================================
   Status Utilities
===================================================== */

function statusIcon(status) {

    if (status === "adequate") return <Check size={14} strokeWidth={2.25} />

    if (status === "insufficient") return <AlertTriangle size={14} strokeWidth={2.25} />

    if (status === "missing") return <X size={14} strokeWidth={2.25} />

    return <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400" />

}


function statusColor(status) {

    if (status === "adequate") return "text-emerald-700"

    if (status === "insufficient") return "text-amber-700"

    if (status === "missing") return "text-red-600"

    return "text-slate-500"

}


function barColor(score) {

    if (score >= 75) return "bg-emerald-500"

    if (score >= 40) return "bg-amber-500"

    return "bg-red-500"

}


function scoreColor(score) {

    if (score >= 75) return "text-emerald-700"

    if (score >= 40) return "text-amber-700"

    return "text-red-600"

}


/* =====================================================
   Main Component
===================================================== */

export default function EvidenceSufficiencyPanel({

    competencies = [],

    warrants = []

}) {


    /* =====================================================
       Run Sufficiency Engine
    ===================================================== */

    const result = useMemo(() => {

        return runEvidenceSufficiency({

            competencies,

            warrants

        })

    }, [competencies, warrants])


    const {

        sufficiency = [],

        sufficiencyScore = 0,

        diagnostics = [],

        warnings = []

    } = result || {}


    const totalConstructs = sufficiency.length

    const coveredConstructs = sufficiency.filter(

        s => s.status === "adequate"

    ).length


    /* =====================================================
       Coverage Ratio
    ===================================================== */

    const coverageRatio = totalConstructs === 0

        ? 0

        : Math.round((coveredConstructs / totalConstructs) * 100)



    /* =====================================================
       UI
    ===================================================== */

    return (

        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">


            {/* Header */}

            <div className="flex items-center justify-between">

                <h4 className="text-sm font-semibold text-slate-800">
                    Evidence Sufficiency
                </h4>

                <div className={`text-sm font-semibold ${scoreColor(sufficiencyScore)}`}>
                    Score: {sufficiencyScore}/100
                </div>

            </div>


            {/* Coverage Summary */}

            <div className="text-xs text-slate-500">
                Construct Coverage: {coveredConstructs} / {totalConstructs}
                <span className="ml-2 text-slate-400">
                    ({coverageRatio}%)
                </span>
            </div>


            {/* Score Bar */}

            <div className="h-2 w-full rounded-full bg-slate-200">

                <div

                    className={`h-2 rounded-full transition-all ${barColor(sufficiencyScore)}`}

                    style={{ width: `${sufficiencyScore}%` }}

                />

            </div>


            {/* Construct Breakdown */}

            <div className="space-y-2 text-sm">

                {sufficiency.length === 0 && (

                    <p className="text-sm italic text-slate-400">
                        No construct evidence detected yet.
                    </p>

                )}


                {sufficiency.map((s, i) => (

                    <div

                        key={i}

                        className={`flex items-center justify-between ${statusColor(s.status)}`}

                    >


                        <div className="flex items-center gap-2">

                            <span>
                                {statusIcon(s.status)}
                            </span>

                            <span>
                                {s.construct}
                            </span>

                        </div>


                        <div className="text-xs text-slate-500">

                            {s.count} warrant{s.count !== 1 ? "s" : ""}

                        </div>


                    </div>

                ))}


            </div>


            {/* Diagnostics */}

            {diagnostics.length > 0 && (

                <div className="space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-600">

                    {diagnostics.map((d, i) => (

                        <div key={i} className="flex items-start gap-1.5">

                            <Check size={14} strokeWidth={2.25} className="mt-0.5 shrink-0 text-emerald-600" />
                            <span>{d.message}</span>

                        </div>

                    ))}

                </div>

            )}


            {/* Warnings */}

            {warnings.length > 0 && (

                <div className="space-y-1 border-t border-slate-100 pt-3 text-xs text-amber-700">

                    {warnings.map((w, i) => (

                        <div key={i} className="flex items-start gap-1.5">

                            <AlertTriangle size={14} strokeWidth={2.25} className="mt-0.5 shrink-0" />
                            <span>{w.message}</span>

                        </div>

                    ))}

                </div>

            )}


        </div>

    )

}
