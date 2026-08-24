// IRTRelationshipDiagram.jsx
// 🧠 Enterprise ECD — IRT Measurement Relationship Diagram
// --------------------------------------------------------
// Illustrates the conceptual Item Characteristic Curve (ICC)
// showing probability of correct response as a function of
// learner ability (θ).

import React from "react";
import { Info } from "lucide-react";

export default function IRTRelationshipDiagram() {

    /* =====================================================
       SVG Dimensions
    ===================================================== */

    const width = 520;
    const height = 260;

    const padding = 40;

    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    /* =====================================================
       Logistic Curve Generator
    ===================================================== */

    const generateCurve = () => {

        const points = [];

        const discrimination = 1;
        const difficulty = 0;

        for (let x = -3; x <= 3; x += 0.1) {

            const prob =
                1 / (1 + Math.exp(-discrimination * (x - difficulty)));

            const px =
                padding + ((x + 3) / 6) * chartWidth;

            const py =
                padding + chartHeight - prob * chartHeight;

            points.push(`${px},${py}`);
        }

        return points.join(" ");
    };

    const curvePoints = generateCurve();

    /* =====================================================
       UI
    ===================================================== */

    return (

        <div className="space-y-4">

            {/* Header */}

            <div>

                <div className="text-lg font-semibold text-slate-900">
                    IRT Measurement Relationship
                </div>

                <div className="text-sm text-slate-500">

                    Item Response Theory models the probability of
                    a correct response as a function of learner
                    ability (θ).

                </div>

            </div>

            {/* Diagram */}

            <div className="rounded-lg border border-slate-200 shadow-sm bg-white p-4 flex justify-center">

                <svg
                    width={width}
                    height={height}
                >

                    {/* Axes */}

                    <line
                        x1={padding}
                        y1={height - padding}
                        x2={width - padding}
                        y2={height - padding}
                        stroke="#475569"
                    />

                    <line
                        x1={padding}
                        y1={padding}
                        x2={padding}
                        y2={height - padding}
                        stroke="#475569"
                    />

                    {/* Axis Labels */}

                    <text
                        x={width / 2}
                        y={height - 5}
                        textAnchor="middle"
                        className="text-xs fill-slate-600"
                    >
                        Learner Ability (θ)
                    </text>

                    <text
                        x="15"
                        y={height / 2}
                        transform={`rotate(-90 15 ${height / 2})`}
                        textAnchor="middle"
                        className="text-xs fill-slate-600"
                    >
                        Probability of Correct Response
                    </text>

                    {/* ICC Curve */}

                    <polyline
                        points={curvePoints}
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="2"
                    />

                    {/* Difficulty Marker */}

                    <line
                        x1={width / 2}
                        y1={padding}
                        x2={width / 2}
                        y2={height - padding}
                        stroke="#94a3b8"
                        strokeDasharray="4"
                    />

                    <text
                        x={width / 2}
                        y={padding - 5}
                        textAnchor="middle"
                        className="text-xs fill-slate-500"
                    >
                        Item Difficulty
                    </text>

                    {/* Probability Midpoint */}

                    <line
                        x1={padding}
                        y1={height / 2}
                        x2={width - padding}
                        y2={height / 2}
                        stroke="#cbd5e1"
                        strokeDasharray="4"
                    />

                    <text
                        x={padding - 10}
                        y={height / 2 + 4}
                        textAnchor="end"
                        className="text-xs fill-slate-500"
                    >
                        0.5
                    </text>

                </svg>

            </div>

            {/* Explanation */}

            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3.5 text-sm text-blue-800">

                <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0" />

                <div>
                    In Item Response Theory, each observable response
                    contributes evidence about the learner’s latent
                    ability (θ). The curve represents how the probability
                    of a correct response increases as ability increases.
                    Item difficulty determines the ability level where the
                    probability of success reaches 0.5.
                </div>

            </div>

        </div>

    );

}