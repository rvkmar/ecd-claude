// BayesianGraphPreview.jsx
// 🧠 Enterprise ECD — Bayesian Network Graph Preview
// --------------------------------------------------
// Visualizes probabilistic dependency structure between
// competency claim and observable evidence variables.

import React from "react";
import { Info } from "lucide-react";

export default function BayesianGraphPreview({
    competencyName = "Competency",
    observables = []
}) {

    /* =====================================================
       Helper Functions
    ===================================================== */

    const truncate = (text, max = 35) => {
        if (!text) return "";
        return text.length > max
            ? text.slice(0, max) + "..."
            : text;
    };

    /* =====================================================
       Empty State
    ===================================================== */

    if (!observables.length) {

        return (

            <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">

                No observables available to visualize the Bayesian network.

            </div>

        );

    }

    /* =====================================================
       Layout Calculation
    ===================================================== */

    const width = Math.max(600, observables.length * 160);
    const height = 260;

    const competencyX = width / 2;
    const competencyY = 60;

    const observableY = 190;

    const spacing = width / (observables.length + 1);

    /* =====================================================
       UI
    ===================================================== */

    return (

        <div className="space-y-4">

            {/* Header */}

            <div>

                <div className="text-lg font-semibold text-slate-900">
                    Bayesian Network Structure
                </div>

                <div className="text-sm text-slate-500">

                    This diagram shows the probabilistic dependency
                    structure between the competency claim and
                    observable evidence variables.

                </div>

            </div>

            {/* Graph */}

            <div className="rounded-lg border border-slate-200 shadow-sm bg-white overflow-x-auto">

                <svg
                    width={width}
                    height={height}
                    className="mx-auto"
                >

                    {/* Model Label */}

                    <text
                        x={width / 2}
                        y={20}
                        textAnchor="middle"
                        className="text-sm fill-slate-600"
                    >
                        Bayesian Diagnostic Model
                    </text>

                    {/* Competency Node */}

                    <circle
                        cx={competencyX}
                        cy={competencyY}
                        r="28"
                        fill="#7C3AED"
                    />

                    <text
                        x={competencyX}
                        y={competencyY + 4}
                        textAnchor="middle"
                        className="fill-white text-xs"
                    >
                        C
                    </text>

                    <text
                        x={competencyX}
                        y={competencyY + 45}
                        textAnchor="middle"
                        className="fill-slate-600 text-xs"
                    >
                        {truncate(competencyName, 30)}
                    </text>

                    {/* Observable Nodes */}

                    {observables.map((obs, index) => {

                        const x = spacing * (index + 1);

                        return (

                            <g key={obs.id}>

                                {/* Directed Edge */}

                                <line
                                    x1={competencyX}
                                    y1={competencyY + 28}
                                    x2={x}
                                    y2={observableY - 24}
                                    stroke="#94a3b8"
                                    strokeWidth="1.5"
                                />

                                {/* Arrow Head */}

                                <polygon
                                    points={`
                                        ${x - 4},${observableY - 28}
                                        ${x + 4},${observableY - 28}
                                        ${x},${observableY - 20}
                                    `}
                                    fill="#94a3b8"
                                />

                                {/* Observable Node */}

                                <circle
                                    cx={x}
                                    cy={observableY}
                                    r="22"
                                    fill="#10B981"
                                />

                                <text
                                    x={x}
                                    y={observableY + 4}
                                    textAnchor="middle"
                                    className="fill-white text-xs"
                                >
                                    O{index + 1}
                                </text>

                                {/* Observable Label */}

                                <text
                                    x={x}
                                    y={observableY + 45}
                                    textAnchor="middle"
                                    className="fill-slate-600 text-xs"
                                >
                                    {truncate(obs.statement, 40)}
                                </text>

                            </g>

                        );

                    })}

                </svg>

            </div>

            {/* Interpretation */}

            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3.5 text-sm text-blue-800">

                <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0" />

                <div>
                    In a Bayesian diagnostic model, the competency node
                    represents the learner's mastery state. Observable
                    variables depend probabilistically on this competency,
                    and inference is performed using conditional probability
                    tables (CPTs).
                </div>

            </div>

        </div>

    );

}