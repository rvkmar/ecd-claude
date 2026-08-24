// src/components/itemBank/ItemWizard/components/scoring/ScoringMethodSelector.jsx
// ------------------------------------------------------------
// 🧠 Scoring Method Selector (Strict Model-Derived)
// ------------------------------------------------------------
// ✔ Derived strictly from active statistical model
// ✔ No arbitrary scoring methods allowed
// ✔ Immutable updates
// ✔ Draft-aware
// ✔ ECD-chain safe
// ------------------------------------------------------------

import React, { useMemo, useEffect } from "react";
import {
    deriveAllowedScoringMethods,
    scoringLabel,
} from "@/utils/ecdVocabulary";

/* =====================================================
   🔹 Scoring vocabulary
   -----------------------------------------------------
   deriveAllowedScoringMethods() and the label map used to be defined
   here AND, separately, in src/components/taskModels/taskModelConstants.js,
   with a comment at the top of each telling the reader to keep the two in
   step by hand. They are one definition in src/utils/ecdVocabulary.js
   now, imported by this file, by taskModelConstants and by
   src/utils/schema.js -- so the picker, the Task Model blueprint
   whitelist and the server validator cannot drift apart.
===================================================== */

/* =====================================================
   🔹 Component
===================================================== */

export default function ScoringMethodSelector({
    scoring,
    activeStatisticalModel,
    onChange,
    canEdit,
    // The Task Model blueprint's whitelist, already intersected with the
    // model-derived set by deriveItemContext(). `null` means unconstrained.
    allowedMethods: allowedMethodsProp = null,
}) {
    const allowedMethods = useMemo(
        () =>
            Array.isArray(allowedMethodsProp)
                ? allowedMethodsProp
                : deriveAllowedScoringMethods(activeStatisticalModel),
        [allowedMethodsProp, activeStatisticalModel]
    );

    /* -----------------------------------------------------
       🔹 Reset invalid scoring method automatically
    ----------------------------------------------------- */

    useEffect(() => {
        if (!allowedMethods.length) return;
        if (!scoring.method) return;
        if (allowedMethods.includes(scoring.method)) return;

        // Only clears on a real incompatibility. The previous version
        // depended on `allowedMethods`, a fresh array on every render of
        // the parent, so the effect re-ran constantly -- and each run that
        // found a stale method wiped `evidenceActivationMap` with it.
        onChange({
            ...scoring,
            method: "",
            evidenceActivationMap: [],
        });
    }, [allowedMethods, scoring, onChange]);

    /* -----------------------------------------------------
       🔹 Update Method
    ----------------------------------------------------- */

    const handleMethodChange = (method) => {
        if (!canEdit) return;

        onChange({
            ...scoring,
            method,
            evidenceActivationMap: [], // reset mapping when method changes
        });
    };

    /* -----------------------------------------------------
       🔹 UI
    ----------------------------------------------------- */

    return (
        <div className="space-y-4">
            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Scoring Method
                </label>

                {!activeStatisticalModel && (
                    <div className="mt-2 text-sm text-slate-500">
                        No active statistical model found.
                    </div>
                )}

                {activeStatisticalModel && (
                    <>
                        <div className="mb-2 text-xs text-slate-500">
                            Derived from model:{" "}
                            <strong className="text-slate-700">
                                {activeStatisticalModel.type}
                                {activeStatisticalModel.subtype
                                    ? ` (${activeStatisticalModel.subtype})`
                                    : ""}
                            </strong>
                        </div>

                        <select
                            value={scoring.method || ""}
                            disabled={
                                !canEdit || allowedMethods.length === 0
                            }
                            onChange={(e) =>
                                handleMethodChange(e.target.value)
                            }
                            className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                        >
                            <option value="">
                                -- Select Scoring Method --
                            </option>

                            {allowedMethods.map((method) => (
                                <option
                                    key={method}
                                    value={method}
                                >
                                    {scoringLabel(method)}
                                </option>
                            ))}
                        </select>
                    </>
                )}
            </div>

            {!canEdit && (
                <div className="text-xs font-medium text-red-600">
                    Scoring locked (confirmed item).
                </div>
            )}
        </div>
    );
}