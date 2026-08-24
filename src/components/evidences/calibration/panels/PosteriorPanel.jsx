// PosteriorPanel.jsx
// Enterprise ECD — Posterior Belief Panel
// ------------------------------------------

import React, { useMemo, useState } from "react";
import { Brain } from "lucide-react";
import { computePosterior } from "@/components/evidences/EvidenceWizard/components/engines/posteriorEngine";

export default function PosteriorPanel({

    observables = [],
    model

}) {

    const cpt = model?.structureConfig?.cpt || {};

    const [responses, setResponses] = useState({});

    /* =====================================================
       Handle Response Input
    ===================================================== */

    const updateResponse = (obsId, value) => {

        setResponses(prev => ({
            ...prev,
            [obsId]: value
        }));

    };

    /* =====================================================
       Compute Posterior
    ===================================================== */

    const posterior = useMemo(() => {

        return computePosterior({
            observations: responses,
            cpt
        });

    }, [responses, cpt]);


    /* =====================================================
       UI
    ===================================================== */

    return (

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm space-y-4">

            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Brain size={16} strokeWidth={2} className="text-slate-400" />
                Posterior Inference (Live)
            </div>

            {/* Inputs */}

            <div className="space-y-2">

                {observables.map(obs => (

                    <div key={obs.id} className="flex items-center gap-3">

                        <span className="w-48 text-sm text-slate-700">
                            {obs.id}
                        </span>

                        <select
                            className="w-full max-w-xs rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                            onChange={(e) =>
                                updateResponse(
                                    obs.id,
                                    Number(e.target.value)
                                )
                            }
                        >
                            <option value="">--</option>
                            <option value="1">Correct</option>
                            <option value="0">Incorrect</option>
                        </select>

                    </div>

                ))}

            </div>


            {/* Posterior Output */}

            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-1">

                <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">P(High θ):</span> {posterior.high.toFixed(3)}
                </div>

                <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">P(Low θ):</span> {posterior.low.toFixed(3)}
                </div>

            </div>

        </div>

    );

}
