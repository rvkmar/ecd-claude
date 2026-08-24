// ModelSelectionPanel.jsx
// 🧠 Enterprise ECD — Statistical Model Selection Panel
// -----------------------------------------------------
// Provides guided model selection with explanations,
// complexity indicators, and competency compatibility.

import React from "react";
import { useEvidenceWizardContext } from "../../EvidenceWizardContext";

export default function ModelSelectionPanel({
    selectedType,
    onSelectModel
}) {

    const { selectedCompetency } = useEvidenceWizardContext();

    const variableType = selectedCompetency?.variableType;

    /* =====================================================
       MODEL DEFINITIONS
    ===================================================== */

    const MODEL_LIBRARY = [

        {
            type: "rasch",
            label: "Rasch Model",
            category: "IRT Family",
            description:
                "Estimates a single latent ability (θ) assuming equal discrimination across observables.",
            useCases: [
                "Curriculum aligned assessments",
                "Large scale educational testing",
                "Stable ability measurement"
            ],
            complexity: "Low",
            sampleSize: "200+ responses recommended",
            allowed: ["binary", "ordinal", "continuous"]
        },

        {
            type: "irt",
            label: "Item Response Theory",
            category: "IRT Family",
            description:
                "Models probability of observable outcomes as a function of latent ability and item parameters.",
            useCases: [
                "Adaptive assessments",
                "Precision ability estimation",
                "Item discrimination modeling"
            ],
            complexity: "Medium",
            sampleSize: "500+ responses recommended",
            allowed: ["binary", "ordinal", "continuous"]
        },

        {
            type: "bayesian_network",
            label: "Bayesian Network",
            category: "Diagnostic Model",
            description:
                "Represents probabilistic relationships between competencies and observable behaviors.",
            useCases: [
                "Diagnostic assessment",
                "Skill mastery networks",
                "Learning progression modeling"
            ],
            complexity: "High",
            sampleSize: "Varies with network size",
            allowed: ["binary", "categorical"]
        },

        {
            type: "sum",
            label: "Sum Score Model",
            category: "Deterministic",
            description:
                "Aggregates observable evidence through weighted scoring rules.",
            useCases: [
                "Operational approximations",
                "Simple scoring systems",
                "Low data environments"
            ],
            complexity: "Low",
            sampleSize: "No calibration required",
            allowed: ["binary"]
        },

        {
            type: "threshold",
            label: "Threshold Rule",
            category: "Deterministic",
            description:
                "Classifies mastery based on minimum observable evidence threshold.",
            useCases: [
                "Competency mastery checks",
                "Ordinal classification systems"
            ],
            complexity: "Low",
            sampleSize: "No calibration required",
            allowed: ["ordinal"]
        }

    ];

    /* =====================================================
       FILTER MODELS BY COMPETENCY TYPE
    ===================================================== */

    const compatibleModels = MODEL_LIBRARY.filter(
        m => m.allowed.includes(variableType)
    );

    /* =====================================================
       MODEL CARD
    ===================================================== */

    const ModelCard = ({ model }) => {

        const isSelected = selectedType === model.type;

        return (

            <div
                onClick={() => onSelectModel(model.type)}
                className={`cursor-pointer rounded-lg border p-4 transition
                ${isSelected
                        ? "border-slate-900 bg-slate-50 ring-2 ring-slate-900/10"
                        : "border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                    }`}
            >

                {/* Header */}

                <div className="flex items-center justify-between">

                    <div className="text-sm font-semibold text-slate-900">
                        {model.label}
                    </div>

                    <div className="text-xs text-slate-500">
                        {model.category}
                    </div>

                </div>

                {/* Description */}

                <div className="mt-2 text-sm text-slate-700">
                    {model.description}
                </div>

                {/* Use Cases */}

                <div className="mt-3">

                    <div className="mb-1 text-xs font-medium text-slate-600">
                        Typical Use Cases
                    </div>

                    <ul className="ml-4 list-disc space-y-1 text-xs text-slate-700">

                        {model.useCases.map((u, i) => (
                            <li key={i}>{u}</li>
                        ))}

                    </ul>

                </div>

                {/* Metadata */}

                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">

                    <div>
                        Complexity:
                        <span className="ml-1 font-medium text-slate-700">
                            {model.complexity}
                        </span>
                    </div>

                    <div>
                        Data:
                        <span className="ml-1 font-medium text-slate-700">
                            {model.sampleSize}
                        </span>
                    </div>

                </div>

                {/* Selection Indicator */}

                {isSelected && (

                    <div className="mt-3 text-xs font-medium text-slate-900">
                        Selected Model
                    </div>

                )}

            </div>

        );
    };

    /* =====================================================
       UI
    ===================================================== */

    return (

        <div className="space-y-6">

            {/* Header */}

            <div>

                <div className="text-lg font-semibold text-slate-900">
                    Select Statistical Model
                </div>

                <div className="mt-1 text-sm text-slate-500">

                    Choose a statistical model that defines how observable
                    evidence updates belief in the competency claim.

                </div>

            </div>

            {/* Competency Compatibility Notice */}

            <div className="text-xs text-slate-400">

                Available models are restricted by competency variable type:

                <span className="ml-1 font-medium text-slate-700">
                    {variableType}
                </span>

            </div>

            {/* Model Cards */}

            <div className="grid grid-cols-2 gap-4">

                {compatibleModels.map(model => (
                    <ModelCard
                        key={model.type}
                        model={model}
                    />
                ))}

            </div>

        </div>
    );
}
