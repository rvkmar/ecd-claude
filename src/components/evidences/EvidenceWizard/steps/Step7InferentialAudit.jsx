// Step7InferentialAudit.jsx
// 🧠 Enterprise ECD — Step 7: Inferential Audit (RESEARCH-GRADE)
// ------------------------------------------------------------------
// ✔ Full pipeline audit: Warrant → Observable → EvidenceRule → Model → Claim
// ✔ Uses schema validation + derived inferential diagnostics
// ✔ Separates STRUCTURE vs INFERENCE vs MODEL COMPATIBILITY
// ✔ Blocks progression unless fully coherent

import { useMemo, useEffect } from "react";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useEvidenceWizardContext } from "../EvidenceWizardContext";
import { validateEntity } from "../../../../utils/schema";
import InferentialTraceGraph from "../components/InferentialTraceGraph";

export default function Step7InferentialAudit({ db, onValidityChange }) {

    const {
        draftModel,
        selectedCompetency,
        selectedModelMeta
    } = useEvidenceWizardContext();

    const observables = draftModel?.observables || [];
    const warrants = draftModel?.warrants || [];
    const evidenceRules = draftModel?.evidenceRules || [];
    const models = draftModel?.statisticalModels || [];


    /* =====================================================
       1. SCHEMA VALIDATION (BASE LAYER)
    ===================================================== */

    const schemaAudit = useMemo(() => {
        if (!draftModel) return null;
        return validateEntity("evidenceModels", draftModel, db);
    }, [draftModel, db]);


    /* =====================================================
       2. INFERENTIAL CHAIN AUDIT (NEW — CORE ECD)
    ===================================================== */

    const inferentialAudit = useMemo(() => {

        const issues = [];

        observables.forEach(obs => {

            const warrant = warrants.find(w => w.id === obs.warrantId);
            const rule = evidenceRules.find(r => r.observableId === obs.id);

            if (!warrant) {
                issues.push(`Observable ${obs.id} not linked to valid warrant`);
            }

            if (!rule) {
                issues.push(`Observable ${obs.id} missing EvidenceRule`);
                return;
            }

            // Weak reasoning link
            if (!rule.justification.includes("warrant") && !warrant) {
                issues.push(`Observable ${obs.id} has weak inferential justification`);
            }

            // Direction sanity
            if (rule.direction === "neutral") {
                issues.push(`Observable ${obs.id} contributes no directional evidence`);
            }

        });

        return {
            valid: issues.length === 0,
            issues
        };

    }, [observables, warrants, evidenceRules]);


    /* =====================================================
       3. MODEL COMPATIBILITY AUDIT
    ===================================================== */

    const modelAudit = useMemo(() => {

        const issues = [];

        evidenceRules.forEach(rule => {

            if (rule.direction === "weakens" && models.some(m => m.type === "irt")) {
                issues.push(`IRT does not support 'weakens' directly (observable ${rule.observableId})`);
            }

            if (rule.direction === "neutral" && models.some(m => m.type === "irt")) {
                issues.push(`Neutral evidence ignored in IRT (observable ${rule.observableId})`);
            }

        });

        return {
            valid: issues.length === 0,
            issues
        };

    }, [evidenceRules, models]);


    /* =====================================================
       FINAL STATUS
    ===================================================== */

    const allErrors = [
        ...(schemaAudit?.errors || []),
        ...inferentialAudit.issues,
        ...modelAudit.issues
    ];

    const isValid =
        schemaAudit?.valid &&
        inferentialAudit.valid &&
        modelAudit.valid;


    useEffect(() => {
        if (onValidityChange) {
            onValidityChange(isValid);
        }
    }, [isValid]);


    /* =====================================================
       UI SECTION COMPONENT
    ===================================================== */

    const Section = ({ title, items, color }) => (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
            <div className={`text-sm font-semibold mb-2 ${color}`}>
                {title} ({items.length})
            </div>

            {items.length === 0 ? (
                <div className="flex items-center gap-1.5 text-emerald-700 text-sm">
                    <CheckCircle2 size={14} strokeWidth={2.25} />
                    No issues
                </div>
            ) : (
                <ul className="space-y-2 text-sm text-red-600">
                    {items.map((e, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                            <AlertTriangle size={14} strokeWidth={2.25} className="mt-0.5 shrink-0" />
                            {e}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );


    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div className="space-y-8 max-w-6xl">

            {/* HEADER */}
            <div>
                <h2 className="text-lg font-semibold text-slate-900">
                    Inferential Audit
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Validates structural integrity, inferential reasoning, and statistical compatibility.
                </p>
            </div>


            {/* CONTEXT */}
            <div className="grid grid-cols-3 gap-4 text-sm">

                <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
                    <div className="text-slate-500">Competency</div>
                    <div className="font-medium text-slate-900">
                        {selectedCompetency?.name || "—"}
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
                    <div className="text-slate-500">Model</div>
                    <div className="font-medium text-slate-900">
                        {selectedModelMeta?.modelName || "—"}
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
                    <div className="text-slate-500">Version</div>
                    <div className="font-medium text-slate-900">
                        v{draftModel?.versionNumber}
                    </div>
                </div>

            </div>


            {/* RESULT */}
            <div className={`flex items-start gap-3 rounded-lg border px-4 py-3.5 text-sm ${isValid ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
                {isValid ? (
                    <CheckCircle2 size={18} strokeWidth={2.25} className="mt-0.5 shrink-0" />
                ) : (
                    <XCircle size={18} strokeWidth={2.25} className="mt-0.5 shrink-0" />
                )}
                <div>
                    <div className="font-semibold">
                        {isValid ? "PASSED" : "FAILED"}
                    </div>
                    <div className="mt-1">
                        {isValid ? "Inferential model is valid." : `${allErrors.length} issues detected`}
                    </div>
                </div>
            </div>


            {/* BREAKDOWN */}
            <div className="grid grid-cols-3 gap-4">

                <Section
                    title="Schema Integrity"
                    items={schemaAudit?.errors || []}
                    color="text-blue-600"
                />

                <Section
                    title="Inferential Logic"
                    items={inferentialAudit.issues}
                    color="text-purple-600"
                />

                <Section
                    title="Model Compatibility"
                    items={modelAudit.issues}
                    color="text-orange-600"
                />

            </div>


            {/* TRACE GRAPH */}
            <InferentialTraceGraph draftModel={draftModel} />


            {!isValid && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
                    <AlertTriangle size={18} strokeWidth={2.25} className="mt-0.5 shrink-0" />
                    Cannot proceed until all inferential issues are resolved.
                </div>
            )}

        </div>
    );
}
