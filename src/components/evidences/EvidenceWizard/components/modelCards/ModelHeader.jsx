// ModelHeader.jsx
// 🧠 Enterprise ECD — Statistical Model Card Header
// -------------------------------------------------
// Displays model identity and controls for each
// statistical model card.

import React from "react";
import { Trash2 } from "lucide-react";
import ModelTypeBadge from "./ModelTypeBadge";

export default function ModelHeader({
    model,
    observables = [],
    onRemove,
    onSetActive
}) {

    if (!model) return null;

    const observableIds =
        model?.structureConfig?.observableIds || [];

    const observableCount = observableIds.length || observables.length || 0;

    const subtypeLabel = model.subtype
        ? model.subtype.toUpperCase()
        : null;

    const isActive = model.active;

    /* =====================================================
       Model Label
    ===================================================== */

    const getModelLabel = () => {

        switch (model.type) {

            case "rasch":
                return "Rasch Model";

            case "irt":
                return "Item Response Theory";

            case "bayesian_network":
                return "Bayesian Network";

            case "sum":
                return "Sum Score Model";

            case "threshold":
                return "Threshold Rule";

            default:
                return "Statistical Model";
        }

    };

    /* =====================================================
       UI
    ===================================================== */

    return (

        <div className="flex items-start justify-between">

            {/* Left Section */}

            <div className="space-y-1">

                {/* Model Title */}

                <div className="flex items-center space-x-2">

                    <ModelTypeBadge type={model.type} />

                    <span className="text-sm font-semibold text-slate-900">

                        {getModelLabel()}

                    </span>

                </div>

                {/* Metadata Row */}

                <div className="flex items-center space-x-4 text-xs text-slate-500">

                    {subtypeLabel && (

                        <span>

                            Subtype:
                            <span className="ml-1 font-medium text-slate-700">

                                {subtypeLabel}

                            </span>

                        </span>

                    )}

                    <span>

                        Observables:
                        <span className="ml-1 font-medium text-slate-700">

                            {observableCount}

                        </span>

                    </span>

                </div>

            </div>

            {/* Right Section */}

            <div className="flex items-center space-x-3">

                {/* Active Indicator */}

                <label className="flex items-center space-x-1.5 text-xs text-slate-600">

                    <input
                        type="radio"
                        name="activeModel"
                        checked={isActive || false}
                        onChange={() => onSetActive(model.id)}
                        className="h-4 w-4 rounded-full border-slate-300 accent-slate-900"
                    />

                    <span>

                        Active

                    </span>

                </label>

                {/* Remove Button */}

                <button
                    onClick={() => onRemove(model.id)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                >
                    <Trash2 size={14} strokeWidth={2} />
                    Remove
                </button>

            </div>

        </div>

    );

}
