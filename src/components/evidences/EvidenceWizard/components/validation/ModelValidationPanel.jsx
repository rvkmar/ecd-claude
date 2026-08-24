// ModelValidationPanel.jsx
// 🧠 Enterprise ECD — Statistical Model Validation Panel
// ------------------------------------------------------
// Provides live structural validation for Step6
// statistical model configuration.

import React from "react";
import { getModelGuidance } from "../utils/modelGuidanceLibrary";
import { Check, AlertTriangle, X, Info } from "lucide-react";
import { useEvidenceWizardContext } from "../../EvidenceWizardContext";

export default function ModelValidationPanel({
    models = [],
    observables = []
}) {

    const { selectedCompetency } = useEvidenceWizardContext();

    const variableType = selectedCompetency?.variableType;

    /* =====================================================
       Validation Checks
    ===================================================== */

    const results = [];

    /* ---------- At least one model ---------- */

    if (!models.length) {

        results.push({
            type: "error",
            message: "No statistical model defined."
        });

    } else {

        results.push({
            type: "success",
            message: "At least one statistical model defined."
        });

    }

    /* ---------- Exactly one active model ---------- */

    const activeModels = models.filter(m => m.active);

    if (activeModels.length !== 1) {

        results.push({
            type: "error",
            message:
                "Exactly one statistical model must be active."
        });

    } else {

        results.push({
            type: "success",
            message:
                "Active statistical model selected."
        });

    }

    /* ---------- Observables exist ---------- */

    if (!observables.length) {

        results.push({
            type: "warning",
            message:
                "No observables defined. Statistical models require observable evidence."
        });

    } else {

        results.push({
            type: "success",
            message:
                `${observables.length} observables available.`
        });

    }

    /* ---------- Model compatibility ---------- */

    models.forEach(model => {

        if (!model.type) {

            results.push({
                type: "warning",
                message:
                    `Model ${model.id} has no type selected.`
            });

            return;
        }

        /* Compatibility is read from MODEL_GUIDANCE_LIBRARY, which is the
           same table Step 6's model cards are built from and the same set
           schema.js enforces at confirmation. This panel used to restate the
           rules in its own hard-coded conditions, so adding a model family to
           the library (CTT most recently) produced the contradiction of a
           model the selector offers and this panel calls an error. */

        const meta = getModelGuidance(model.type);

        if (variableType && meta &&
            !meta.allowedVariableTypes.includes(variableType)) {

            results.push({
                type: "error",
                message:
                    `${meta.label} is not compatible with a ${variableType} competency. Supported: ${meta.allowedVariableTypes.join(", ")}.`
            });

        }

    });

    /* ---------- Structure configuration ---------- */

    models.forEach(model => {

        if (!model.structureConfig ||
            Object.keys(model.structureConfig).length === 0) {

            results.push({
                type: "warning",
                message:
                    `Model ${model.id} has no structure configuration.`
            });

        }

    });

    /* =====================================================
       Helper: Styling
    ===================================================== */

    const getStyle = (type) => {

        switch (type) {

            case "success":
                return "text-emerald-700";

            case "warning":
                return "text-amber-700";

            case "error":
                return "text-red-600";

            default:
                return "text-slate-700";

        }

    };

    const getIcon = (type) => {

        switch (type) {

            case "success":
                return <Check size={14} strokeWidth={2.25} />;

            case "warning":
                return <AlertTriangle size={14} strokeWidth={2.25} />;

            case "error":
                return <X size={14} strokeWidth={2.25} />;

            default:
                return <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400" />;

        }

    };

    /* =====================================================
       UI
    ===================================================== */

    return (

        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">

            {/* Header */}

            <div>

                <div className="text-sm font-semibold text-slate-800">
                    Model Validation
                </div>

                <div className="mt-1 text-sm text-slate-500">

                    Structural validation checks for the statistical model configuration.

                </div>

            </div>

            {/* Validation Results */}

            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/60 p-4 text-sm">

                {results.map((result, index) => (

                    <div
                        key={index}
                        className={`flex items-start gap-2 ${getStyle(result.type)}`}
                    >

                        <div className="mt-0.5 shrink-0">

                            {getIcon(result.type)}

                        </div>

                        <div>

                            {result.message}

                        </div>

                    </div>

                ))}

            </div>

            {/* Governance Notice */}

            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3.5 text-xs text-blue-800">

                <Info size={14} strokeWidth={2.25} className="mt-0.5 shrink-0" />

                <span>
                    Validation results reflect structural requirements
                    defined in the Evidence Model schema. All errors
                    must be resolved before the evidence model can
                    be confirmed.
                </span>

            </div>

        </div>

    );

}