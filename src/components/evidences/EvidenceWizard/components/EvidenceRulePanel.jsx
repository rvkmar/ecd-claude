// EvidenceRulePanel.jsx
// 🧠 Enterprise ECD Step 5 — Evidence Rule Definition (STRICT)
// -----------------------------------------------------------
// ✔ Fully aligned with NEW schema (separate evidenceRules[])
// ✔ No dependency on observable.evidenceRule (deprecated)
// ✔ Always works on explicit rule object
// ✔ Enforces research-grade input quality

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

export default function EvidenceRulePanel({
    observable,
    rule,
    warrants,
    competency,
    index,
    errors,
    onChange,
    locked
}) {

    const [expanded, setExpanded] = useState(false);

    /* =====================================================
       SAFETY — RULE MUST EXIST
    ===================================================== */

    if (!rule) {
        return (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
                <AlertTriangle size={16} strokeWidth={2.25} className="mt-0.5 shrink-0" />
                <span>Evidence Rule missing for observable: {observable.statement}</span>
            </div>
        );
    }

    /* =====================================================
       LINKED WARRANT
    ===================================================== */

    const linkedWarrant =
        warrants?.find(w => w.id === observable.warrantId) || null;


    /* =====================================================
       UPDATE HANDLER (STRICT — ONLY PATCH FIELDS)
    ===================================================== */

    function updateField(field, value) {
        onChange({
            ...rule,
            [field]: value
        });
    }


    /* =====================================================
       SMART DEFAULT GENERATION (ENTERPRISE SAFE)
    ===================================================== */

    function generateCompleteRule() {

        const statement = observable.statement?.toLowerCase() || "";

        let direction = "supports";
        let strength = 3;

        if (statement.includes("incorrect") || statement.includes("error")) {
            direction = "weakens";
            strength = 4;
        }

        if (observable.type === "constructed" || observable.type === "performance") {
            strength = Math.min(strength + 1, 5);
        }

        const activationCondition =
            direction === "supports"
                ? "The observable is activated when the learner produces a correct, complete, and contextually appropriate response under defined task conditions."
                : direction === "weakens"
                    ? "The observable is activated when the learner produces an incorrect, inconsistent, or misconception-driven response under defined task conditions."
                    : "The observable is activated when behavior provides diagnostic information without directional inference.";

        const justification = linkedWarrant?.reasoningStatement
            ? `This evidence rule is grounded in the warrant: ${linkedWarrant.reasoningStatement}. The observed behavior provides inferential evidence about the underlying competency as specified in the claim.`
            : "This evidence rule establishes how observed behavior provides inferential support for the claim based on task performance.";

        onChange({
            ...rule,
            direction,
            strengthLevel: strength,
            activationCondition,
            justification
        });
    }


    /* =====================================================
       UI HELPERS
    ===================================================== */

    function badge(dir) {
        if (dir === "supports") return "bg-emerald-100 text-emerald-700";
        if (dir === "weakens") return "bg-red-100 text-red-700";
        if (dir === "neutral") return "bg-slate-100 text-slate-600";
        return "bg-amber-100 text-amber-700";
    }

    function fieldClasses(hasError) {
        return `w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
            hasError
                ? "border-red-400 focus:ring-red-500/10 focus:border-red-500"
                : "border-slate-300 focus:ring-slate-900/10 focus:border-slate-400"
        }`;
    }


    /* =====================================================
       UI
    ===================================================== */

    return (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">

            {/* HEADER */}

            <div
                className="flex items-center justify-between gap-3 px-5 py-4 text-left cursor-pointer transition hover:bg-slate-50"
                onClick={() => setExpanded(prev => !prev)}
            >

                <div>
                    <div className="text-xs font-medium text-slate-500">
                        Evidence Rule for the Observable
                    </div>
                    <div className="mt-0.5 text-sm font-semibold text-slate-900">
                        {observable.statement}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${badge(rule.direction)}`}>
                        {rule.direction || "unset"}
                    </span>
                    {expanded ? (
                        <ChevronUp size={16} strokeWidth={2.25} className="text-slate-400" />
                    ) : (
                        <ChevronDown size={16} strokeWidth={2.25} className="text-slate-400" />
                    )}
                </div>
            </div>


            {/* BODY -- left-accent color reflects the rule's own direction
                (supports/weakens/neutral) so the expanded panel isn't just
                a uniform gray block, and Direction + Strength (both short
                fields) share a row instead of each claiming a full-width
                row of their own. */}

            {expanded && (
                <div
                    className={`space-y-5 border-t px-6 py-6 border-l-4 ${
                        rule.direction === "supports"
                            ? "border-t-slate-100 border-l-emerald-400 bg-emerald-50/30"
                            : rule.direction === "weakens"
                                ? "border-t-slate-100 border-l-red-400 bg-red-50/30"
                                : "border-t-slate-100 border-l-slate-300 bg-slate-50/60"
                    }`}
                >

                    {/* WARRANT */}

                    {linkedWarrant && (
                        <div className="rounded-md border border-slate-200 bg-white px-3.5 py-3">
                            <div className="text-xs font-medium text-slate-500">
                                Warrant
                            </div>
                            <div className="mt-1 text-sm text-slate-700">
                                {linkedWarrant.reasoningStatement}
                            </div>
                        </div>
                    )}


                    {/* AUTO GENERATE */}
                    {!locked && (
                        <button
                            type="button"
                            onClick={generateCompleteRule}
                            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                            Auto-generate complete rule
                        </button>
                    )}

                    {/* DIRECTION + STRENGTH */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Direction <span className="text-red-500">*</span>
                            </label>
                            <select
                                className={fieldClasses(Boolean(errors[`direction-${index}`]))}
                                value={rule.direction}
                                onChange={(e) => updateField("direction", e.target.value)}
                                disabled={locked}
                            >
                                <option value="">Select</option>
                                <option value="supports">Supports</option>
                                <option value="weakens">Weakens</option>
                                <option value="neutral">Neutral</option>
                            </select>
                            {errors[`direction-${index}`] && (
                                <p className="mt-1.5 text-xs font-medium text-red-600">
                                    {errors[`direction-${index}`]}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Strength (1–5) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={5}
                                className={fieldClasses(false)}
                                value={rule.strengthLevel}
                                onChange={(e) =>
                                    updateField("strengthLevel", Number(e.target.value))
                                }
                                disabled={locked}
                            />
                        </div>

                    </div>


                    {/* ACTIVATION CONDITION */}

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Activation Condition <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            className={fieldClasses(Boolean(errors[`condition-${index}`]))}
                            rows={3}
                            value={rule.activationCondition}
                            onChange={(e) =>
                                updateField("activationCondition", e.target.value)
                            }
                            disabled={locked}
                        />
                        {errors[`condition-${index}`] && (
                            <p className="mt-1.5 text-xs font-medium text-red-600">
                                {errors[`condition-${index}`]}
                            </p>
                        )}
                    </div>


                    {/* JUSTIFICATION */}

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Inferential Justification <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            className={fieldClasses(Boolean(errors[`justification-${index}`]))}
                            rows={4}
                            value={rule.justification}
                            onChange={(e) =>
                                updateField("justification", e.target.value)
                            }
                            disabled={locked}
                        />
                        {errors[`justification-${index}`] && (
                            <p className="mt-1.5 text-xs font-medium text-red-600">
                                {errors[`justification-${index}`]}
                            </p>
                        )}
                    </div>

                </div>
            )}

        </div>
    );
}
