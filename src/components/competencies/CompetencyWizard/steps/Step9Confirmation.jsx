// CompetencyWizard/steps/Step9Confirmation.jsx
// Step 9 — Confirmation & Lock (Lifecycle Clean Refactor)
// WizardStepContainer controls Save Draft + Lock & Confirm
// This step now focuses ONLY on review + acknowledgment

import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { useCompetencyWizard } from "../CompetencyWizardContext";
import CompetencyPreviewPanel from "../components/CompetencyPreviewPanel";
import VersionHistoryViewer from "../components/VersionHistoryViewer";
import CloneModelDialog from "../components/CloneModelDialog";

export default function Step9Confirmation() {
    const { model, competencies, cloneModel, allModels } =
        useCompetencyWizard();

    const [cloneOpen, setCloneOpen] = useState(false);

    async function handleClone(newName) {
        await cloneModel(newName);
        setCloneOpen(false);
    }

    /* =====================================================
       LOCKED VIEW
    ===================================================== */
    if (model?.locked) {
        return (
            <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">
                    Step 9 — Confirmation
                </h2>

                <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800">
                    <CheckCircle2 size={18} strokeWidth={2} className="mt-0.5 shrink-0" />
                    <div>
                        <strong className="block text-sm font-semibold">
                            Model Confirmed
                        </strong>
                        <p className="mt-2 text-sm">
                            This Competency Model is locked and structurally frozen.
                            To modify the latent architecture, clone this model to
                            create a new draft version.
                        </p>

                        <button
                            onClick={() => setCloneOpen(true)}
                            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                        >
                            Clone Model
                        </button>
                    </div>
                </div>

                <VersionHistoryViewer
                    currentModel={model}
                    allModels={allModels || []}
                />

                <CloneModelDialog
                    isOpen={cloneOpen}
                    model={model}
                    onConfirmClone={handleClone}
                    onCancel={() => setCloneOpen(false)}
                />
            </div>
        );
    }

    /* =====================================================
       DRAFT REVIEW VIEW
    ===================================================== */
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-slate-900">
                    Step 9 — Confirmation
                </h2>
                <p className="mt-1 text-sm text-slate-500 max-w-3xl">
                    Review the full structural definition of this Competency Model
                    before locking. Structural confirmation will permanently freeze
                    the latent architecture.
                </p>
            </div>

            {/* Structural Preview */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
                <CompetencyPreviewPanel
                    model={model}
                    competencies={competencies}
                />
            </div>

            {/* Consequences List */}
            <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-800">
                    After confirmation:
                </div>

                <ul className="list-disc pl-6 space-y-1 text-sm text-slate-700">
                    <li>Dimensionality cannot be changed</li>
                    <li>Latent variables cannot be added or removed</li>
                    <li>State space definitions cannot be altered</li>
                    <li>Structural relationships become immutable</li>
                    <li>Evidence Models may reference this model</li>
                </ul>
            </div>

            {/* Warning Panel */}
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-800">
                <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
                <p>
                    <strong className="font-semibold">Warning:</strong> Structural
                    confirmation is irreversible. Future structural changes require
                    cloning.
                </p>
            </div>

            {/* Governance Panel */}
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3.5 text-sm text-blue-800">
                <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
                <p>
                    <strong className="font-semibold">ECD Governance:</strong> Confirmation
                    transitions this model from draft to operational status. Evidence
                    Models may only reference confirmed Competency Models.
                </p>
            </div>

            {/* Version History */}
            <VersionHistoryViewer
                currentModel={model}
                allModels={allModels || []}
            />
        </div>
    );
}
