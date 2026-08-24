// ClaimBuilder.jsx
// Modular Claim Builder — ECD Claim Construction Helper
// Provides structured assistance for generating inferential claim statements

import { useMemo, useEffect } from "react";
import { Info, Sparkles } from "lucide-react";
import { ecdClaimTaxonomy } from "../constants/ecdClaimTaxonomy";

export default function ClaimBuilder({
    builder,
    setBuilder,
    generatedClaim,
    onGenerate,
    competency
}) {

    /* =========================================================
       Taxonomy Destructuring
    ========================================================= */

    const {
        cognitiveProcesses,
        rangeOptions,
        transferConditions
    } = ecdClaimTaxonomy;

    /* =========================================================
       Available Cognitive Actions
    ========================================================= */

    const availableActions = useMemo(() => {
        if (!builder.processType) return [];
        return cognitiveProcesses[builder.processType]?.actions || [];
    }, [builder.processType, cognitiveProcesses]);

    /* =========================================================
       Auto Suggest Builder Values
       Based on competency metadata
    ========================================================= */

    const suggestions = useMemo(() => {

        if (!competency) return null;

        const name = competency.name.toLowerCase();
        const description = competency.description?.toLowerCase() || "";

        const text = name + " " + description;

        let processType = "reasoning";
        let action = "analyze";
        let range = "routine and novel situations";
        let transfer = "apply reasoning independently";

        // Math equation solving
        if (text.includes("solve") || text.includes("equation")) {
            processType = "application";
            action = "solve";
            range = "multi-step problems";
        }

        // Modeling
        if (text.includes("model")) {
            processType = "construction";
            action = "model";
            range = "real-world contexts";
        }

        // Strategy / classification
        if (text.includes("strategy") || text.includes("classif")) {
            processType = "reasoning";
            action = "analyze";
        }

        // Conceptual understanding
        if (text.includes("understand") || text.includes("interpret")) {
            processType = "understanding";
            action = "interpret";
        }

        return {
            processType,
            action,
            range,
            transfer
        };

    }, [competency]);

    /* =========================================================
       Apply Suggestions (only if fields empty)
    ========================================================= */

    useEffect(() => {

        if (!suggestions) return;

        setBuilder(prev => {

            const updated = { ...prev };

            if (!prev.processType)
                updated.processType = suggestions.processType;

            if (!prev.action)
                updated.action = suggestions.action;

            if (!prev.range)
                updated.range = suggestions.range;

            if (!prev.transfer)
                updated.transfer = suggestions.transfer;

            return updated;

        });

    }, [suggestions]);


    /* =========================================================
       Helper Update Function
    ========================================================= */

    const updateBuilder = (field, value) => {
        setBuilder(prev => ({
            ...prev,
            [field]: value
        }));
    };

    /* =========================================================
       UI
    ========================================================= */

    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 space-y-5">

            {/* Template Guidance */}
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3.5 text-sm text-blue-800">
                <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
                <div>
                    <p className="font-medium mb-1">Structured Claim Template:</p>
                    <p>
                        The student can <em>[cognitive process type & action]</em> within{" "}
                        <em>[domain/context/range]</em> at a level sufficient to{" "}
                        <em>[transfer/application criterion]</em>.
                    </p>
                </div>
            </div>

            {suggestions && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-2 rounded-md">
                    <Sparkles size={14} strokeWidth={2} className="shrink-0" />
                    Suggested builder values based on competency description.
                </div>
            )}

            {/* Builder Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* =====================================================
                    Cognitive Process Type
                    ===================================================== */}

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Cognitive Process Type
                    </label>

                    <select
                        className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                        value={builder.processType || ""}
                        onChange={(e) => {
                            updateBuilder("processType", e.target.value);
                            updateBuilder("action", "");
                        }}
                    >
                        <option value="">
                            -- Select Process Type --
                        </option>

                        {Object.entries(cognitiveProcesses).map(
                            ([key, group]) => (
                                <option key={key} value={key}>
                                    {group.label}
                                </option>
                            )
                        )}
                    </select>
                </div>

                {/* =====================================================
                    Cognitive Action
                    ===================================================== */}

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Cognitive Action
                    </label>

                    <select
                        className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                        disabled={!builder.processType}
                        value={builder.action || ""}
                        onChange={(e) =>
                            updateBuilder("action", e.target.value)
                        }
                    >
                        <option value="">
                            -- Select Cognitive Action --
                        </option>

                        {availableActions.map((action) => (
                            <option key={action} value={action}>
                                {action}
                            </option>
                        ))}
                    </select>
                </div>

                {/* =====================================================
                    Range
                    ===================================================== */}

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Range
                    </label>

                    <select
                        className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                        value={builder.range || ""}
                        onChange={(e) =>
                            updateBuilder("range", e.target.value)
                        }
                    >
                        <option value="">
                            -- Select Range --
                        </option>

                        {rangeOptions.map((range) => (
                            <option key={range} value={range}>
                                {range}
                            </option>
                        ))}
                    </select>
                </div>

                {/* =====================================================
                    Transfer Condition
                    ===================================================== */}

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Transfer Condition
                    </label>

                    <select
                        className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                        value={builder.transfer || ""}
                        onChange={(e) =>
                            updateBuilder("transfer", e.target.value)
                        }
                    >
                        <option value="">
                            -- Select Transfer Condition --
                        </option>

                        {transferConditions.map((condition) => (
                            <option key={condition} value={condition}>
                                {condition}
                            </option>
                        ))}
                    </select>
                </div>

            </div>

            {/* =====================================================
                    Generate Claim Button
                ===================================================== */}

            <div>
                <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none"
                    disabled={!generatedClaim}
                    onClick={onGenerate}
                >
                    Generate Claim
                </button>
            </div>

        </div>
    );
}