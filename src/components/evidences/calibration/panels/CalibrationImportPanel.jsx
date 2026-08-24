// CalibrationImportPanel.jsx
// 🧠 Enterprise ECD — Calibration Intake
// ---------------------------------------------------------------
// Three intake routes, one downstream path. Whatever comes in — a
// signed calibration package, a raw response matrix, or a parameter
// blob pasted by a psychometrician — is normalised into the same
// package shape, validated against the evidence model's observables,
// previewed, and only then POSTed to /recalibrate.
//
// Nothing is written until the operator presses Commit: import is a
// governed action that appends an immutable parameter set and
// activates it, and it must never be a side effect of picking a file.
// ---------------------------------------------------------------

import React, { useMemo, useRef, useState } from "react";
import {
    AlertCircle,
    AlertTriangle,
    CheckCircle2,
    FileJson,
    FileSpreadsheet,
    Keyboard,
    Lock,
    Upload,
} from "lucide-react";

import { useRecalibrateEvidenceModel, useUpdateDecisionRule } from "@/api/queries/evidenceModels";
import { apiErrorMessage } from "@/api/apiClient";

import {
    CALIBRATION_FILE_VERSION,
    buildRecalibrationPayload,
    detectFormat,
    observableParameterEntries,
    parseCalibrationJson,
    validateAgainstModel,
} from "../engines/calibrationFile";

import {
    parseResponseMatrix,
    responseMatrixToPackage,
} from "../engines/classicalCalibration";

import { resolveCalibrationWindow } from "../engines/effectiveModel";

const SOURCES = [
    {
        id: "package",
        label: "Calibration file",
        hint: "JSON parameter package (.json)",
        icon: FileJson,
    },
    {
        id: "matrix",
        label: "Response matrix",
        hint: "Raw 0/1 responses (.csv)",
        icon: FileSpreadsheet,
    },
    {
        id: "manual",
        label: "Manual entry",
        hint: "Paste parameters directly",
        icon: Keyboard,
    },
];

export default function CalibrationImportPanel({
    evidenceModel,
    statisticalModel,
    observables = [],
    competency = null,
    onImported,
}) {

    const [source, setSource] = useState("package");

    const [fileName, setFileName] = useState(null);
    const [pkg, setPkg] = useState(null);
    const [parseErrors, setParseErrors] = useState([]);
    const [parseWarnings, setParseWarnings] = useState([]);

    const [manualText, setManualText] = useState("");
    const [operator, setOperator] = useState("");
    const [applyDecisionRule, setApplyDecisionRule] = useState(true);
    const [committed, setCommitted] = useState(null);

    const fileInputRef = useRef(null);

    // The FileReader callback fires after the operator may have typed more,
    // so read the current value through a ref rather than the closure.
    const operatorRef = useRef("");
    operatorRef.current = operator;

    const recalibrate = useRecalibrateEvidenceModel();
    const updateDecisionRule = useUpdateDecisionRule();

    // The server refuses recalibration outside the confirmed/suspended
    // window; resolveCalibrationWindow is the client mirror of that gate,
    // so the operator sees WHY the import is unavailable instead of
    // pressing Commit and getting a server rejection back.
    const window_ = resolveCalibrationWindow(evidenceModel);

    /* =====================================================
       VALIDATION AGAINST THE TARGET MODEL
    ===================================================== */

    const modelValidation = useMemo(() => {

        if (!pkg) return null;

        return validateAgainstModel({
            pkg,
            statisticalModel,
            observables,
            competency,
        });

    }, [pkg, statisticalModel, observables, competency]);

    const blocking = [
        ...parseErrors,
        ...(modelValidation?.errors || []),
    ];

    const advisories = [
        ...parseWarnings,
        ...(modelValidation?.warnings || []),
    ];

    const canCommit =
        !!pkg && blocking.length === 0 && window_.open && !recalibrate.isPending;

    /* =====================================================
       RESET
    ===================================================== */

    const reset = () => {
        setPkg(null);
        setFileName(null);
        setParseErrors([]);
        setParseWarnings([]);
        setCommitted(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const selectSource = (id) => {
        setSource(id);
        reset();
    };

    /* =====================================================
       INGEST
    ===================================================== */

    const ingestText = (text, name) => {

        setCommitted(null);

        const format = source === "matrix"
            ? "csv"
            : source === "manual"
                ? "json"
                : detectFormat(name || "", text);

        if (format === "csv") {

            const parsed = parseResponseMatrix(text, { fileName: name || "" });

            if (!parsed.ok) {
                setPkg(null);
                setParseErrors(parsed.errors);
                setParseWarnings(parsed.warnings);
                return;
            }

            const built = responseMatrixToPackage({
                matrix: parsed.matrix,
                subtype: statisticalModel?.subtype || "2pl",
                calibratedBy: operatorRef.current.trim() || "response-matrix import",
                fileName: name,
            });

            setPkg(built.pkg);
            setParseErrors([]);
            setParseWarnings([...parsed.warnings, ...built.warnings]);
            return;
        }

        const parsed = parseCalibrationJson(text);

        setPkg(parsed.ok ? parsed.pkg : null);
        setParseErrors(parsed.errors);
        setParseWarnings(parsed.warnings);
    };

    const handleFile = (e) => {

        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);

        const reader = new FileReader();
        reader.onerror = () => setParseErrors(["The file could not be read."]);
        reader.onload = (ev) => ingestText(String(ev.target.result || ""), file.name);
        reader.readAsText(file);
    };

    /* =====================================================
       COMMIT
    ===================================================== */

    const commit = async () => {

        if (!canCommit) return;

        const payload = buildRecalibrationPayload({
            pkg,
            statisticalModelId: statisticalModel.id,
            fileName,
        });

        try {

            const res = await recalibrate.mutateAsync({
                id: evidenceModel.id,
                payload,
            });

            if (applyDecisionRule && pkg.decisionRule) {
                await updateDecisionRule.mutateAsync({
                    id: evidenceModel.id,
                    payload: { decisionRule: pkg.decisionRule },
                });
            }

            setCommitted({
                parameterSetId: res?.parameterSet?.parameterSetId || null,
                count: observableParameterEntries(payload.parameters).length,
            });

            setPkg(null);
            setFileName(null);
            setManualText("");
            if (fileInputRef.current) fileInputRef.current.value = "";

            onImported?.(res);

        } catch (err) {
            setParseErrors([apiErrorMessage(err, "Recalibration failed.")]);
        }
    };

    /* =====================================================
       GUARD — THE CALIBRATION WINDOW MUST BE OPEN
       Draft: no parameters allowed at all (schema.js blocks them).
       Operational: frozen while live — deactivate to reopen.
       Archived: read-only.
    ===================================================== */

    if (!window_.open) {

        const live = window_.status === "operational";

        return (

            <div className={`flex items-start gap-3 rounded-lg border px-4 py-3.5 text-sm ${live
                ? "border-slate-300 bg-slate-100 text-slate-700"
                : "border-amber-200 bg-amber-50 text-amber-800"
                }`}>

                {live
                    ? <Lock size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-slate-500" />
                    : <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />}

                <span>
                    <strong className="font-semibold">
                        Calibration import is unavailable.
                    </strong>{" "}
                    {window_.reason}
                    {window_.remedy && (
                        <span className="mt-1 block text-xs opacity-80">
                            {window_.remedy}
                        </span>
                    )}
                </span>

            </div>

        );
    }

    /* =====================================================
       UI
    ===================================================== */

    return (

        <div className="space-y-6">

            {/* ---------- source selector ---------- */}

            <div className="grid gap-3 sm:grid-cols-3">

                {SOURCES.map(s => {

                    const Icon = s.icon;
                    const selected = source === s.id;

                    return (

                        <button
                            key={s.id}
                            type="button"
                            onClick={() => selectSource(s.id)}
                            className={`flex items-start gap-3 rounded-lg border p-4 text-left transition ${selected
                                ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                }`}
                        >

                            <Icon size={18} strokeWidth={2} className="mt-0.5 shrink-0" />

                            <span>
                                <span className="block text-sm font-semibold">
                                    {s.label}
                                </span>
                                <span className={`mt-0.5 block text-xs ${selected ? "text-slate-300" : "text-slate-500"}`}>
                                    {s.hint}
                                </span>
                            </span>

                        </button>

                    );

                })}

            </div>

            {/* ---------- intake ---------- */}

            {source !== "manual" ? (

                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">

                    <Upload size={20} strokeWidth={2} className="mx-auto text-slate-400" />

                    <div className="mt-3 text-sm font-medium text-slate-800">
                        {source === "package"
                            ? "Select a calibration package"
                            : "Select a response matrix"}
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                        {source === "package"
                            ? `JSON, calibrationFileVersion ${CALIBRATION_FILE_VERSION}.x — see samples/sample-calibration-irt-2pl.json`
                            : "CSV — first row = observable ids, one row per examinee, cells 0 / 1 / blank"}
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={source === "package" ? ".json,application/json" : ".csv,.tsv,text/csv"}
                        onChange={handleFile}
                        className="mx-auto mt-4 block w-full max-w-sm cursor-pointer rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-700 file:mr-3 file:rounded file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                    />

                    {source === "matrix" && (
                        <div className="mx-auto mt-4 w-full max-w-sm text-left">
                            <label className="mb-1.5 block text-xs font-medium text-slate-600">
                                Calibrated by
                            </label>
                            <input
                                type="text"
                                value={operator}
                                onChange={(e) => setOperator(e.target.value)}
                                placeholder="who ran this calibration"
                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            />
                            <p className="mt-1 text-[11px] text-slate-500">
                                Recorded on the parameter set. A response-matrix import has
                                no provenance of its own — this is the only attribution it gets.
                            </p>
                        </div>
                    )}

                    {fileName && (
                        <div className="mt-3 text-xs text-slate-500">
                            Loaded: <span className="font-mono text-slate-700">{fileName}</span>
                        </div>
                    )}

                </div>

            ) : (

                <div className="space-y-3">

                    <label className="block text-sm font-medium text-slate-700">
                        Calibration package JSON
                    </label>

                    <textarea
                        rows={10}
                        value={manualText}
                        onChange={(e) => setManualText(e.target.value)}
                        spellCheck={false}
                        placeholder={MANUAL_PLACEHOLDER}
                        className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-xs text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />

                    <button
                        type="button"
                        onClick={() => ingestText(manualText, "manual-entry.json")}
                        disabled={!manualText.trim()}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Validate
                    </button>

                </div>

            )}

            {/* ---------- blocking errors ---------- */}

            {blocking.length > 0 && (

                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3.5">

                    <div className="flex items-center gap-2 text-sm font-semibold text-red-800">
                        <AlertCircle size={16} strokeWidth={2} />
                        Import blocked ({blocking.length})
                    </div>

                    <ul className="ml-5 mt-2 list-disc space-y-1 text-sm text-red-700">
                        {blocking.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>

                </div>

            )}

            {/* ---------- advisories ---------- */}

            {advisories.length > 0 && (

                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5">

                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                        <AlertTriangle size={16} strokeWidth={2} />
                        Advisories ({advisories.length})
                    </div>

                    <ul className="ml-5 mt-2 list-disc space-y-1 text-sm text-amber-800">
                        {advisories.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>

                    <div className="mt-2 text-xs text-amber-700/80">
                        Advisories do not block import. They are recorded here, not on
                        the parameter set — note anything material in the calibration
                        notes before committing.
                    </div>

                </div>

            )}

            {/* ---------- preview ---------- */}

            {pkg && <CalibrationPreview pkg={pkg} coverage={modelValidation?.coverage} observables={observables} />}

            {/* ---------- decision rule opt-in ---------- */}

            {pkg?.decisionRule && (

                <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-700">

                    <input
                        type="checkbox"
                        checked={applyDecisionRule}
                        onChange={(e) => setApplyDecisionRule(e.target.checked)}
                        className="mt-0.5"
                    />

                    <span>
                        Also apply the decision rule carried in this file
                        (<span className="font-mono text-xs">{pkg.decisionRule.type} {pkg.decisionRule.direction} {pkg.decisionRule.threshold}</span>).
                        <span className="mt-1 block text-xs text-slate-500">
                            Replaces the current decision rule. Blocked by the schema once
                            historical sessions exist, to protect longitudinal comparability.
                        </span>
                    </span>

                </label>

            )}

            {/* ---------- commit ---------- */}

            <div className="flex flex-wrap items-center gap-3">

                <button
                    type="button"
                    onClick={commit}
                    disabled={!canCommit}
                    className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                >
                    {recalibrate.isPending ? "Committing…" : "Commit parameter set"}
                </button>

                {pkg && (
                    <button
                        type="button"
                        onClick={reset}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        Discard
                    </button>
                )}

                <span className="text-xs text-slate-500">
                    Committing appends a new parameter set and makes it active.
                    Previous sets are retained.
                </span>

            </div>

            {/* ---------- success ---------- */}

            {committed && (

                <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800">

                    <CheckCircle2 size={16} strokeWidth={2} className="mt-0.5 shrink-0" />

                    <span>
                        Parameter set <span className="font-mono">{committed.parameterSetId}</span> committed
                        and activated with {committed.count} calibrated observable(s).
                    </span>

                </div>

            )}

        </div>

    );

}

/* =====================================================
   PREVIEW
===================================================== */

function CalibrationPreview({ pkg, coverage, observables }) {

    const isIrt = pkg.kind === "irt-parameters";

    const entries = observableParameterEntries(pkg.parameters);

    const statementFor = (obsId) =>
        observables.find(o => o.id === obsId)?.statement || "—";

    const states = pkg.prior ? Object.keys(pkg.prior) : [];

    return (

        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex flex-wrap items-center justify-between gap-3">

                <div className="text-sm font-semibold text-slate-900">
                    Calibration Preview
                </div>

                <div className="flex flex-wrap gap-2">

                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                        {pkg.kind}
                    </span>

                    {coverage && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                            {coverage.supplied}/{coverage.scoped} mapped observables
                        </span>
                    )}

                </div>

            </div>

            {/* provenance */}

            <dl className="grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
                <Field label="Calibrated by" value={pkg.provenance?.calibratedBy} />
                <Field label="Method" value={pkg.provenance?.calibrationMethod} />
                <Field label="Sample size" value={pkg.provenance?.sampleSize} />
                <Field label="Calibration date" value={pkg.provenance?.calibrationDate} />
                <Field label="Population" value={pkg.provenance?.population} />
                <Field label="Software" value={pkg.provenance?.software} />
            </dl>

            {pkg.provenance?.notes && (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    {pkg.provenance.notes}
                </div>
            )}

            {/* parameters */}

            <div className="overflow-x-auto">

                <table className="w-full min-w-[640px] text-left text-xs">

                    <thead className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                        <tr>
                            <th className="py-2 pr-3">Observable</th>
                            {isIrt ? (
                                <>
                                    <th className="py-2 pr-3">a</th>
                                    <th className="py-2 pr-3">b</th>
                                    <th className="py-2 pr-3">c</th>
                                    <th className="py-2 pr-3">p</th>
                                    <th className="py-2 pr-3">r<sub>pb</sub></th>
                                    <th className="py-2 pr-3">n</th>
                                </>
                            ) : (
                                states.map(s => (
                                    <th key={s} className="py-2 pr-3">P(obs | {s})</th>
                                ))
                            )}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">

                        {entries.map(([obsId, p]) => (

                            <tr key={obsId}>

                                <td className="py-2 pr-3">
                                    <div className="font-mono text-slate-800">{obsId}</div>
                                    <div className="max-w-xs truncate text-[11px] text-slate-500">
                                        {statementFor(obsId)}
                                    </div>
                                </td>

                                {isIrt ? (
                                    <>
                                        <td className="py-2 pr-3 tabular-nums text-slate-700">{fmt(p.a)}</td>
                                        <td className="py-2 pr-3 tabular-nums text-slate-700">{fmt(p.b)}</td>
                                        <td className="py-2 pr-3 tabular-nums text-slate-700">{fmt(p.c)}</td>
                                        <td className="py-2 pr-3 tabular-nums text-slate-500">{fmt(p.pValue)}</td>
                                        <td className="py-2 pr-3 tabular-nums text-slate-500">{fmt(p.pointBiserial)}</td>
                                        <td className="py-2 pr-3 tabular-nums text-slate-500">{p.n ?? "—"}</td>
                                    </>
                                ) : (
                                    states.map(s => (
                                        <td key={s} className="py-2 pr-3 tabular-nums text-slate-700">
                                            {fmt(p.levels?.[s])}
                                        </td>
                                    ))
                                )}

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

            {/* prior / scale / fit */}

            {pkg.prior && (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Prior:</span>
                    {states.map(s => (
                        <span key={s} className="ml-3 tabular-nums">{s}: {fmt(pkg.prior[s])}</span>
                    ))}
                </div>
            )}

            {(pkg.scale || pkg.fit) && (

                <div className="grid gap-3 sm:grid-cols-2">

                    {pkg.scale && (
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                            <div className="font-semibold text-slate-700">Reporting scale</div>
                            <div className="mt-1 space-y-0.5">
                                {Object.entries(pkg.scale).map(([k, v]) => (
                                    <div key={k}>{k}: <span className="tabular-nums">{String(v)}</span></div>
                                ))}
                            </div>
                        </div>
                    )}

                    {pkg.fit && (
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                            <div className="font-semibold text-slate-700">Model fit</div>
                            <div className="mt-1 space-y-0.5">
                                {Object.entries(pkg.fit).map(([k, v]) => (
                                    <div key={k}>{k}: <span className="tabular-nums">{String(v)}</span></div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

            )}

        </div>

    );

}

function Field({ label, value }) {

    if (value === undefined || value === null || value === "") return null;

    return (
        <div className="flex gap-2">
            <dt className="shrink-0 font-medium text-slate-500">{label}:</dt>
            <dd className="text-slate-800">{String(value)}</dd>
        </div>
    );
}

const fmt = (v) =>
    typeof v === "number" && Number.isFinite(v) ? v.toFixed(3) : "—";

const MANUAL_PLACEHOLDER = `{
  "calibrationFileVersion": "1.0",
  "kind": "irt-parameters",
  "provenance": {
    "calibratedBy": "j.rao@example.org",
    "calibrationMethod": "R mirt 2PL MML-EM",
    "sampleSize": 1200
  },
  "parameters": {
    "o1": { "a": 1.21, "b": -0.34 }
  }
}`;
