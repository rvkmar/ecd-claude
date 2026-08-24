// Step8Confirmation.jsx
// 🧠 Enterprise ECD — Step 8: Confirmation & Governance Lock (REWRITE)
// -------------------------------------------------------------------
// ✔ Final gate after Step7 audit
// ✔ Enforces single active model + zero audit errors
// ✔ Captures governance declaration
// ✔ Prepares model for LOCK + VERSIONING (handled outside)
// ✔ No API calls here — pure decision + certification layer

import React, { useMemo, useEffect } from "react";
import { CheckCircle2, AlertTriangle, Lock } from "lucide-react";
import { useEvidenceWizardContext } from "../EvidenceWizardContext";

export default function Step8Confirmation({
    confirmationChecked,
    setConfirmationChecked,
    onValidityChange
}) {

    const { draftModel } = useEvidenceWizardContext();

    const observables = draftModel?.observables || [];
    const warrants = draftModel?.warrants || [];
    const evidenceRules = draftModel?.evidenceRules || [];
    const models = draftModel?.statisticalModels || [];


    /* =====================================================
       DERIVED STATE
    ===================================================== */

    const activeModels = useMemo(() => {
        return models.filter(m => m.active);
    }, [models]);

    const activeModel = activeModels[0] || null;


    /* =====================================================
       COMPLETENESS CHECK (STRUCTURAL + INFERENTIAL)
    ===================================================== */

    const completeness = useMemo(() => {

        let issues = [];

        // Claim
        if (!draftModel?.claimStatement) {
            issues.push("Claim is not defined");
        }

        // Warrants
        if (warrants.length === 0) {
            issues.push("No warrants defined");
        }

        // Observables
        if (observables.length === 0) {
            issues.push("No observables defined");
        }

        // Evidence Rules
        observables.forEach(obs => {
            const rule = evidenceRules.find(r => r.observableId === obs.id);

            if (!rule) {
                issues.push(`Missing EvidenceRule for observable ${obs.id}`);
                return;
            }

            if (!rule.activationCondition || rule.activationCondition.length < 15) {
                issues.push(`Weak activation condition for observable ${obs.id}`);
            }

            if (!rule.justification || rule.justification.length < 25) {
                issues.push(`Weak justification for observable ${obs.id}`);
            }
        });

        // Model
        if (activeModels.length !== 1) {
            issues.push("Exactly one active statistical model is required");
        }

        return {
            valid: issues.length === 0,
            issues
        };

    }, [draftModel, observables, warrants, evidenceRules, activeModels]);


    /* =====================================================
       FINAL VALIDITY
    ===================================================== */

    const isValid =
        confirmationChecked &&
        completeness.valid;

    useEffect(() => {
        onValidityChange?.(isValid);
    }, [isValid]);


    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div className="space-y-8 max-w-5xl">

            {/* HEADER */}

            <div>
                <h2 className="text-lg font-semibold text-slate-900">
                    Confirmation & Governance Lock
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Final certification of inferential integrity before model locking.
                </p>
            </div>


            {/* SUMMARY */}

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-2 text-sm">

                <div className="text-slate-700"><strong className="text-slate-900">Name:</strong> {draftModel.name || "—"}</div>
                <div className="text-slate-700"><strong className="text-slate-900">Claim:</strong> {draftModel.claimStatement || "—"}</div>
                <div className="text-slate-700"><strong className="text-slate-900">Warrants:</strong> {warrants.length}</div>
                <div className="text-slate-700"><strong className="text-slate-900">Observables:</strong> {observables.length}</div>
                <div className="text-slate-700"><strong className="text-slate-900">Evidence Rules:</strong> {evidenceRules.length}</div>
                <div className="text-slate-700"><strong className="text-slate-900">Statistical Models:</strong> {models.length}</div>
                <div className="text-slate-700"><strong className="text-slate-900">Active Model:</strong> {activeModel?.type || "None"}</div>

            </div>


            {/* COMPLETENESS REPORT */}

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">

                <div className="text-sm font-semibold text-slate-800 mb-2">
                    Final Integrity Check
                </div>

                {completeness.valid ? (
                    <div className="flex items-center gap-1.5 text-emerald-700 text-sm">
                        <CheckCircle2 size={14} strokeWidth={2.25} />
                        All inferential components are complete
                    </div>
                ) : (
                    <ul className="text-red-600 text-sm space-y-1.5">
                        {completeness.issues.map((e, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                                <AlertTriangle size={14} strokeWidth={2.25} className="mt-0.5 shrink-0" />
                                {e}
                            </li>
                        ))}
                    </ul>
                )}

            </div>


            {/* DECLARATION */}

            {!draftModel.locked && (
                <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3.5 text-sm text-blue-800 space-y-3">

                    <div className="space-y-3">
                        <p>
                            By confirming this model, you certify that:
                        </p>

                        <ul className="list-disc ml-5 space-y-1">
                            <li>The claim, warrants, observables, and evidence rules form a valid inferential chain.</li>
                            <li>The statistical model is appropriate for the defined evidence.</li>
                            <li>This model is ready for operational use and interpretation.</li>
                            <li>Further structural changes require version cloning.</li>
                        </ul>
                    </div>

                </div>
            )}


            {/* CONFIRMATION */}

            {!draftModel.locked && (
                <div className="flex items-start gap-2">
                    <input
                        type="checkbox"
                        checked={confirmationChecked}
                        onChange={(e) => setConfirmationChecked(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-slate-900"
                    />
                    <label className="text-sm text-slate-700">
                        I confirm that this Evidence Model satisfies enterprise ECD standards and is ready for structural locking.
                    </label>
                </div>
            )}


            {/* LOCKED STATE */}

            {draftModel.locked && (
                <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800">
                    <Lock size={18} strokeWidth={2.25} className="mt-0.5 shrink-0" />
                    Model locked — structural edits disabled. Versioning required for changes.
                </div>
            )}


            {/* BLOCKER */}

            {!isValid && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
                    <AlertTriangle size={18} strokeWidth={2.25} className="mt-0.5 shrink-0" />
                    Confirmation blocked — resolve all issues and accept declaration.
                </div>
            )}

        </div>
    );
}
