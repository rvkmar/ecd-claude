// src/components/taskModels/TaskModelTable.jsx
// ------------------------------------------------------------
// Task Model Table — plain browsing view
// ------------------------------------------------------------
// Same role as itemBank/ItemList.jsx: a lean, read-only, searchable
// table for browsing existing records. Full CRUD/creation lives in
// TaskModelBuilderPanel.jsx (reached via the "Create" tab),
// mirroring ItemBank's Items (List) vs Operate Item split.
//
// Also offers an additional "Ingredients View" alongside the default
// table: an enterprise-style breakdown of each model's components --
// linked Evidence Models, expected observations, item mappings,
// selected items, and fairness risks -- each with ids, names, and
// counts. See ModelIngredientsCard.
// ------------------------------------------------------------

import React, { useMemo, useState } from "react";
import { useTaskModels } from "@/api/queries/taskModels";
import { useEvidenceModels } from "@/api/queries/evidenceModels";
import { apiErrorMessage } from "@/api/apiClient";
import ModelIngredientsCard from "../shared/ModelIngredientsCard";
import { computeValidity, normalizeFairnessRisks } from "./taskModelConstants";

// computeValidity used to be re-implemented here, in TaskModelList and in
// TaskModelDashboard -- three copies that had already drifted apart. It
// now comes from taskModelConstants.js, the same definition the wizard
// gates its own Confirm button on.

export default function TaskModelTable() {
    const { data: models = [], isLoading: loading, error: queryError } =
        useTaskModels();
    const { data: evidenceModels = [] } = useEvidenceModels();

    const error = queryError
        ? apiErrorMessage(queryError, "Failed to fetch task models.")
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
    const evidenceModelById = useMemo(() => {
        const map = {};
        evidenceModels.forEach((em) => {
            map[em.id] = em;
        });
        return map;
    }, [evidenceModels]);

    // observationId → observable definition, across every Evidence
    // Model this task could reference (mirrors
    // TaskModelWizardContext's observationLookup).
    const observationLookup = useMemo(() => {
        const lookup = {};
        evidenceModels.forEach((em) => {
            (em.observables || []).forEach((obs) => {
                lookup[obs.id] = obs;
            });
        });
        return lookup;
    }, [evidenceModels]);

    const buildGroups = (model) => {
        const evidenceModelIds = model.evidenceModelIds || [];
        const expectedObservations = model.expectedObservations || [];
        const itemMappings = model.itemMappings || [];
        const selectedItemIds = model.selectedItemIds || [];
        const fairnessRisks = model.fairnessRisks || [];

        const evidenceModelItems = evidenceModelIds.map((id) => ({
            id,
            primary: evidenceModelById[id]?.name || "Untitled evidence model",
            secondary: evidenceModelById[id]?.status,
        }));

        const observationItems = expectedObservations.map((eo, idx) => ({
            id: eo.observationId || `obs-${idx}`,
            primary: observationLookup[eo.observationId]?.statement || eo.observationId,
            secondary: [
                eo.required ? "required" : "optional",
                eo.weight != null ? `weight ${eo.weight}` : null,
            ]
                .filter(Boolean)
                .join(" • "),
        }));

        const itemMappingItems = itemMappings.map((im, idx) => ({
            id: im.itemId || `mapping-${idx}`,
            primary: `Item ${im.itemId || "—"}`,
            secondary: observationLookup[im.observationId]?.statement || im.observationId,
        }));

        const selectedItemItems = selectedItemIds.map((id) => ({
            id,
            primary: `Item ${id}`,
        }));

        // Fairness risks are structured records now; normalizeFairnessRisks
        // upgrades the legacy string[] shape still present on older records.
        const fairnessRiskItems = normalizeFairnessRisks(fairnessRisks)
            .filter((risk) => risk.description.trim().length > 0)
            .map((risk) => ({
                id: risk.id,
                primary: risk.description,
                secondary: [risk.category, `${risk.severity} severity`]
                    .filter(Boolean)
                    .join(" • "),
            }));

        return [
            { key: "evidenceModels", label: "Evidence Models", items: evidenceModelItems },
            {
                key: "expectedObservations",
                label: "Expected Observations",
                items: observationItems,
            },
            { key: "itemMappings", label: "Item Mappings", items: itemMappingItems },
            { key: "selectedItems", label: "Selected Items", items: selectedItemItems },
            { key: "fairnessRisks", label: "Fairness Risks", items: fairnessRiskItems },
        ];
    };

    // A Task Model no longer declares a competency of its own -- it binds
    // Evidence Models, and the competency is a property of those. The
    // subtitle names the primary binding instead of the removed
    // taskPurpose.primaryCompetencyId.
    const buildSubtitle = (model) => {
        const parts = [];

        const primaryId = model.primaryEvidenceModelId;
        if (primaryId) {
            parts.push(
                `Primary Evidence: ${evidenceModelById[primaryId]?.name || primaryId}`
            );
        }

        parts.push(`v${model.versionNumber ?? 1}`);
        parts.push(`Validity: ${computeValidity(model)}`);

        return parts.join(" • ");
    };

    if (loading) {
        return <div className="p-6 text-sm text-gray-600">Loading task models...</div>;
    }

    if (error) {
        return <div className="p-6 text-sm text-red-600">{error}</div>;
    }

    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-wrap justify-between items-center gap-3">
                <h1 className="text-2xl font-semibold">Task Model Structure</h1>

                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        placeholder="Search by ID, task, name..."
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
                                <th className="px-4 py-3">Validity</th>
                                <th className="px-4 py-3">Locked</th>
                                <th className="px-4 py-3 cursor-pointer" onClick={() => toggleSort("updatedAt")}>
                                    Updated
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedModels.map((m) => (
                                <tr key={m.id} className="border-t hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">{m.id}</td>
                                    <td className="px-4 py-3 font-medium">{m.name}</td>
                                    <td className="px-4 py-3 capitalize">{m.status}</td>
                                    <td className="px-4 py-3 capitalize">{computeValidity(m)}</td>
                                    <td className="px-4 py-3">{m.locked ? "Yes" : "No"}</td>
                                    <td className="px-4 py-3">
                                        {m.updatedAt ? new Date(m.updatedAt).toLocaleDateString() : "—"}
                                    </td>
                                </tr>
                            ))}

                            {sortedModels.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-4 py-6 text-center text-gray-500">
                                        No task models found.
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
                            No task models found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
