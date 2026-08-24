// Step7Fairness.jsx
// ------------------------------------------------------------
// Task Model Wizard — Step 7: Fairness & Accessibility
// ------------------------------------------------------------
// Documents construct-irrelevant variance this task form is exposed to,
// what is being done about it, and what the task assumes about the
// examinee's access.
//
// Two things were wrong with the previous StepFairness.jsx:
//
//  1. THE DELETE DIALOG NEVER OPENED. It rendered
//     `<Modal onClose=...>{children}</Modal>`, but src/components/ui/Modal.jsx
//     takes `{isOpen, onClose, onConfirm, title, message}` and renders no
//     children -- with `isOpen` undefined it returned null. A fairness
//     risk, once added, could not be removed. Removal is now inline and
//     immediate (a one-line text record does not warrant a confirmation
//     dialog), with the row's own X button.
//
//  2. Risks were bare strings. There was no way to say how serious one
//     was, what kind of bias it represented, or what mitigated it -- so
//     the "Mitigation & Validity Notes" box was one undifferentiated
//     blob for the whole task. Risks are structured records now, and
//     records authored under the old shape are upgraded on read by
//     normalizeFairnessRisks().
// ------------------------------------------------------------

import { useMemo } from "react";
import { AlertTriangle, Plus, X } from "lucide-react";
import InfoTooltip from "../../../ui/InfoTooltip";
import {
    FAIRNESS_CATEGORIES,
    FAIRNESS_SEVERITIES,
    normalizeFairnessRisks,
} from "../../taskModelConstants";

const inputBase =
    "w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition " +
    "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 " +
    "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed";

const SEVERITY_TONE = {
    low: "bg-slate-100 text-slate-600",
    medium: "bg-amber-100 text-amber-700",
    high: "bg-red-100 text-red-700",
};

export default function Step7Fairness({ draft, setDraft, disabled }) {
    const risks = useMemo(
        () => normalizeFairnessRisks(draft.fairnessRisks || []),
        [draft.fairnessRisks]
    );

    const accessibility = draft.accessibilityAssumptions || {};

    const unmitigatedHigh = risks.filter(
        (r) => r.severity === "high" && !r.mitigation.trim()
    );

    /* ---------------- Mutations ---------------- */

    const writeRisks = (transform) => {
        if (disabled) return;
        setDraft((prev) => ({
            ...prev,
            fairnessRisks: transform(normalizeFairnessRisks(prev.fairnessRisks || [])),
        }));
    };

    const addRisk = () =>
        writeRisks((current) => [
            ...current,
            {
                id: `risk-${Date.now()}-${current.length}`,
                category: "construct_irrelevant",
                description: "",
                severity: "medium",
                mitigation: "",
            },
        ]);

    const updateRisk = (id, patch) =>
        writeRisks((current) =>
            current.map((r) => (r.id === id ? { ...r, ...patch } : r))
        );

    const removeRisk = (id) =>
        writeRisks((current) => current.filter((r) => r.id !== id));

    const updateAccessibility = (field, value) => {
        if (disabled) return;
        setDraft((prev) => ({
            ...prev,
            accessibilityAssumptions: {
                ...(prev.accessibilityAssumptions || {}),
                [field]: value,
            },
        }));
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-slate-900">
                    Fairness & Accessibility
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Record what could make performance on this task reflect something
                    other than the construct, and what the task assumes about access.
                    Accessibility assumptions are required before this Task Model can
                    be made operational.
                </p>
            </div>

            {/* Risk register */}
            <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                    <h3 className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                        Fairness Risk Register
                        <InfoTooltip content="Each entry names one source of construct-irrelevant variance, how serious it is, and what is being done about it." />
                    </h3>
                    {!disabled && (
                        <button
                            type="button"
                            onClick={addRisk}
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                        >
                            <Plus size={14} strokeWidth={2.25} />
                            Add risk
                        </button>
                    )}
                </div>

                {risks.length === 0 && (
                    <p className="text-sm text-slate-400">
                        No risks documented. An empty register is a claim in itself —
                        make sure it is one you can defend at review.
                    </p>
                )}

                <div className="space-y-4">
                    {risks.map((risk) => (
                        <div
                            key={risk.id}
                            className="rounded-lg border border-slate-200 bg-slate-50/60 p-4"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="grid flex-1 gap-4 md:grid-cols-5">
                                    {/* Category needs more room than an even
                                        half: a native select clips its own text,
                                        and "Construct-irrelevant variance" was
                                        rendering as "Construct-irrelevant v…".
                                        3/5 for the label, 2/5 for the three
                                        severity pills, which need less. */}
                                    <div className="md:col-span-3">
                                        <label className="mb-1.5 block text-xs font-medium text-slate-600">
                                            Category
                                        </label>
                                        <select
                                            value={risk.category}
                                            disabled={disabled}
                                            onChange={(e) =>
                                                updateRisk(risk.id, { category: e.target.value })
                                            }
                                            className={inputBase}
                                        >
                                            {FAIRNESS_CATEGORIES.map((c) => (
                                                <option key={c.value} value={c.value}>
                                                    {c.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="mb-1.5 block text-xs font-medium text-slate-600">
                                            Severity
                                        </label>
                                        <div className="flex gap-2">
                                            {FAIRNESS_SEVERITIES.map((s) => (
                                                <button
                                                    key={s.value}
                                                    type="button"
                                                    disabled={disabled}
                                                    onClick={() =>
                                                        updateRisk(risk.id, { severity: s.value })
                                                    }
                                                    className={`rounded-md px-3 py-2 text-xs font-semibold transition ${risk.severity === s.value
                                                        ? SEVERITY_TONE[s.value]
                                                        : "border border-slate-300 bg-white text-slate-500 hover:bg-slate-50"
                                                        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                                                >
                                                    {s.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="md:col-span-5">
                                        <label className="mb-1.5 block text-xs font-medium text-slate-600">
                                            Risk description
                                        </label>
                                        <input
                                            type="text"
                                            value={risk.description}
                                            disabled={disabled}
                                            placeholder="What could cause performance to reflect something other than the construct?"
                                            onChange={(e) =>
                                                updateRisk(risk.id, { description: e.target.value })
                                            }
                                            className={inputBase}
                                        />
                                    </div>

                                    <div className="md:col-span-5">
                                        <label className="mb-1.5 block text-xs font-medium text-slate-600">
                                            Mitigation
                                        </label>
                                        <input
                                            type="text"
                                            value={risk.mitigation}
                                            disabled={disabled}
                                            placeholder="What the task design does about it"
                                            onChange={(e) =>
                                                updateRisk(risk.id, { mitigation: e.target.value })
                                            }
                                            className={inputBase}
                                        />
                                    </div>
                                </div>

                                {!disabled && (
                                    <button
                                        type="button"
                                        onClick={() => removeRisk(risk.id)}
                                        aria-label="Remove risk"
                                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                    >
                                        <X size={15} strokeWidth={2.25} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {unmitigatedHigh.length > 0 && (
                    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-800">
                        <AlertTriangle size={16} strokeWidth={2.25} className="mt-0.5 shrink-0" />
                        <span>
                            {unmitigatedHigh.length} high-severity risk
                            {unmitigatedHigh.length === 1 ? " has" : "s have"} no recorded
                            mitigation. Reviewers will ask.
                        </span>
                    </div>
                )}
            </section>

            {/* Validity narrative */}
            <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800">
                    Validity Narrative
                </h3>
                <p className="text-sm text-slate-500">
                    The argument a reviewer reads alongside the register: why the
                    remaining risks are acceptable for this task's intended use.
                </p>
                <textarea
                    value={draft.fairnessNotes || ""}
                    disabled={disabled}
                    rows={5}
                    onChange={(e) =>
                        setDraft((prev) => ({ ...prev, fairnessNotes: e.target.value }))
                    }
                    className={inputBase}
                    placeholder="Summarize the residual risk and why it is tolerable."
                />
            </section>

            {/* Accessibility */}
            <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                        Accessibility Assumptions
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Required before this Task Model can be promoted to operational.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Assistive Technology Support
                        </label>
                        <input
                            type="text"
                            value={accessibility.assistiveSupport || ""}
                            disabled={disabled}
                            placeholder="e.g. screen-reader compatible, no drag interactions"
                            onChange={(e) =>
                                updateAccessibility("assistiveSupport", e.target.value)
                            }
                            className={inputBase}
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Language Load
                        </label>
                        <input
                            type="text"
                            value={accessibility.languageLoad || ""}
                            disabled={disabled}
                            placeholder="e.g. reading demand below the target grade band"
                            onChange={(e) =>
                                updateAccessibility("languageLoad", e.target.value)
                            }
                            className={inputBase}
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Permitted Accommodations
                        </label>
                        <input
                            type="text"
                            value={accessibility.accommodations || ""}
                            disabled={disabled}
                            placeholder="e.g. extended time, scribe"
                            onChange={(e) =>
                                updateAccessibility("accommodations", e.target.value)
                            }
                            className={inputBase}
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Sensory / Motor Demands
                        </label>
                        <input
                            type="text"
                            value={accessibility.sensoryMotorDemands || ""}
                            disabled={disabled}
                            placeholder="e.g. requires fine pointer control"
                            onChange={(e) =>
                                updateAccessibility("sensoryMotorDemands", e.target.value)
                            }
                            className={inputBase}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}
