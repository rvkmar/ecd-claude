// CompetencyWizard/steps/Step6StructuralRelationships.jsx
// Step 6 — Structural Relationships (Full Tailwind Refactor)
// Clean graph + table separation, locked-state alignment, enterprise layout clarity

import React from "react";
import { Info } from "lucide-react";
import { useCompetencyWizard } from "../CompetencyWizardContext";
import RelationshipGraphEditor from "../components/RelationshipGraphEditor";
import RelationshipTableView from "../components/RelationshipTableView";

export default function Step6StructuralRelationships() {
    const {
        model,
        competencies,
        addRelationship,
        removeRelationship,
    } = useCompetencyWizard();

    const isLocked = model?.locked;

    /* =====================================================
       HANDLERS
    ===================================================== */

    // RelationshipTableView calls onAddRelationship(sourceId, relationship)
    // -- 2 args -- and the context's addRelationship also takes 2 args
    // (sourceId, relationship). This used to declare a 3rd `relationship`
    // param that always received `undefined` and forward a stray extra
    // arg the context silently dropped; simplified to match the real
    // call shape.
    function handleAddRelationship(sourceId, relationship) {
        if (isLocked) return;
        addRelationship(sourceId, relationship);
    }

    function handleRemoveRelationship(sourceId, targetId, type) {
        if (isLocked) return;
        removeRelationship(sourceId, targetId, type);
    }

    /* =====================================================
       MAIN RENDER
    ===================================================== */

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-lg font-semibold text-slate-900">
                    Step 6 — Structural Relationships
                </h2>
                <p className="mt-1 text-sm text-slate-500 max-w-3xl">
                    Define structural dependencies among competencies. These
                    relationships determine the latent architecture and influence
                    inferential modeling (e.g., Bayesian Networks, hierarchical IRT).
                </p>
            </div>

            {/* Graph Visualization */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">
                    Graph View
                </h3>
                <RelationshipGraphEditor
                    competencies={competencies}
                    height={420}
                />
            </div>

            {/* Table Editor */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">
                    Relationship Table
                </h3>
                <RelationshipTableView
                    competencies={competencies}
                    onAddRelationship={handleAddRelationship}
                    onRemoveRelationship={handleRemoveRelationship}
                    disabled={isLocked}
                />
            </div>

            {/* Informational Panel */}
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3.5 text-sm text-blue-800">
                <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
                <p>
                    <strong className="font-semibold">ECD Principle:</strong> Structural
                    relationships define the organization of latent variables in the
                    Student Model. Cyclic prerequisite dependencies are theoretically
                    invalid and will be blocked during structural confirmation.
                </p>
            </div>
        </div>
    );
}
