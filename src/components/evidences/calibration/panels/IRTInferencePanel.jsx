// IRTInferencePanel.jsx
// Enterprise ECD — IRT Inference Panel (Research Grade)
// -------------------------------------------------------
// ✔ 1PL / 2PL / 3PL
// ✔ θ estimation (MLE)
// ✔ SE + Confidence Interval
// ✔ Proper Likelihood + Information visualization
// ✔ Adaptive selection
// ✔ ECD interpretation

import React, { useMemo, useState } from "react";
import { AlertTriangle, Check, Info } from "lucide-react";

import {
    estimateThetaMLE,
    estimateThetaMAP,
    estimateThetaEAP,
    posteriorCurve,
    likelihoodCurve,
    standardError,
    informationCurve,
    thetaToPercentile,
    thetaToPercentileEmpirical,
    selectNextItem
} from "@/components/evidences/EvidenceWizard/components/engines/irtEngine";

import {
    buildThetaBands,
    mapThetaToState
} from "@/components/evidences/EvidenceWizard/components/utils/thetaMapping"

/* =====================================================
   θ → Competency Mapping
===================================================== */

const mapThetaToLevel = (theta, statesMeta) => {

    if (!statesMeta.length) return null;

    const n = statesMeta.length;
    const min = -3;
    const max = 3;

    const step = (max - min) / n;

    const index = Math.min(
        n - 1,
        Math.max(0, Math.floor((theta - min) / step))
    );

    return statesMeta[index];

};


/* =====================================================
   CHART HELPERS
===================================================== */

const scaleX = (theta, width) =>
    ((theta + 3) / 6) * width;

const scaleY = (value, height, maxY) =>
    height - (value / maxY) * height;


/* =====================================================
   COMPONENT
===================================================== */

export default function IRTInferencePanel({

    observables = [],
    model,
    selectedCompetency

}) {

    const [responses, setResponses] = useState({});

    const width = 420;
    const height = 220;


    const observableMap = useMemo(() => {

        const map = {};

        observables.forEach(obs => {
            map[obs.id] = obs;
        });

        return map;

    }, [observables]);

    const isContinuous =
        selectedCompetency?.variableType === "continuous";

    /* =====================================================
       ACTIVE PARAMETER SET
       -----------------------------------------------------
       Calibration produces MANY parameter sets over a model's
       operational life. Item parameters must always be read
       from the set flagged `activeParameterSetId` -- reading
       parameterSets[0] silently pins the panel to the oldest
       calibration and makes every recalibration invisible.
    ===================================================== */

    const activeParameterSet = useMemo(() => {

        const sets = model?.parameterSets || [];

        if (!sets.length) return null;

        return (
            sets.find(
                ps => ps.parameterSetId === model?.activeParameterSetId
            ) || sets[sets.length - 1]
        );

    }, [model]);


    /* =====================================================
       ITEMS (1PL / 2PL / 3PL)
    ===================================================== */

    const items = useMemo(() => {

        const config = model?.structureConfig || {};
        const subtype = model?.subtype || "2pl";

        // Fall back to every observable in scope when the statistical
        // model never declared an explicit observable mapping.
        const scopedIds =
            (config.observableIds || []).length
                ? config.observableIds
                : observables.map(o => o.id);

        return scopedIds.map(obsId => {

            const param =
                activeParameterSet?.parameters?.[obsId] || {};

            const obs = observableMap[obsId];

            return {
                id: obsId,
                statement: obs?.statement || "Unknown observable",
                type: obs?.type,
                a: subtype === "rasch" ? 1 : (param.a ?? 1),
                b: param.b ?? 0,
                c: subtype === "3pl" ? (param.c ?? 0.2) : 0
            };

        });

    }, [model, observableMap, observables, activeParameterSet]);


    /* =====================================================
       θ ESTIMATION
    ===================================================== */

    const [method, setMethod] = useState("MLE"); // MLE | MAP | EAP

    const thetaMLE = useMemo(() => {
        return estimateThetaMLE(responses, items);
    }, [responses, items]);

    const thetaMAP = useMemo(() => {
        return estimateThetaMAP(responses, items);
    }, [responses, items]);

    const thetaEAP = useMemo(() => {
        return estimateThetaEAP(responses, items);
    }, [responses, items]);

    const theta = useMemo(() => {

        if (method === "MAP") return thetaMAP;
        if (method === "EAP") return thetaEAP;

        return thetaMLE;

    }, [method, thetaMLE, thetaMAP, thetaEAP]);


    /* Z score */

    const zScore = useMemo(() => {

        if (!isContinuous) return null;

        const norm = model?.structureConfig?.norm || {
            mean: 0,
            sd: 1
        };

        return (theta - (norm.mean ?? 0)) / (norm.sd ?? 1);

    }, [theta, model, isContinuous]);


    /* PERCENTILE */

    const percentile = useMemo(() => {

        if (!isContinuous) return null;

        const norm = model?.structureConfig?.norm || {
            type: "normal",
            mean: 0,
            sd: 1
        };

        /* =========================
           NORMAL (DEFAULT)
        ========================= */

        if (norm.type === "normal") {
            return thetaToPercentile(theta, norm.mean, norm.sd);
        }

        /* =========================
           EMPIRICAL
        ========================= */

        if (norm.type === "empirical") {

            const dist = norm.distribution || [];

            if (dist.length < 30) {
                return thetaToPercentile(theta, norm.mean ?? 0, norm.sd ?? 1);
            }

            return thetaToPercentileEmpirical(theta, dist);
        }

        /* =========================
           GROUP NORM
        ========================= */

        if (norm.type === "group") {

            const groupDist = norm.distribution || [];

            return thetaToPercentileEmpirical(theta, groupDist);
        }

        return null;

    }, [theta, model, isContinuous]);


    /* =====================================================
       POSTERIOR
    ===================================================== */

    const posterior = useMemo(() => {

        if (method === "MLE") return null;

        return posteriorCurve(responses, items);

    }, [responses, items, method]);


    /* =====================================================
       MAX POSTERIOR (FOR SCALING)
    ===================================================== */
    const maxPosterior =
        posterior?.length
            ? Math.max(...posterior.map(p => p.value))
            : 1;


    /* =====================================================
       UNCERTAINTY
    ===================================================== */

    const se = useMemo(() => {
        return standardError(theta, items);
    }, [theta, items]);

    const ci = [
        theta - 1.96 * se,
        theta + 1.96 * se
    ];


    /* =====================================================
       CURVES
    ===================================================== */

    const likelihood = useMemo(() => {
        return likelihoodCurve(responses, items);
    }, [responses, items]);

    const info = useMemo(() => {
        return informationCurve(items);
    }, [items]);

    const maxLikelihood =
        likelihood.length ? Math.max(...likelihood.map(p => p.value)) : 1;

    const maxInfo =
        info.length ? Math.max(...info.map(p => p.info)) : 1;


    /* =====================================================
       ADAPTIVE
    ===================================================== */

    const nextItem = useMemo(() => {
        return selectNextItem(theta, items, Object.keys(responses));
    }, [theta, items, responses]);


    /* =====================================================
       COMPETENCY
    ===================================================== */
    const statesMeta = (selectedCompetency?.states || [])
        .slice()
        .sort((a, b) => (a.order || 0) - (b.order || 0));


    const thetaBands = useMemo(() => {
        return buildThetaBands(selectedCompetency?.states || []);
    }, [selectedCompetency]);


    const mappedState = useMemo(() => {

        if (isContinuous) return null;

        return mapThetaToState(theta, thetaBands);

    }, [theta, thetaBands, isContinuous]);


    const mappedLevel = mapThetaToLevel(theta, statesMeta);


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-8">

            {/* HEADER */}

            <div className="flex justify-between items-center">

                <div className="text-lg font-semibold text-slate-900">
                    IRT Ability Estimation
                </div>

                <div className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    {model?.subtype?.toUpperCase()}
                </div>

            </div>


            {/* ============================
                RESPONSE INPUT
            ============================ */}

            <div className="space-y-3">

                <div className="text-sm font-semibold text-slate-800">
                    Observed Evidence
                </div>

                {items.map(item => (

                    <div
                        key={item.id}
                        className="rounded-lg border border-slate-200 bg-white shadow-sm p-4 flex justify-between items-start gap-4"
                    >

                        {/* LEFT: Observable */}

                        <div className="flex-1">

                            <div className="text-sm font-medium text-slate-900">
                                {item.statement}
                            </div>

                            <div className="text-xs text-slate-500 mt-1">
                                ID: {item.id}
                            </div>

                            <div className="text-xs text-slate-500">
                                Type: {item.type}
                            </div>

                            <div className="text-xs text-slate-600 mt-1">
                                Difficulty: {item.b.toFixed(2)} |
                                Discrimination: {item.a.toFixed(2)}
                                {model?.subtype === "3pl" && ` | Guessing: ${item.c.toFixed(2)}`}
                            </div>

                        </div>

                        {/* RIGHT: Response */}

                        <select
                            value={responses[item.id] ?? ""}
                            onChange={(e) =>
                                setResponses(prev => ({
                                    ...prev,
                                    [item.id]:
                                        e.target.value === ""
                                            ? undefined
                                            : Number(e.target.value)
                                }))
                            }
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                        >
                            <option value="">--</option>
                            <option value="1">✔ Correct</option>
                            <option value="0">✘ Incorrect</option>
                        </select>

                    </div>

                ))}

                <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-4">

                    <div className="flex flex-col gap-1">

                        <div className="text-sm font-semibold text-slate-800">
                            Estimation Method
                        </div>

                        <div className="text-xs text-slate-500">
                            Method affects stability of θ estimate
                        </div>

                        <div className="text-xs text-slate-500">
                            {Object.keys(responses).filter(k => responses[k] !== undefined).length}
                            {" / "}
                            {items.length} observables recorded
                        </div>

                    </div>

                    <div className="flex gap-2">

                        {["MLE", "MAP", "EAP"].map(m => (

                            <button
                                key={m}
                                onClick={() => setMethod(m)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${method === m
                                    ? "bg-slate-900 text-white shadow-sm"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                            >
                                {m}
                            </button>

                        ))}

                    </div>

                </div>

            </div>

            {/* ============================
                θ SUMMARY
            ============================ */}

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">

                <div className="text-sm font-semibold text-slate-800">
                    Ability Estimate (θ)
                </div>

                <div className="text-xs text-slate-500">

                    {isContinuous ? (

                        <>
                            Continuous scale (θ):
                            <span className="ml-1 font-medium text-slate-900">
                                {theta.toFixed(2)}
                            </span>

                            <span className="ml-2 text-slate-400">
                                (Range: {selectedCompetency?.scale?.min ?? "-3"} to {selectedCompetency?.scale?.max ?? "3"})
                            </span>
                        </>

                    ) : mappedState ? (

                        <>
                            Level:
                            <span className="ml-1 font-medium text-slate-900">
                                {mappedState.label}
                            </span>

                            <span className="ml-2 text-slate-400">
                                ({mappedState.lower.toFixed(1)} to {mappedState.upper.toFixed(1)})
                            </span>
                        </>

                    ) : null}

                </div>

                <div className="text-2xl font-semibold text-slate-900">
                    {theta.toFixed(2)}
                </div>


                <div className="text-xs text-slate-600 space-y-1">

                    <div>
                        SE: {isFinite(se) ? se.toFixed(3) : "—"} |
                        95% CI: [{ci[0].toFixed(2)}, {ci[1].toFixed(2)}]
                    </div>

                    {isContinuous && zScore !== null && (
                        <div>
                            Z-score:
                            <span className="ml-1 font-medium text-slate-900">
                                {zScore.toFixed(2)}
                            </span>
                        </div>
                    )}

                    {isContinuous && percentile !== null && (
                        <div>
                            Percentile:
                            <span className="ml-1 font-medium text-slate-900">
                                {percentile.toFixed(1)}th
                            </span>
                        </div>
                    )}

                </div>
            </div>

            {isContinuous && (

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-2">

                    <div className="text-sm font-semibold text-blue-900">
                        Continuous Ability Interpretation
                    </div>

                    <div className="text-xl font-semibold text-blue-900">
                        θ = {theta.toFixed(2)}
                    </div>

                    <div className="text-xs text-blue-800">
                        {selectedCompetency?.scale?.interpretationGuide ||
                            "Higher θ indicates greater proficiency."}
                    </div>

                    <div className="mt-2 text-xs rounded-md border border-slate-200 bg-white p-3 text-slate-700">

                        {isFinite(se) && (
                            <>
                                Precision:
                                <span className="ml-1 font-medium text-slate-900">
                                    SE = {se.toFixed(3)}
                                </span>
                            </>
                        )}

                    </div>

                </div>

            )}

            {/* ============================
                INTERPRETATION
            ============================ */}

            {!isContinuous && mappedState && (

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">

                    <div className="text-sm font-semibold text-blue-900">
                        Interpretation
                    </div>

                    <div className="text-xl font-semibold text-blue-900">
                        {mappedState?.label}
                    </div>

                    <div className="text-xs text-blue-800">
                        {mappedState?.description}
                    </div>

                    <div className="mt-3 text-xs rounded-md border border-slate-200 bg-white p-3 space-y-1.5">

                        {isFinite(se) && se > 0.6 && (
                            <div className="flex items-center gap-1.5 text-amber-700">
                                <AlertTriangle size={14} strokeWidth={2.25} />
                                Low measurement precision — more evidence needed
                            </div>
                        )}

                        {isFinite(se) && se < 0.3 && (
                            <div className="flex items-center gap-1.5 text-emerald-700">
                                <Check size={14} strokeWidth={2.25} />
                                High precision estimate
                            </div>
                        )}

                        {Math.abs(thetaMLE - thetaEAP) > 0.5 && (
                            <div className="flex items-center gap-1.5 text-amber-700">
                                <AlertTriangle size={14} strokeWidth={2.25} />
                                High estimation instability — results are sensitive to prior assumptions.
                            </div>
                        )}

                        {Math.abs(thetaMLE - thetaEAP) <= 0.5 && (
                            <div className="flex items-center gap-1.5 text-emerald-700">
                                <Check size={14} strokeWidth={2.25} />
                                Stable estimation — inference is consistent across methods.
                            </div>
                        )}

                        {Math.abs(thetaMAP - thetaEAP) > 0.5 && (
                            <div className="flex items-center gap-1.5 text-amber-700">
                                <AlertTriangle size={14} strokeWidth={2.25} />
                                Norm interpretation may be unstable (prior-sensitive)
                            </div>
                        )}

                    </div>

                </div>

            )}

            {isContinuous && percentile !== null && (

                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-2">

                    <div className="text-sm font-semibold text-emerald-900">
                        Norm-Referenced Interpretation
                    </div>

                    <div className="text-xs text-emerald-800">
                        Norm:
                        <span className="ml-1 font-medium text-emerald-900">
                            {model?.structureConfig?.norm?.type || "normal"}
                        </span>

                        {model?.structureConfig?.norm?.groupKey && (
                            <span className="ml-2 text-emerald-700/70">
                                ({model.structureConfig.norm.groupKey})
                            </span>
                        )}
                    </div>

                    <div className="text-xl font-semibold text-emerald-900">
                        {percentile.toFixed(1)}th Percentile
                    </div>

                    <div className="text-xs text-emerald-800">

                        {percentile < 10 && "Well below expected performance"}
                        {percentile >= 10 && percentile < 25 && "Below expected performance"}
                        {percentile >= 25 && percentile < 75 && "Within expected range"}
                        {percentile >= 75 && percentile < 90 && "Above expected performance"}
                        {percentile >= 90 && "Well above expected performance"}

                    </div>

                </div>

            )}


            {/* ============================
                METHOD COMPARISON (CRITICAL)
            ============================ */}

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">

                <div className="text-sm font-semibold text-slate-800">
                    Estimation Comparison
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">

                    <div>
                        <div className="text-slate-500 text-xs">MLE</div>
                        <div className="font-semibold text-slate-900">
                            {thetaMLE.toFixed(2)}
                        </div>
                    </div>

                    <div>
                        <div className="text-slate-500 text-xs">MAP</div>
                        <div className="font-semibold text-slate-900">
                            {thetaMAP.toFixed(2)}
                        </div>
                    </div>

                    <div>
                        <div className="text-slate-500 text-xs">EAP</div>
                        <div className="font-semibold text-slate-900">
                            {thetaEAP.toFixed(2)}
                        </div>
                    </div>

                </div>

                {/* Δ Differences */}

                <div className="text-xs text-slate-600 space-y-1">

                    <div>
                        Δ(MLE − MAP): {(thetaMLE - thetaMAP).toFixed(2)}
                    </div>

                    <div>
                        Δ(MLE − EAP): {(thetaMLE - thetaEAP).toFixed(2)}
                    </div>

                </div>

            </div>

            {/* ============================
                LIKELIHOOD CURVE
            ============================ */}

            <div>

                <div className="text-sm font-semibold text-slate-800 mb-2">
                    Likelihood Function
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3">

                    <svg width={width} height={height}>

                        {/* Axes */}
                        <line x1="0" y1={height} x2={width} y2={height} stroke="#999" />
                        <line x1="0" y1="0" x2="0" y2={height} stroke="#999" />

                        {/* Curve */}
                        {likelihood.map((p, i) => {

                            if (i === 0) return null;

                            const prev = likelihood[i - 1];

                            return (
                                <line
                                    key={i}
                                    x1={scaleX(prev.theta, width)}
                                    y1={scaleY(prev.value, height, maxLikelihood)}
                                    x2={scaleX(p.theta, width)}
                                    y2={scaleY(p.value, height, maxLikelihood)}
                                    stroke="#2563eb"
                                    strokeWidth="2"
                                />
                            );

                        })}

                        {/* θ marker */}
                        <line
                            x1={scaleX(theta, width)}
                            x2={scaleX(theta, width)}
                            y1="0"
                            y2={height}
                            stroke="red"
                            strokeDasharray="4"
                        />

                    </svg>

                </div>

                <div className="text-xs text-slate-500 mt-1">
                    Peak indicates most likely θ estimate.
                </div>

            </div>


            {/* ============================
                INFORMATION FUNCTION
            ============================ */}

            <div>

                <div className="text-sm font-semibold text-slate-800 mb-2">
                    Test Information Function
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3">

                    <svg width={width} height={height}>

                        {/* Axes */}
                        <line x1="0" y1={height} x2={width} y2={height} stroke="#999" />
                        <line x1="0" y1="0" x2="0" y2={height} stroke="#999" />

                        {/* Curve */}
                        {info.map((p, i) => {

                            if (i === 0) return null;

                            const prev = info[i - 1];

                            return (
                                <line
                                    key={i}
                                    x1={scaleX(prev.theta, width)}
                                    y1={scaleY(prev.info, height, maxInfo)}
                                    x2={scaleX(p.theta, width)}
                                    y2={scaleY(p.info, height, maxInfo)}
                                    stroke="#16a34a"
                                    strokeWidth="2"
                                />
                            );

                        })}

                        {/* θ marker */}
                        <line
                            x1={scaleX(theta, width)}
                            x2={scaleX(theta, width)}
                            y1="0"
                            y2={height}
                            stroke="red"
                            strokeDasharray="4"
                        />

                    </svg>

                </div>

                <div className="text-xs text-slate-500 mt-1">
                    Higher information → lower uncertainty (SE).
                </div>

            </div>

            {/* ============================
                POSTERIOR CURVE
            ============================ */}

            {posterior && posterior.length > 0 && (

                <div>

                    <div className="text-sm font-semibold text-slate-800 mb-2">
                        Posterior Distribution
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-3">

                        <svg width={420} height={220}>

                            {posterior.map((p, i) => {

                                if (i === 0) return null;

                                const prev = posterior[i - 1];

                                return (
                                    <line
                                        key={i}
                                        x1={scaleX(prev.theta, width)}
                                        y1={scaleY(prev.value, height, maxPosterior)}
                                        x2={scaleX(p.theta, width)}
                                        y2={scaleY(p.value, height, maxPosterior)}
                                        stroke="#7c3aed"
                                        strokeWidth="2"
                                    />
                                );

                            })}

                            {/* θ marker */}
                            <line
                                x1={scaleX(theta, width)}
                                x2={scaleX(theta, width)}
                                y1="0"
                                y2={height}
                                stroke="red"
                                strokeDasharray="4"
                            />

                        </svg>

                    </div>

                    <div className="text-xs text-slate-500 mt-1">
                        Posterior combines evidence with prior belief.
                    </div>

                </div>

            )}

            {/* ============================
                ADAPTIVE
            ============================ */}

            {nextItem && (
                <div className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    <Info size={14} strokeWidth={2.25} className="shrink-0" />
                    Next Best Evidence:
                    <span className="ml-1 font-medium text-blue-900">
                        {observableMap[nextItem.id]?.statement || nextItem.id}
                    </span>
                </div>
            )}

        </div>

    );

}
