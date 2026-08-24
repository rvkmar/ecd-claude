// ObservableMappingTable.jsx
// 🧠 Enterprise ECD — Observable → Model Mapping Table
// ----------------------------------------------------
// Displays how observables and evidence rules feed
// into the statistical model structure.

import React from "react";
import { Info } from "lucide-react";

export default function ObservableMappingTable({
    observables = [],
    modelType
}) {

    /* =====================================================
       Helper: Model Parameter Label
    ===================================================== */

    const getModelRole = (observable) => {

        if (!modelType) return "—";

        switch (modelType) {

            case "rasch":
            case "irt":
                return "Item difficulty contribution";

            case "bayesian_network":
                return "Conditional probability evidence";

            case "sum":
                return "Weighted score contribution";

            case "threshold":
                return "Mastery threshold contribution";

            default:
                return "Evidence input";
        }

    };

    /* =====================================================
       Helper: Direction Color
    ===================================================== */

    const getDirectionColor = (direction) => {

        switch (direction) {

            case "supports":
                return "text-emerald-700";

            case "weakens":
                return "text-red-700";

            case "neutral":
                return "text-slate-500";

            default:
                return "text-slate-500";
        }

    };

    /* =====================================================
       Empty State
    ===================================================== */

    if (!observables.length) {

        return (

            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3.5 text-sm text-blue-800">

                <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0" />

                <span>
                    No observables defined. Observables must be created in
                    Step 4 before configuring the statistical model.
                </span>

            </div>

        );

    }

    /* =====================================================
       Table UI
    ===================================================== */

    return (

        <div className="space-y-4">

            {/* Header */}

            <div>

                <div className="text-sm font-semibold text-slate-800">
                    Observable Evidence Mapping
                </div>

                <div className="mt-1 text-sm text-slate-500">

                    This table shows how observable behaviors and evidence
                    rules contribute to the statistical model.

                </div>

            </div>

            {/* Table */}

            <div className="overflow-x-auto rounded-lg border border-slate-200">

                <table className="min-w-full divide-y divide-slate-200 text-sm">

                    <thead className="bg-slate-50">

                        <tr>

                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Observable Behavior
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Evidence Direction
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Strength
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Activation Condition
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Model Role
                            </th>

                        </tr>

                    </thead>

                    <tbody className="divide-y divide-slate-100">

                        {observables.map((obs) => {

                            const rule = obs.evidenceRule || {};

                            return (

                                <tr
                                    key={obs.id}
                                    className="hover:bg-slate-50"
                                >

                                    {/* Observable Statement */}

                                    <td className="px-4 py-3">

                                        <div className="font-medium text-slate-900">

                                            {obs.statement?.slice(0, 120)}

                                            {obs.statement?.length > 120 && "..."}
                                        </div>

                                        <div className="mt-1 text-xs text-slate-400">
                                            ID: {obs.id}
                                        </div>

                                    </td>

                                    {/* Evidence Direction */}

                                    <td className="px-4 py-3">

                                        <span className={`font-medium ${getDirectionColor(rule.direction)}`}>

                                            {rule.direction || "—"}

                                        </span>

                                    </td>

                                    {/* Strength */}

                                    <td className="px-4 py-3 text-slate-700">

                                        {rule.strengthLevel || "—"}

                                    </td>

                                    {/* Activation Condition */}

                                    <td className="px-4 py-3 text-slate-700">

                                        {rule.activationCondition || "—"}

                                    </td>

                                    {/* Model Role */}

                                    <td className="px-4 py-3 text-slate-700">

                                        {getModelRole(obs)}

                                    </td>

                                </tr>

                            );

                        })}

                    </tbody>

                </table>

            </div>

            {/* Governance Note */}

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5 text-xs text-amber-800">

                Evidence rules defined in Step 5 determine how each observable
                affects the claim inference. The statistical model converts
                these evidence signals into probabilistic belief updates.

            </div>

        </div>

    );
}
