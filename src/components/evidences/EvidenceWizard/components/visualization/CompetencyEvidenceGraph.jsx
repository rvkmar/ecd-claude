// CompetencyEvidenceGraph.jsx
// 🧠 Enterprise ECD — Competency Evidence Graph
// ----------------------------------------------
// Visualizes observable evidence contributing to a
// latent competency variable (θ).

import React from "react";

export default function CompetencyEvidenceGraph({
    observables = [],
    competencyName = "Competency",
    modelType = "IRT"
}) {

    const Node = ({ label, type }) => {

        const styles = {
            observable: "bg-blue-100 border-blue-300 text-blue-700",
            competency: "bg-emerald-100 border-emerald-300 text-emerald-700"
        };

        return (
            <div
                className={`rounded-lg border px-4 py-3 text-xs text-center font-medium ${styles[type]}`}
            >
                {label}
            </div>
        );
    };

    const Arrow = () => (
        <div className="text-slate-400 text-lg">↓</div>
    );

    const truncate = (text, max = 40) => {
        if (!text) return "";
        return text.length > max
            ? text.slice(0, max) + "..."
            : text;
    };

    return (

        <div className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">

            {/* Title */}

            <div className="flex justify-between items-center">

                <div className="text-sm font-semibold text-slate-800">
                    Competency Evidence Graph
                </div>

                <div className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    Model: {modelType?.toUpperCase()}
                </div>

            </div>

            {/* Observable Layer */}

            <div className="flex justify-center gap-6 flex-wrap">

                {observables.length === 0 && (

                    <Node
                        label="Observable"
                        type="observable"
                    />

                )}

                {observables.map(obs => (

                    <div
                        key={obs.id}
                        className="flex flex-col items-center space-y-1"
                    >

                        <Node
                            label={`O: ${obs.id}`}
                            type="observable"
                        />

                        <Arrow />

                    </div>

                ))}

            </div>

            {/* Competency Node */}

            <div className="flex justify-center">

                <Node
                    label={`θ — ${truncate(competencyName)}`}
                    type="competency"
                />

            </div>

            {/* Explanation */}

            <div className="text-xs text-slate-500 text-center">

                Observable responses provide evidence about the
                latent competency variable (θ) through the selected
                statistical measurement model.

            </div>

        </div>

    );

}