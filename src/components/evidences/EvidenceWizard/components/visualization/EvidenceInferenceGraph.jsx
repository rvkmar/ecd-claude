// EvidenceInferenceGraph.jsx
// 🧠 Enterprise ECD — Evidence Inference Graph
// ---------------------------------------------
// Visualizes the full ECD inference pipeline including
// observables, evidence rules, statistical model,
// posterior belief, and competency claim.

import React from "react";

export default function EvidenceInferenceGraph({

    observables = [],
    competencyName = "Competency"

}) {

    const Node = ({ label, type }) => {

        const colors = {

            observable: "bg-blue-100 border-blue-300 text-blue-700",
            evidence: "bg-slate-100 border-slate-300 text-slate-700",
            model: "bg-emerald-100 border-emerald-300 text-emerald-700",
            posterior: "bg-amber-100 border-amber-300 text-amber-700",
            claim: "bg-slate-200 border-slate-400 text-slate-900"

        };

        return (

            <div
                className={`rounded-lg border px-4 py-3 text-sm text-center min-w-[160px] font-medium ${colors[type]}`}
            >
                {label}
            </div>

        );

    };

    const Arrow = () => (
        <div className="flex items-center justify-center text-slate-400 text-xl">
            →
        </div>
    );

    const DownArrow = () => (
        <div className="flex justify-center text-slate-400 text-xl">
            ↓
        </div>
    );

    return (

        <div className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">

            {/* Title */}

            <div className="text-sm font-semibold text-slate-800">
                Evidence Inference Graph
            </div>

            {/* Observable Layer */}

            <div className="flex flex-wrap gap-3">

                {observables.length === 0 && (
                    <Node
                        label="Observable Behavior"
                        type="observable"
                    />
                )}

                {observables.map(obs => (

                    <Node
                        key={obs.id}
                        label={`Observable: ${obs.id}`}
                        type="observable"
                    />

                ))}

            </div>

            {/* Arrow Down */}

            <DownArrow />

            {/* Evidence Layer */}

            <div className="flex justify-center">

                <Node
                    label="Evidence Rules"
                    type="evidence"
                />

            </div>

            {/* Arrow Down */}

            <DownArrow />

            {/* Model Layer */}

            <div className="flex justify-center">

                <Node
                    label="Statistical Model"
                    type="model"
                />

            </div>

            {/* Arrow Down */}

            <DownArrow />

            {/* Posterior Layer */}

            <div className="flex justify-center">

                <Node
                    label="Posterior Belief"
                    type="posterior"
                />

            </div>

            {/* Arrow Down */}

            <DownArrow />

            {/* Claim */}

            <div className="flex justify-center">

                <Node
                    label={`Claim Inference: ${competencyName}`}
                    type="claim"
                />

            </div>

        </div>

    );

}