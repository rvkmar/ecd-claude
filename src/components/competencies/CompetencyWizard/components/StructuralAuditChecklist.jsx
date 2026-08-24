// CompetencyWizard/components/StructuralAuditChecklist.jsx
// 🧠 Structural Audit Checklist (Production-Grade Refactor)
// Consolidated structural validation for Competency Model
// Mirrors backend validation logic (UI-level pre-check)
// - Tailwind UI
// - Deterministic prerequisite cycle detection
// - Strict structural validation
// - Governance-aligned messaging

import React, { useMemo } from "react";
import { Check, X, ShieldCheck, AlertTriangle } from "lucide-react";
import { computeStructuralAudit } from "../structuralAudit";

export default function StructuralAuditChecklist({
    model,
    competencies = [],
}) {
    /* =====================================================
       🔹 STRUCTURAL VALIDATION
       Delegated to the shared computeStructuralAudit() util so this
       display never disagrees with CompetencyWizardContext's
       stepValidity[8], which gates on the same function's allPassed.
    ===================================================== */

    const { checks: audit, allPassed } = useMemo(
        () => computeStructuralAudit({ model, competencies }),
        [model, competencies]
    );

    /* =====================================================
       🔹 RENDER
    ===================================================== */

    return (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-6 space-y-6">
            <div>
                <h4 className="text-sm font-semibold text-slate-800">
                    Structural Audit Checklist
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                    Consolidated structural validation prior to confirmation.
                </p>
            </div>

            {/* Checklist */}
            <ul className="space-y-3">
                {audit.map((item, index) => (
                    <li
                        key={index}
                        className={`flex items-center gap-2 text-sm ${item.passed ? "text-emerald-700" : "text-red-600"
                            }`}
                    >
                        {item.passed ? (
                            <Check size={16} strokeWidth={2.25} className="shrink-0" />
                        ) : (
                            <X size={16} strokeWidth={2.25} className="shrink-0" />
                        )}
                        {item.label}
                    </li>
                ))}
            </ul>

            {/* Overall Status */}
            <div
                className={`flex items-start gap-3 rounded-lg border px-4 py-3.5 text-sm font-semibold ${allPassed
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-red-200 bg-red-50 text-red-700"
                    }`}
            >
                {allPassed ? (
                    <ShieldCheck size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
                ) : (
                    <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
                )}
                <span>
                    {allPassed
                        ? "All structural checks passed. Model ready for confirmation."
                        : "Structural violations detected. Resolve before confirming."}
                </span>
            </div>

            <div className="text-xs text-slate-500">
                <strong className="font-semibold text-slate-700">Governance:</strong> This checklist mirrors backend validation.
                Final confirmation will be blocked if any rule fails.
            </div>
        </div>
    );
}