// SumConfigPanel.jsx
// 🧠 Enterprise ECD — Deterministic Score Aggregation Panel
// ---------------------------------------------------------
// Defines deterministic aggregation of observable evidence
// using weighted scoring rules.
//
// Used when statistical calibration models are not applied.
// Supports:
//
// • weighted sum scoring
// • score normalization
// • evidence contribution diagnostics
//
// Future extensions:
//
// • rubric scoring
// • domain weighted mastery
// • threshold classification rules

import React, { useMemo } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { useEvidenceWizardContext } from "../../EvidenceWizardContext";
import EvidenceChainCard from "../../components/EvidenceChainCard";

export default function SumConfigPanel({

    model,
    observables = [],
    warrants = [],
    evidenceRules = [],
    onChange,
    locked

}) {

    const { selectedCompetency } =
        useEvidenceWizardContext();


    /* =====================================================
       Competency Context
    ===================================================== */

    const competencyName =
        selectedCompetency?.name || "Competency";


    /* =====================================================
       Structure Configuration
    ===================================================== */

    const config = model.structureConfig || {

        observableIds: [],

        weights: {},

        normalization: false

    };


    const updateStructure = (updates) => {

        onChange({

            ...config,

            ...updates

        });

    };


    /* =====================================================
       Observable Toggle
    ===================================================== */

    const toggleObservable = (obsId, checked) => {

        const ids = new Set(config.observableIds || []);
        const weights = { ...(config.weights || {}) };

        if (checked) {

            ids.add(obsId);

            if (!weights[obsId]) {

                weights[obsId] = 1;

            }

        }

        else {

            ids.delete(obsId);
            delete weights[obsId];

        }

        updateStructure({

            observableIds: Array.from(ids),

            weights

        });

    };


    /* =====================================================
       Weight Update
    ===================================================== */

    const updateWeight = (obsId, value) => {

        const weights = { ...(config.weights || {}) };

        weights[obsId] =
            Math.max(0, Number(value) || 0);

        updateStructure({

            weights

        });

    };


    /* =====================================================
       Select All Observables
    ===================================================== */

    const toggleSelectAll = (checked) => {

        if (checked) {

            const ids =
                observables.map(o => o.id);

            const weights = {};

            ids.forEach(id => {

                weights[id] = 1;

            });

            updateStructure({

                observableIds: ids,
                weights

            });

        }

        else {

            updateStructure({

                observableIds: [],
                weights: {}

            });

        }

    };


    /* =====================================================
       Derived Metrics
    ===================================================== */

    const allSelected = useMemo(() => {

        return config.observableIds?.length ===
            observables.length;

    }, [config.observableIds, observables]);


    const totalWeight = useMemo(() => {

        return Object
            .values(config.weights || {})
            .reduce((sum, w) => sum + Number(w), 0);

    }, [config.weights]);


    const normalizedWeights = useMemo(() => {

        if (!config.normalization || totalWeight === 0)
            return config.weights;

        const normalized = {};

        Object.entries(config.weights || {})
            .forEach(([k, v]) => {

                normalized[k] =
                    (Number(v) / totalWeight).toFixed(3);

            });

        return normalized;

    }, [config.weights, totalWeight, config.normalization]);


    /* =====================================================
       Helper
    ===================================================== */

    const truncate = (text, max = 90) => {

        if (!text) return "";

        return text.length > max
            ? text.slice(0, max) + "..."
            : text;

    };


    /* =====================================================
       UI
    ===================================================== */

    return (

        <div className="space-y-6">


            {/* Header */}

            <div>

                <h3 className="text-sm font-semibold text-slate-800">

                    Deterministic Evidence Aggregation

                </h3>

                <p className="mt-1 text-sm text-slate-500">

                    Observable evidence variables contribute
                    weighted scores used to approximate
                    competency mastery.

                </p>

            </div>


            {/* Competency Context */}

            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3.5 text-sm text-blue-800">

                <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0" />

                <div className="space-y-1.5">

                    <div className="font-medium text-sm">
                        Target Competency
                    </div>

                    <div className="text-xs text-blue-700/80">
                        Aggregated observable evidence contributes
                        to classification of this competency.
                    </div>

                    <div className="text-sm font-medium">
                        {competencyName}
                    </div>

                </div>

            </div>


            {/* Observable Selection */}

            <div>

                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Observable Evidence Variables <span className="text-red-500">*</span>
                </label>

                <div className="flex items-center gap-2 mb-3">

                    <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) =>
                            toggleSelectAll(e.target.checked)
                        }
                        disabled={locked}
                        className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                    />

                    <span className="text-sm font-medium text-slate-700">
                        Include All Observables
                    </span>

                </div>


                <div className="space-y-3 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">

                    {observables.map(obs => {

                        const included =
                            config.observableIds?.includes(obs.id);

                        return (

                            <div
                                key={obs.id}
                                className="flex flex-col space-y-1"
                            >

                                <EvidenceChainCard
                                    key={obs.id}
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
                                            value={
                                                config.weights?.[obs.id] || 1
                                            }
                                            onChange={(e) =>
                                                updateWeight(
                                                    obs.id,
                                                    e.target.value
                                                )
                                            }
                                            disabled={locked}
                                        />

                                    </div>

                                )}

                            </div>

                        );

                    })}

                </div>

                <p className="mt-1.5 text-xs text-slate-400">

                    Each observable contributes evidence to the
                    total score using its assigned weight.

                </p>

            </div>


            {/* Normalization Option */}

            <div className="flex items-center gap-2">

                <input
                    type="checkbox"
                    checked={config.normalization || false}
                    onChange={(e) =>
                        updateStructure({
                            normalization: e.target.checked
                        })
                    }
                    disabled={locked}
                    className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                />

                <label className="text-sm font-medium text-slate-700">

                    Normalize weights to probability distribution

                </label>

            </div>


            {/* Score Structure Preview */}

            <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-5 space-y-2">

                <div className="font-medium text-sm text-slate-800">
                    Score Structure Preview
                </div>

                <div className="text-xs font-mono text-slate-600 space-y-1">

                    {config.observableIds?.map(id => (

                        <div key={id}>

                            {normalizedWeights?.[id] || 1}
                            {" × "}
                            {id}

                        </div>

                    ))}

                    {config.observableIds?.length > 0 && (

                        <div className="mt-2 font-semibold text-slate-800">

                            Total Weight: {totalWeight}

                        </div>

                    )}

                </div>

            </div>


            {/* Governance Notice */}

            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-800">

                <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />

                <span>

                    Deterministic aggregation models approximate
                    competency mastery using simple scoring rules.
                    Unlike Rasch or IRT models, they do not estimate
                    latent ability probabilistically and should be
                    used when statistical calibration is not required.

                </span>

            </div>

        </div>

    );

}