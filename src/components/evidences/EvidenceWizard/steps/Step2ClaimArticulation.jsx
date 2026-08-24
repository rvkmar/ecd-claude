// Step2ClaimArticulation.jsx
// 🧠 Extreme Strict ECD — Claim Articulation (Using Shared Diagnostics Engine)

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, AlertTriangle, ChevronDown, ChevronUp, Info } from "lucide-react";
import { useEvidenceWizardContext } from "../EvidenceWizardContext";
import ClaimBuilder from "../components/ClaimBuilder";

import {
    runClaimDiagnostics,
    polishClaimGrammar
} from "../components/diagnostics/claimDiagnostics";

const badgeBase =
    "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide";

const textareaBase =
    "w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed";

export default function Step2ClaimArticulation({ onValidityChange, locked }) {

    const {
        draftModel,
        updateField,
        competencies,
        competencyModels,
        selectedCompetency,
    } = useEvidenceWizardContext();

    const [errors, setErrors] = useState({});
    const [qualityScore, setQualityScore] = useState(null);
    const [semanticWarning, setSemanticWarning] = useState(null);

    const [builder, setBuilder] = useState({
        action: "",
        range: "",
        transfer: ""
    });

    const [showBuilder, setShowBuilder] = useState(false);

    if (!selectedCompetency) {
        return (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
                <AlertCircle size={16} strokeWidth={2.25} className="mt-0.5 shrink-0" />
                Complete Step 1 first.
            </div>
        );
    }

    /* =====================================================
       DOMAIN PHRASE BUILDER
    ===================================================== */

    function toTitleCase(text) {
        return text.replace(/\w\S*/g, (word) =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        );
    }

    const naturalDomainPhrase = useMemo(() => {

        const facet = selectedCompetency.facet?.toLowerCase();
        const strand = selectedCompetency.strand?.toLowerCase();

        if (!facet || !strand) return "";

        return `${facet} contexts in ${strand}`;

    }, [selectedCompetency]);


    const titleDomainPhrase = useMemo(() => {

        const facet = selectedCompetency.facet || "";
        const strand = selectedCompetency.strand || "";

        return toTitleCase(`${facet} Contexts in ${strand}`);

    }, [selectedCompetency]);


    /* =====================================================
       VARIABLE TYPE LEVEL CLAUSE
    ===================================================== */

    const levelClause = useMemo(() => {

        const c = selectedCompetency;

        switch (c.variableType) {

            case "binary":
                return "at mastery level";

            case "ordinal":
                return "at progressively higher developmental levels";

            case "continuous":
                if (typeof c.scale?.min === "number") {
                    return `along a continuous proficiency continuum (${c.scale.min} to ${c.scale.max})`;
                }
                return "along a continuous proficiency continuum";

            case "categorical":
                return "as a dominant strategy profile";

            default:
                return "";

        }

    }, [selectedCompetency]);


    /* =====================================================
       GENERATED CLAIM
    ===================================================== */

    const generatedClaim = useMemo(() => {

        if (!builder.action || !builder.range || !builder.transfer)
            return "";

        return polishClaimGrammar(
            `The student can ${builder.action} within ${naturalDomainPhrase} across ${builder.range}, sufficient to ${builder.transfer} ${levelClause}.`
        );

    }, [builder, naturalDomainPhrase, levelClause]);


    /* =====================================================
       CLAIM DIAGNOSTICS (Shared Engine)
    ===================================================== */

    useEffect(() => {

        const result = runClaimDiagnostics({

            claimText: draftModel.claimStatement,

            competency: selectedCompetency,

            levelClause

        });


        setQualityScore(result.qualityScore);

        setSemanticWarning(result.semanticWarning);


        updateField("claimQualityScore", result.qualityScore);


        setErrors(result.validationErrors || {});


        const valid =
            result.qualityScore !== null &&
            Object.keys(result.validationErrors || {}).length === 0;

        onValidityChange(valid);

    }, [draftModel.claimStatement, selectedCompetency, levelClause]);


    /* =====================================================
       Target Competency
    ===================================================== */
    const safeCompetencies = competencies || [];

    const safeModels = competencyModels || [];

    const targetCompetencyId =
        draftModel?.competencyId || draftModel?.claimCompetencyId;

    const activeCompetency = useMemo(() => {

        return safeCompetencies.find(
            c => c.id === targetCompetencyId
        );

    }, [safeCompetencies, targetCompetencyId]);


    const activeModel = useMemo(() => {

        if (!activeCompetency) return null;

        return safeModels.find(m => m.id === activeCompetency.modelId);

    }, [safeModels, activeCompetency]);


    /* =====================================================
       Competency Lookup Map
    ===================================================== */

    const competencyMap = useMemo(() => {

        const map = {};

        safeCompetencies.forEach(c => {

            map[c.id] = c;

        });


        return map;

    }, [safeCompetencies]);


    /* =====================================================
       UI
    ===================================================== */

    return (

        <div className="space-y-6 max-w-4xl">

            <div>
                <h2 className="text-lg font-semibold text-slate-900">
                    Claim Articulation
                </h2>
            </div>


            {/* =================================================
               Competency Context Panel
            ================================================= */}

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 space-y-3">

                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Info size={14} strokeWidth={2.25} />
                    Target Competency
                </div>

                <div className="text-sm font-semibold text-slate-900">
                    {activeCompetency?.name}
                </div>


                <div className="flex flex-wrap items-center gap-2 pt-1">

                    <span className={`${badgeBase} bg-blue-100 text-blue-700`}>
                        {activeModel?.name}
                    </span>

                    <span className={`${badgeBase} bg-slate-100 text-slate-600`}>
                        {activeCompetency?.variableType}
                    </span>

                    {activeCompetency?.states?.length > 0 && (

                        <span className={`${badgeBase} bg-slate-100 text-slate-600`}>

                            {activeCompetency.states.length} states

                        </span>

                    )}

                    {activeCompetency?.variableType === "continuous"
                        && activeCompetency?.scale && (

                            <span className="text-xs text-slate-500">

                                Scale: {activeCompetency.scale.min} to {activeCompetency.scale.max}

                            </span>

                        )}

                </div>

                {/* RELATIONSHIPS (Resolve IDs → Names) */}
                {activeCompetency.relationships?.length > 0 && (
                    <div className="text-sm text-slate-600 mt-2 border-t border-slate-100 pt-2">
                        <strong className="text-slate-700">Relationships:</strong>
                        <ul className="list-disc ml-6 mt-1 space-y-0.5">
                            {activeCompetency.relationships.map((r, i) => {
                                const target = competencyMap[r.targetCompetencyId];
                                return (
                                    <li key={i}>
                                        {r.type} →{" "}
                                        {target ? target.name : r.targetCompetencyId}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                <div className="text-sm text-slate-600 mt-2 border-t border-slate-100 pt-2">
                    <strong className="text-slate-700">Construct:</strong> <br></br>
                    <span className="text-sm text-slate-800">
                        {activeCompetency?.domain} →{" "}
                        {activeCompetency?.strand} →{" "}
                        {activeCompetency?.facet}
                    </span>
                </div>

            </div>


            {/* Claim Textarea */}

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
                {!locked && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-800">
                            Articulate the Claim Statement
                        </h3>

                        {/* Claim Builder Toggle */}

                        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-sm font-semibold text-slate-800">Claim Builder</h3>

                                <button
                                    type="button"
                                    onClick={() => setShowBuilder(prev => !prev)}
                                    className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-slate-800"
                                >
                                    {showBuilder ? "Hide Builder" : "Show Builder"}
                                    {showBuilder
                                        ? <ChevronUp size={14} strokeWidth={2.25} />
                                        : <ChevronDown size={14} strokeWidth={2.25} />}
                                </button>
                            </div>

                            {/* Builder Panel */}
                            {!locked && showBuilder && (
                                <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">

                                    <ClaimBuilder
                                        builder={builder}
                                        setBuilder={setBuilder}
                                        generatedClaim={generatedClaim}
                                        onGenerate={() =>
                                            updateField("claimStatement", generatedClaim)
                                        }
                                        competency={selectedCompetency}
                                    />

                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Formal Claim Statement <span className="text-red-500">*</span>
                    </label>

                    <textarea
                        className={textareaBase}
                        rows={6}
                        value={draftModel.claimStatement || ""}
                        onChange={(e) =>
                            updateField("claimStatement", e.target.value)
                        }
                        onBlur={(e) =>
                            updateField("claimStatement", polishClaimGrammar(e.target.value))
                        }
                        disabled={locked}
                    />

                </div>
                {errors.claimStatement && (

                    <p className="mt-1.5 text-xs font-medium text-red-600">
                        {errors.claimStatement}
                    </p>

                )}


                {semanticWarning && (

                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-700">
                        <AlertTriangle size={14} strokeWidth={2.25} />
                        {semanticWarning}
                    </p>

                )}


                {/* Quality Score */}

                <div>

                    {qualityScore === null ? (

                        <div className="text-sm italic text-slate-400">
                            No claim entered yet.
                        </div>

                    ) : (

                        <>

                            <div className="text-sm text-slate-700 mb-1">
                                Linguistic Quality Score: {qualityScore}/100
                            </div>

                            <div className="w-full bg-slate-200 rounded h-3">

                                <div
                                    className={`h-3 rounded ${qualityScore > 70
                                        ? "bg-emerald-500"
                                        : qualityScore > 40
                                            ? "bg-amber-500"
                                            : "bg-red-500"
                                        }`}
                                    style={{ width: `${qualityScore}%` }}
                                />

                            </div>

                        </>

                    )}

                </div>

            </div>


        </div>

    );

}
