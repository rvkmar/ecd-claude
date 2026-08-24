// TaskModelList.jsx
// ------------------------------------------------------------
// Task Model List — governance card view
// ------------------------------------------------------------
// The working list inside "Operate Task Model": filter, inspect, open,
// delete, and drive lifecycle transitions.
//
// CHANGES IN THIS REWORK
// ----------------------
// • DOUBLE DELETE. This list called `deleteTaskModel.mutate(id)` itself
//   and then invoked `onDelete(id)`, whose owner (TaskModelBuilderPanel)
//   fired a SECOND delete for the same id. The second request 404s, so a
//   successful delete reliably produced both a success and a failure
//   toast. Deletion is owned here now; `onDelete` is a notification only.
//
// • The competency lookup and the "Primary Claim" row are gone -- a Task
//   Model no longer declares a competency. The primary Evidence Model is
//   shown in its place, which is the binding that actually governs the
//   inference.
//
// • Validity comes from the shared computeValidity() in
//   taskModelConstants.js rather than a local copy that disagreed with
//   the wizard's own readiness rules.
//
// • Lifecycle buttons are labelled and explained rather than rendering
//   the bare status string as a button caption.
//
// The cross-import of TRANSITIONS from server/utils/lifecycleMatrix is
// deliberate and matches the existing convention in this codebase
// (src/utils/schema.js and src/components/ui/LifecycleStatusBadge.jsx do
// the same): one declaration of the lifecycle, shared by both sides.
// ------------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, Star } from "lucide-react";
import { TRANSITIONS } from "../../../server/utils/lifecycleMatrix";
import Modal from "../ui/Modal";
import LifecycleStatusBadge from "../ui/LifecycleStatusBadge";
import {
    useCloneTaskModel,
    useDeleteTaskModel,
    useForceDeactivateTaskModel,
    useTaskModelDependents,
    useTaskModels,
} from "@/api/queries/taskModels";
import { useEvidenceModels } from "@/api/queries/evidenceModels";
import { useItems } from "@/api/queries/items";
import { openActionLabel } from "@/utils/modelActionLabel";
import {
    activationBlockers,
    computeValidity,
    formatWeight,
    sumWeights,
} from "./taskModelConstants";

const VALIDITY_TONE = {
    valid: "bg-emerald-100 text-emerald-700",
    incomplete: "bg-amber-100 text-amber-700",
    invalid: "bg-red-100 text-red-700",
};

const TRANSITION_COPY = {
    reviewed: "Send for review",
    draft: "Return to draft",
    confirmed: "Lock & confirm",
    operational: "Activate",
    suspended: "Suspend",
    archived: "Archive",
};

export default function TaskModelList({ onEdit, onDelete, onPromote }) {
    const [expandedId, setExpandedId] = useState(null);
    const [filters, setFilters] = useState({ status: "all", validity: "all" });

    const [deleteModal, setDeleteModal] = useState({
        open: false,
        id: null,
        name: "",
    });

    const [lifecycleConfirm, setLifecycleConfirm] = useState({
        open: false,
        model: null,
        nextStatus: null,
    });

    // Force Deactivate gets its own dialog rather than reusing the generic
    // lifecycle one: it ends other people's in-flight sessions, and a
    // confirmation that does not say how many is not a confirmation.
    const [forceTarget, setForceTarget] = useState(null);
    const [forceReason, setForceReason] = useState("");

    /* ---------------- Data (shared caches) ---------------- */

    const {
        data: taskModels = [],
        isLoading: loading,
        isError: taskModelsError,
    } = useTaskModels();

    const { data: evidenceModels = [] } = useEvidenceModels();

    // Activation depends on the item bank as well as the evidence models,
    // so the list needs both to know whether Activate can be offered.
    // Shared React Query cache — TaskModelBuilderPanel already fetches
    // these, so this costs no extra request.
    const { data: items = [] } = useItems();

    useEffect(() => {
        if (taskModelsError) toast.error("Failed to load task models");
    }, [taskModelsError]);

    const deleteTaskModel = useDeleteTaskModel();

    /* Cloning is the documented escape hatch from a locked model -- both
       the wizard's read-only banner and the server's 409 tell the author
       to "clone instead". There was no clone affordance anywhere in the
       UI, and useCloneTaskModel() had no call sites at all, so that
       instruction pointed at nothing. */
    const cloneTaskModel = useCloneTaskModel();

    const forceDeactivate = useForceDeactivateTaskModel();

    const handleForceDeactivate = () => {
        if (!forceTarget) return;

        forceDeactivate.mutate(
            { id: forceTarget.id, reason: forceReason.trim() || undefined },
            {
                onSuccess: (result) => {
                    toast.success(result?.message || "Task Model deactivated.");
                    setForceTarget(null);
                    setForceReason("");
                },
                onError: (err) =>
                    toast.error(
                        err?.message || "Failed to force-deactivate this Task Model."
                    ),
            }
        );
    };

    const handleClone = (model) => {
        cloneTaskModel.mutate(model.id, {
            onSuccess: (created) => {
                toast.success(
                    `Cloned as v${created?.versionNumber ?? "?"} draft. Edit the new version.`
                );
            },
            onError: () => toast.error("Failed to clone Task Model"),
        });
    };

    const evidenceById = useMemo(() => {
        const map = {};
        evidenceModels.forEach((em) => {
            map[em.id] = em;
        });
        return map;
    }, [evidenceModels]);

    /* ---------------- Filtering ---------------- */

    const filteredModels = useMemo(
        () =>
            taskModels.filter((m) => {
                if (filters.status !== "all" && m.status !== filters.status) return false;
                if (
                    filters.validity !== "all" &&
                    computeValidity(m) !== filters.validity
                ) {
                    return false;
                }
                return true;
            }),
        [taskModels, filters]
    );

    /* ---------------- Delete ---------------- */

    const confirmDelete = () => {
        const { id } = deleteModal;
        if (!id) return;

        deleteTaskModel.mutate(id, {
            onSuccess: () => {
                toast.success("Task Model deleted");
                // Notification only -- the owner must NOT delete again.
                onDelete?.(id);
            },
            onError: () => toast.error("Failed to delete Task Model"),
        });

        setDeleteModal({ open: false, id: null, name: "" });
    };

    if (loading) {
        return <p className="text-sm text-slate-500">Loading task models…</p>;
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
                    aria-label="Filter by lifecycle status"
                >
                    <option value="all">All statuses</option>
                    <option value="draft">Draft</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="operational">Operational</option>
                    <option value="suspended">Suspended</option>
                    <option value="archived">Archived</option>
                </select>

                <select
                    value={filters.validity}
                    onChange={(e) => setFilters({ ...filters, validity: e.target.value })}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
                    aria-label="Filter by structural validity"
                >
                    <option value="all">All validity</option>
                    <option value="valid">Valid</option>
                    <option value="incomplete">Incomplete</option>
                    <option value="invalid">Invalid</option>
                </select>

                <span className="text-sm text-slate-400">
                    {filteredModels.length} of {taskModels.length}
                </span>
            </div>

            {taskModels.length === 0 && (
                <p className="text-sm text-slate-500">
                    No Task Models defined yet.
                </p>
            )}

            {taskModels.length > 0 && filteredModels.length === 0 && (
                <p className="text-sm text-slate-500">
                    No Task Models match the current filters.
                </p>
            )}

            {/* Cards */}
            {filteredModels.map((m) => {
                const expanded = expandedId === m.id;
                const validity = computeValidity(m);
                const boundIds = m.evidenceModelIds || [];
                const primary = evidenceById[m.primaryEvidenceModelId];
                const observations = m.expectedObservations || [];

                // Why this Task Model cannot be activated right now, or [] if
                // it can. Same source as the wizard's Operational
                // Prerequisites panel and the server's activation gate, so
                // the three cannot disagree about what is missing.
                const blockers =
                    TRANSITIONS[m.status]?.includes("operational")
                        ? activationBlockers(m, items, evidenceModels)
                        : [];

                return (
                    <div key={m.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
                        <button
                            type="button"
                            onClick={() => setExpandedId(expanded ? null : m.id)}
                            className="flex w-full items-start justify-between gap-4 p-4 text-left"
                            aria-expanded={expanded}
                        >
                            <div className="min-w-0">
                                <h3 className="truncate font-semibold text-slate-900">
                                    {expanded ? "▾" : "▸"} {m.name || "Untitled Task Model"}
                                </h3>
                                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                    <span
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold uppercase tracking-wide ${VALIDITY_TONE[validity]}`}
                                    >
                                        {validity}
                                    </span>
                                    <span>v{m.versionNumber ?? 1}</span>
                                    <span>
                                        {boundIds.length} evidence model
                                        {boundIds.length === 1 ? "" : "s"}
                                    </span>
                                    <span>
                                        {observations.length} observable
                                        {observations.length === 1 ? "" : "s"}
                                    </span>
                                </div>
                            </div>

                            <LifecycleStatusBadge status={m.status} className="shrink-0" />
                        </button>

                        {expanded && (
                            <div className="space-y-4 border-t border-slate-100 px-6 py-5 text-sm">
                                {m.description && (
                                    <p className="leading-relaxed text-slate-600">
                                        {m.description}
                                    </p>
                                )}

                                <div>
                                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                        Evidence binding
                                    </div>
                                    {boundIds.length === 0 ? (
                                        <p className="mt-1 text-slate-400">None bound.</p>
                                    ) : (
                                        <ul className="mt-1 space-y-1">
                                            {boundIds.map((id) => (
                                                <li key={id} className="text-slate-700">
                                                    {evidenceById[id]?.name || id}
                                                    {id === m.primaryEvidenceModelId && (
                                                        <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                                                            <Star size={11} strokeWidth={2.5} />
                                                            primary
                                                        </span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {primary === undefined && boundIds.length > 0 && (
                                        <p className="mt-1 text-xs text-amber-700">
                                            No primary Evidence Model nominated.
                                        </p>
                                    )}
                                </div>

                                <div className="grid gap-x-8 gap-y-1.5 text-xs text-slate-500 sm:grid-cols-3">
                                    <Pair
                                        label="Presentation"
                                        value={m.taskStructure?.presentationMode || "—"}
                                    />
                                    <Pair
                                        label="Response"
                                        value={m.taskStructure?.responseFormat || "—"}
                                    />
                                    <Pair
                                        label="Composition"
                                        value={m.taskCompositionType || "—"}
                                    />
                                    <Pair
                                        label="Observable weight"
                                        value={formatWeight(sumWeights(observations))}
                                    />
                                    <Pair
                                        label="Items in scope"
                                        value={(m.selectedItemIds || []).length}
                                    />
                                    <Pair
                                        label="Equivalence group"
                                        value={m.equivalenceGroupId || "—"}
                                        literal={Boolean(m.equivalenceGroupId)}
                                    />
                                </div>

                                <div className="flex flex-wrap gap-2 pt-1">
                                    <button
                                        onClick={() => onEdit?.(m)}
                                        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-800"
                                    >
                                        {openActionLabel(m)}
                                    </button>

                                    {m.locked && (
                                        <button
                                            onClick={() => handleClone(m)}
                                            disabled={cloneTaskModel.isPending}
                                            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                            title="Create an editable draft copy at the next version number"
                                        >
                                            {cloneTaskModel.isPending ? "Cloning…" : "Clone to new version"}
                                        </button>
                                    )}

                                    {!m.locked && (
                                        <button
                                            onClick={() =>
                                                setDeleteModal({
                                                    open: true,
                                                    id: m.id,
                                                    name: m.name || m.id,
                                                })
                                            }
                                            className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                                        >
                                            Delete
                                        </button>
                                    )}

                                    {m.status === "operational" && (
                                        <button
                                            onClick={() => {
                                                setForceTarget(m);
                                                setForceReason("");
                                            }}
                                            className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50"
                                            title="Close every live session on this Task Model and deactivate it"
                                        >
                                            Force Deactivate
                                        </button>
                                    )}

                                    {(TRANSITIONS[m.status] || []).map((nextStatus) => {
                                        // Activation is the one transition with
                                        // preconditions the client can evaluate
                                        // itself. Offering an enabled button that
                                        // the server is certain to refuse is a
                                        // worse experience than saying up front
                                        // what is missing.
                                        const blocked =
                                            nextStatus === "operational" && blockers.length > 0;

                                        return (
                                            <button
                                                key={nextStatus}
                                                disabled={blocked}
                                                aria-describedby={
                                                    blocked ? `activation-blockers-${m.id}` : undefined
                                                }
                                                onClick={() =>
                                                    setLifecycleConfirm({
                                                        open: true,
                                                        model: m,
                                                        nextStatus,
                                                    })
                                                }
                                                title={
                                                    blocked
                                                        ? `Cannot activate yet: ${blockers
                                                            .map((b) => b.label)
                                                            .join("; ")}`
                                                        : undefined
                                                }
                                                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${blocked
                                                    ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                                                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                                    }`}
                                            >
                                                {TRANSITION_COPY[nextStatus] || nextStatus}
                                            </button>
                                        );
                                    })}
                                </div>

                                {blockers.length > 0 && (
                                    <div
                                        id={`activation-blockers-${m.id}`}
                                        className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5"
                                    >
                                        <div className="flex items-start gap-2.5">
                                            <AlertTriangle
                                                size={15}
                                                strokeWidth={2.25}
                                                className="mt-0.5 shrink-0 text-amber-700"
                                            />
                                            <div className="min-w-0">
                                                <div className="text-sm font-semibold text-amber-900">
                                                    {m.status === "suspended"
                                                        ? "Cannot be reactivated yet"
                                                        : "Cannot be activated yet"}
                                                </div>
                                                <ul className="mt-2 space-y-1.5">
                                                    {blockers.map((b) => (
                                                        <li key={b.key} className="text-sm text-amber-800">
                                                            <span className="font-medium">{b.label}</span>
                                                            {b.detail && (
                                                                <span className="block text-xs text-amber-700">
                                                                    {b.detail}
                                                                </span>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Delete confirmation */}
            <Modal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, id: null, name: "" })}
                onConfirm={confirmDelete}
                title="Delete Task Model"
                message={`Delete "${deleteModal.name}"? This cannot be undone.`}
                confirmClass="bg-red-600 hover:bg-red-700 text-white"
            />

            {forceTarget && (
                <ForceDeactivateDialog
                    model={forceTarget}
                    reason={forceReason}
                    onReasonChange={setForceReason}
                    pending={forceDeactivate.isPending}
                    onCancel={() => {
                        setForceTarget(null);
                        setForceReason("");
                    }}
                    onConfirm={handleForceDeactivate}
                />
            )}

            {/* Lifecycle confirmation */}
            <Modal
                isOpen={lifecycleConfirm.open}
                onClose={() =>
                    setLifecycleConfirm({ open: false, model: null, nextStatus: null })
                }
                onConfirm={async () => {
                    // The promote mutation invalidates the shared taskModels query
                    // on success, so this list re-renders with fresh data; no local
                    // state patch is needed.
                    await onPromote?.(lifecycleConfirm.model, lifecycleConfirm.nextStatus);
                    setLifecycleConfirm({ open: false, model: null, nextStatus: null });
                }}
                title="Change lifecycle state"
                message={
                    lifecycleConfirm.model
                        ? `Move "${lifecycleConfirm.model.name || lifecycleConfirm.model.id}" from ${lifecycleConfirm.model.status} to ${lifecycleConfirm.nextStatus}?`
                        : ""
                }
                confirmClass="bg-slate-900 hover:bg-slate-800 text-white"
            />
        </div>
    );
}

// Stacked, not side by side. `flex` + `truncate` starved the value of
// width in a three-up grid -- the same layout bug that reduced the
// evidence card's metadata to single characters in Step 2.
// `capitalize` is right for enum values rendered raw ("interactive",
// "atomic") and WRONG for anything matched literally elsewhere. The
// equivalence group id is the clearest case: grouping compares these
// strings exactly, so displaying "multistep-linear-equation-v1" as
// "Multistep-Linear-Equation-V1" invites someone to retype the
// title-cased form into the next model and silently fail to group.
function Pair({ label, value, literal = false }) {
    return (
        <div className="min-w-0">
            <span className="block text-[11px] uppercase tracking-wide text-slate-400">
                {label}
            </span>
            <span
                className={`block break-words font-medium text-slate-600 ${literal ? "font-mono text-xs" : "capitalize"
                    }`}
            >
                {value}
            </span>
        </div>
    );
}

/* Force Deactivate confirmation.

   Fetches the dependants on open so it can name the cost -- how many live
   sessions will be closed, and for whom -- instead of asking the user to
   confirm an unknown quantity. Deliberately not the shared ui/Modal:
   that one renders a title and a message and nothing else, and this needs
   a live count and a reason field. */
function ForceDeactivateDialog({
    model,
    reason,
    onReasonChange,
    pending,
    onCancel,
    onConfirm,
}) {
    const { data, isLoading, isError } = useTaskModelDependents(model.id);
    const live = data?.sessions?.live ?? null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <AlertTriangle size={18} strokeWidth={2.25} className="text-red-600" />
                    Force deactivate "{model.name || model.id}"?
                </h2>

                <div className="mt-3 space-y-3 text-sm text-slate-600">
                    {isLoading && <p>Checking what depends on this Task Model…</p>}

                    {isError && (
                        <p className="text-amber-700">
                            Could not read the dependants. Proceeding will still close
                            whatever live sessions exist — the server recounts them.
                        </p>
                    )}

                    {live !== null && (
                        <p className={live > 0 ? "font-medium text-slate-900" : ""}>
                            {live === 0
                                ? "No live sessions depend on this Task Model. Deactivating is safe."
                                : `${live} live session${live === 1 ? "" : "s"} will be closed.`}
                        </p>
                    )}

                    {live > 0 && (
                        <ul className="max-h-32 space-y-1 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">
                            {(data.sessions.liveSessions || []).map((s) => (
                                <li key={s.id}>
                                    {s.id}
                                    {s.studentId ? ` · student ${s.studentId}` : ""} ·{" "}
                                    {s.status} · {s.responses} response
                                    {s.responses === 1 ? "" : "s"}
                                </li>
                            ))}
                        </ul>
                    )}

                    <p className="text-xs text-slate-500">
                        Closed sessions are submitted, not deleted — every response
                        already collected is locked and stays scorable. Students cannot
                        resume them.
                    </p>
                </div>

                <label className="mt-4 block">
                    <span className="mb-1.5 block text-xs font-medium text-slate-600">
                        Reason (recorded on the Task Model and on every closed session)
                    </span>
                    <input
                        type="text"
                        value={reason}
                        onChange={(e) => onReasonChange(e.target.value)}
                        placeholder="e.g. calibration error found in the bound evidence model"
                        className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                </label>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        disabled={pending}
                        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={pending}
                        className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {pending
                            ? "Deactivating…"
                            : live > 0
                                ? `Close ${live} session${live === 1 ? "" : "s"} & deactivate`
                                : "Deactivate"}
                    </button>
                </div>
            </div>
        </div>
    );
}
