// CompetencyWizard/WizardSidebar.jsx
// 🧭 Wizard Sidebar (Canonical Wizard Chrome — Enterprise Visual System)
// ------------------------------------------------------------
// Shared visual template for all four model wizards' sidebars: a
// white, bordered rail with a numbered/connected step tracker
// (rather than a flat highlighted list), a refined status pill, and
// a quiet branding footer. Behavior is unchanged from the previous
// pass -- draft-step navigation isn't gated behind a manual "Save
// Draft" anymore, so step clicks just navigate directly (locked
// models still block editing/step clicks, same as before).
// ------------------------------------------------------------

import React from "react";
import { Check, ChevronLeft, ChevronRight, Lock } from "lucide-react";

// Same lifecycle color map used by every other wizard's sidebar, for
// uniformity across all four model wizards.
const STATUS_COLORS = {
    draft: "bg-slate-100 text-slate-600",
    reviewed: "bg-amber-100 text-amber-700",
    confirmed: "bg-blue-100 text-blue-700",
    operational: "bg-emerald-100 text-emerald-700",
    suspended: "bg-red-100 text-red-700",
    archived: "bg-slate-800 text-white",
};

// Compact dot equivalent of STATUS_COLORS, shown in place of the full
// status pill when the sidebar is collapsed to its icon rail.
const STATUS_DOT_COLORS = {
    draft: "bg-slate-400",
    reviewed: "bg-amber-500",
    confirmed: "bg-blue-500",
    operational: "bg-emerald-500",
    suspended: "bg-red-500",
    archived: "bg-slate-800",
};

export default function WizardSidebar({
    steps = [],
    currentStep,
    onStepClick,
    locked = false,
    status = "draft",
}) {
    // Purely a visual/UI concern local to this component -- folding the
    // rail doesn't affect wizard state, so it isn't lifted to context.
    const [collapsed, setCollapsed] = React.useState(false);

    /* =====================================================
       🔹 STEP STATE
    ===================================================== */
    function getStepState(stepId) {
        if (stepId < currentStep) return "completed";
        if (stepId === currentStep) return "active";
        return "pending";
    }

    return (
        <aside
            className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-slate-200 bg-white transition-all duration-200 ease-in-out ${collapsed ? "w-[72px]" : "w-72"
                }`}
        >
            {/* Collapse / Expand Handle */}
            <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="absolute -right-3 top-8 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
            >
                {collapsed ? (
                    <ChevronRight size={13} strokeWidth={2.5} />
                ) : (
                    <ChevronLeft size={13} strokeWidth={2.5} />
                )}
            </button>

            {/* Brand / Title */}
            <div className={`border-b border-slate-100 py-6 ${collapsed ? "px-3" : "px-6"}`}>
                <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
                        C
                    </div>
                    {!collapsed && (
                        <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-slate-900">
                                Competency Model Wizard
                            </h3>
                            <p className="text-xs text-slate-400">
                                Guided authoring workflow
                            </p>
                        </div>
                    )}
                </div>

                {!collapsed && (
                    <div className="mt-5 flex flex-wrap items-center gap-2">
                        <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${STATUS_COLORS[status] || STATUS_COLORS.draft
                                }`}
                        >
                            {status}
                        </span>

                        {locked && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600">
                                <Lock size={12} strokeWidth={2.5} />
                                Structure Locked
                            </span>
                        )}
                    </div>
                )}

                {collapsed && (
                    <div className="mt-4 flex flex-col items-center gap-1.5">
                        <span
                            className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT_COLORS[status] || STATUS_DOT_COLORS.draft}`}
                            title={status}
                        />
                        {locked && <Lock size={12} strokeWidth={2.5} className="text-red-600" />}
                    </div>
                )}
            </div>

            {/* Scrollable Step Tracker */}
            <nav className={`flex-1 overflow-y-auto overflow-x-hidden py-6 ${collapsed ? "px-2" : "px-4"}`}>
                <ol className="relative">
                    {steps.map((step, index) => {
                        const state = getStepState(step.id);
                        const isLastItem = index === steps.length - 1;

                        const circleClasses = {
                            active:
                                "bg-slate-900 text-white ring-4 ring-slate-200",
                            completed:
                                "bg-white text-slate-900 border-2 border-slate-900",
                            pending:
                                "bg-white text-slate-400 border-2 border-slate-200",
                        }[state];

                        const labelClasses = {
                            active: "text-slate-900 font-semibold",
                            completed:
                                "text-slate-600 font-medium group-hover:text-slate-900",
                            pending: "text-slate-400 font-medium",
                        }[state];

                        return (
                            <li key={step.id} className="relative pb-7 last:pb-0">
                                {!isLastItem && (
                                    <span
                                        aria-hidden="true"
                                        className={`absolute top-8 h-full w-px bg-slate-200 ${collapsed ? "left-[23px]" : "left-[15px]"
                                            }`}
                                    />
                                )}

                                {/* Locked = read-only inputs, not a frozen
                                    rail: a confirmed model still has to be
                                    walkable to be readable. */}
                                <button
                                    type="button"
                                    onClick={() => onStepClick?.(step.id)}
                                    title={collapsed ? step.label : undefined}
                                    className={`group relative z-10 flex w-full cursor-pointer items-center gap-3 rounded-md text-left transition ${collapsed ? "justify-center" : ""
                                        }`}
                                >
                                    <span
                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition ${circleClasses}`}
                                    >
                                        {state === "completed" ? (
                                            <Check size={14} strokeWidth={2.5} />
                                        ) : (
                                            step.id
                                        )}
                                    </span>
                                    {!collapsed && (
                                        <span className={`text-sm transition ${labelClasses}`}>
                                            {step.label}
                                        </span>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ol>
            </nav>

            {/* Sticky Bottom Footer */}
            {!collapsed && (
                <div className="border-t border-slate-100 px-6 py-5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Evidence Centered Design (ECD)
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-300">
                        Competency Layer
                    </p>
                </div>
            )}
        </aside>
    );
}
