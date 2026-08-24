// IRTConfigPanel.jsx
// 🧠 Enterprise ECD — IRT / Rasch Measurement Configuration
// ---------------------------------------------------------
// Configures measurement structure for Rasch / IRT models.
// Subtype selection is handled upstream by StatisticalModelSelector.
// This panel focuses on:
//
// • scoring configuration
// • latent structure
// • observable evidence mapping

import React, { useEffect, useMemo } from "react";
import { AlertTriangle } from "lucide-react";

import {
    getSubtypeMetadata
} from "../utils/modelSubtypeEngine";

import EvidenceChainCard from "../EvidenceChainCard";

export default function IRTConfigPanel({

    model,
    observables = [],
    warrants = [],
    evidenceRules = [],
    onChange,
    locked

}) {

    const isRasch = model.type === "rasch";


    /* =====================================================
       Structure Configuration
    ===================================================== */

    const config = model.structureConfig || {

        observableIds: [],
        scoringMode: "binary",
        dimensions: 1

    };


    const updateStructure = (updates) => {

        onChange({

            ...config,

            ...updates

        });

    };


    /* =====================================================
       Subtype Metadata
    ===================================================== */

    const subtypeMeta = useMemo(() => {

        if (!model.subtype) return null;

        return getSubtypeMetadata(model.subtype);

    }, [model.subtype]);


    /* =====================================================
       Rasch Constraints
    ===================================================== */

    useEffect(() => {

        if (!isRasch) return;

        let forced = { ...config };

        if (model.subtype === "1pl") {

            forced.scoringMode = "binary";
            forced.dimensions = 1;

        }

        if (
            model.subtype === "pcm" ||
            model.subtype === "rsm"
        ) {

            forced.scoringMode = "polytomous";
            forced.dimensions = 1;

        }

        updateStructure(forced);

    }, [model.subtype]);


    /* =====================================================
       Helpers
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

            {/* =====================================================
                Header
            ===================================================== */}

            <div>

                <h3 className="text-sm font-semibold text-slate-800">

                    {isRasch
                        ? "Rasch Measurement Configuration"
                        : "IRT Measurement Configuration"}

                </h3>

                <p className="mt-1 text-sm text-slate-500">

                    Configure how observable responses contribute
                    to estimating learner ability (θ).

                </p>

            </div>


            {/* =====================================================
                Subtype Information
            ===================================================== */}

            {model.subtype && subtypeMeta && (

                <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-5">

                    <div className="text-sm font-semibold text-slate-900">

                        Model Variant: {subtypeMeta.label}

                    </div>

                    <div className="text-xs text-slate-500 mt-1">

                        {subtypeMeta.description}

                    </div>

                    <div className="text-xs text-slate-500 mt-2">

                        Parameters estimated during calibration:

                        <span className="ml-1 font-mono text-slate-700">

                            {subtypeMeta.parameters.join(", ")}

                        </span>

                    </div>

                </div>

            )}


            {/* =====================================================
                Scoring Mode
            ===================================================== */}

            <div>

                <label className="mb-1.5 block text-sm font-medium text-slate-700">

                    Scoring Mode

                </label>

                <select

                    className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"

                    value={config.scoringMode}

                    disabled={isRasch || locked}

                    onChange={(e) =>
                        updateStructure({

                            scoringMode: e.target.value

                        })
                    }

                >

                    <option value="binary">
                        Binary (0/1 scoring)
                    </option>

                    <option value="polytomous">
                        Polytomous (multiple score levels)
                    </option>

                </select>

                <p className="mt-1.5 text-xs text-slate-400">

                    Binary scoring is used for correct/incorrect responses.
                    Polytomous scoring allows partial credit categories.

                </p>

            </div>


            {/* =====================================================
                Latent Dimensions
            ===================================================== */}

            <div>

                <label className="mb-1.5 block text-sm font-medium text-slate-700">

                    Latent Dimensions

                </label>

                <input

                    type="number"

                    min="1"

                    className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"

                    value={config.dimensions}

                    disabled={isRasch || locked}

                    onChange={(e) =>
                        updateStructure({

                            dimensions: Number(e.target.value)

                        })
                    }

                />

                <p className="mt-1.5 text-xs text-slate-400">

                    Current implementation supports single-latent models.
                    Future versions may allow multidimensional IRT.

                </p>

            </div>


            {/* =====================================================
                Governance Notice
            ===================================================== */}

            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-800">

                <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />

                <span>

                    Rasch and IRT models estimate learner ability using
                    probabilistic response functions. Item parameters
                    (difficulty, discrimination, guessing, thresholds)
                    are estimated later during calibration using
                    empirical response data.

                </span>

            </div>

        </div>

    );

}