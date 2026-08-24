// ModelComparisonPanel.jsx
// 🧠 Enterprise ECD — Statistical Model Comparison Panel
// ------------------------------------------------------
// Provides side-by-side comparison of candidate
// statistical models before selecting the active model.

import React from "react";
import { getModelGuidance } from "../utils/modelGuidanceLibrary";
import { AlertTriangle } from "lucide-react";

export default function ModelComparisonPanel({
    models = [],
    onSetActive
}) {

    /* =====================================================
       Hide panel if only one model exists
    ===================================================== */

    if (!models || models.length <= 1) {
        return null;
    }

    /* =====================================================
       Helpers
    ===================================================== */

    /* Read from MODEL_GUIDANCE_LIBRARY rather than a switch of its own.
       These were duplicate hard-coded tables, so every model family added to
       the library (CTT most recently) showed up here as "Unknown" complexity
       and "Unknown" calibration requirement, and the Model column printed the
       raw type string. One source of truth, no drift. */

    const getLabel = (type) =>
        getModelGuidance(type)?.label || type || "—";

    const getComplexity = (type) => {

        const complexity = getModelGuidance(type)?.complexity;

        if (!complexity) return "Unknown";

        return complexity.charAt(0).toUpperCase() + complexity.slice(1);

    };

    const getCalibrationRequirement = (type) => {

        return getModelGuidance(type)?.calibrationSample || "Unknown";

    };

    const getObservablesCount = (model) => {

        const ids = model?.structureConfig?.observableIds;

        if (!ids) return "—";

        return ids.length;
    };

    /* =====================================================
       UI
    ===================================================== */

    return (

        <div className="space-y-4">

            {/* Header */}

            <div>

                <div className="text-sm font-semibold text-slate-800">
                    Model Comparison
                </div>

                <div className="mt-1 text-sm text-slate-500">

                    Multiple statistical models are defined.
                    Compare them below and select the model
                    that should be used for claim inference.

                </div>

            </div>

            {/* Table */}

            <div className="overflow-x-auto rounded-lg border border-slate-200">

                <table className="min-w-full divide-y divide-slate-200 text-sm">

                    <thead className="bg-slate-50">

                        <tr>

                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Model
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Subtype
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Observables
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Complexity
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Calibration Requirement
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Active
                            </th>

                        </tr>

                    </thead>

                    <tbody className="divide-y divide-slate-100">

                        {models.map((model) => (

                            <tr
                                key={model.id}
                                className="hover:bg-slate-50"
                            >

                                {/* Model Type */}

                                <td className="px-4 py-3 font-medium text-slate-900">

                                    {getLabel(model.type)}

                                </td>

                                {/* Subtype */}

                                <td className="px-4 py-3 text-slate-700">

                                    {model.subtype || "—"}

                                </td>

                                {/* Observables */}

                                <td className="px-4 py-3 text-slate-700">

                                    {getObservablesCount(model)}

                                </td>

                                {/* Complexity */}

                                <td className="px-4 py-3 text-slate-700">

                                    {getComplexity(model.type)}

                                </td>

                                {/* Calibration */}

                                <td className="px-4 py-3 text-slate-700">

                                    {getCalibrationRequirement(model.type)}

                                </td>

                                {/* Active Selector */}

                                <td className="px-4 py-3">

                                    <input
                                        type="radio"
                                        name="activeModel"
                                        checked={model.active || false}
                                        onChange={() =>
                                            onSetActive(model.id)
                                        }
                                        className="h-4 w-4 rounded-full border-slate-300 accent-slate-900"
                                    />

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

            {/* Governance Note */}

            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5 text-xs text-amber-800">

                <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />

                <span>
                    Exactly one statistical model must be active.
                    The active model determines how observable evidence
                    is transformed into claim inference.
                </span>

            </div>

        </div>

    );

}
