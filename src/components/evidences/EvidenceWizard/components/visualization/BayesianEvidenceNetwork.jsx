// BayesianEvidenceNetwork.jsx
// 🧠 Enterprise ECD — Bayesian Evidence Network (Upgraded)
// --------------------------------------------------------
// ✔ Evidence-strength weighted edges
// ✔ Direction-sensitive coloring (supports / weakens)
// ✔ Warrant-aware nodes
// ✔ Missing-link diagnostics
// ✔ Step 6 + Step 7 ready visualization

import React, { useMemo } from "react";
import { AlertTriangle } from "lucide-react";

export default function BayesianEvidenceNetwork({

    observables = [],
    warrants = [],
    competencyName = "Competency",
    modelType = "bayesian_network"

}) {

    const width = 700;
    const height = 360;

    const centerX = width / 2;
    const centerY = height - 90;

    const observableY = 70;

    const spacing =
        observables.length > 0
            ? width / (observables.length + 1)
            : width / 2;


    /* =====================================================
       Resolve Warrant + Evidence Rule
    ===================================================== */

    const enriched = useMemo(() => {

        return observables.map(obs => {

            const warrant = warrants.find(
                w => w.id === obs.warrantId
            );

            const rule = obs.evidenceRule;

            return {
                ...obs,
                warrant,
                rule
            };

        });

    }, [observables, warrants]);


    /* =====================================================
       Visual Encoding Functions
    ===================================================== */

    const getEdgeColor = (rule) => {

        if (!rule) return "#cbd5e1";

        if (rule.direction === "supports") return "#16a34a";
        if (rule.direction === "weakens") return "#dc2626";

        return "#6b7280";
    };


    const getEdgeWidth = (rule) => {

        if (!rule) return 1;

        return 1 + (rule.strengthLevel || 1) * 1.2;
    };


    const getNodeColor = (obs) => {

        if (!obs.warrantId) return "#fecaca"; // red (missing warrant)
        if (!obs.evidenceRule) return "#fde68a"; // yellow (missing rule)

        return "#dbeafe"; // blue (valid)
    };


    const truncate = (text, max = 36) => {

        if (!text) return "";

        return text.length > max
            ? text.slice(0, max) + "..."
            : text;

    };


    /* =====================================================
       Network Stats
    ===================================================== */

    const stats = useMemo(() => {

        let missingWarrant = 0;
        let missingRule = 0;

        enriched.forEach(e => {

            if (!e.warrant) missingWarrant++;
            if (!e.rule) missingRule++;

        });

        return {
            total: enriched.length,
            missingWarrant,
            missingRule
        };

    }, [enriched]);


    /* =====================================================
       Render
    ===================================================== */

    const hasIssues = stats.missingWarrant > 0 || stats.missingRule > 0;

    return (

        <div className="border border-slate-200 rounded-lg shadow-sm bg-white p-6 space-y-4">

            {/* Header */}

            <div className="flex justify-between items-center">

                <div className="text-lg font-semibold text-slate-900">
                    Bayesian Evidence Network
                </div>

                <div className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    {modelType?.toUpperCase()}
                </div>

            </div>


            {/* Health Summary */}

            <div
                className={`flex items-start gap-3 rounded-lg border px-4 py-3.5 text-sm ${
                    hasIssues
                        ? "border-amber-200 bg-amber-50 text-amber-800"
                        : "border-blue-200 bg-blue-50 text-blue-800"
                }`}
            >

                <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />

                <div className="space-y-1">

                    <div>Total Observables: {stats.total}</div>

                    {stats.missingWarrant > 0 && (
                        <div className="font-medium">
                            Missing Warrants: {stats.missingWarrant}
                        </div>
                    )}

                    {stats.missingRule > 0 && (
                        <div className="font-medium">
                            Missing Evidence Rules: {stats.missingRule}
                        </div>
                    )}

                </div>

            </div>


            {/* SVG Network */}

            <svg
                width="100%"
                height={height}
                viewBox={`0 0 ${width} ${height}`}
            >

                {/* Observable Nodes + Edges */}

                {enriched.map((obs, i) => {

                    const x = spacing * (i + 1);

                    const edgeColor = getEdgeColor(obs.rule);
                    const edgeWidth = getEdgeWidth(obs.rule);

                    return (

                        <g key={obs.id}>

                            {/* EDGE */}

                            <line
                                x1={x}
                                y1={observableY + 20}
                                x2={centerX}
                                y2={centerY - 30}
                                stroke={edgeColor}
                                strokeWidth={edgeWidth}
                                opacity="0.85"
                            />

                            {/* EDGE LABEL (Strength) */}

                            {obs.rule && (
                                <text
                                    x={(x + centerX) / 2}
                                    y={(observableY + centerY) / 2}
                                    textAnchor="middle"
                                    fontSize="9"
                                    fill={edgeColor}
                                >
                                    {obs.rule.strengthLevel}
                                </text>
                            )}

                            {/* NODE */}

                            <circle
                                cx={x}
                                cy={observableY}
                                r="18"
                                fill={getNodeColor(obs)}
                                stroke="#475569"
                                strokeWidth="1.5"
                            />

                            {/* NODE LABEL */}

                            <text
                                x={x}
                                y={observableY + 35}
                                textAnchor="middle"
                                fontSize="10"
                                fill="#334155"
                            >
                                {obs.id}
                            </text>

                            {/* TOOLTIP (WARRANT INFO) */}

                            <title>
                                {obs.statement}

                                {"\n\nWarrant: "}
                                {obs.warrant?.reasoningStatement || "Missing"}

                                {"\n\nRule: "}
                                {obs.rule
                                    ? `${obs.rule.direction} (${obs.rule.strengthLevel})`
                                    : "Missing"}
                            </title>

                        </g>

                    );

                })}


                {/* LATENT NODE */}

                <circle
                    cx={centerX}
                    cy={centerY}
                    r="34"
                    fill="#dcfce7"
                    stroke="#16a34a"
                    strokeWidth="3"
                />

                <text
                    x={centerX}
                    y={centerY + 5}
                    textAnchor="middle"
                    fontSize="16"
                    fontWeight="bold"
                >
                    θ
                </text>

                <text
                    x={centerX}
                    y={centerY + 55}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#334155"
                >
                    {truncate(competencyName)}
                </text>

            </svg>


            {/* Legend */}

            <div className="text-xs text-slate-500 space-y-1">

                <div><strong>Edge:</strong> Evidence strength (thickness) + direction (color)</div>
                <div><strong>Green:</strong> Supports | <strong>Red:</strong> Weakens</div>
                <div><strong>Blue node:</strong> Valid evidence</div>
                <div><strong>Yellow:</strong> Missing rule | <strong>Red:</strong> Missing warrant</div>

            </div>

        </div>

    );

}