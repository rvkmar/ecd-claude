// Step3Observables.jsx
// ------------------------------------------------------------
// Task Model Wizard — Step 3: Observable Targeting
// ------------------------------------------------------------
// Declares which observables of the bound Evidence Models this task is
// expected to produce, which of them are mandatory, and how the task's
// evidential weight is allocated across them.
//
// THE WEIGHT BUG THIS STEP EXISTS TO FIX
// --------------------------------------
// Both src/utils/schema.js and server/routes/taskModelsRoutes.js reject a
// Task Model whose expectedObservations weights do not sum to 1.0. The
// previous UI defaulted every newly added observable to `weight: 1` and
// rendered the field as `<input type="number" min="1">`, rejecting any
// entry <= 0. So with two or more observables the sum was >= 2 and the
// author had no way to type 0.5 -- the wizard could not save a Task Model
// with more than one observable at all, and the failure surfaced as an
// opaque 400 on Next.
//
// Weights are a proportional allocation now: fractional input, a live
// allocation bar, and one-click Normalize / Distribute evenly. All the
// arithmetic lives in taskModelConstants.js so the wizard context and the
// review step agree with what is shown here.
// ------------------------------------------------------------

import { useMemo } from "react";
import { AlertTriangle, Info, Scale, SlidersHorizontal } from "lucide-react";
import InfoTooltip from "../../../ui/InfoTooltip";
import {
    addObservationWeight,
    distributeWeightsEvenly,
    formatWeight,
    normalizeWeights,
    removeObservationWeight,
    round4,
    sumWeights,
    weightsAreNormalized,
    zeroWeightObservations,
} from "../../taskModelConstants";

export default function Step3Observables({
    draft,
    setDraft,
    evidenceModels = [],
    disabled,
}) {
    const selectedObservations = draft.expectedObservations || [];

    const boundEvidenceModels = useMemo(
        () =>
            (evidenceModels || []).filter((em) =>
                (draft.evidenceModelIds || []).includes(em.id)
            ),
        [evidenceModels, draft.evidenceModelIds]
    );

    const entryFor = (obsId) =>
        selectedObservations.find((o) => o.observationId === obsId);

    const totalWeight = round4(sumWeights(selectedObservations));
    const normalized = weightsAreNormalized(selectedObservations);
    const requiredCount = selectedObservations.filter((o) => o.required).length;
    const zeroWeighted = zeroWeightObservations(selectedObservations);

    /* ---------------- Mutations ---------------- */

    const toggleObservable = (obs, evidenceModelId) => {
        if (disabled) return;

        setDraft((prev) => {
            const current = prev.expectedObservations || [];
            const exists = current.some((o) => o.observationId === obs.id);

            // Adding takes an equal share and rescales the rest
            // proportionally; removing rescales what is left back up to 1.
            // Both keep the allocation valid at every moment.
            //
            // New selections used to default to weight 0. The total stayed
            // at 1.000, so the normalized gate passed and Next enabled with
            // observables that carried no evidential weight and nothing
            // saying so.
            const next = exists
                ? removeObservationWeight(
                    current.filter((o) => o.observationId !== obs.id)
                )
                : addObservationWeight(current, {
                    observationId: obs.id,
                    evidenceModelId,
                    required: current.length === 0,
                });

            const survivingIds = new Set(next.map((o) => o.observationId));

            return {
                ...prev,
                expectedObservations: next,
                itemMappings: (prev.itemMappings || []).filter((m) =>
                    survivingIds.has(m.observationId)
                ),
            };
        });
    };

    const updateEntry = (obsId, patch) => {
        if (disabled) return;

        setDraft((prev) => ({
            ...prev,
            expectedObservations: (prev.expectedObservations || []).map((o) =>
                o.observationId === obsId ? { ...o, ...patch } : o
            ),
        }));
    };

    const applyWeights = (transform) => {
        if (disabled) return;
        setDraft((prev) => ({
            ...prev,
            expectedObservations: transform(prev.expectedObservations || []),
        }));
    };

    /* ---------------- Render ---------------- */

    if (boundEvidenceModels.length === 0) {
        return (
            <div className="space-y-6">
                <Header />
                <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-600">
                    <Info size={16} strokeWidth={2.25} className="mt-0.5 shrink-0 text-slate-400" />
                    <span>
                        Bind at least one Evidence Model in the previous step before
                        targeting observables.
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Header />

            {/* Allocation summary */}
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                        <Stat label="Targeted" value={selectedObservations.length} />
                        <Stat label="Required" value={requiredCount} />
                        <Stat
                            label="Allocated weight"
                            value={formatWeight(totalWeight)}
                            tone={normalized && zeroWeighted.length === 0 ? "ok" : "warn"}
                        />
                    </div>

                    {!disabled && selectedObservations.length > 0 && (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => applyWeights(distributeWeightsEvenly)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                            >
                                <SlidersHorizontal size={14} strokeWidth={2.25} />
                                Distribute evenly
                            </button>
                            <button
                                type="button"
                                onClick={() => applyWeights(normalizeWeights)}
                                disabled={normalized}
                                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${normalized
                                    ? "cursor-not-allowed border border-slate-200 bg-white text-slate-300"
                                    : "bg-slate-900 text-white hover:bg-slate-800"
                                    }`}
                            >
                                <Scale size={14} strokeWidth={2.25} />
                                Normalize to 1.0
                            </button>
                        </div>
                    )}
                </div>

                {selectedObservations.length > 0 && (
                    <div className="mt-4">
                        <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            {selectedObservations.map((o, idx) => (
                                <div
                                    key={o.observationId}
                                    className={idx % 2 === 0 ? "bg-slate-900" : "bg-slate-500"}
                                    style={{
                                        width: `${Math.max(0, Math.min(100, (Number(o.weight) || 0) * 100))}%`,
                                    }}
                                    title={`${o.observationId}: ${o.weight}`}
                                />
                            ))}
                        </div>
                        <p className="mt-2 text-xs text-slate-400">
                            Weights are a proportional allocation of this task's
                            evidential contribution and must total exactly 1.000.
                        </p>
                    </div>
                )}
            </div>

            {/* Blocking conditions */}
            {selectedObservations.length > 0 && requiredCount === 0 && (
                <Banner tone="error">
                    At least one observable must be marked required. A task that can
                    produce no mandatory evidence cannot support an inference.
                </Banner>
            )}

            {selectedObservations.length > 0 && !normalized && (
                <Banner tone="error">
                    Weights currently total {formatWeight(totalWeight)}. They must total
                    1 — use Normalize or adjust the values below. Saving is blocked
                    until they do.
                </Banner>
            )}

            {zeroWeighted.length > 0 && (
                <Banner tone="error">
                    {zeroWeighted.length} targeted observable
                    {zeroWeighted.length === 1 ? "" : "s"} carr
                    {zeroWeighted.length === 1 ? "ies" : "y"} zero weight. An observable
                    this task declares it will elicit, but which contributes nothing to
                    the inference, is a contradiction — give it a share or untarget it.
                </Banner>
            )}

            {/* Observable groups */}
            {boundEvidenceModels.map((em) => {
                const observables = em.observables || [];

                return (
                    <div key={em.id} className="space-y-3">
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-sm font-semibold text-slate-800">
                                {em.name || em.id}
                            </h3>
                            <span className="text-xs text-slate-400">
                                v{em.versionNumber ?? 1} · {observables.length} observable
                                {observables.length === 1 ? "" : "s"}
                            </span>
                        </div>

                        {observables.length === 0 && (
                            <p className="text-sm text-slate-400">
                                This Evidence Model declares no observables.
                            </p>
                        )}

                        <div className="grid gap-3">
                            {observables.map((obs) => {
                                const entry = entryFor(obs.id);
                                const selected = Boolean(entry);

                                return (
                                    <div
                                        key={obs.id}
                                        className={`rounded-lg border shadow-sm transition ${selected
                                            ? "border-slate-900 bg-white"
                                            : "border-slate-200 bg-white hover:bg-slate-50"
                                            }`}
                                    >
                                        <label className="flex cursor-pointer items-start gap-3 px-5 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selected}
                                                disabled={disabled}
                                                onChange={() => toggleObservable(obs, em.id)}
                                                className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-slate-900 disabled:cursor-not-allowed"
                                            />
                                            <div className="min-w-0 space-y-1">
                                                <div className="font-medium text-slate-800">
                                                    {obs.statement || obs.id}
                                                </div>
                                                <div className="flex flex-wrap gap-x-4 text-xs text-slate-500">
                                                    {obs.type && <span>Interaction: {obs.type}</span>}
                                                    {obs.evidenceRule?.direction && (
                                                        <span>Direction: {obs.evidenceRule.direction}</span>
                                                    )}
                                                    {obs.evidenceRule?.strengthLevel != null && (
                                                        <span>Strength: {obs.evidenceRule.strengthLevel}/5</span>
                                                    )}
                                                </div>
                                                {obs.boundaryNote && (
                                                    <p className="text-xs italic text-slate-400">
                                                        {obs.boundaryNote}
                                                    </p>
                                                )}
                                            </div>
                                        </label>

                                        {selected && (
                                            <div className="flex flex-wrap items-end gap-8 border-t border-slate-100 bg-slate-50/60 px-6 py-5">
                                                <div>
                                                    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                                                        Requirement
                                                        <InfoTooltip content="Required observables must be produced for the task to yield usable evidence. Optional ones enrich the inference when present." />
                                                    </span>
                                                    <div className="flex gap-2">
                                                        <TogglePill
                                                            active={entry.required === true}
                                                            disabled={disabled}
                                                            onClick={() => updateEntry(obs.id, { required: true })}
                                                        >
                                                            Required
                                                        </TogglePill>
                                                        <TogglePill
                                                            active={entry.required !== true}
                                                            disabled={disabled}
                                                            onClick={() => updateEntry(obs.id, { required: false })}
                                                        >
                                                            Optional
                                                        </TogglePill>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label
                                                        className="mb-1.5 block text-xs font-medium text-slate-600"
                                                        htmlFor={`weight-${obs.id}`}
                                                    >
                                                        Weight (0 – 1)
                                                    </label>
                                                    <input
                                                        id={`weight-${obs.id}`}
                                                        type="number"
                                                        min="0"
                                                        max="1"
                                                        step="0.05"
                                                        value={entry.weight ?? 0}
                                                        disabled={disabled}
                                                        onChange={(e) => {
                                                            const raw = e.target.value;
                                                            const numeric =
                                                                raw === "" ? 0 : round4(Number(raw));
                                                            updateEntry(obs.id, {
                                                                weight: Math.max(0, Math.min(1, numeric)),
                                                            });
                                                        }}
                                                        className="w-28 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                                                    />
                                                </div>

                                                <div
                                                    className={`pb-2 text-xs ${Number(entry.weight) > 0
                                                        ? "text-slate-400"
                                                        : "font-medium text-red-600"
                                                        }`}
                                                >
                                                    {Number(entry.weight) > 0
                                                        ? `${((Number(entry.weight) || 0) * 100).toFixed(1)}% of this task's evidential weight`
                                                        : "Carries no evidential weight"}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ---------------- Presentational helpers ---------------- */

function Header() {
    return (
        <div>
            <h2 className="text-lg font-semibold text-slate-900">Observable Targeting</h2>
            <p className="mt-1 text-sm text-slate-500">
                Select the observables this task is designed to elicit, mark which are
                mandatory, and allocate the task's evidential weight across them.
            </p>
        </div>
    );
}

function Stat({ label, value, tone }) {
    const toneClasses =
        tone === "warn"
            ? "text-amber-700"
            : tone === "ok"
                ? "text-emerald-700"
                : "text-slate-900";

    return (
        <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {label}
            </div>
            <div className={`mt-0.5 text-lg font-semibold tabular-nums ${toneClasses}`}>
                {value}
            </div>
        </div>
    );
}

function TogglePill({ active, disabled, onClick, children }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${active
                ? "bg-slate-900 text-white"
                : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
        >
            {children}
        </button>
    );
}

function Banner({ tone, children }) {
    const classes =
        tone === "error"
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-amber-200 bg-amber-50 text-amber-800";

    return (
        <div className={`flex items-start gap-3 rounded-lg border px-4 py-3.5 text-sm ${classes}`}>
            <AlertTriangle size={16} strokeWidth={2.25} className="mt-0.5 shrink-0" />
            <span>{children}</span>
        </div>
    );
}
