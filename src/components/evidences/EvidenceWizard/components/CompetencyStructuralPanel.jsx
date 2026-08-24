// CompetencyStructuralPanel.jsx
// Strict Structural Metadata Panel (Corrected)

import { useMemo } from "react";
import { BookMarked, CheckCircle2 } from "lucide-react";

import { goalLabel } from "@/api/queries/curricularPolicies";

export default function CompetencyStructuralPanel({
    competency,
    competencyModel,
    modelMeta,
    competencies = []   // Pass full competency list for lookup
}) {

    /* =====================================================
       Lookup Map for Relationship Resolution
    ===================================================== */

    const competencyMap = useMemo(() => {
        const map = {};
        competencies.forEach(c => {
            map[c.id] = c;
        });
        return map;
    }, [competencies]);

    /* =====================================================
       Sorted States (Ordinal Only)
    ===================================================== */

    const sortedStates = useMemo(() => {
        if (!competency?.states) return [];
        return [...competency.states].sort(
            (a, b) => (a.order ?? 0) - (b.order ?? 0)
        );
    }, [competency]);

    /* =====================================================
       Construct Framework (from Competency Wizard Step 3)
    ===================================================== */

    const framework = competencyModel?.constructFramework || null;

    /* Only the goals the author actually selected. `curricularGoals` is the
       snapshot of those selections; older models predate the field and carry
       only reference/citation, which still render on their own. */
    const selectedGoals = useMemo(() => {
        const goals = framework?.curricularGoals;
        return Array.isArray(goals) ? goals : [];
    }, [framework]);

    const hasFramework = Boolean(
        framework &&
        (framework.reference ||
            framework.citation ||
            framework.notes ||
            framework.policyName ||
            selectedGoals.length > 0)
    );

    if (!competency || !competencyModel) return null;

    const isContinuous = competency.variableType === "continuous";
    const hasValidScale =
        isContinuous &&
        typeof competency.scale?.min === "number" &&
        typeof competency.scale?.max === "number";

    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-5">

            {/* HEADER */}
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-900">
                    Competency Structure
                </h3>

                <div className="flex gap-2">
                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide bg-blue-100 text-blue-700">
                        v{modelMeta?.versionNumber}
                    </span>

                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-600">
                        {modelMeta?.measurementIntent}
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide bg-emerald-100 text-emerald-700">
                        <CheckCircle2 size={12} strokeWidth={2.25} />
                        Confirmed
                    </span>
                </div>
            </div>

            {/* DOMAIN STRUCTURE */}
            <div className="space-y-1 text-sm text-slate-700">
                <div><strong className="text-slate-900">Domain:</strong> {competency.domain}</div>
                <div><strong className="text-slate-900">Strand:</strong> {competency.strand}</div>
                <div><strong className="text-slate-900">Facet:</strong> {competency.facet}</div>
                <div><strong className="text-slate-900">Variable Type:</strong> {competency.variableType}</div>
            </div>

            {/* STATES (Binary, Ordinal, Categorical Only) */}
            {sortedStates.length > 0 && competency.variableType !== "continuous" && (
                <div>
                    <strong className="text-sm font-semibold text-slate-800">States:</strong>
                    <ul className="list-disc ml-6 text-sm mt-1 text-slate-700">
                        {sortedStates.map((s) => (
                            <li key={s.value}>
                                <span className="font-medium text-slate-900">{s.label}</span>
                                {s.description && (
                                    <span className="text-slate-500">
                                        {" — "}{s.description}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* SCALE (Continuous Only, Strict Guard) */}
            {hasValidScale && (
                <div>
                    <strong className="text-sm font-semibold text-slate-800">Scale:</strong>
                    <span className="text-sm text-slate-700">
                        {" "}
                        {competency.scale.min} to {competency.scale.max}
                        {competency.scale.interpretationGuide && (
                            <div className="text-slate-500 mt-1">
                                {competency.scale.interpretationGuide}
                            </div>
                        )}
                    </span>
                </div>
            )}

            {/* RELATIONSHIPS (Resolve IDs → Names) */}
            {competency.relationships?.length > 0 && (
                <div>
                    <strong className="text-sm font-semibold text-slate-800">Relationships:</strong>
                    <ul className="list-disc ml-6 text-sm mt-1 text-slate-700">
                        {competency.relationships.map((r, i) => {
                            const target = competencyMap[r.targetCompetencyId];
                            return (
                                <li key={i}>
                                    {r.type} →{" "}
                                    {target ? target.name : r.targetCompetencyId}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {/* CONSTRUCT FRAMEWORK
                -----------------------------------------------------------
                Mirrors what the author chose in Competency Wizard Step 3.
                That step binds the competency model to a curricular policy
                and to specific curricular goals within it, but this panel
                only ever rendered `reference` and `citation` -- so the
                Evidence Wizard author, at the exact moment of picking the
                competency this whole evidence model will be built for,
                could not see which curriculum it is grounded in. The claim
                they write in Step 2 and the warrants in Step 3 are supposed
                to answer to those goals.

                `curricularGoals` is the snapshot taken at selection time
                (see schema.js), so this keeps rendering correctly even if
                the source policy is later edited or deleted. */}
            {hasFramework && (
                <div className="border-t border-slate-200 pt-4 space-y-3">

                    <div className="flex items-center justify-between gap-3">
                        <strong className="text-sm font-semibold text-slate-800">
                            Construct Framework
                        </strong>

                        {framework.policyName && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
                                <BookMarked size={12} strokeWidth={2.25} />
                                {framework.policyName}
                            </span>
                        )}
                    </div>

                    {framework.reference && (
                        <div className="text-sm text-slate-700">
                            {framework.reference}
                        </div>
                    )}

                    {framework.citation && (
                        <div className="text-sm text-slate-500">
                            {framework.citation}
                        </div>
                    )}

                    {selectedGoals.length > 0 && (
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3.5">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Curricular goals this competency answers to
                            </div>

                            <ul className="mt-2 space-y-2.5">
                                {selectedGoals.map((goal, i) => (
                                    <li key={goal.code || i} className="text-sm text-slate-800">
                                        <span className="font-medium">
                                            {goalLabel(goal)}
                                        </span>

                                        {goal.competencies?.length > 0 && (
                                            <ul className="mt-1 ml-4 list-disc space-y-0.5 text-xs text-slate-600">
                                                {goal.competencies.map((c, j) => (
                                                    <li key={c.code || j}>
                                                        {c.code ? `${c.code} — ` : ""}
                                                        {c.statement}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {framework.notes && (
                        <div className="text-xs text-slate-500">
                            {framework.notes}
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}