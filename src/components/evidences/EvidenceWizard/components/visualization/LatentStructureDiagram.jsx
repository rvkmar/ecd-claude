// LatentStructureDiagram.jsx
// 🧠 Enterprise ECD — Latent Structure Visualization
// --------------------------------------------------
// Visualizes the relationship between the latent
// competency variable and observable evidence.
//
// Used for Rasch / IRT models.

import React from "react";
import { Info } from "lucide-react";

export default function LatentStructureDiagram({
    observables = [],
    competencyName = "Competency",
    modelType = "irt"
}) {

    /* =====================================================
       Helpers
    ===================================================== */

    const truncate = (text, max = 35) => {
        if (!text) return "";
        return text.length > max
            ? text.slice(0, max) + "..."
            : text;
    };

    const modelLabel =
        modelType === "rasch"
            ? "Rasch Latent Ability Model"
            : "Item Response Theory Model";

    /* =====================================================
       Empty State
    ===================================================== */

    if (!observables.length) {

        return (

            <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">

                No observables available to display in the latent structure diagram.

            </div>

        );

    }

    /* =====================================================
       Layout Calculations
    ===================================================== */

    const width = Math.max(600, observables.length * 160);
    const height = 260;

    const latentX = width / 2;
    const latentY = 60;

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
                    Latent Measurement Structure
                </div>

                <div className="text-sm text-slate-500">

                    This diagram illustrates how observable behaviors
                    provide evidence about the learner's latent competency.

                </div>

            </div>

            {/* Diagram */}

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
                        {modelLabel}
                    </text>

                    {/* Latent Node */}

                    <circle
                        cx={latentX}
                        cy={latentY}
                        r="28"
                        fill="#2563EB"
                    />

                    <text
                        x={latentX}
                        y={latentY + 5}
                        textAnchor="middle"
                        className="fill-white text-xs"
                    >
                        θ
                    </text>

                    <text
                        x={latentX}
                        y={latentY + 45}
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

                                {/* Connection Line */}

                                <line
                                    x1={latentX}
                                    y1={latentY + 28}
                                    x2={x}
                                    y2={observableY - 24}
                                    stroke="#94a3b8"
                                    strokeWidth="1.5"
                                />

                                {/* Observable Circle */}

                                <circle
                                    cx={x}
                                    cy={observableY}
                                    r="22"
                                    fill="#10B981"
                                />

                                {/* Observable Label */}

                                <text
                                    x={x}
                                    y={observableY + 4}
                                    textAnchor="middle"
                                    className="fill-white text-xs"
                                >
                                    O{index + 1}
                                </text>

                                {/* Observable Description */}

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
                    Each observable contributes evidence about the learner's
                    latent ability (θ). The statistical model estimates this
                    latent variable using observed response patterns.
                </div>

            </div>

        </div>

    );

}