// StatisticalModelCard.jsx
// 🧠 Enterprise ECD — Statistical Model Authoring Card (Upgraded)
// ----------------------------------------------------------------
// ✔ Integrates full ECD chain visibility
// ✔ Adds Evidence Mapping layer (CRITICAL for Step 6)
// ✔ Fixes evidenceRules misuse
// ✔ Enables inference-aware model configuration

import React, { useState, useMemo } from "react";
import {
    ChevronUp,
    ChevronDown,
    AlertTriangle,
    AlertCircle,
    CheckCircle2,
    Trash2
} from "lucide-react";

import StatisticalModelSelector from "../StatisticalModelSelector";

import IRTConfigPanel from "../config/IRTConfigPanel";
import BNConfigPanel from "../config/BNConfigPanel";
import CTTConfigPanel from "../config/CTTConfigPanel";
import SumConfigPanel from "../config/SumConfigPanel";
import ThresholdConfigPanel from "../config/ThresholdConfigPanel";

import EvidenceChainCard from "../EvidenceChainCard";

import LatentStructureDiagram from "../visualization/LatentStructureDiagram";
import BayesianGraphPreview from "../visualization/BayesianGraphPreview";
import IRTRelationshipDiagram from "../visualization/IRTRelationshipDiagram";
import CompetencyEvidenceGraph from "../visualization/CompetencyEvidenceGraph";
import BayesianEvidenceNetwork from "../visualization/BayesianEvidenceNetwork";
import CPTEditorPanel from "../config/CPTEditorPanel";

import ModelValidationPanel from "../validation/ModelValidationPanel";
import ModelFeasibilityPanel from "../validation/ModelFeasibilityPanel";

import { validateSubtype } from "../utils/modelSubtypeEngine";


export default function StatisticalModelCard({

    model,
    selectedCompetency,
    observables = [],
    warrants = [],
    evidenceRules = [],
    onRemove,
    onSetActive,
    onUpdateModel,
    locked

}) {

    const [activeTab, setActiveTab] = useState("mapping");

    const [isOpen, setIsOpen] = useState(false);

    /* =====================================================
       Update Helper
    ===================================================== */

    const updateModel = (updates) => {

        onUpdateModel(model.id, {
            ...model,
            ...updates
        });

    };


    /* =====================================================
       Derived Configuration
    ===================================================== */

    const config = model.structureConfig || {};
    const selectedObservableIds = config.observableIds || [];


    /* =====================================================
       Subtype Validation
    ===================================================== */

    const scoringMode = config.scoringMode || "binary";

    const subtypeValid = useMemo(() => {

        if (!model.subtype) return true;

        return validateSubtype({
            modelType: model.type,
            scoringMode,
            subtype: model.subtype
        });

    }, [model.type, scoringMode, model.subtype]);


    /* =====================================================
       Evidence Quality Diagnostics (NEW)
    ===================================================== */

    const evidenceStats = useMemo(() => {

        let missingWarrant = 0;
        let missingRule = 0;

        observables.forEach(o => {

            if (!o.warrantId) missingWarrant++;
            if (!o.evidenceRule) missingRule++;

        });

        return {
            total: observables.length,
            missingWarrant,
            missingRule
        };

    }, [observables]);


    /* =====================================================
       Observable Toggle (Model Binding)
    ===================================================== */

    const toggleObservable = (obsId, checked) => {

        const ids = new Set(selectedObservableIds);

        if (checked) ids.add(obsId);
        else ids.delete(obsId);

        updateModel({
            structureConfig: {
                ...config,
                observableIds: Array.from(ids)
            }
        });

    };


    const toggleSelectAll = (checked) => {

        updateModel({
            structureConfig: {
                ...config,
                observableIds: checked ? observables.map(o => o.id) : []
            }
        });

    };


    const allSelected = useMemo(() => {

        return config.observableIds?.length === observables.length;

    }, [config.observableIds, observables]);


    /* =====================================================
       CONFIG PANEL
    ===================================================== */

    const renderConfigPanel = () => {

        if (!model.type) return null;

        // evidenceRules was declared by every config panel but never passed,
        // so panels that reason about evidence direction (CTT's "a weakens
        // observable in a total score raises it" check) saw an empty array.
        // The embedded observable.evidenceRule mirror covers most cases; pass
        // the array too so both shapes are available.
        const commonProps = {
            model,
            observables,
            warrants,
            evidenceRules,
            onChange: (updates) =>
                updateModel({ structureConfig: updates }),
            locked
        };

        switch (model.type) {

            case "rasch":
            case "irt":
                return <IRTConfigPanel {...commonProps} />;

            case "bayesian_network":
                return <BNConfigPanel {...commonProps} />;

            case "ctt":
                return <CTTConfigPanel {...commonProps} />;

            case "sum":
                return <SumConfigPanel {...commonProps} />;

            case "threshold":
                return <ThresholdConfigPanel {...commonProps} />;

            default:
                return null;
        }
    };


    /* =====================================================
       VISUALIZATION
    ===================================================== */

    const renderVisualizationPanel = () => {

        if (!model.type) return null;

        switch (model.type) {

            case "rasch":
            case "irt":
                return (
                    <div className="space-y-6">
                        <LatentStructureDiagram model={model} observables={observables} />
                        <IRTRelationshipDiagram model={model} observables={observables} />
                        <CompetencyEvidenceGraph
                            observables={observables}
                            competencyName={selectedCompetency?.name}
                            modelType={model.type}
                        />
                    </div>
                );

            case "bayesian_network":
                return (
                    <div className="space-y-6">
                        <BayesianGraphPreview model={model} observables={observables} />
                        <BayesianEvidenceNetwork
                            observables={observables}
                            competencyName={selectedCompetency?.name}
                            modelType={model.type}
                        />
                    </div>
                );

            default:
                return (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                        Visualization is only available for Rasch, IRT and Bayesian Network models.
                    </div>
                );
        }
    };


    /* =====================================================
       TABS (UPDATED)
    ===================================================== */

    const tabs = [

        { id: "mapping", label: "Evidence Mapping" },
        { id: "config", label: "Configuration" },
        { id: "cpt", label: "Probabilities" },
        { id: "visual", label: "Visualization" }
        // { id: "validation", label: "Validation" },
        // { id: "feasibility", label: "Feasibility" }

    ];


    /* =====================================================
       UI
    ===================================================== */

    return (

        <div className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">

            {/* =====================================================
                HEADER
            ===================================================== */}

            <div
                className="flex cursor-pointer items-center justify-between"
                onClick={() => setIsOpen(prev => !prev)}
            >

                <div className="flex items-center space-x-3">

                    <div className="text-lg font-semibold text-slate-900">
                        Statistical Model
                    </div>

                    {model.type && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                            {model.type.toUpperCase()}
                            {model.subtype && ` • ${model.subtype}`}
                        </span>
                    )}

                    {model.active && (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                            ACTIVE
                        </span>
                    )}

                </div>

                <div className="flex items-center space-x-2">

                    {/* Expand Icon */}
                    <span className="text-slate-400">
                        {isOpen ? (
                            <ChevronUp size={16} strokeWidth={2} />
                        ) : (
                            <ChevronDown size={16} strokeWidth={2} />
                        )}
                    </span>

                    {/* Buttons (stop propagation!) */}
                    {!model.active && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onSetActive(model.id);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                        >
                            Set Active
                        </button>
                    )}

                    {!locked && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove(model.id);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                        >
                            <Trash2 size={14} strokeWidth={2} />
                            Remove
                        </button>
                    )}

                </div>

            </div>

            {isOpen && (
                <>

                    {/* =====================================================
                            MODEL SELECTOR
                        ===================================================== */}

                    <StatisticalModelSelector
                        model={model}
                        onChange={(updates) => updateModel(updates)}
                        locked={locked}
                    />


                    {!subtypeValid && (
                        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
                            <AlertCircle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
                            <span>Invalid subtype for selected scoring mode.</span>
                        </div>
                    )}


                    {/* =====================================================
                            EVIDENCE HEALTH (NEW)
                        ===================================================== */}

                    <div className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5 text-xs">

                        <div className="font-semibold text-amber-800">Evidence Mapping Health</div>

                        <div className="text-amber-800">Total Observables: {evidenceStats.total}</div>

                        {evidenceStats.missingWarrant > 0 && (
                            <div className="flex items-center gap-1.5 text-red-600">
                                <AlertTriangle size={14} strokeWidth={2} />
                                Missing Warrants: {evidenceStats.missingWarrant}
                            </div>
                        )}

                        {evidenceStats.missingRule > 0 && (
                            <div className="flex items-center gap-1.5 text-red-600">
                                <AlertTriangle size={14} strokeWidth={2} />
                                Missing Evidence Rules: {evidenceStats.missingRule}
                            </div>
                        )}

                    </div>


                    {/* =====================================================
                            TABS
                        ===================================================== */}

                    {model.type && (

                        <div className="space-y-6">

                            <div className="flex space-x-6 border-b border-slate-200 text-sm font-medium">

                                {tabs.map(tab => (

                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={
                                            activeTab === tab.id
                                                ? "border-b-2 border-slate-900 pb-2 font-semibold text-slate-900"
                                                : "border-b-2 border-transparent pb-2 text-slate-500 transition hover:text-slate-800"
                                        }
                                    >
                                        {tab.label}
                                    </button>

                                ))}

                            </div>


                            {/* =====================================================
                                    TAB CONTENT
                                ===================================================== */}

                            {/* EVIDENCE MAPPING TAB */}
                            {activeTab === "mapping" && (

                                <div className="max-h-[400px] space-y-4 overflow-y-auto">

                                    {/* =====================================================
                                            Observable Evidence Mapping
                                        ===================================================== */}

                                    <div>

                                        <label className="mb-2 block text-sm font-medium text-slate-700">

                                            Observable Evidence Variables <span className="text-red-500">*</span>

                                        </label>

                                        <div className="mb-2 flex items-center gap-2">

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

                                                Select all

                                            </span>

                                        </div>


                                        <div className="max-h-64 space-y-3 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">

                                            {observables.map(obs => {

                                                const included =
                                                    config.observableIds?.includes(obs.id);

                                                return (

                                                    <EvidenceChainCard
                                                        key={obs.id}
                                                        observable={obs}
                                                        warrants={warrants}
                                                        checked={included}
                                                        onToggle={toggleObservable}
                                                        locked={locked}
                                                    />

                                                );

                                            })}

                                        </div>


                                        <p className="mt-2 text-xs text-slate-400">

                                            Each observable response provides evidence
                                            about the learner's latent ability (θ).

                                        </p>

                                    </div>

                                </div>

                            )}


                            {activeTab === "config" && renderConfigPanel()}

                            {activeTab === "cpt" && (
                                ["bayesian_network", "irt", "rasch"].includes(model.type) ? (

                                    <CPTEditorPanel
                                        model={model}
                                        observables={observables}
                                        warrants={warrants}
                                        selectedCompetency={selectedCompetency}
                                        onChange={(updates) =>
                                            updateModel({
                                                structureConfig: updates
                                            })
                                        }
                                        locked={locked}
                                    />

                                ) : (

                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                                        CPT configuration is only available for probabilistic models
                                        (Bayesian Network, IRT, Rasch).
                                    </div>

                                ))}

                            {activeTab === "visual" && renderVisualizationPanel()}

                            {activeTab === "validation" && (

                                <ModelValidationPanel
                                    model={model}
                                    observables={observables}
                                    warrants={warrants}
                                    selectedCompetency={selectedCompetency}
                                />
                            )}

                            {activeTab === "feasibility" && (
                                <ModelFeasibilityPanel
                                    model={model}
                                    observables={observables}
                                    warrants={warrants}
                                    selectedCompetency={selectedCompetency}
                                />
                            )}

                        </div>

                    )}
                </>
            )}

            {!isOpen && (

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">

                    <div className="flex justify-between">

                        <div>
                            Observables: {selectedObservableIds.length}
                        </div>

                        <div>
                            Type: {(model?.type || "Not selected").toUpperCase()}
                        </div>

                    </div>

                    <div className="mt-1 flex items-center gap-3">

                        {evidenceStats.missingWarrant > 0 && (
                            <span className="inline-flex items-center gap-1 text-red-600">
                                <AlertTriangle size={12} strokeWidth={2} />
                                Warrants missing
                            </span>
                        )}

                        {evidenceStats.missingRule > 0 && (
                            <span className="inline-flex items-center gap-1 text-red-600">
                                <AlertTriangle size={12} strokeWidth={2} />
                                Rules missing
                            </span>
                        )}

                        {evidenceStats.missingRule === 0 &&
                            evidenceStats.missingWarrant === 0 && (
                                <span className="inline-flex items-center gap-1 text-emerald-700">
                                    <CheckCircle2 size={12} strokeWidth={2} />
                                    Evidence mapping complete
                                </span>
                            )}

                    </div>

                </div>

            )}

        </div>

    );

}
