// EvidenceWizard/components/ObservableBuilder.jsx
// 🧠 Enterprise Observable Builder (ECD Template Engine)
// -------------------------------------------------
// Generates high‑quality ECD observable statements
// Uses template library + verb grammar + quality diagnostics

import { useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";

export default function ObservableBuilder({
    competency,
    warrant,
    onApply
}) {

    const [showBuilder, setShowBuilder] = useState(false);

    const [builder, setBuilder] = useState({
        action: "",
        context: "",
        evidence: ""
    });

    const [generated, setGenerated] = useState("");

    const [qualityScore, setQualityScore] = useState(null);


    /* =====================================================
       ACTION LIBRARY
    ===================================================== */

    const actions = [
        "identify",
        "select",
        "compute",
        "classify",
        "construct",
        "produce",
        "justify",
        "explain",
        "compare",
        "analyze"
    ];


    /* =====================================================
       VERB INFLECTION MAP
    ===================================================== */

    const verbForms = {
        identify: "identifies",
        select: "selects",
        compute: "computes",
        classify: "classifies",
        construct: "constructs",
        produce: "produces",
        justify: "justifies",
        explain: "explains",
        compare: "compares",
        analyze: "analyzes"
    };


    /* =====================================================
       EVIDENCE TYPES
    ===================================================== */

    const evidences = [
        "correct answer",
        "selected option",
        "numeric result",
        "constructed expression",
        "structured explanation",
        "diagram annotation",
        "step-by-step solution"
    ];


    /* =====================================================
       TEMPLATE LIBRARY
    ===================================================== */

    const templates = {

        "numeric result":
            (context) => `Student correctly computes the numeric result for ${context}.`,

        "selected option":
            (context) => `Student selects the correct option for ${context}.`,

        "constructed expression":
            (context) => `Student constructs an algebraic expression representing ${context}.`,

        "structured explanation":
            (context) => `Student explains the reasoning used when working with ${context}.`,

        "diagram annotation":
            (context) => `Student annotates the diagram to represent ${context}.`,

        "step-by-step solution":
            (context) => `Student produces a step-by-step solution for ${context}.`

    };


    /* =====================================================
       DOMAIN CONTEXT HINT
    ===================================================== */

    const contextHint = useMemo(() => {

        if (!competency) return "";

        return `${competency.facet} tasks in ${competency.strand}`;

    }, [competency]);


    /* =====================================================
       GENERATE OBSERVABLE
    ===================================================== */

    function generateObservable(action, context, evidence) {

        if (templates[evidence])
            return templates[evidence](context);

        const verb = verbForms[action] || action;

        return `Student ${verb} ${evidence} when working with ${context}.`;

    }


    /* =====================================================
       OBSERVABLE TYPE INFERENCE
    ===================================================== */

    function inferType(evidence) {

        if (!evidence) return "";

        if (evidence.includes("selected"))
            return "selected_response";

        if (evidence.includes("numeric"))
            return "numeric_response";

        if (evidence.includes("expression"))
            return "constructed_response";

        if (evidence.includes("explanation"))
            return "constructed_response";

        if (evidence.includes("diagram"))
            return "artifact";

        return "constructed_response";

    }

/* =====================================================
       BOUNDARY NOTE SUGGESTION
    ===================================================== */
    function suggestBoundaryNote(evidence) {

        if (!evidence) return "";

        if (evidence.includes("numeric"))
            return "Correct responses may reflect procedural execution rather than conceptual understanding.";

        if (evidence.includes("selected"))
            return "Correct selections may occur through guessing rather than genuine understanding.";

        if (evidence.includes("expression"))
            return "Constructed expressions may reflect memorized procedures rather than flexible reasoning.";

        if (evidence.includes("explanation"))
            return "Explanations may reflect rehearsed responses rather than deep conceptual understanding.";

        if (evidence.includes("diagram"))
            return "Diagram annotations may reflect recognition of visual patterns rather than conceptual understanding.";

        if (evidence.includes("solution"))
            return "Step-by-step solutions may reflect procedural rehearsal rather than conceptual reasoning.";

        return "Observed behavior may reflect partial strategies rather than full mastery of the targeted competency.";

    }


    /* =====================================================
       QUALITY DIAGNOSTIC
    ===================================================== */

    function evaluateQuality(statement) {

        let score = 40;

        if (statement.includes("correct")) score += 10;

        if (statement.includes("compute") || statement.includes("select")) score += 15;

        if (statement.length > 45) score += 10;

        if (builder.context) score += 10;

        if (builder.evidence) score += 10;

        if (builder.action) score += 5;

        setQualityScore(Math.min(score, 100));

    }


    /* =====================================================
       GENERATION EFFECT
    ===================================================== */

    useEffect(() => {

        const { action, context, evidence } = builder;

        if (!action || !context || !evidence) {
            setGenerated("");
            setQualityScore(null);
            return;
        }

        const sentence = generateObservable(action, context, evidence);

        setGenerated(sentence);

        evaluateQuality(sentence);

    }, [builder]);


    /* =====================================================
       APPLY PATCH
    ===================================================== */

    function applyBuilder() {

        if (!generated) return;

        const observablePatch = {
            statement: generated,
            type: inferType(builder.evidence),
            boundaryNote: suggestBoundaryNote(builder.evidence)
        };

        onApply(observablePatch);

        setShowBuilder(false);

        setBuilder({
            action: "",
            context: "",
            evidence: ""
        });

        setGenerated("");

        setQualityScore(null);

    }


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">

            {/* Header */}

            <div className="flex justify-between items-center">

                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                    <Sparkles size={15} strokeWidth={2} className="text-slate-400" />
                    Observable Builder
                </div>

                <button
                    type="button"
                    onClick={() => setShowBuilder(!showBuilder)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-slate-800"
                >
                    {showBuilder ? "Hide Builder" : "Show Builder"}
                    {showBuilder ? (
                        <ChevronUp size={14} strokeWidth={2} />
                    ) : (
                        <ChevronDown size={14} strokeWidth={2} />
                    )}
                </button>

            </div>


            {showBuilder && (

                <div className="space-y-4">

                    {/* Context -- drives the other two fields, so it leads
                        on its own row; Action + Evidence are both short
                        selects and pair naturally into one compact row
                        instead of three stacked full-width rows. */}

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Task Context
                        </label>

                        <input
                            type="text"
                            className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                            placeholder={contextHint}
                            value={builder.context}
                            onChange={(e) =>
                                setBuilder({
                                    ...builder,
                                    context: e.target.value
                                })
                            }
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        {/* Action */}

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Observable Action
                            </label>

                            <select
                                className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                                value={builder.action}
                                onChange={(e) =>
                                    setBuilder({
                                        ...builder,
                                        action: e.target.value
                                    })
                                }
                            >
                                <option value="">Select action</option>

                                {actions.map(a => (
                                    <option key={a} value={a}>{a}</option>
                                ))}

                            </select>
                        </div>


                        {/* Evidence */}

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Observable Evidence
                            </label>

                            <select
                                className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                                value={builder.evidence}
                                onChange={(e) =>
                                    setBuilder({
                                        ...builder,
                                        evidence: e.target.value
                                    })
                                }
                            >
                                <option value="">Select evidence</option>

                                {evidences.map(e => (
                                    <option key={e} value={e}>{e}</option>
                                ))}

                            </select>
                        </div>

                    </div>


                    {/* Generated -- distinct tinted card instead of a plain
                        gray textarea, so the payoff of filling in the
                        fields above visually stands out. */}

                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Generated Observable
                        </label>

                        <textarea
                            rows={2}
                            className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                            value={generated}
                            onChange={(e) => setGenerated(e.target.value)}
                        />

                        {/* Quality meter + Apply share a row with the
                            generated text so the panel doesn't grow an
                            extra full-width row for each. */}
                        <div className="mt-3 flex items-center justify-between gap-4">

                            {qualityScore !== null ? (
                                <div className="flex-1 space-y-1">
                                    <div className="text-xs text-slate-500">
                                        Quality Score: {qualityScore}/100
                                    </div>

                                    <div className="w-full bg-slate-200 rounded h-1.5">
                                        <div
                                            className={`h-1.5 rounded ${qualityScore > 70
                                                    ? "bg-emerald-500"
                                                    : qualityScore > 45
                                                        ? "bg-amber-500"
                                                        : "bg-red-500"
                                                }`}
                                            style={{ width: `${qualityScore}%` }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div />
                            )}

                            <button
                                type="button"
                                onClick={applyBuilder}
                                className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none"
                            >
                                Apply to Observable
                            </button>

                        </div>
                    </div>

                </div>

            )}

        </div>

    );

}
