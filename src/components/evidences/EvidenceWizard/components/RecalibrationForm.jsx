import React, { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useRecalibrateEvidenceModel } from "@/api/queries/evidenceModels";
import { apiErrorMessage } from "@/api/apiClient";

export default function RecalibrationForm({
    evidenceModelId,
    statisticalModelId,
    locked
}) {
    const [parameters, setParameters] = useState("{}");
    const [calibratedBy, setCalibratedBy] = useState("");
    const [calibrationMethod, setCalibrationMethod] = useState("");
    const [sampleSize, setSampleSize] = useState("");
    const [notes, setNotes] = useState("");

    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const recalibrate = useRecalibrateEvidenceModel();
    const loading = recalibrate.isPending;

    if (!locked) {
        return (
            <div className="text-sm text-slate-500">
                Recalibration available only after confirmation.
            </div>
        );
    }

    const handleSubmit = async () => {
        setError(null);
        setSuccess(false);

        let parsedParameters;

        try {
            parsedParameters = JSON.parse(parameters);
        } catch (err) {
            setError("Parameters must be valid JSON.");
            return;
        }

        if (!calibratedBy || !calibrationMethod) {
            setError("Calibrated By and Calibration Method are required.");
            return;
        }

        // Phase 2 note: this used to hard window.location.reload() after a
        // successful recalibration. useRecalibrateEvidenceModel() invalidates
        // this evidence model's query instead, so the parameter set list
        // (ParameterSetViewer, right below this form in the wizard)
        // re-renders with the new set without a full page reload.
        try {
            await recalibrate.mutateAsync({
                id: evidenceModelId,
                payload: {
                    statisticalModelId,
                    parameters: parsedParameters,
                    calibratedBy,
                    calibrationMethod,
                    sampleSize: Number(sampleSize) || 0,
                    notes,
                },
            });

            setSuccess(true);
            setParameters("{}");
            setCalibratedBy("");
            setCalibrationMethod("");
            setSampleSize("");
            setNotes("");

        } catch (err) {
            setError(apiErrorMessage(err, "Recalibration failed."));
        }
    };

    return (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-5 space-y-4">

            <h4 className="text-sm font-semibold text-slate-900">
                Add New Parameter Set
            </h4>

            {error && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
                    <AlertCircle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800">
                    <CheckCircle2 size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
                    <span>Recalibration successful.</span>
                </div>
            )}

            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Parameters (JSON) <span className="text-red-500">*</span>
                </label>
                <textarea
                    className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                    rows={4}
                    value={parameters}
                    onChange={(e) =>
                        setParameters(e.target.value)
                    }
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Calibrated By <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                        value={calibratedBy}
                        onChange={(e) =>
                            setCalibratedBy(e.target.value)
                        }
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Calibration Method <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                        placeholder="e.g., R mirt 2PL estimation"
                        value={calibrationMethod}
                        onChange={(e) =>
                            setCalibrationMethod(e.target.value)
                        }
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Sample Size
                    </label>
                    <input
                        type="number"
                        className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                        value={sampleSize}
                        onChange={(e) =>
                            setSampleSize(e.target.value)
                        }
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Notes
                    </label>
                    <input
                        type="text"
                        className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                        value={notes}
                        onChange={(e) =>
                            setNotes(e.target.value)
                        }
                    />
                </div>

            </div>

            <button
                type="button"
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none"
                onClick={handleSubmit}
            >
                {loading ? "Submitting..." : "Recalibrate & Activate"}
            </button>

            <p className="text-xs text-slate-500">
                New parameter sets are appended and automatically activated.
            </p>

        </div>
    );
}
