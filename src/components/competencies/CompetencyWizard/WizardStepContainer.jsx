// CompetencyWizard/WizardStepContainer.jsx
// 🧩 Wizard Step Container (Canonical Wizard Chrome — Enterprise Visual System)
// ------------------------------------------------------------
// This is the shared visual/behavioral template all four model
// wizards (Competency / Evidence / Task Model / Item) follow:
//  • Nav bar (Cancel, step indicator + progress rail, Back/Next/
//    Confirm) pinned to the TOP of the step content, not the bottom.
//  • The final step swaps Next for Save (draft) or Lock &
//    Confirm (reviewed) -- see the nav block below.
//  • No mid-wizard "Save Draft" button -- Next silently persists the
//    draft first (see CompetencyWizard.jsx's goNext); Confirm does
//    the same if anything changed since the last auto-save.
//  • Cancel governance with unsaved-change protection.
//  • Fully controlled by external state (no duplicated lifecycle
//    state) -- Tailwind UI.
// ------------------------------------------------------------

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Lock, X } from "lucide-react";

export default function WizardStepContainer({
    step,
    totalSteps,
    onNext,
    onBack,
    onCancel,
    canProceed,
    isLast,
    locked,
    status,
    isDirty = false,
    onSaveDraft,
    onSaveAndReview,
    onConfirm,
    children,
}) {
    const [saving, setSaving] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    /* Two pre-confirmation states are editable, not one:
         draft     -- being authored. Last step offers Save.
         reviewed  -- saved and reopened via the list's Review button.
                      Last step offers Lock & Confirm.
       Confirmed/locked is read-only: no Next, no Save, no Confirm. */
    const isDraft = status === "draft";
    const isReviewMode = status === "reviewed" && !locked;
    const canEdit = (isDraft || isReviewMode) && !locked;
    const progressPercent = Math.min(100, Math.round((step / totalSteps) * 100));

    /* =====================================================
       🔹 NEXT (silently auto-saves via the onNext prop, which
       already wraps saveDraft() -- see CompetencyWizard.jsx)
    ===================================================== */

    async function handleNext() {
        if (saving) return;
        try {
            setSaving(true);
            await onNext?.();
        } finally {
            setSaving(false);
        }
    }

    /* =====================================================
       🔹 SAVE (final step, draft only) -- persists the draft and
       promotes it to `reviewed`, which is what turns the model
       list's Edit button into Review. Confirmation is deliberately
       a separate, later act performed from review mode.
    ===================================================== */

    async function handleSave() {
        if (saving) return;
        try {
            setSaving(true);
            if (onSaveDraft) {
                const ok = await onSaveDraft();
                if (ok === false) return;
            }
            await onSaveAndReview?.();
        } finally {
            setSaving(false);
        }
    }

    /* =====================================================
       🔹 LOCK & CONFIRM -- auto-saves first if there are
       unsaved edits made on this (final) step, then confirms.
    ===================================================== */

    async function handleLockAndConfirm() {
        if (!onConfirm || !isReviewMode) return;

        try {
            setSaving(true);
            if (isDirty && onSaveDraft) {
                const ok = await onSaveDraft();
                if (ok === false) return;
            }
            await onConfirm();
        } finally {
            setSaving(false);
        }
    }

    /* =====================================================
       🔹 CANCEL HANDLING
    ===================================================== */

    function handleCancelClick() {
        if (canEdit && isDirty) {
            setShowCancelModal(true);
        } else {
            onCancel?.();
        }
    }

    function confirmCancel() {
        setShowCancelModal(false);
        onCancel?.();
    }

    /* =====================================================
       🔹 TOP NAVIGATION BAR
    ===================================================== */

    const primaryButtonClasses = (disabled, tone = "bg-slate-900 hover:bg-slate-800") =>
        `inline-flex items-center gap-1.5 rounded-md px-5 py-2 text-sm font-semibold text-white shadow-sm transition ${disabled
            ? "cursor-not-allowed bg-slate-200 text-slate-400 shadow-none"
            : tone
        }`;

    function renderNavigation() {
        return (
            <div className="sticky top-0 z-20 border-b border-slate-200 bg-white">
                <div className="flex items-center justify-between gap-4 px-8 py-4">
                    {/* Cancel */}
                    <button
                        onClick={handleCancelClick}
                        className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                    >
                        <X size={15} strokeWidth={2.25} />
                        Cancel
                    </button>

                    {/* Step Indicator + Progress Rail */}
                    <div className="flex flex-1 flex-col items-center px-4">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Step {step} of {totalSteps}
                        </span>
                        <div className="mt-1.5 h-1 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-slate-900 transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2.5">
                        {saving && (
                            <span className="mr-0.5 text-xs font-medium text-slate-400">
                                Saving…
                            </span>
                        )}

                        {/* Back */}
                        {step > 1 && (
                            <button
                                onClick={onBack}
                                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                            >
                                <ChevronLeft size={15} strokeWidth={2.25} />
                                Back
                            </button>
                        )}

                        {/* Next -- silently saves the draft before advancing
                            while editing. A confirmed/locked model still gets
                            Next and Back: paging through a locked model to READ
                            it is the whole point of View mode, and the step
                            validity flags that gate Next while editing are
                            meaningless there (a step you never mount never sets
                            its flag, so `canProceed` is false for reasons that
                            have nothing to do with the model). onNext skips the
                            auto-save when locked -- see the wizard controller. */}
                        {!isLast && (
                            <button
                                onClick={handleNext}
                                disabled={saving || (canEdit && !canProceed)}
                                className={primaryButtonClasses(
                                    saving || (canEdit && !canProceed)
                                )}
                            >
                                Next
                                <ChevronRight size={15} strokeWidth={2.25} />
                            </button>
                        )}

                        {/* Save -- final step while still a draft */}
                        {isLast && canEdit && !isReviewMode && (
                            <button
                                onClick={handleSave}
                                disabled={!canProceed || saving}
                                className={primaryButtonClasses(
                                    !canProceed || saving,
                                    "bg-emerald-600 hover:bg-emerald-700"
                                )}
                            >
                                {saving ? "Saving…" : "Save for Review"}
                            </button>
                        )}

                        {/* Lock & Confirm -- final step in review mode */}
                        {isLast && isReviewMode && (
                            <button
                                onClick={handleLockAndConfirm}
                                disabled={!canProceed || saving}
                                className={primaryButtonClasses(
                                    !canProceed || saving,
                                    "bg-blue-600 hover:bg-blue-700"
                                )}
                            >
                                {saving ? "Processing…" : "Lock & Confirm"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    /* =====================================================
       🔹 RENDER
    ===================================================== */

    return (
        <div className="flex flex-1 flex-col min-w-0">
            {renderNavigation()}

            {/* Grows with step content instead of scrolling internally --
                the page itself scrolls, with the sidebar and nav bar above
                staying pinned via `sticky`. */}
            <div className="flex-1 px-8 py-8">
                <div className="mx-auto max-w-5xl">
                    {children}

                    {locked && (
                        <div className="mt-8 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800">
                            <Lock size={16} strokeWidth={2.25} className="mt-0.5 shrink-0" />
                            <span>
                                This Competency Model is confirmed and locked.
                                Structural changes require cloning.
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                    <div className="w-[26rem] rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
                        <h2 className="text-base font-semibold text-slate-900">
                            Discard changes?
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            You have unsaved changes on this step. Leaving now will
                            discard them.
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                            >
                                Continue Editing
                            </button>
                            <button
                                onClick={confirmCancel}
                                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                            >
                                Discard & Exit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
