// EvidenceDiagnosticsPanel.jsx
// 🧠 Enterprise Evidence & Construct Diagnostics Dashboard (Fully Refactored)
// -----------------------------------------------------------------------------
// Comprehensive diagnostics dashboard for evaluating Evidence Models within
// the Evidence-Centered Design (ECD) framework.
//
// Integrated Diagnostics Engines
// • Evidence Diagnostics Engine
// • Construct Diagnostics Engine
// • Evidence Sufficiency Engine
// • Structural Alignment Analyzer
//
// Visual Analytics Provided
// ✔ Claim quality evaluation
// ✔ Cognitive attribute coverage
// ✔ Attribute distribution balance
// ✔ Construct coverage diagnostics
// ✔ Evidence sufficiency evaluation
// ✔ Competency prerequisite structure
// ✔ Construct redundancy detection
// ✔ Dimensionality warnings

import { useMemo } from "react";
import { Check, AlertTriangle } from "lucide-react";

import EvidenceSufficiencyPanel from "./EvidenceSufficiencyPanel";

import { runEvidenceDiagnostics } from "../components/diagnostics/evidenceDiagnostics";
import { runConstructDiagnostics } from "../components/diagnostics/constructDiagnostics";

/* =====================================================
   Score Utilities
===================================================== */

function scoreColor(score) {
    if (score >= 75) return "text-emerald-700";
    if (score >= 40) return "text-amber-700";
    return "text-red-600";
}

function scoreBar(score) {
    if (score >= 75) return "bg-emerald-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-red-500";
}

function safeArray(v) {
    return Array.isArray(v) ? v : [];
}

/* =====================================================
   Main Component
===================================================== */

export default function EvidenceDiagnosticsPanel({
    claimText = "",
    claimQualityScore = 0,
    warrants = [],
    competencies = [],
    competencyModels = []
}) {

    /* =====================================================
       Evidence Diagnostics
    ===================================================== */

    const evidence = useMemo(() => {

        return runEvidenceDiagnostics({
            claimText,
            claimScore: claimQualityScore,
            warrants,
            competencies
        });

    }, [claimText, claimQualityScore, warrants, competencies]);


    /* =====================================================
       Construct Diagnostics
    ===================================================== */

    // const construct = useMemo(() => {

    //     return runConstructDiagnostics({
    //         competencies,
    //         competencyModels,
    //         warrants
    //     });

    // }, [competencies, competencyModels, warrants]);


    const {
        coverage = [],
        coverageScore = 0,
        // constructMap = {},
        constructCoverageScore = 0,
        alignmentScore = 0,
        graphDiagnostics = []
    } = evidence || {};


    const claimScore = claimQualityScore ?? 0;


    /* =====================================================
       Attribute Distribution
    ===================================================== */

    const attributeDistribution = useMemo(() => {

        const counts = {};

        safeArray(warrants).forEach(w => {

            const attr = w?.cognitiveAttribute || "Unclassified";

            if (!counts[attr]) counts[attr] = 0;

            counts[attr]++;

        });

        return counts;


    }, [warrants]);


    /* =====================================================
       Sorted Attributes
    ===================================================== */

    const sortedAttributes = useMemo(() => {

        return Object.entries(attributeDistribution)
            .sort((a, b) => b[1] - a[1]);

    }, [attributeDistribution]);


    /* =====================================================
       UI
    ===================================================== */

    return (

        <div className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">


            {/* Header */}

            <div>

                <h3 className="text-sm font-semibold text-slate-800">
                    Evidence Model Diagnostics
                </h3>


                <p className="mt-1 text-xs text-slate-500">
                    Automated analytics evaluating evidence coverage,
                    construct representation, and structural competency alignment.
                </p>

            </div>


            {/* Score Dashboard */}

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">

                <ScoreCard label="Claim Quality" score={claimScore} />

                <ScoreCard label="Evidence Coverage" score={coverageScore} />

                <ScoreCard label="Construct Coverage" score={constructCoverageScore} />

                <ScoreCard label="Alignment Score" score={alignmentScore} />

            </div>


            {/* Attribute Coverage */}

            {/* <section className="space-y-3">

                <h4 className="text-sm font-medium">
                    Cognitive Attribute Coverage
                </h4>


                {coverage.length === 0 && (

                    <p className="text-gray-500 italic text-sm">
                        No attributes inferred from the claim.
                    </p>

                )}


                {coverage.map(c => (

                    <CoverageRow
                        key={c.attribute}
                        label={c.attribute}
                        covered={c.covered}
                    />

                ))}

            </section> */}


            {/* Attribute Distribution */}

            {/* <section className="space-y-3">

                <h4 className="text-sm font-medium">
                    Attribute Distribution
                </h4>


                {sortedAttributes.length === 0 && (

                    <p className="text-gray-500 italic text-sm">
                        No attributes assigned to warrants.
                    </p>

                )}


                {sortedAttributes.map(([attr, count]) => (

                    <div
                        key={attr}
                        className="flex justify-between text-sm"
                    >

                        <span>{attr}</span>

                        <span className="text-gray-600">
                            {count} warrant{count !== 1 ? "s" : ""}
                        </span>

                    </div>

                ))}

            </section> */}


            {/* Construct Coverage */}

            {/* <section className="space-y-3">

                <h4 className="text-sm font-medium">
                    Construct Coverage
                </h4>


                {Object.keys(constructMap).length === 0 && (

                    <p className="text-gray-500 italic text-sm">
                        No constructs detected.
                    </p>

                )}


                {Object.entries(constructMap).map(([key, covered]) => (

                    <CoverageRow
                        key={key}
                        label={key}
                        covered={covered}
                    />

                ))}

            </section> */}


            {/* Evidence Sufficiency */}

            {/* <EvidenceSufficiencyPanel
                competencies={competencies}
                warrants={warrants}
            /> */}


            {/* Structural Diagnostics */}

            {/* <section className="space-y-3">

                <h4 className="text-sm font-medium">
                    Structural Evidence Diagnostics
                </h4>


                {warrants.length === 0 && (

                    <p className="text-gray-500 italic text-sm">
                        Evidence diagnostics unavailable — no warrants defined yet.
                    </p>

                )}


                {warrants.length !== 0 && graphDiagnostics.length === 0 && (

                    <p className="text-green-700 text-sm">
                        ✔ Competency prerequisite structure satisfied
                    </p>

                )}


                {graphDiagnostics.map((w, i) => (

                    <WarningRow
                        key={`pr-${i}`}
                        message={`Evidence for "${w.competency}" exists but prerequisite "${w.prerequisite}" has no supporting evidence.`}
                    />

                ))}


                {safeArray(construct.missingConstructs).map((m, i) => (

                    <WarningRow
                        key={`missing-${i}`}
                        message={`Missing construct evidence for ${m.construct}`}
                    />

                ))}


                {safeArray(construct.redundantEvidence).map((r, i) => (

                    <WarningRow
                        key={`redundant-${i}`}
                        message={`Redundant evidence for "${r.competency}" (${r.count} warrants)`}
                    />

                ))}


                {safeArray(construct.dimensionalityWarnings).map((d, i) => (

                    <WarningRow
                        key={`dim-${i}`}
                        message={`Unidimensional model "${d.model}" has ${d.competencies} competencies bound`}
                    />

                ))}


            </section> */}


        </div>

    );

}


/* =====================================================
   Score Card
===================================================== */

function ScoreCard({ label, score }) {

    return (

        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">

            <div className="text-xs text-slate-500">
                {label}
            </div>


            <div className={`text-xl font-semibold ${scoreColor(score)}`}>
                {score}
            </div>


            <div className="h-2 w-full rounded-full bg-slate-200">

                <div
                    className={`h-2 rounded-full transition-all ${scoreBar(score)}`}
                    style={{ width: `${score}%` }}
                />

            </div>

        </div>

    );

}


/* =====================================================
   Coverage Row
===================================================== */

function CoverageRow({ label, covered }) {

    return (

        <div className="flex items-center gap-2 text-sm">

            <span className={covered ? "text-emerald-700" : "text-amber-700"}>
                {covered ? (
                    <Check size={14} strokeWidth={2.25} />
                ) : (
                    <AlertTriangle size={14} strokeWidth={2.25} />
                )}
            </span>


            <span className={covered ? "text-emerald-700" : "text-amber-700"}>
                {label}
            </span>

        </div>

    );

}


/* =====================================================
   Warning Row
===================================================== */

function WarningRow({ message }) {

    return (

        <div className="flex items-start gap-1.5 text-sm text-amber-700">
            <AlertTriangle size={14} strokeWidth={2.25} className="mt-0.5 shrink-0" />
            <span>{message}</span>
        </div>

    );

}
