// src/components/shared/ModelIngredientsCard.jsx
// ------------------------------------------------------------
// Model Ingredients Card — enterprise "what's inside this model"
// view. Used by the read-only Structure tables (CompetencyTable,
// EvidenceModelTable, TaskModelTable) as an additional view next to
// their existing plain data-grid table view. Purely presentational:
// callers derive `groups` (one tile per component type -- e.g.
// competencies, warrants, observables, evidence rules, expected
// observations, ...) from their own model data and hand them in as
//   { key, label, items: [{ id, primary, secondary }] }
// ------------------------------------------------------------

import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

const STATUS_CLASSES = {
    draft: "bg-yellow-100 text-yellow-700",
    reviewed: "bg-blue-100 text-blue-700",
    confirmed: "bg-emerald-100 text-emerald-700",
    operational: "bg-green-100 text-green-700",
    suspended: "bg-red-100 text-red-700",
    archived: "bg-gray-200 text-gray-600",
};

export function statusBadgeClass(status) {
    return STATUS_CLASSES[status] || "bg-slate-200 text-slate-700";
}

function IngredientTile({ group }) {
    const [open, setOpen] = useState(false);
    const count = group.items?.length || 0;

    return (
        <div className="border rounded-xl bg-gray-50">
            <button
                type="button"
                onClick={() => count > 0 && setOpen((o) => !o)}
                disabled={count === 0}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left disabled:cursor-default"
            >
                <span className="text-sm font-medium text-gray-700">
                    {group.label}
                </span>
                <span className="flex items-center gap-2">
                    <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            count > 0
                                ? "bg-indigo-100 text-indigo-700"
                                : "bg-gray-200 text-gray-500"
                        }`}
                    >
                        {count}
                    </span>
                    {count > 0 &&
                        (open ? (
                            <ChevronDown size={14} className="text-gray-400" />
                        ) : (
                            <ChevronRight size={14} className="text-gray-400" />
                        ))}
                </span>
            </button>

            {open && count > 0 && (
                <ul className="border-t px-3 py-2 space-y-1.5 max-h-56 overflow-y-auto">
                    {group.items.map((item, idx) => (
                        <li key={item.id ?? idx} className="text-xs leading-snug">
                            {item.id != null && (
                                <span className="font-mono text-gray-400 mr-1.5">
                                    {item.id}
                                </span>
                            )}
                            <span className="text-gray-800">
                                {item.primary || "Untitled"}
                            </span>
                            {item.secondary && (
                                <span className="text-gray-400"> — {item.secondary}</span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function ModelIngredientsCard({
    model,
    groups,
    subtitle,
    defaultExpanded = false,
}) {
    const [expanded, setExpanded] = useState(defaultExpanded);

    return (
        <div className="border rounded-2xl bg-white shadow-sm overflow-hidden">
            <div
                className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded((e) => !e)}
            >
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        {expanded ? (
                            <ChevronDown size={16} className="text-gray-400 shrink-0" />
                        ) : (
                            <ChevronRight size={16} className="text-gray-400 shrink-0" />
                        )}
                        <h3 className="font-semibold truncate">
                            {model.name || "Untitled"}
                        </h3>
                    </div>
                    <div className="text-xs font-mono text-gray-400 mt-0.5 ml-6">
                        {model.id}
                    </div>
                    {subtitle && (
                        <div className="text-xs text-gray-500 mt-1 ml-6 truncate">
                            {subtitle}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {model.status && (
                        <span
                            className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusBadgeClass(
                                model.status
                            )}`}
                        >
                            {model.status}
                        </span>
                    )}
                    {model.locked && (
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-800 text-white">
                            Locked
                        </span>
                    )}
                    {model.versionNumber ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                            v{model.versionNumber}
                        </span>
                    ) : null}
                </div>
            </div>

            {expanded && (
                <div className="border-t bg-white px-4 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {groups.map((g) => (
                            <IngredientTile key={g.key} group={g} />
                        ))}
                    </div>

                    {model.updatedAt && (
                        <div className="text-xs text-gray-400 mt-4">
                            Updated {new Date(model.updatedAt).toLocaleString()}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
