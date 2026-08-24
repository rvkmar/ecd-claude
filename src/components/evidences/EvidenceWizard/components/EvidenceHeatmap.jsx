// EvidenceHeatmap.jsx
// 🧠 Enterprise ECD Evidence Coverage Heatmap (Advanced)
// ----------------------------------------------------------------------
// High-resolution analytics component visualizing how warrants cover
// constructs and cognitive attributes within the Evidence Model.
//
// Capabilities
// • Attribute × Construct coverage matrix
// • Evidence density heat visualization
// • Construct coverage totals
// • Attribute distribution totals
// • Missing coverage highlighting
// • Coverage percentage diagnostics
// • Construct hierarchy visualization
//
// Used in:
// • Step3Warrants.jsx
// • EvidenceDiagnosticsPanel

import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";

/* =====================================================
   Utility Functions
===================================================== */

function lower(v = "") {
    return String(v || "").toLowerCase();
}

function safeArray(v) {
    return Array.isArray(v) ? v : [];
}

function constructLabel(c) {
    return [c?.domain, c?.strand, c?.facet].filter(Boolean).join(" → ");
}

/* =====================================================
   Heat Intensity Color
   NOTE: this is the data-driven color scale for the heatmap cells.
   Do not change these thresholds/colors — they encode evidence density.
===================================================== */

function heatColor(value) {

    if (value >= 4) return "bg-green-600";

    if (value === 3) return "bg-green-400";

    if (value === 2) return "bg-yellow-400";

    if (value === 1) return "bg-orange-400";

    return "bg-red-300";

}

/* =====================================================
   Main Component
===================================================== */

export default function EvidenceHeatmap({

    competencies = [],

    warrants = []

}) {


    /* =====================================================
       Extract Attributes
    ===================================================== */

    const attributes = useMemo(() => {

        const set = new Set();

        safeArray(warrants).forEach(w => {

            if (w?.cognitiveAttribute)

                set.add(w.cognitiveAttribute);

        });


        return Array.from(set);


    }, [warrants]);


    /* =====================================================
       Build Construct List
    ===================================================== */

    const constructs = useMemo(() => {

        return safeArray(competencies).map(c => ({

            id: c.id,

            label: constructLabel(c),

            facet: lower(c?.facet)

        }));


    }, [competencies]);


    /* =====================================================
       Build Coverage Matrix
    ===================================================== */

    const matrix = useMemo(() => {

        const map = {};


        constructs.forEach(c => {

            map[c.id] = {};


            attributes.forEach(attr => {

                map[c.id][attr] = 0;

            });


        });


        warrants.forEach(w => {

            const attr = w?.cognitiveAttribute;

            const competencyId = w?.competencyId;


            if (!attr || !competencyId) return;


            if (!map[competencyId]) return;


            map[competencyId][attr]++;


        });


        return map;


    }, [constructs, attributes, warrants]);


    /* =====================================================
       Construct Totals
    ===================================================== */

    const constructTotals = useMemo(() => {

        const totals = {};


        constructs.forEach(c => {

            totals[c.id] = 0;


            attributes.forEach(attr => {

                totals[c.id] += matrix[c.id]?.[attr] || 0;

            });


        });


        return totals;


    }, [constructs, attributes, matrix]);


    /* =====================================================
       Attribute Totals

       NOTE: deliberately computed straight from `warrants`, not by
       summing the construct x attribute `matrix`. The matrix only
       counts a warrant once it has a competencyId AND that id resolves
       to one of the scoped `constructs` -- a warrant missing either
       (an unbound/legacy warrant, or a construct outside the current
       scope) used to silently vanish from these totals, so the heatmap
       could report "Attribute X has no supporting warrants" for an
       attribute the Warrant List above was visibly grouping warrants
       under. Attribute coverage is a warrant-level fact and shouldn't
       be gated on construct binding; only the per-construct matrix
       cells legitimately need competencyId.
    ===================================================== */

    const attributeTotals = useMemo(() => {

        const totals = {};


        attributes.forEach(attr => {

            totals[attr] = 0;

        });


        safeArray(warrants).forEach(w => {

            if (w?.cognitiveAttribute && totals[w.cognitiveAttribute] !== undefined) {

                totals[w.cognitiveAttribute]++;

            }

        });


        return totals;


    }, [attributes, warrants]);


    /* =====================================================
       Coverage Diagnostics
    ===================================================== */

    const diagnostics = useMemo(() => {

        const warnings = [];


        constructs.forEach(c => {

            if (!constructTotals[c.id]) {

                warnings.push(`No evidence supports construct "${c.label}".`);

            }


        });


        attributes.forEach(attr => {

            if (!attributeTotals[attr]) {

                warnings.push(`Attribute "${attr}" has no supporting warrants.`);

            }


        });


        return warnings;


    }, [constructs, attributes, constructTotals, attributeTotals]);


    /* =====================================================
       Coverage Percentage
    ===================================================== */

    const coveragePercent = useMemo(() => {

        const totalCells = constructs.length * attributes.length;


        if (!totalCells) return 0;


        let filled = 0;


        constructs.forEach(c => {

            attributes.forEach(attr => {

                if ((matrix[c.id]?.[attr] || 0) > 0)

                    filled++;

            });


        });


        return Math.round((filled / totalCells) * 100);


    }, [constructs, attributes, matrix]);


    /* =====================================================
       UI
    ===================================================== */

    return (

        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">


            {/* Header */}

            <div>

                <h4 className="text-sm font-semibold text-slate-800">

                    Evidence Coverage Heatmap

                </h4>


                <p className="mt-1 text-xs text-slate-500">

                    Visualizes how warrants support constructs and cognitive attributes.

                </p>

            </div>


            {/* Coverage Summary */}

            <div className="text-xs font-medium text-slate-600">

                Matrix Coverage: {coveragePercent}%

            </div>


            {/* Matrix Table */}

            <div className="overflow-x-auto rounded-lg border border-slate-200">

                <table className="min-w-full text-xs">


                    <thead className="bg-slate-50">

                        <tr>

                            <th className="border border-slate-200 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Construct
                            </th>


                            {attributes.map(attr => (

                                <th

                                    key={attr}

                                    className="border border-slate-200 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500"

                                >

                                    {attr}

                                </th>

                            ))}


                            <th className="border border-slate-200 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Total
                            </th>


                        </tr>

                    </thead>


                    <tbody>


                        {constructs.map(c => (

                            <tr key={c.id} className="hover:bg-slate-50">


                                <td className="border border-slate-200 px-3 py-2 text-slate-700">

                                    {c.label}

                                </td>


                                {attributes.map(attr => {

                                    const value = matrix[c.id]?.[attr] || 0;


                                    return (

                                        <td

                                            key={attr}

                                            className="border border-slate-200 text-center"

                                        >

                                            <div

                                                className={`mx-auto w-8 h-5 rounded text-white text-[10px] flex items-center justify-center ${heatColor(value)}`}

                                            >

                                                {value}

                                            </div>


                                        </td>

                                    );


                                })}


                                <td className="border border-slate-200 text-center font-semibold text-slate-700">

                                    {constructTotals[c.id]}

                                </td>


                            </tr>

                        ))}


                        {/* Attribute Totals Row */}

                        {attributes.length > 0 && (

                            <tr className="bg-slate-50">

                                <td className="border border-slate-200 px-3 py-2 font-semibold text-slate-700">
                                    Attribute Totals
                                </td>


                                {attributes.map(attr => (

                                    <td

                                        key={attr}

                                        className="border border-slate-200 text-center font-semibold text-slate-700"

                                    >

                                        {attributeTotals[attr]}

                                    </td>

                                ))}


                                <td className="border border-slate-200" />

                            </tr>

                        )}


                    </tbody>


                </table>

            </div>


            {/* Diagnostics */}

            {diagnostics.length > 0 && (

                <div className="space-y-1 text-sm text-amber-700">

                    {diagnostics.map((d, i) => (

                        <div key={i} className="flex items-start gap-1.5">
                            <AlertTriangle size={14} strokeWidth={2.25} className="mt-0.5 shrink-0" />
                            <span>{d}</span>
                        </div>

                    ))}

                </div>

            )}


            {/* Legend */}

            <div className="flex flex-wrap gap-4 text-xs text-slate-600">

                <Legend color="bg-red-300" label="No Evidence" />

                <Legend color="bg-orange-400" label="Low Evidence" />

                <Legend color="bg-yellow-400" label="Moderate Evidence" />

                <Legend color="bg-green-400" label="High Evidence" />

                <Legend color="bg-green-600" label="Strong Evidence" />

            </div>


        </div>

    );

}

/* =====================================================
   Legend
===================================================== */

function Legend({ color, label }) {

    return (

        <div className="flex items-center gap-2">

            <div className={`w-3 h-3 rounded ${color}`} />

            <span>{label}</span>

        </div>

    );

}
