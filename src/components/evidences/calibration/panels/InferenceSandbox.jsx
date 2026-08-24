// InferenceSandbox.jsx
// 🧠 Enterprise ECD — Inference Sandbox
// ---------------------------------------------------------------
// The three inference panels used to sit in Step 6 of the Evidence
// Wizard, where they had nothing real to work with: a draft evidence
// model is forbidden from carrying parameter sets, so IRT rendered
// every observable at a = 1, b = 0 and the posterior panel showed the
// prior back to the operator. Here they run against the ACTIVE
// parameter set, which is what actually scores live sessions.
//
// This is a what-if surface, not a scoring surface. Responses entered
// here are never persisted; the point is to let a reviewer walk a
// response pattern through the calibrated model and see the claim it
// would produce before the model goes operational.
// ---------------------------------------------------------------

import React, { useMemo, useState } from "react";
import { AlertTriangle, FlaskConical, Info } from "lucide-react";

import IRTInferencePanel from "./IRTInferencePanel";
import PosteriorPanel from "./PosteriorPanel";
import PosteriorPanelMulti from "./PosteriorPanelMulti";

import { buildEffectiveStatisticalModel } from "../engines/effectiveModel";

export default function InferenceSandbox({
    statisticalModel,
    observables = [],
    competency = null,
}) {

    const [binaryView, setBinaryView] = useState(false);

    const effective = useMemo(
        () => buildEffectiveStatisticalModel(statisticalModel),
        [statisticalModel]
    );

    const states = useMemo(() => {

        return (competency?.states || [])
            .slice()
            .sort((a, b) => (a.order || 0) - (b.order || 0));

    }, [competency]);

    /* =====================================================
       BINARY CPT ADAPTER
       PosteriorPanel predates multi-state competencies and speaks
       { obsId: { pHigh, pLow } }. When a two-state competency is in
       play we can express the calibrated CPT in exactly that shape,
       which gives the simpler high/low read-out for free.
    ===================================================== */

    const binaryCpt = useMemo(() => {

        if (states.length !== 2) return null;

        const cpt = effective?.structureConfig?.cpt || {};

        const [low, high] = states.map(s => s.value);

        const out = {};

        Object.entries(cpt).forEach(([obsId, entry]) => {

            const levels = entry?.levels;

            if (!levels) return;

            if (typeof levels[high] !== "number" || typeof levels[low] !== "number") return;

            out[obsId] = { pHigh: levels[high], pLow: levels[low] };
        });

        return Object.keys(out).length ? out : null;

    }, [effective, states]);

    /* =====================================================
       GUARDS
    ===================================================== */

    if (!statisticalModel) {
        return (
            <div className="text-sm text-slate-500">
                Select a statistical model to run inference.
            </div>
        );
    }

    const uncalibrated = !effective?.__calibrated;

    /* =====================================================
       UI
    ===================================================== */

    return (

        <div className="space-y-5">

            <div className="flex flex-wrap items-start justify-between gap-3">

                <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <FlaskConical size={16} strokeWidth={2} className="text-slate-400" />
                        Inference Sandbox
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                        Walk a response pattern through the active parameter set.
                        Nothing entered here is stored or scored.
                    </div>
                </div>

                {states.length === 2 && statisticalModel.type === "bayesian_network" && binaryCpt && (
                    <label className="flex items-center gap-2 text-xs text-slate-600">
                        <input
                            type="checkbox"
                            checked={binaryView}
                            onChange={(e) => setBinaryView(e.target.checked)}
                        />
                        Simple high/low view
                    </label>
                )}

            </div>

            {uncalibrated && (

                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-800">

                    <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />

                    <span>
                        No active parameter set. Inference below runs on authoring
                        defaults (a = 1, b = 0, or the hand-entered CPT and prior from
                        the wizard) — informative about the model's shape, not about
                        any real learner. Import a calibration first.
                    </span>

                </div>

            )}

            {effective.__activeParameterSet && (

                <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3.5 text-xs text-slate-600">

                    <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-slate-400" />

                    <span>
                        Running on <span className="font-mono">{effective.__activeParameterSet.parameterSetId}</span>
                        {" "}— {effective.__activeParameterSet.calibrationMethod || "method unspecified"},
                        n = {effective.__activeParameterSet.sampleSize ?? 0}.
                    </span>

                </div>

            )}

            {/* ---------- IRT / RASCH ---------- */}

            {["irt", "rasch"].includes(statisticalModel.type) && (
                <IRTInferencePanel
                    observables={observables}
                    model={effective}
                    selectedCompetency={competency}
                />
            )}

            {/* ---------- BAYESIAN NETWORK ---------- */}

            {statisticalModel.type === "bayesian_network" && (

                binaryView && binaryCpt ? (
                    <PosteriorPanel
                        observables={scopedObservables(effective, observables)}
                        model={{
                            ...effective,
                            structureConfig: {
                                ...effective.structureConfig,
                                cpt: binaryCpt,
                            },
                        }}
                    />
                ) : (
                    <PosteriorPanelMulti
                        observables={scopedObservables(effective, observables)}
                        model={effective}
                        selectedCompetency={competency}
                    />
                )

            )}

            {/* ---------- EVERYTHING ELSE ---------- */}

            {!["irt", "rasch", "bayesian_network"].includes(statisticalModel.type) && (

                <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-600">

                    <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-slate-400" />

                    <span>
                        Interactive inference is available for IRT, Rasch and Bayesian
                        network models. A <span className="font-mono">{statisticalModel.type || "—"}</span> model
                        scores deterministically from its evidence rules — no latent
                        estimate to explore.
                    </span>

                </div>

            )}

        </div>

    );

}

/* =====================================================
   HELPERS
===================================================== */

function scopedObservables(effective, observables) {

    const ids = effective?.structureConfig?.observableIds || [];

    if (!ids.length) return observables;

    return observables.filter(o => ids.includes(o.id));
}
