// CTTConfigPanel.jsx
// 🧠 Enterprise ECD — Classical Test Theory Configuration Panel
// -------------------------------------------------------------
// Defines the observed-score model: which observables are scored, how
// heavily each counts, what scale the total is reported on, and what
// reliability the resulting score is expected to reach.
//
// Scope boundary, same as every other Step 6 panel: this defines
// STRUCTURE only. Reliability (Cronbach's alpha), item difficulty
// (p-values), item discrimination (point-biserial) and the standard
// error of measurement are ESTIMATES, produced against a real response
// matrix in the Calibration & Operationalization workspace. What is
// authored here is the target the calibration will be judged against.

import React, { useMemo } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { useEvidenceWizardContext } from "../../EvidenceWizardContext";
import EvidenceChainCard from "../../components/EvidenceChainCard";

const SCORE_SCALES = [
    {
        value: "raw",
        label: "Raw total",
        help: "The weighted total itself. A cut score is set on this scale."
    },
    {
        value: "percent",
        label: "Percent of maximum",
        help: "Total ÷ maximum attainable, so the cut score does not move when observables are added."
    },
    {
        value: "standardized",
        label: "Standardized (z / scaled)",
        help: "Total referenced to a norm group's mean and SD. Norm-referenced, not criterion-referenced."
    }
];

export default function CTTConfigPanel({

    model,
    observables = [],
    warrants = [],
    evidenceRules = [],
    onChange,
    locked

}) {

    const { selectedCompetency } = useEvidenceWizardContext();

    const competencyName =
        selectedCompetency?.name || "Competency";


    /* =====================================================
       Structure Configuration
    ===================================================== */

    const config = model.structureConfig || {};

    const scoreScale = config.scoreScale || "raw";

    const reliabilityTarget =
        typeof config.reliabilityTarget === "number"
            ? config.reliabilityTarget
            : 0.7;

    const updateStructure = (updates) => {

        onChange({

            ...config,

            observableIds: config.observableIds || [],

            weights: config.weights || {},

            scoreScale,

            reliabilityTarget,

            ...updates

        });

    };


    /* =====================================================
       Observable Selection
    ===================================================== */

    const toggleObservable = (obsId, checked) => {

        const ids = new Set(config.observableIds || []);
        const weights = { ...(config.weights || {}) };

        if (checked) {
            ids.add(obsId);
            if (!weights[obsId]) weights[obsId] = 1;
        } else {
            ids.delete(obsId);
            delete weights[obsId];
        }

        updateStructure({
            observableIds: Array.from(ids),
            weights
        });

    };

    const toggleSelectAll = (checked) => {

        if (!checked) {
            updateStructure({ observableIds: [], weights: {} });
            return;
        }

        const ids = observables.map(o => o.id);
        const weights = {};
        ids.forEach(id => { weights[id] = config.weights?.[id] || 1; });

        updateStructure({ observableIds: ids, weights });

    };

    const updateWeight = (obsId, value) => {

        const weights = { ...(config.weights || {}) };

        weights[obsId] = Math.max(0, Number(value) || 0);

        updateStructure({ weights });

    };


    /* =====================================================
       Derived
    ===================================================== */

    const selectedIds = config.observableIds || [];

    const allSelected = useMemo(() => {
        return observables.length > 0 &&
            selectedIds.length === observables.length;
    }, [selectedIds, observables]);

    const totalWeight = useMemo(() => {
        return selectedIds.reduce(
            (sum, id) => sum + Number(config.weights?.[id] ?? 1),
            0
        );
    }, [selectedIds, config.weights]);

    /* Weakening evidence in a total score is a real modelling error, not a
       style question: adding a "weakens" observable to a sum increases the
       score for the behaviour it is supposed to count against. Surface it
       here, where the author can reverse-code it or drop it, rather than at
       confirmation. */
    const weakeningSelected = useMemo(() => {

        return selectedIds.filter(id => {

            const obs = observables.find(o => o.id === id);

            const rule =
                obs?.evidenceRule ||
                evidenceRules.find(r => r.observableId === id);

            return rule?.direction === "weakens";

        });

    }, [selectedIds, observables, evidenceRules]);

    /* Cronbach's alpha is undefined below two components, and unstable just
       above it. */
    const tooFewForReliability = selectedIds.length > 0 && selectedIds.length < 3;


    /* =====================================================
       UI
    ===================================================== */

    return (

        <div className="space-y-6">

            {/* Header */}

            <div>

                <h3 className="text-sm font-semibold text-slate-800">
                    Observed Score Model
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                    Competency standing is the weighted total of the scored
                    observables, read against a cut score or a norm. Item
                    statistics and reliability are estimated later, at
                    calibration.
                </p>

            </div>


            {/* Competency Context */}

            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3.5 text-sm text-blue-800">

                <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0" />

                <div className="space-y-1.5">
                    <div className="font-medium text-sm">Target Competency</div>
                    <div className="text-sm font-medium">{competencyName}</div>
                    <div className="text-xs text-blue-700/80">
                        A total score assumes more evidence means further along
                        this construct.
                    </div>
                </div>

            </div>


            {/* Observable Selection */}

            <div>

                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Scored Observables <span className="text-red-500">*</span>
                </label>

                <div className="mb-3 flex items-center gap-2">

                    <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                        disabled={locked}
                        className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                    />

                    <span className="text-sm font-medium text-slate-700">
                        Score All Observables
                    </span>

                </div>

                <div className="max-h-64 space-y-3 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">

                    {observables.length === 0 && (
                        <div className="text-sm text-slate-500">
                            No observables defined yet — add them in Step 4.
                        </div>
                    )}

                    {observables.map(obs => {

                        const included = selectedIds.includes(obs.id);

                        return (

                            <div key={obs.id} className="flex flex-col space-y-1">

                                <EvidenceChainCard
                                    observable={obs}
                                    warrants={warrants}
                                    evidenceRules={evidenceRules}
                                    checked={included}
                                    onToggle={toggleObservable}
                                    locked={locked}
                                />

                                {included && (

                                    <div className="ml-7 flex items-center gap-2">

                                        <label className="text-xs text-slate-500">
                                            Weight
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            className="w-24 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                            value={config.weights?.[obs.id] ?? 1}
                                            onChange={(e) =>
                                                updateWeight(obs.id, e.target.value)
                                            }
                                            disabled={locked}
                                        />

                                    </div>

                                )}

                            </div>

                        );

                    })}

                </div>

            </div>


            {/* Score Scale */}

            <div>

                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Score Scale
                </label>

                <select
                    className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    value={scoreScale}
                    onChange={(e) => updateStructure({ scoreScale: e.target.value })}
                    disabled={locked}
                >
                    {SCORE_SCALES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                </select>

                <p className="mt-1.5 text-xs text-slate-400">
                    {SCORE_SCALES.find(s => s.value === scoreScale)?.help}
                </p>

            </div>


            {/* Norm parameters — standardized scale only */}

            {scoreScale === "standardized" && (

                <div className="grid grid-cols-2 gap-4">

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Norm Mean
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                            value={config.normMean ?? 0}
                            onChange={(e) =>
                                updateStructure({ normMean: Number(e.target.value) || 0 })
                            }
                            disabled={locked}
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Norm SD
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                            value={config.normSD ?? 1}
                            onChange={(e) =>
                                updateStructure({ normSD: Number(e.target.value) || 0 })
                            }
                            disabled={locked}
                        />
                    </div>

                </div>

            )}


            {/* Reliability Target */}

            <div>

                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Reliability Target (Cronbach's α)
                </label>

                <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    className="w-32 rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    value={reliabilityTarget}
                    onChange={(e) =>
                        updateStructure({
                            reliabilityTarget: Math.min(1, Math.max(0, Number(e.target.value) || 0))
                        })
                    }
                    disabled={locked}
                />

                <p className="mt-1.5 text-xs text-slate-400">
                    The minimum internal consistency this score is expected to
                    reach at calibration. Conventionally ≥ 0.70 for group
                    decisions and ≥ 0.90 for decisions about an individual.
                </p>

            </div>


            {/* Score Structure Preview */}

            <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">

                <div className="text-sm font-medium text-slate-800">
                    Score Structure Preview
                </div>

                {selectedIds.length === 0 ? (

                    <div className="text-xs text-slate-500">
                        No observables scored yet.
                    </div>

                ) : (

                    <div className="space-y-1 font-mono text-xs text-slate-600">

                        {selectedIds.map(id => (
                            <div key={id}>
                                {config.weights?.[id] ?? 1} × {id}
                            </div>
                        ))}

                        <div className="mt-2 font-semibold text-slate-800">
                            Maximum attainable (unit-scored): {totalWeight}
                            {scoreScale === "percent" && " → reported as 0–100%"}
                            {scoreScale === "standardized" &&
                                ` → z against N(${config.normMean ?? 0}, ${config.normSD ?? 1})`}
                        </div>

                    </div>

                )}

            </div>


            {/* Structural warnings */}

            {weakeningSelected.length > 0 && (

                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">

                    <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />

                    <span>
                        {weakeningSelected.length} scored observable
                        {weakeningSelected.length === 1 ? " has" : "s have"} a
                        <strong> weakens </strong>
                        evidence rule. Adding it to a total raises the score for
                        behaviour that argues against the claim — reverse-code the
                        observable or remove it from the score.
                    </span>

                </div>

            )}

            {tooFewForReliability && (

                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-800">

                    <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />

                    <span>
                        Internal-consistency reliability is undefined below two
                        components and unstable at two. With {selectedIds.length}{" "}
                        scored observable{selectedIds.length === 1 ? "" : "s"}, the
                        reliability target above cannot be meaningfully evaluated
                        at calibration.
                    </span>

                </div>

            )}


            {/* Governance Notice */}

            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-800">

                <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />

                <div className="space-y-2">

                    <div>
                        Classical Test Theory scores are test-dependent: the same
                        total means different things on different observable sets,
                        and item statistics are sample-dependent. It does not
                        estimate a latent ability, so it cannot drive adaptive item
                        selection — use Rasch or IRT where that is required.
                    </div>

                    <div>
                        The Calibration workspace does not yet accept a CTT
                        statistics file (it reads IRT parameter and Bayesian CPT
                        formats). A CTT model can be authored and confirmed now;
                        activating it operationally still requires a parameter set,
                        so keep that in view before committing a live
                        administration to this model.
                    </div>

                </div>

            </div>

        </div>

    );

}
