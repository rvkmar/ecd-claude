// Step1Identity.jsx
// ------------------------------------------------------------
// Task Model Wizard — Step 1: Task Identity
// ------------------------------------------------------------
// Names the Task Model and records the design rationale behind it.
//
// COMPETENCY SELECTION WAS REMOVED FROM THIS STEP.
// A Task Model is bound to Evidence Models and nothing else: the
// competency is already a property of the Evidence Model
// (evidenceModel.competencyId), so asking for it again here created a
// second, unvalidated source of truth that could contradict the bound
// evidence. The construct this task speaks to is now *derived* from the
// evidence binding in Step 2 and displayed read-only, rather than
// re-declared by the author.
// ------------------------------------------------------------

import { Info } from "lucide-react";
import InfoTooltip from "../../../ui/InfoTooltip";

const inputBase =
    "w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition " +
    "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 " +
    "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed";

const labelBase = "mb-1.5 block text-sm font-medium text-slate-700";

export default function Step1Identity({ draft, setDraft, disabled }) {
    const update = (field, value) => {
        if (disabled) return;
        setDraft((prev) => ({ ...prev, [field]: value }));
    };

    const nameLength = (draft.name || "").trim().length;
    const descriptionLength = (draft.description || "").trim().length;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-slate-900">Task Identity</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Name this Task Model and state what it is for. Everything
                    downstream — evidence binding, observable targeting, item
                    authoring — hangs off this record, so the name should read the
                    same way to an item author two years from now.
                </p>
            </div>

            <div className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                    <label className={labelBase} htmlFor="task-model-name">
                        Task Model Name
                        <span className="ml-1 text-red-600">*</span>
                    </label>
                    <input
                        id="task-model-name"
                        className={inputBase}
                        type="text"
                        value={draft.name || ""}
                        disabled={disabled}
                        placeholder="e.g. Multi-step linear equation, worked justification"
                        onChange={(e) => update("name", e.target.value)}
                    />
                    {nameLength === 0 && !disabled && (
                        <p className="mt-1.5 text-xs font-medium text-amber-700">
                            A name is required before you can continue.
                        </p>
                    )}
                </div>

                <div>
                    <label className={labelBase} htmlFor="task-model-description">
                        Description — Measurement Intent
                        <span className="ml-1 text-red-600">*</span>
                    </label>
                    <textarea
                        id="task-model-description"
                        className={`${inputBase} min-h-[120px]`}
                        value={draft.description || ""}
                        disabled={disabled}
                        placeholder="What does an examinee actually do here, and what does doing it well tell you?"
                        onChange={(e) => update("description", e.target.value)}
                    />
                    {descriptionLength === 0 && !disabled && (
                        <p className="mt-1.5 text-xs font-medium text-amber-700">
                            A description is required before you can continue.
                        </p>
                    )}
                </div>

                <div>
                    <label className={labelBase} htmlFor="task-model-rationale">
                        <span className="inline-flex items-center gap-1.5">
                            Design Rationale
                            <InfoTooltip content="Why this task form was chosen over the alternatives. Reviewers read this first; it is optional but strongly recommended." />
                        </span>
                    </label>
                    <textarea
                        id="task-model-rationale"
                        className={`${inputBase} min-h-[100px]`}
                        value={draft.designRationale || ""}
                        disabled={disabled}
                        placeholder="Why this task form, and why not the obvious alternatives?"
                        onChange={(e) => update("designRationale", e.target.value)}
                    />
                </div>
            </div>

            {/* Governance metadata — server-owned, shown for orientation. */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start gap-3">
                    <Info size={16} strokeWidth={2.25} className="mt-0.5 shrink-0 text-slate-400" />
                    <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-3 text-sm lg:grid-cols-4">
                        <Metadatum label="Identifier" value={draft.id || "Assigned on first save"} />
                        <Metadatum label="Version" value={`v${draft.versionNumber || 1}`} />
                        <Metadatum label="Lifecycle" value={draft.status || "draft"} />
                        <Metadatum
                            label="Derived from"
                            value={draft.parentModelId || "Original"}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// `truncate` clipped every one of these to a few characters in the
// four-up grid ("Assigned O…"). An id and a status are short enough to
// show in full; wrap instead of clipping, and keep the title attribute
// for anything unusually long.
function Metadatum({ label, value }) {
    return (
        <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {label}
            </div>
            <div
                className="mt-0.5 break-words text-sm capitalize text-slate-700"
                title={String(value)}
            >
                {value}
            </div>
        </div>
    );
}
