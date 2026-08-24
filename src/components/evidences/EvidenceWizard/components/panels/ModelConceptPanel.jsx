// ModelConceptPanel.jsx
// 🧠 Enterprise ECD — Statistical Model Concept Panel
// ----------------------------------------------------
// Explains how observable evidence is converted into
// probabilistic claim inference through statistical models.
//
// This panel provides conceptual grounding for Step 6
// before model configuration begins.

import React, { useState } from "react";
import { ChevronDown, ChevronUp, ArrowRight, ArrowDown, AlertTriangle } from "lucide-react";

export default function ModelConceptPanel() {

    const [expanded, setExpanded] = useState(false);

    return (

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">

            {/* Header */}

            <div
                className="flex cursor-pointer items-center justify-between rounded-t-lg bg-slate-50 p-4"
                onClick={() => setExpanded(prev => !prev)}
            >

                <div className="text-lg font-semibold text-slate-900">
                    Statistical Inference Concept
                </div>

                <div className="flex items-center gap-1 text-sm text-slate-500">
                    {expanded ? "Collapse" : "Expand"}
                    {expanded ? (
                        <ChevronUp size={16} strokeWidth={2} />
                    ) : (
                        <ChevronDown size={16} strokeWidth={2} />
                    )}
                </div>

            </div>

            {/* Content */}

            {expanded && (

                <div className="space-y-6 p-6">

                    {/* Explanation */}

                    <div className="text-sm leading-relaxed text-slate-700">

                        In Evidence-Centered Design (ECD), observable behaviors
                        do not directly confirm a claim. Instead, they provide
                        <strong> evidence </strong> that must be interpreted
                        through a statistical model.

                        <br /><br />

                        The statistical model determines how observed performance
                        changes the system’s belief about the learner’s
                        competency.

                    </div>

                    {/* Inference Pipeline */}

                    <div className="rounded-md border border-blue-200 bg-blue-50 p-4">

                        <div className="mb-3 text-sm font-semibold text-slate-800">
                            Evidence Inference Pipeline
                        </div>

                        <div className="grid grid-cols-5 gap-3 text-center text-sm">

                            <div className="rounded-md border border-slate-200 bg-white p-3 text-slate-700">
                                Observable Behavior
                            </div>

                            <div className="flex items-center justify-center text-slate-400">
                                <ArrowRight size={16} strokeWidth={2} />
                            </div>

                            <div className="rounded-md border border-slate-200 bg-white p-3 text-slate-700">
                                Evidence Rule
                            </div>

                            <div className="flex items-center justify-center text-slate-400">
                                <ArrowRight size={16} strokeWidth={2} />
                            </div>

                            <div className="rounded-md border border-slate-200 bg-white p-3 text-slate-700">
                                Statistical Model
                            </div>

                        </div>

                        <div className="mt-3 grid grid-cols-5 gap-3 text-center text-sm">

                            <div></div>

                            <div className="flex items-center justify-center text-slate-400">
                                <ArrowDown size={16} strokeWidth={2} />
                            </div>

                            <div></div>

                            <div className="flex items-center justify-center text-slate-400">
                                <ArrowDown size={16} strokeWidth={2} />
                            </div>

                            <div className="rounded-md border border-slate-200 bg-white p-3 text-slate-700">
                                Posterior Belief
                            </div>

                        </div>

                        <div className="mt-3 grid grid-cols-5 gap-3 text-center text-sm">

                            <div></div>
                            <div></div>
                            <div></div>

                            <div className="flex items-center justify-center text-slate-400">
                                <ArrowDown size={16} strokeWidth={2} />
                            </div>

                            <div className="rounded-md border border-slate-200 bg-white p-3 text-slate-700">
                                Claim Inference
                            </div>

                        </div>

                    </div>

                    {/* Model Role */}

                    <div className="space-y-2 text-sm text-slate-700">

                        <div className="font-semibold text-slate-800">
                            Role of the Statistical Model
                        </div>

                        <ul className="ml-6 list-disc space-y-1">

                            <li>
                                Defines how observable evidence updates belief
                                in the competency claim.
                            </li>

                            <li>
                                Converts observed performance into a
                                probabilistic estimate of learner ability.
                            </li>

                            <li>
                                Supports diagnostic inference and decision
                                making.
                            </li>

                        </ul>

                    </div>

                    {/* Model Types */}

                    <div className="space-y-3">

                        <div className="text-sm font-semibold text-slate-800">
                            Common Model Types
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">

                            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">

                                <div className="font-medium text-slate-800">
                                    Rasch / IRT Models
                                </div>

                                <div className="mt-1 text-slate-500">

                                    Estimate a learner’s latent ability (θ)
                                    based on item difficulty and response
                                    patterns.

                                </div>

                            </div>

                            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">

                                <div className="font-medium text-slate-800">
                                    Bayesian Networks
                                </div>

                                <div className="mt-1 text-slate-500">

                                    Represent relationships between
                                    competencies and observable behaviors
                                    using probabilistic graphical models.

                                </div>

                            </div>

                            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">

                                <div className="font-medium text-slate-800">
                                    Sum Score Models
                                </div>

                                <div className="mt-1 text-slate-500">

                                    Aggregate observable evidence using
                                    weighted scoring rules. Used as
                                    deterministic approximations.

                                </div>

                            </div>

                            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">

                                <div className="font-medium text-slate-800">
                                    Threshold Rules
                                </div>

                                <div className="mt-1 text-slate-500">

                                    Classify learners based on minimum
                                    evidence thresholds or mastery criteria.

                                </div>

                            </div>

                        </div>

                    </div>

                    {/* Governance Notice */}

                    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5 text-xs text-amber-800">

                        <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />

                        <span>
                            The statistical model must be compatible with the
                            competency’s variable type and observable structure.
                            The system will validate this alignment before the
                            evidence model can be confirmed.
                        </span>

                    </div>

                </div>

            )}

        </div>
    );
}
