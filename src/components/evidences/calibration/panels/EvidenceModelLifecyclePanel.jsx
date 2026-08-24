// EvidenceModelLifecyclePanel.jsx
// 🧠 Enterprise ECD — Evidence Model Lifecycle (State-Aware)
// ---------------------------------------------------------------
// Replaces the wizard's ModelLifecyclePanel, which read only
// `evidenceModelStatus` and mapped draft → stage 1, confirmed →
// stage 3, everything else → stage 1. Inside the wizard the status is
// always "draft", so the timeline never moved: it was a static
// diagram pretending to be a state display.
//
// This version derives its stage from the model's ACTUAL governance
// state -- status, lock, active statistical model, parameter sets,
// active parameter set, decision rule, activation timestamp -- and
// annotates each stage with the evidence that it did or did not
// happen. Suspension is a real state here, not an unhandled default.
// ---------------------------------------------------------------

import React, { useMemo } from "react";
import {
    AlertTriangle,
    Archive,
    CheckCircle2,
    CircleDot,
    Circle,
    PauseCircle,
} from "lucide-react";

import { linkedTaskModels, resolveLifecycleStage } from "../engines/effectiveModel";

/* The narrative timeline. "calibrated" is a derived stage rather than a
   stored status (a confirmed model WITH an active parameter set);
   suspended and archived are states OF the operational stage, handled by
   the banners below rather than as stages of their own. */
const STAGE_ORDER = ["draft", "reviewed", "confirmed", "calibrated", "bound", "operational"];

export default function EvidenceModelLifecyclePanel({
    evidenceModel,
    activeStatModel,
    taskModels = null,
}) {

    const stage = resolveLifecycleStage(evidenceModel, taskModels);

    const suspended = stage === "suspended";
    const archived = stage === "archived";

    // Suspended and archived are both states OF the operational stage
    // rather than stages of their own, so the timeline pins to stage 4
    // and the banner below carries the distinction.
    const currentIndex = (suspended || archived)
        ? STAGE_ORDER.indexOf("operational")
        : STAGE_ORDER.indexOf(stage);

    /* =====================================================
       EVIDENCE PER STAGE (what actually happened, from data)
    ===================================================== */

    const stages = useMemo(() => {

        const sm = activeStatModel ||
            evidenceModel?.statisticalModels?.find(m => m.active) ||
            null;

        const paramSets = sm?.parameterSets || [];

        const activeSet = paramSets.find(
            ps => ps.parameterSetId === sm?.activeParameterSetId
        );

        const dr = evidenceModel?.decisionRule;

        const bound = Array.isArray(taskModels)
            ? linkedTaskModels(evidenceModel?.id, taskModels)
            : [];

        return [
            {
                key: "draft",
                title: "Structure Definition",
                description:
                    "Claim, warrants, observables, evidence rules and statistical model structure are authored in the Evidence Wizard.",
                facts: [
                    `Statistical models defined: ${evidenceModel?.statisticalModels?.length || 0}`,
                    `Observables: ${evidenceModel?.observables?.length || 0}`,
                    sm
                        ? `Active model: ${sm.type}${sm.subtype ? ` (${sm.subtype})` : ""}`
                        : "No statistical model marked active",
                ],
            },
            {
                key: "reviewed",
                title: "Structural Review",
                description:
                    "A reviewer checks the evidence chain — claim, warrants, observables, evidence rules — before the structure is frozen. Deliberately an unlocked state: the model can still change in response to what the review finds.",
                facts: [
                    `Warrants: ${evidenceModel?.warrants?.length || 0}`,
                    `Evidence rules: ${evidenceModel?.evidenceRules?.length || 0}`,
                    evidenceModel?.reviewMeta?.submittedForReviewAt
                        ? `Submitted for review ${new Date(evidenceModel.reviewMeta.submittedForReviewAt).toLocaleString()}`
                        : "No review submission recorded",
                    evidenceModel?.reviewMeta?.returnedToDraftAt
                        ? `Returned to draft ${new Date(evidenceModel.reviewMeta.returnedToDraftAt).toLocaleString()}`
                        : null,
                ],
            },
            {
                key: "confirmed",
                title: "Confirmation & Structural Lock",
                description:
                    "Structure is validated and frozen. From here on, only parameters may change — structure is version-locked so historical sessions stay comparable.",
                facts: [
                    evidenceModel?.locked
                        ? "Structure locked"
                        : "Structure still editable (not yet confirmed)",
                    `Version: v${evidenceModel?.versionNumber || 1}`,
                    evidenceModel?.parentModelId
                        ? `Cloned from ${evidenceModel.parentModelId}`
                        : "Original (not a clone)",
                ],
            },
            {
                key: "calibrated",
                title: "Parameter Calibration",
                description:
                    "Item parameters or conditional probabilities are estimated from empirical response data and stored as an append-only parameter set.",
                facts: [
                    `Parameter sets on file: ${paramSets.length}`,
                    activeSet
                        ? `Active set: ${activeSet.parameterSetId}`
                        : "No active parameter set",
                    activeSet
                        ? `Method: ${activeSet.calibrationMethod || "unspecified"} (n = ${activeSet.sampleSize || 0})`
                        : "Awaiting first calibration import",
                ],
            },
            {
                key: "bound",
                title: "Delivery Binding",
                description:
                    "A task model binds these observables to something a learner actually does. An evidence model observes nothing on its own — until a confirmed task model delivers it, there is no route by which any session could produce the evidence it describes.",
                facts: (() => {

                    if (!Array.isArray(taskModels)) {
                        return ["Checking task models…"];
                    }

                    const referencing = taskModels.filter(
                        tm =>
                            Array.isArray(tm.evidenceModelIds) &&
                            tm.evidenceModelIds.includes(evidenceModel?.id)
                    );

                    if (!bound.length) {
                        return [
                            referencing.length
                                ? `${referencing.length} task model(s) reference this model, but none is confirmed`
                                : "No task model references this evidence model",
                            "Draft task models do not count — the link is not settled until the task model is confirmed",
                            "Required before activation",
                        ];
                    }

                    return [
                        `Bound by ${bound.length} confirmed task model(s)`,
                        ...bound.slice(0, 4).map(
                            tm => `${tm.name || tm.id} (${tm.status})`
                        ),
                        bound.length > 4 ? `…and ${bound.length - 4} more` : null,
                        referencing.length > bound.length
                            ? `${referencing.length - bound.length} further draft reference(s), not counted`
                            : null,
                    ];

                })(),
            },
            {
                key: "operational",
                title: "Operational Delivery & Recalibration",
                description:
                    "The model scores live sessions. New response data produces new parameter sets; activating one switches scoring without touching structure.",
                facts: [
                    dr && dr.type
                        ? `Decision rule: ${dr.type} ${dr.direction || ""} ${typeof dr.threshold === "number" ? dr.threshold : "—"}`
                        : "Decision rule not yet defined",
                    evidenceModel?.operationalMeta?.activatedAt
                        ? `Activated ${new Date(evidenceModel.operationalMeta.activatedAt).toLocaleString()}`
                        : "Not yet activated",
                    paramSets.length > 1
                        ? `${paramSets.length - 1} recalibration(s) recorded`
                        : "No recalibration yet",
                    evidenceModel?.operationalMeta?.suspendedAt
                        ? `Last suspended ${new Date(evidenceModel.operationalMeta.suspendedAt).toLocaleString()}`
                        : null,
                    evidenceModel?.operationalMeta?.reactivationCount
                        ? `Reactivated ${evidenceModel.operationalMeta.reactivationCount}×`
                        : null,
                    bound.length
                        ? `Delivered by: ${bound.map(tm => tm.name || tm.id).join(", ")}`
                        : null,
                ],
            },
        ];

    }, [evidenceModel, activeStatModel, taskModels]);

    /* =====================================================
       UI
    ===================================================== */

    return (

        <div className="space-y-6">

            {/* Header */}

            <div className="flex flex-wrap items-start justify-between gap-3">

                <div>

                    <div className="text-sm font-semibold text-slate-800">
                        Evidence Model Lifecycle
                    </div>

                    <div className="mt-1 text-sm text-slate-500">
                        Derived from this model's stored governance state — status,
                        lock, parameter sets and decision rule.
                    </div>

                </div>

                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${stageBadgeClass(stage)}`}>
                    {suspended
                        ? <PauseCircle size={12} strokeWidth={2.5} />
                        : archived
                            ? <Archive size={12} strokeWidth={2.5} />
                            : <CircleDot size={12} strokeWidth={2.5} />}
                    {stage}
                </span>

            </div>

            {/* Suspension banner */}

            {suspended && (

                <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3.5 text-sm text-orange-800">

                    <PauseCircle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />

                    <span>
                        This evidence model is <strong>suspended</strong>. It keeps its
                        calibration history and can be recalibrated, but it is not
                        scoring live sessions.
                    </span>

                </div>

            )}

            {archived && (

                <div className="flex items-start gap-3 rounded-lg border border-slate-300 bg-slate-100 px-4 py-3.5 text-sm text-slate-700">

                    <Archive size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-slate-500" />

                    <span>
                        This evidence model is <strong>archived</strong>. It is retired
                        from delivery and read-only: it accepts no new task-model or item
                        links and cannot be reactivated. Its calibration history is kept
                        so past results stay interpretable.
                    </span>

                </div>

            )}

            {/* Timeline */}

            <ol className="space-y-4">

                {stages.map((s, i) => {

                    const isCompleted = i < currentIndex;
                    const isCurrent = i === currentIndex && !suspended;

                    return (

                        <li
                            key={s.key}
                            className={`rounded-lg border p-4 ${isCurrent
                                ? "border-blue-400 bg-blue-50"
                                : isCompleted
                                    ? "border-emerald-200 bg-emerald-50"
                                    : "border-slate-200 bg-slate-50"
                                }`}
                        >

                            <div className="flex items-center justify-between gap-3">

                                <div className="flex items-center gap-2 font-medium text-slate-900">

                                    {isCompleted ? (
                                        <CheckCircle2 size={16} strokeWidth={2.25} className="shrink-0 text-emerald-600" />
                                    ) : isCurrent ? (
                                        <CircleDot size={16} strokeWidth={2.25} className="shrink-0 text-blue-600" />
                                    ) : (
                                        <Circle size={16} strokeWidth={2.25} className="shrink-0 text-slate-300" />
                                    )}

                                    Stage {i + 1}: {s.title}

                                </div>

                                <div className="shrink-0 text-xs text-slate-500">
                                    {isCurrent
                                        ? "Current stage"
                                        : isCompleted
                                            ? "Completed"
                                            : "Upcoming"}
                                </div>

                            </div>

                            <div className="mt-2 text-sm text-slate-700">
                                {s.description}
                            </div>

                            <ul className="ml-5 mt-3 list-disc space-y-1 text-xs text-slate-500">
                                {s.facts.filter(Boolean).map((f, k) => (
                                    <li key={k}>{f}</li>
                                ))}
                            </ul>

                        </li>

                    );

                })}

            </ol>

            {/* Governance notice */}

            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5 text-xs text-amber-800">

                <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />

                <span>
                    Structural changes are only possible while the evidence model is a
                    draft. After confirmation the structure is locked and the only
                    permitted change is appending a new parameter set through
                    recalibration — that is what keeps results from different
                    administrations on the same scale. To change structure, clone the
                    model into a new version.
                </span>

            </div>

        </div>

    );

}

/* =====================================================
   HELPERS
===================================================== */

function stageBadgeClass(stage) {

    if (stage === "operational") return "bg-emerald-100 text-emerald-700";
    if (stage === "bound") return "bg-indigo-100 text-indigo-700";
    if (stage === "calibrated") return "bg-blue-100 text-blue-700";
    if (stage === "confirmed") return "bg-slate-200 text-slate-700";
    if (stage === "reviewed") return "bg-amber-100 text-amber-700";
    if (stage === "suspended") return "bg-orange-100 text-orange-700";
    if (stage === "archived") return "bg-slate-200 text-slate-500";

    return "bg-slate-100 text-slate-600";
}
