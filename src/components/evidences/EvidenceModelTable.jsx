// src/components/evidences/EvidenceModelTable.jsx
// ------------------------------------------------------------
// Evidence Model Table — plain browsing view
// ------------------------------------------------------------
// Same role as itemBank/ItemList.jsx: a lean, read-only, searchable
// table for browsing existing records. Full CRUD/creation lives in
// EvidenceModelBuilderPanel.jsx (reached via the "Create" tab),
// mirroring ItemBank's Items (List) vs Operate Item split.
//
// Also offers an additional "Ingredients View" alongside the default
// table: an enterprise-style breakdown of each model's components --
// warrants, observables, evidence rules, and statistical models --
// each with ids, names/statements, and counts. See
// ModelIngredientsCard.
// ------------------------------------------------------------

import React, { useMemo, useState } from "react";
import { useEvidenceModels } from "@/api/queries/evidenceModels";
import { useCompetencies } from "@/api/queries/competencies";
import { apiErrorMessage } from "@/api/apiClient";
import ModelIngredientsCard from "../shared/ModelIngredientsCard";

export default function EvidenceModelTable() {
    const { data: models = [], isLoading: loading, error: queryError } =
        useEvidenceModels();
    const { data: competencies = [] } = useCompetencies();

    const error = queryError
        ? apiErrorMessage(queryError, "Failed to fetch evidence models.")
        : null;

    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState("updatedAt");
    const [sortDir, setSortDir] = useState("desc");
    const [viewMode, setViewMode] = useState("table"); // table | ingredients

    const filteredModels = useMemo(() => {
        if (!search.trim()) return models;
        const lower = search.toLowerCase();
        return models.filter((m) =>
            [m.name, m.id].filter(Boolean).some((field) =>
                String(field).toLowerCase().includes(lower)
            )
        );
    }, [models, search]);

    const sortedModels = useMemo(() => {
        const sorted = [...filteredModels];
        sorted.sort((a, b) => {
            const aVal = a[sortKey] || "";
            const bVal = b[sortKey] || "";
            if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
            if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [filteredModels, sortKey, sortDir]);

    const toggleSort = (key) => {
        if (sortKey === key) {
            setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    /* =====================================================
       🔹 INGREDIENTS VIEW
    ===================================================== */
    const competencyNameById = useMemo(() => {
        const map = {};
        competencies.forEach((c) => {
            map[c.id] = c.name || c.id;
        });
        return map;
    }, [competencies]);

    const buildGroups = (model) => {
        const warrants = model.warrants || [];
        const observables = model.observables || [];
        // `evidenceRules` is the wizard's top-level array (keyed by
        // observableId); fall back to each observable's embedded
        // `evidenceRule` if the model predates/omits that array.
        const evidenceRules =
            model.evidenceRules && model.evidenceRules.length > 0
                ? model.evidenceRules
                : observables
                    .filter((o) => o.evidenceRule)
                    .map((o) => ({ ...o.evidenceRule, observableId: o.id }));
        const statisticalModels = model.statisticalModels || [];

        const warrantItems = warrants.map((w) => ({
            id: w.id,
            primary: w.reasoningStatement || "Untitled warrant",
            secondary: w.cognitiveAttribute,
        }));

        const observableItems = observables.map((o) => ({
            id: o.id,
            primary: o.statement || "Untitled observable",
            secondary: o.type,
        }));

        const evidenceRuleItems = evidenceRules.map((r, idx) => ({
            id: r.id || `rule-${idx}`,
            primary: [r.direction, r.strengthLevel ? `strength ${r.strengthLevel}` : null]
                .filter(Boolean)
                .join(" • ") || "Untitled rule",
            secondary: r.activationCondition,
        }));

        const statisticalModelItems = statisticalModels.map((sm) => ({
            id: sm.id,
            primary: [sm.type, sm.subtype].filter(Boolean).join(" / ") || "Untitled model",
            secondary: [
                sm.active ? "active" : "inactive",
                `${(sm.parameterSets || []).length} parameter set(s)`,
            ].join(" • "),
        }));

        return [
            { key: "warrants", label: "Warrants", items: warrantItems },
            { key: "observables", label: "Observables", items: observableItems },
            { key: "evidenceRules", label: "Evidence Rules", items: evidenceRuleItems },
            {
                key: "statisticalModels",
                label: "Statistical Models",
                items: statisticalModelItems,
            },
        ];
    };

    const buildSubtitle = (model) => {
        const parts = [];
        const compName = competencyNameById[model.competencyId];
        if (compName) parts.push(`Competency: ${compName}`);
        if (model.decisionRule?.type) {
            parts.push(
                `Decision Rule: ${model.decisionRule.type}${model.decisionRule.threshold != null
                    ? ` (${model.decisionRule.direction || ""} ${model.decisionRule.threshold})`
                    : ""
                }`
            );
        }
        return parts.join(" • ") || undefined;
    };

    if (loading) {
        return <div className="p-6 text-sm text-gray-600">Loading evidence models...</div>;
    }

    if (error) {
        return <div className="p-6 text-sm text-red-600">{error}</div>;
    }

    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-wrap justify-between items-center gap-3">
                <h1 className="text-2xl font-semibold">Evidence Model Structure</h1>

                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        placeholder="Search by ID, evidence, name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border rounded-xl px-4 py-2 text-sm w-72"
                    />

                    <div className="flex border rounded-xl overflow-hidden text-sm">
                        <button
                            onClick={() => setViewMode("table")}
                            className={`px-3 py-2 ${viewMode === "table"
                                    ? "bg-gray-900 text-white"
                                    : "bg-white text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            Table View
                        </button>
                        <button
                            onClick={() => setViewMode("ingredients")}
                            className={`px-3 py-2 border-l ${viewMode === "ingredients"
                                    ? "bg-gray-900 text-white"
                                    : "bg-white text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            Ingredients View
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === "table" && (
                <div className="overflow-x-auto bg-white rounded-2xl shadow">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-left">
                            <tr>
                                <th className="px-4 py-3 cursor-pointer" onClick={() => toggleSort("id")}>
                                    ID
                                </th>
                                <th className="px-4 py-3 cursor-pointer" onClick={() => toggleSort("name")}>
                                    Name
                                </th>
                                <th className="px-4 py-3 cursor-pointer" onClick={() => toggleSort("status")}>
                                    Status
                                </th>
                                <th className="px-4 py-3">Locked</th>
                                <th className="px-4 py-3">Warrants</th>
                                <th className="px-4 py-3">Observables</th>
                                <th className="px-4 py-3 cursor-pointer" onClick={() => toggleSort("updatedAt")}>
                                    Updated
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedModels.map((m) => (
                                <tr key={m.id} className="border-t hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">{m.id}</td>
                                    <td className="px-4 py-3 font-medium">{m.name || "Untitled"}</td>
                                    <td className="px-4 py-3 capitalize">{m.status}</td>
                                    <td className="px-4 py-3">{m.locked ? "Yes" : "No"}</td>
                                    <td className="px-4 py-3">{m.warrants?.length || 0}</td>
                                    <td className="px-4 py-3">{m.observables?.length || 0}</td>
                                    <td className="px-4 py-3">
                                        {m.updatedAt ? new Date(m.updatedAt).toLocaleDateString() : "—"}
                                    </td>
                                </tr>
                            ))}

                            {sortedModels.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-4 py-6 text-center text-gray-500">
                                        No evidence models found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {viewMode === "ingredients" && (
                <div className="space-y-4">
                    {sortedModels.map((m) => (
                        <ModelIngredientsCard
                            key={m.id}
                            model={m}
                            groups={buildGroups(m)}
                            subtitle={buildSubtitle(m)}
                        />
                    ))}

                    {sortedModels.length === 0 && (
                        <div className="bg-white rounded-2xl shadow px-4 py-6 text-center text-gray-500 text-sm">
                            No evidence models found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
