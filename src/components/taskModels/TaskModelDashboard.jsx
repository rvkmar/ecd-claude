// src/components/taskModels/TaskModelDashboard.jsx
// ------------------------------------------------------------
// 🧠 Task Model Dashboard — Governance Overview
// ------------------------------------------------------------
// Same layout/visual language as itemBank/AdminDashboard.jsx:
// executive summary stat cards + lifecycle/lock/validity donuts.
// ------------------------------------------------------------

import React, { useMemo } from "react";
import { useTaskModels } from "@/api/queries/taskModels";
import { apiErrorMessage } from "@/api/apiClient";

import LifecyclePieChart from "../itemBank/admin/charts/LifecyclePieChart";
import TwoCategoryDonutChart from "../shared/charts/TwoCategoryDonutChart";
import { computeValidity } from "./taskModelConstants";

// computeValidity is shared with the wizard, the list and the table so
// this dashboard cannot report a model as valid that the wizard would
// refuse to confirm -- which is what the three divergent local copies
// used to allow.

export default function TaskModelDashboard() {
    const { data: taskModels = [], isLoading: loading, error: queryError } =
        useTaskModels();

    const error = queryError
        ? apiErrorMessage(queryError, "Failed to fetch task models.")
        : null;

    /* =====================================================
       🔹 Lifecycle Distribution
    ===================================================== */
    const lifecycleStats = useMemo(() => {
        // Every state in server/utils/lifecycleMatrix.js STATUS needs a slot
        // here; "suspended" was missing, so a suspended Task Model appended
        // an unordered bucket at render time.
        const base = {
            draft: 0,
            reviewed: 0,
            confirmed: 0,
            operational: 0,
            suspended: 0,
            archived: 0,
        };

        taskModels.forEach((m) => {
            const status = m.status || "draft";
            if (base[status] === undefined) base[status] = 0;
            base[status] += 1;
        });

        return base;
    }, [taskModels]);

    /* =====================================================
       🔒 Lock Distribution
    ===================================================== */
    const lockStats = useMemo(() => {
        let locked = 0;
        let unlocked = 0;

        taskModels.forEach((m) => {
            if (m.locked) locked += 1;
            else unlocked += 1;
        });

        return { locked, unlocked };
    }, [taskModels]);

    /* =====================================================
       ✅ Structural Validity Distribution
    ===================================================== */
    const validityStats = useMemo(() => {
        let valid = 0;
        let needsAttention = 0;

        taskModels.forEach((m) => {
            if (computeValidity(m) === "valid") valid += 1;
            else needsAttention += 1;
        });

        return { valid, needsAttention };
    }, [taskModels]);

    const totalModels = taskModels.length;

    if (loading) {
        return (
            <div className="p-8 text-sm text-gray-600">
                Loading dashboard...
            </div>
        );
    }

    if (error) {
        return <div className="p-8 text-red-600 text-sm">{error}</div>;
    }

    return (
        <div className="p-8 space-y-16 max-w-7xl mx-auto">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                    Task Model Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                    Governance overview, structural completeness, and lifecycle monitoring.
                </p>
            </div>

            {/* Executive Summary */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl shadow p-6">
                    <div className="text-xs uppercase text-gray-500">
                        Total Task Models
                    </div>
                    <div className="text-3xl font-bold mt-2">{totalModels}</div>
                </div>

                <div className="bg-white rounded-2xl shadow p-6">
                    <div className="text-xs uppercase text-gray-500">
                        Confirmed
                    </div>
                    <div className="text-3xl font-bold mt-2">
                        {lifecycleStats.confirmed || 0}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow p-6">
                    <div className="text-xs uppercase text-gray-500">
                        Operational
                    </div>
                    <div className="text-3xl font-bold mt-2">
                        {lifecycleStats.operational || 0}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow p-6">
                    <div className="text-xs uppercase text-gray-500">
                        Draft
                    </div>
                    <div className="text-3xl font-bold mt-2">
                        {lifecycleStats.draft || 0}
                    </div>
                </div>
            </section>

            {/* Governance Charts */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <LifecyclePieChart lifecycleStats={lifecycleStats} />
                <TwoCategoryDonutChart
                    title="Structural Lock Distribution"
                    subtitle="Ratio of locked vs unlocked task models."
                    labelA="Locked"
                    labelB="Unlocked"
                    valueA={lockStats.locked}
                    valueB={lockStats.unlocked}
                    countLabel="Total Models Counted"
                />
                <TwoCategoryDonutChart
                    title="Structural Validity"
                    subtitle="Task models with a complete identity, evidence binding, and observations."
                    labelA="Valid"
                    labelB="Needs Attention"
                    valueA={validityStats.valid}
                    valueB={validityStats.needsAttention}
                    countLabel="Total Models Counted"
                />
            </section>
        </div>
    );
}
