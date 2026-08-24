// DecisionRulePanel.jsx
// 🧠 Enterprise ECD — Claim-Level Decision Rule
// ---------------------------------------------------------------
// The decision rule is the last inferential step: it turns a
// calibrated posterior or theta estimate into the claim the report
// actually makes about the learner. schema.js validates it hard
// (PHASE 8, steps 1-4) and the previous calibration screen wrote
// `{ cutScore: <number> }`, which is not a shape the schema
// recognises at all -- so the field looked saved, satisfied the
// "decision rule defined" readiness check, and then failed
// validation on the next full update.
//
// Three things this panel gets right that the first pass did not:
//
//   1. The threshold input is SCALE-AWARE. A bare <input type="number"
//      step="any"> steps by 1 on every arrow press, walking straight
//      out of the 0-1 probability range and into the schema's
//      extreme-threshold rule with no warning. Bounds and step now
//      follow the rule type, and the >=25-character requirement is
//      announced the moment the value leaves 0.05-0.95 rather than
//      appearing as a rejection afterwards.
//
//   2. The SAVED rule is visible. Previously the form was the only
//      view, so there was no way to see what was actually stored --
//      and after saving, the form just sat there looking unsaved.
//      A saved rule now renders as a read-only record with an
//      explicit Edit affordance.
//
//   3. It is READ-ONLY while the model is operational, with the
//      remedy named. Editing the cut rule under a live administration
//      is what lifecycle governance exists to prevent.
// ---------------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    AlertTriangle,
    CheckCircle2,
    Info,
    Lock,
    Pencil,
} from "lucide-react";

import { useUpdateDecisionRule } from "@/api/queries/evidenceModels";
import { apiErrorMessage } from "@/api/apiClient";

import { resolveCalibrationWindow } from "../engines/effectiveModel";

/* Variable type → the ONE decision rule type schema.js accepts.
   (Ordinal is nominally classification|score_band in one block and
   classification-only in another; the intersection is classification.) */
const TYPE_BY_VARIABLE = {
    binary: "mastery",
    ordinal: "classification",
    categorical: "classification",
    continuous: "posterior_threshold",
};

/* Each rule type puts the threshold on a different scale. Getting this
   wrong is the difference between "0.65" and "65" meaning the same thing. */
const THRESHOLD_SPEC = {
    mastery: {
        unit: "posterior probability",
        min: 0,
        max: 1,
        step: 0.01,
        placeholder: "0.80",
        guidance:
            "Probability of mastery (0–1). The learner is declared a master when P(mastery) sits above this value.",
    },
    classification: {
        unit: "posterior probability",
        min: 0,
        max: 1,
        step: 0.01,
        placeholder: "0.60",
        guidance:
            "Minimum posterior probability (0–1) the most likely competency state must reach before it is reported. Below it, the result is indeterminate.",
    },
    posterior_threshold: {
        unit: "θ logits",
        min: -4,
        max: 4,
        step: 0.1,
        placeholder: "0.35",
        guidance:
            "A point on the calibrated reporting scale, in θ logits — normally between −3 and 3. Read it against the active parameter set's scale, not as a probability.",
    },
    score_band: {
        unit: "raw score",
        min: 0,
        max: undefined,
        step: 1,
        placeholder: "12",
        guidance:
            "A raw score boundary. Incompatible with IRT/Rasch models, which report on a latent scale rather than a raw score.",
    },
};

const DIRECTIONS = ["above", "below", "within"];

/* schema.js PHASE 8 step 2: thresholds outside this band demand a
   longer justification, whatever scale they are on. */
const ORDINARY_BAND = [0.05, 0.95];
const EXTREME_JUSTIFICATION_MIN = 25;
const BASE_JUSTIFICATION_MIN = 10;

export default function DecisionRulePanel({
    evidenceModel,
    competency,
    activeStatModel,
}) {

    const stored = evidenceModel?.decisionRule || {};

    const requiredType = TYPE_BY_VARIABLE[competency?.variableType] || null;

    const window_ = resolveCalibrationWindow(evidenceModel);

    const hasStoredRule =
        !!stored.type && typeof stored.threshold === "number";

    // Start in read-only whenever there is something to read.
    const [editing, setEditing] = useState(!hasStoredRule);

    const [type, setType] = useState(stored.type || requiredType || "mastery");
    const [threshold, setThreshold] = useState(
        typeof stored.threshold === "number" ? String(stored.threshold) : ""
    );
    const [direction, setDirection] = useState(stored.direction || "above");
    const [justification, setJustification] = useState(stored.justification || "");
    const [saved, setSaved] = useState(false);

    const updateDecisionRule = useUpdateDecisionRule();

    // Re-sync when the query refetches a model saved elsewhere.
    useEffect(() => {
        setType(stored.type || requiredType || "mastery");
        setThreshold(typeof stored.threshold === "number" ? String(stored.threshold) : "");
        setDirection(stored.direction || "above");
        setJustification(stored.justification || "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [evidenceModel?.id, stored.type, stored.threshold, stored.direction, stored.justification]);

    /* =====================================================
       LEGACY SHAPE DETECTION
    ===================================================== */

    const legacyCutScore =
        stored && typeof stored.cutScore === "number" && !stored.type
            ? stored.cutScore
            : null;

    /* =====================================================
       THRESHOLD SCALE
    ===================================================== */

    const spec = THRESHOLD_SPEC[type] || THRESHOLD_SPEC.mastery;

    const thresholdNum = Number(threshold);
    const hasThreshold = threshold !== "" && Number.isFinite(thresholdNum);

    const isExtreme =
        hasThreshold &&
        (thresholdNum > ORDINARY_BAND[1] || thresholdNum < ORDINARY_BAND[0]);

    const requiredJustificationLength = isExtreme
        ? EXTREME_JUSTIFICATION_MIN
        : BASE_JUSTIFICATION_MIN;

    /* =====================================================
       VALIDATION — mirrors schema.js PHASE 8
    ===================================================== */

    const validation = useMemo(() => {

        const errors = [];
        const warnings = [];

        if (!type) errors.push("Decision rule type is required.");

        if (!hasThreshold) {
            errors.push("Threshold must be numeric.");
        } else {
            if (spec.min !== undefined && thresholdNum < spec.min) {
                errors.push(
                    `Threshold ${thresholdNum} is below the minimum for a ${type} rule (${spec.min} ${spec.unit}).`
                );
            }
            if (spec.max !== undefined && thresholdNum > spec.max) {
                errors.push(
                    `Threshold ${thresholdNum} is above the maximum for a ${type} rule (${spec.max} ${spec.unit}).`
                );
            }
        }

        if (!DIRECTIONS.includes(direction)) {
            errors.push("Direction must be above, below or within.");
        }

        const jLength = justification.trim().length;

        if (jLength < BASE_JUSTIFICATION_MIN) {
            errors.push(
                `Justification must be at least ${BASE_JUSTIFICATION_MIN} characters — it is the interpretive rationale of record.`
            );
        } else if (isExtreme && jLength < EXTREME_JUSTIFICATION_MIN) {
            errors.push(
                `A threshold outside ${ORDINARY_BAND[0]}–${ORDINARY_BAND[1]} is treated as extreme and needs at least ${EXTREME_JUSTIFICATION_MIN} characters of justification (currently ${jLength}).`
            );
        }

        /* variable type ↔ rule type */

        if (requiredType && type !== requiredType) {
            errors.push(
                `A ${competency?.variableType} competency must use the "${requiredType}" decision rule.`
            );
        }

        if (!requiredType) {
            warnings.push(
                "Target competency declares no variable type, so the rule type could not be checked against the student model."
            );
        }

        /* high-stakes protection */

        if (["mastery", "posterior_threshold"].includes(type)) {
            if (!justification.toLowerCase().includes("calibration")) {
                errors.push(
                    'High-stakes mastery / posterior decisions must reference their calibration basis — the justification has to contain the word "calibration".'
                );
            }
        }

        if (type === "mastery" && direction === "within") {
            errors.push('Mastery decisions cannot use the "within" direction. Use above or below.');
        }

        /* rule type ↔ statistical model */

        if (activeStatModel) {

            if (["irt", "rasch"].includes(activeStatModel.type) && type === "score_band") {
                errors.push(
                    "IRT/Rasch models report latent θ; a score_band rule is semantically incompatible."
                );
            }

            if (activeStatModel.type === "bayesian_network" && type === "mastery" && hasThreshold && thresholdNum > 1) {
                errors.push(
                    "A Bayesian network mastery decision must use a posterior probability between 0 and 1."
                );
            }

            if (
                ["irt", "rasch"].includes(activeStatModel.type) &&
                type === "posterior_threshold" &&
                hasThreshold &&
                Math.abs(thresholdNum) > 3
            ) {
                warnings.push(
                    `A θ cut of ${thresholdNum} sits outside the usual [-3, 3] reporting range — confirm it is on the calibrated scale.`
                );
            }

            if (!activeStatModel.activeParameterSetId) {
                warnings.push(
                    "No parameter set is active yet, so this threshold cannot be interpreted against a calibrated scale."
                );
            }
        }

        /* ordinal / categorical need states */

        if (["ordinal", "categorical"].includes(competency?.variableType)) {
            if (!Array.isArray(competency?.states) || competency.states.length < 2) {
                errors.push(
                    `A ${competency.variableType} competency must declare at least two states for a classification rule.`
                );
            }
        }

        if (competency?.variableType === "continuous" && !competency?.scale) {
            errors.push(
                "A continuous competency must define a reporting scale before a posterior threshold can be interpreted."
            );
        }

        return { errors, warnings, valid: errors.length === 0 };

    }, [
        type, threshold, direction, justification, requiredType, competency,
        activeStatModel, spec, thresholdNum, hasThreshold, isExtreme,
    ]);

    /* =====================================================
       SAVE
    ===================================================== */

    const save = async () => {

        if (!validation.valid || !window_.open) return;

        setSaved(false);

        await updateDecisionRule.mutateAsync({
            id: evidenceModel.id,
            payload: {
                decisionRule: {
                    type,
                    threshold: thresholdNum,
                    direction,
                    justification: justification.trim(),
                },
            },
        });

        setSaved(true);
        setEditing(false);
    };

    const cancelEdit = () => {
        setType(stored.type || requiredType || "mastery");
        setThreshold(typeof stored.threshold === "number" ? String(stored.threshold) : "");
        setDirection(stored.direction || "above");
        setJustification(stored.justification || "");
        setEditing(false);
    };

    const error = updateDecisionRule.error
        ? apiErrorMessage(updateDecisionRule.error, "Decision rule update failed.")
        : null;

    /* =====================================================
       UI
    ===================================================== */

    return (

        <div className="space-y-5">

            <div className="flex flex-wrap items-start justify-between gap-3">

                <div>
                    <div className="text-sm font-semibold text-slate-800">
                        Claim-Level Decision Rule
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                        How a calibrated estimate becomes the claim reported about the
                        learner. Validated against the same rules the server enforces.
                    </div>
                </div>

                {hasStoredRule && !editing && window_.open && (
                    <button
                        type="button"
                        onClick={() => { setSaved(false); setEditing(true); }}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        <Pencil size={13} strokeWidth={2.25} />
                        Edit
                    </button>
                )}

            </div>

            {/* ---------- frozen while live ---------- */}

            {!window_.open && (

                <div className="flex items-start gap-3 rounded-lg border border-slate-300 bg-slate-100 px-4 py-3.5 text-sm text-slate-700">

                    <Lock size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-slate-500" />

                    <span>
                        <strong className="font-semibold">Decision rule is locked.</strong>{" "}
                        {window_.reason}
                        {window_.remedy && (
                            <span className="mt-1 block text-xs text-slate-600">
                                {window_.remedy}
                            </span>
                        )}
                    </span>

                </div>

            )}

            {/* ---------- legacy shape ---------- */}

            {legacyCutScore !== null && (

                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-800">

                    <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />

                    <span>
                        This model carries a legacy <span className="font-mono">cutScore</span> of{" "}
                        <span className="font-mono">{legacyCutScore}</span> written by an
                        older build. It is not a shape the schema recognises. Complete
                        the fields below and save to replace it with a valid rule.
                    </span>

                </div>

            )}

            {/* ---------- SAVED RULE (read-only record) ---------- */}

            {hasStoredRule && !editing && (
                <SavedRuleCard
                    rule={stored}
                    spec={THRESHOLD_SPEC[stored.type] || THRESHOLD_SPEC.mastery}
                    updatedAt={evidenceModel?.updatedAt}
                    justSaved={saved}
                />
            )}

            {!hasStoredRule && !editing && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-500">
                    No decision rule has been defined for this evidence model yet.
                </div>
            )}

            {/* ---------- FORM ---------- */}

            {editing && (

                <>

                    <div className="grid gap-4 sm:grid-cols-2">

                        <div>

                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Rule type
                            </label>

                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                disabled={!window_.open}
                                className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                            >
                                {Object.keys(THRESHOLD_SPEC).map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>

                            {requiredType && (
                                <p className="mt-1.5 text-xs text-slate-500">
                                    {competency?.variableType} competency → schema requires{" "}
                                    <span className="font-mono">{requiredType}</span>.
                                </p>
                            )}

                        </div>

                        <div>

                            <label className="mb-1.5 flex items-baseline justify-between gap-2 text-sm font-medium text-slate-700">
                                <span>Threshold</span>
                                <span className="text-xs font-normal text-slate-500">
                                    {spec.unit}
                                </span>
                            </label>

                            <input
                                type="number"
                                value={threshold}
                                onChange={(e) => setThreshold(e.target.value)}
                                min={spec.min}
                                max={spec.max}
                                step={spec.step}
                                placeholder={spec.placeholder}
                                disabled={!window_.open}
                                className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm tabular-nums text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                            />

                            <p className="mt-1.5 text-xs text-slate-500">
                                {spec.guidance}
                                {spec.max !== undefined
                                    ? ` Steps of ${spec.step}, range ${spec.min} to ${spec.max}.`
                                    : ` Steps of ${spec.step}, minimum ${spec.min}.`}
                            </p>

                        </div>

                        <div>

                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Direction
                            </label>

                            <select
                                value={direction}
                                onChange={(e) => setDirection(e.target.value)}
                                disabled={!window_.open}
                                className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                            >
                                {DIRECTIONS.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>

                        </div>

                        <div className="sm:col-span-2">

                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Justification
                            </label>

                            <textarea
                                rows={3}
                                value={justification}
                                onChange={(e) => setJustification(e.target.value)}
                                disabled={!window_.open}
                                placeholder="e.g. Threshold set by the standard-setting panel, expressed on the θ scale from the June 2026 calibration (n = 4821)."
                                className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                            />

                            <p className="mt-1.5 text-xs text-slate-500">
                                {justification.trim().length} / {requiredJustificationLength} characters minimum.
                                {["mastery", "posterior_threshold"].includes(type) &&
                                    ' Must reference the word "calibration" for high-stakes rule types.'}
                            </p>

                        </div>

                    </div>

                    {/* ---------- extreme threshold notice ---------- */}

                    {isExtreme && (

                        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3.5 text-xs text-blue-800">

                            <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0" />

                            <span>
                                <strong className="font-semibold">
                                    {thresholdNum} is outside {ORDINARY_BAND[0]}–{ORDINARY_BAND[1]}
                                </strong>
                                , so the schema treats it as an extreme threshold and requires{" "}
                                {EXTREME_JUSTIFICATION_MIN} characters of justification instead of{" "}
                                {BASE_JUSTIFICATION_MIN}.
                                {spec.unit !== "posterior probability" && (
                                    <span className="mt-1 block">
                                        That band is expressed in probability units, so a legitimate{" "}
                                        {spec.unit} cut will usually trip it. The longer justification
                                        is the schema asking you to state the scale explicitly — not a
                                        sign the value is wrong.
                                    </span>
                                )}
                            </span>

                        </div>

                    )}

                    {/* ---------- validation ---------- */}

                    {validation.errors.length > 0 && (

                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3.5">
                            <div className="flex items-center gap-2 text-sm font-semibold text-red-800">
                                <AlertCircle size={16} strokeWidth={2} />
                                Will be rejected ({validation.errors.length})
                            </div>
                            <ul className="ml-5 mt-2 list-disc space-y-1 text-sm text-red-700">
                                {validation.errors.map((e, i) => <li key={i}>{e}</li>)}
                            </ul>
                        </div>

                    )}

                    {validation.warnings.length > 0 && (

                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5">
                            <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                                <AlertTriangle size={16} strokeWidth={2} />
                                Advisories
                            </div>
                            <ul className="ml-5 mt-2 list-disc space-y-1 text-sm text-amber-800">
                                {validation.warnings.map((w, i) => <li key={i}>{w}</li>)}
                            </ul>
                        </div>

                    )}

                    {error && (
                        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
                            <AlertCircle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3">

                        <button
                            type="button"
                            onClick={save}
                            disabled={!validation.valid || !window_.open || updateDecisionRule.isPending}
                            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                        >
                            {updateDecisionRule.isPending ? "Saving…" : "Save decision rule"}
                        </button>

                        {hasStoredRule && (
                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                        )}

                    </div>

                </>

            )}

            <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3.5 text-xs text-slate-600">

                <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-slate-400" />

                <span>
                    Once sessions have been scored with this evidence model the schema
                    blocks any change to the decision rule — two learners assessed under
                    different cut rules are not comparable. Clone the model into a new
                    version to change it after live use.
                </span>

            </div>

        </div>

    );

}

/* =====================================================
   SAVED RULE — the read-only record
===================================================== */

function SavedRuleCard({ rule, spec, updatedAt, justSaved }) {

    return (

        <div className="space-y-4 rounded-lg border border-emerald-200 bg-emerald-50/60 p-5">

            <div className="flex flex-wrap items-center justify-between gap-3">

                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <CheckCircle2 size={16} strokeWidth={2.25} className="text-emerald-600" />
                    {justSaved ? "Decision rule saved" : "Decision rule on file"}
                </div>

                {updatedAt && (
                    <span className="text-xs text-slate-500">
                        Last updated {new Date(updatedAt).toLocaleString()}
                    </span>
                )}

            </div>

            {/* the rule, read as a sentence */}

            <div className="rounded-md border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-800">
                Report the claim when the estimate is{" "}
                <strong className="font-semibold">{rule.direction}</strong>{" "}
                <strong className="font-semibold tabular-nums">{rule.threshold}</strong>{" "}
                <span className="text-slate-500">{spec.unit}</span>
                {" · "}
                <span className="font-mono text-xs text-slate-600">{rule.type}</span>
            </div>

            <dl className="grid gap-x-6 gap-y-2 text-xs sm:grid-cols-3">
                <Field label="Type" value={rule.type} />
                <Field label="Threshold" value={`${rule.threshold} ${spec.unit}`} />
                <Field label="Direction" value={rule.direction} />
            </dl>

            <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Justification
                </div>
                <p className="mt-1 text-sm text-slate-700">
                    {rule.justification || "—"}
                </p>
            </div>

        </div>

    );

}

function Field({ label, value }) {
    return (
        <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {label}
            </dt>
            <dd className="mt-0.5 text-slate-800">{String(value ?? "—")}</dd>
        </div>
    );
}
