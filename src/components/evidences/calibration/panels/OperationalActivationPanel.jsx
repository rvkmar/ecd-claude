// OperationalActivationPanel.jsx
// 🧠 Enterprise ECD — Operational Readiness Gate & Lifecycle Control
// ---------------------------------------------------------------
// Mirrors the server-side gate in PATCH /api/evidenceModels/:id/lifecycle
// so a button is never offered for a request the backend will refuse.
//
// Two fixes over the first pass:
//
//   1. Readiness. The original computed
//      `hasDecisionRule: !!model.decisionRule || {}` -- an empty object
//      is truthy, so that check passed unconditionally and the UI
//      offered activation for models the server then rejected.
//      Readiness now lives in engines/effectiveModel.js and each failed
//      check carries the remedy that clears it.
//
//   2. There is a way back. Activation used to be one-way: once a model
//      went operational, its parameters and decision rule were frozen
//      with no supported route to reopen them, and the calibration
//      controls stayed enabled but started failing server-side.
//      lifecycleMatrix.js has always declared
//      operational → suspended → operational; this panel finally walks it.
// ---------------------------------------------------------------

import React, { useMemo, useState } from "react";
import {
    AlertCircle,
    Archive,
    CheckCircle2,
    Circle,
    Loader2,
    PauseCircle,
    PlayCircle,
    Rocket,
} from "lucide-react";

import { useEvidenceModelLifecycle } from "@/api/queries/evidenceModels";
import { apiErrorMessage } from "@/api/apiClient";

import { computeReadiness } from "../engines/effectiveModel";

export default function OperationalActivationPanel({
    model,
    taskModels = null,
    onUpdateModel,
}) {

    const lifecycle = useEvidenceModelLifecycle();

    const [pendingTarget, setPendingTarget] = useState(null);

    const error = lifecycle.error
        ? apiErrorMessage(lifecycle.error, "Lifecycle transition failed.")
        : null;

    const { checks, ready } = useMemo(
        () => computeReadiness(model, taskModels),
        [model, taskModels]
    );

    const status = model?.status || "draft";

    const isOperational = status === "operational";
    const isSuspended = status === "suspended";
    const isArchived = status === "archived";

    const busy = lifecycle.isPending;

    const move = (nextStatus) => {
        setPendingTarget(nextStatus);
        lifecycle.mutate(
            { id: model.id, nextStatus },
            {
                onSuccess: (data) => onUpdateModel?.(data?.model || data),
                onSettled: () => setPendingTarget(null),
            }
        );
    };

    /* =====================================================
       UI
    ===================================================== */

    return (

        <div className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex flex-wrap items-start justify-between gap-3">

                <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <Rocket size={16} strokeWidth={2} className="text-slate-400" />
                        Operational Readiness
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                        Every check must pass before this evidence model may score
                        live sessions.
                    </div>
                </div>

                <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusBadgeClass(status, ready)}`}>
                    {isOperational
                        ? "Operational"
                        : isSuspended
                            ? "Suspended"
                            : isArchived
                                ? "Archived"
                                : ready
                                    ? "Ready"
                                    : "Not ready"}
                </span>

            </div>

            {/* ---------- state banner ---------- */}

            {isOperational && (

                <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800">

                    <CheckCircle2 size={16} strokeWidth={2} className="mt-0.5 shrink-0" />

                    <span>
                        This model is scoring live sessions. Calibration import,
                        parameter-set activation and the decision rule are all frozen
                        while it is live — <strong className="font-semibold">Deactivate</strong> to
                        reopen them, then reactivate once the change is verified.
                    </span>

                </div>

            )}

            {isSuspended && (

                <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3.5 text-sm text-orange-800">

                    <PauseCircle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />

                    <span>
                        This model is suspended: it is not scoring sessions, and the
                        calibration window is open again. Import a new calibration or
                        adjust the decision rule, then reactivate.
                        {model?.operationalMeta?.suspendedAt && (
                            <span className="mt-1 block text-xs text-orange-700/80">
                                Suspended {new Date(model.operationalMeta.suspendedAt).toLocaleString()}.
                            </span>
                        )}
                    </span>

                </div>

            )}

            {/* ---------- checklist ---------- */}

            <ul className="space-y-2.5">

                {checks.map(c => (

                    <li key={c.id} className="flex items-start gap-2.5 text-sm">

                        {c.ok ? (
                            <CheckCircle2 size={16} strokeWidth={2.25} className="mt-0.5 shrink-0 text-emerald-600" />
                        ) : c.pending ? (
                            <Loader2 size={16} strokeWidth={2.25} className="mt-0.5 shrink-0 animate-spin text-slate-400" />
                        ) : (
                            <Circle size={16} strokeWidth={2.25} className="mt-0.5 shrink-0 text-slate-300" />
                        )}

                        <span>
                            <span className={c.ok ? "text-slate-800" : "text-slate-600"}>
                                {c.label}
                            </span>
                            {c.ok && c.detail && (
                                <span className="mt-0.5 block text-xs text-slate-500">
                                    {c.detail}
                                </span>
                            )}
                            {!c.ok && (
                                <span className="mt-0.5 block text-xs text-slate-500">
                                    {c.remedy}
                                </span>
                            )}
                        </span>

                    </li>

                ))}

            </ul>

            {error && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
                    <AlertCircle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
                    {error}
                </div>
            )}

            {/* ---------- lifecycle controls ---------- */}

            <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5">

                {/* ACTIVATE / REACTIVATE — confirmed or suspended → operational */}

                <button
                    type="button"
                    onClick={() => move("operational")}
                    disabled={!ready || busy || isOperational || isArchived}
                    title={
                        isOperational
                            ? "Already operational"
                            : !ready
                                ? "Outstanding readiness checks"
                                : undefined
                    }
                    className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                >
                    <PlayCircle size={15} strokeWidth={2} />
                    {busy && pendingTarget === "operational"
                        ? (isSuspended ? "Reactivating…" : "Activating…")
                        : isOperational
                            ? "Already operational"
                            : isSuspended
                                ? "Reactivate"
                                : "Activate for live delivery"}
                </button>

                {/* DEACTIVATE — operational → suspended */}

                <button
                    type="button"
                    onClick={() => move("suspended")}
                    disabled={!isOperational || busy}
                    title={
                        isOperational
                            ? "Take the model out of live delivery and reopen calibration"
                            : "Only an operational model can be deactivated"
                    }
                    className="inline-flex items-center gap-1.5 rounded-md border border-orange-300 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:shadow-none"
                >
                    <PauseCircle size={15} strokeWidth={2} />
                    {busy && pendingTarget === "suspended" ? "Deactivating…" : "Deactivate"}
                </button>

                {/* ARCHIVE — terminal */}

                <button
                    type="button"
                    onClick={() => move("archived")}
                    disabled={isArchived || busy || status === "draft"}
                    title="Retire this model permanently. Archived models accept no new links and cannot be reactivated."
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300"
                >
                    <Archive size={15} strokeWidth={2} />
                    {busy && pendingTarget === "archived" ? "Archiving…" : "Archive"}
                </button>

            </div>

            <div className="space-y-1 text-xs text-slate-500">

                {isOperational && model?.operationalMeta?.activatedAt && (
                    <div>
                        Activated {new Date(model.operationalMeta.activatedAt).toLocaleString()}
                        {model.operationalMeta.reactivationCount > 0 &&
                            ` · reactivated ${model.operationalMeta.reactivationCount}×`}
                    </div>
                )}

                <div>
                    Permitted moves from <span className="font-mono">{status}</span>:{" "}
                    <span className="font-mono">
                        {(TRANSITION_HINTS[status] || ["—"]).join(", ")}
                    </span>
                </div>

            </div>

        </div>

    );

}

/* =====================================================
   HELPERS
===================================================== */

// Mirrors TRANSITIONS in server/utils/lifecycleMatrix.js — shown so the
// operator can see why a button is greyed rather than guessing.
const TRANSITION_HINTS = {
    draft: ["reviewed"],
    reviewed: ["draft", "confirmed"],
    confirmed: ["operational", "archived"],
    operational: ["suspended", "archived"],
    suspended: ["operational", "archived"],
    archived: [],
};

function statusBadgeClass(status, ready) {

    if (status === "operational") return "bg-emerald-100 text-emerald-700";
    if (status === "suspended") return "bg-orange-100 text-orange-700";
    if (status === "archived") return "bg-slate-200 text-slate-600";

    return ready ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600";
}
