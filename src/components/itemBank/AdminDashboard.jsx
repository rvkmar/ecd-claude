// src/components/itemBank/AdminDashboard.jsx
// ------------------------------------------------------------
// 🧠 Admin Dashboard — ItemBank Governance Control Center
// ------------------------------------------------------------
// ✔ Executive Summary Cards
// ✔ Lifecycle Pie Chart
// ✔ Lock Donut Chart
// ✔ Calibration Donut Chart
// ✔ Blueprint Coverage Analytics
// ✔ Exposure Risk Monitoring
// ✔ Quick Admin Actions
// ✔ Clean Responsive Grid Layout
// ✔ Governance-focused
// ------------------------------------------------------------

import React from "react";
import useItemListData from "./ItemWizard/hooks/useItemListData";
import useBlueprintAnalytics from "./admin/hooks/useBlueprintAnalytics";
import { useNavigate } from "react-router-dom";

// Governance Charts
import LifecyclePieChart from "./admin/charts/LifecyclePieChart";
import LockDonutChart from "./admin/charts/LockDonutChart";
import CalibrationDonutChart from "./admin/charts/CalibrationDonutChart";

// Blueprint Charts
import CompetencyBarChart from "./admin/blueprint/CompetencyBarChart";
import BloomLevelBarChart from "./admin/blueprint/BloomLevelBarChart";
import DOKBarChart from "./admin/blueprint/DOKBarChart";
import GradeDistributionChart from "./admin/blueprint/GradeDistributionChart";

/* =====================================================
   🔹 Blueprint Analytics Section
===================================================== */

function BlueprintAnalyticsSection({ items, competencyByItem }) {
    const {
        competencyCoverage,
        bloomCoverage,
        dokCoverage,
        gradeCoverage,
        metadataCompleteness,
    } = useBlueprintAnalytics(items, competencyByItem);

    return (
        <section className="space-y-10">
            <div>
                <h2 className="text-2xl font-semibold">
                    Blueprint Coverage Analytics
                </h2>
                <p className="text-sm text-gray-500">
                    Coverage distribution across constructs, cognitive levels, and grades.
                    The construct is derived through each item's Task Model and
                    Evidence Model, not stored on the item.
                </p>

                {/* An empty chart reads as "no coverage here" when it often
                    means "nobody filled the field in". Say which. */}
                {metadataCompleteness.total > 0 && (
                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
                        {[
                            ["Construct resolved", metadataCompleteness.competency],
                            ["Bloom recorded", metadataCompleteness.bloom],
                            ["SOLO recorded", metadataCompleteness.solo],
                            ["Grade recorded", metadataCompleteness.grade],
                            ["Difficulty recorded", metadataCompleteness.difficulty],
                        ].map(([label, n]) => (
                            <span key={label}>
                                {label}:{" "}
                                <strong className="text-gray-700">
                                    {n}/{metadataCompleteness.total} ({metadataCompleteness.pct(n)}%)
                                </strong>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                <CompetencyBarChart competencyCoverage={competencyCoverage} />
                <BloomLevelBarChart bloomCoverage={bloomCoverage} />
                <DOKBarChart dokCoverage={dokCoverage} />
                <GradeDistributionChart gradeCoverage={gradeCoverage} />
            </div>
        </section>
    );
}

/* =====================================================
   🔹 Main Dashboard
===================================================== */

export default function AdminDashboard() {
    const {
        items,
        totalItems,
        loading,
        error,
        competencyByItem,
        lifecycleStats,
        lockStats,
        calibrationStats,
        exposureStats,
    } = useItemListData();

    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="p-8 text-sm text-gray-600">
                Loading dashboard...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-red-600 text-sm">
                {error}
            </div>
        );
    }

    return (
        <div className="p-8 space-y-16 max-w-7xl mx-auto">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                    Item Bank Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                    Governance overview, psychometric readiness, blueprint balance, and operational risk monitoring.
                </p>
            </div>

            {/* Executive Summary */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl shadow p-6">
                    <div className="text-xs uppercase text-gray-500">Total Items</div>
                    <div className="text-3xl font-bold mt-2">{totalItems}</div>
                </div>

                <div className="bg-white rounded-2xl shadow p-6">
                    <div className="text-xs uppercase text-gray-500">Confirmed</div>
                    <div className="text-3xl font-bold mt-2">
                        {lifecycleStats.confirmed || 0}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow p-6">
                    <div className="text-xs uppercase text-gray-500">Operational</div>
                    <div className="text-3xl font-bold mt-2">
                        {lifecycleStats.operational || 0}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow p-6">
                    <div className="text-xs uppercase text-gray-500">Suspended</div>
                    <div className="text-3xl font-bold mt-2">
                        {lifecycleStats.suspended || 0}
                    </div>
                </div>
            </section>

            {/* Governance Charts */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <LifecyclePieChart lifecycleStats={lifecycleStats} />
                <LockDonutChart lockStats={lockStats} />
                <CalibrationDonutChart calibrationStats={calibrationStats} />
            </section>

            {/* Blueprint Analytics */}
            <BlueprintAnalyticsSection items={items} competencyByItem={competencyByItem} />

            {/* Exposure Risk */}
            <section className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold">Exposure Risk Monitoring</h2>
                    <p className="text-sm text-gray-500">
                        Items approaching retirement threshold or exceeding usage limits.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-yellow-50 border border-yellow-300 rounded-2xl p-6 shadow-sm">
                        <div className="text-xs uppercase text-yellow-800">
                            Nearing Retirement (≥ 80%)
                        </div>
                        <div className="text-3xl font-bold text-yellow-700 mt-2">
                            {exposureStats.nearingRetirement}
                        </div>
                    </div>

                    <div className="bg-red-50 border border-red-300 rounded-2xl p-6 shadow-sm">
                        <div className="text-xs uppercase text-red-800">
                            Overused (≥ 100%)
                        </div>
                        <div className="text-3xl font-bold text-red-700 mt-2">
                            {exposureStats.overused}
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Actions */}
            {/* <section className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold">Quick Actions</h2>
                    <p className="text-sm text-gray-500">
                        Administrative shortcuts for workflow management.
                    </p>
                </div>

                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={() => navigate("/items/new")}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition"
                    >
                        Create New Item
                    </button>

                    <button
                        onClick={() => navigate("/items?status=draft")}
                        className="px-5 py-2.5 bg-gray-100 rounded-2xl hover:bg-gray-200 transition"
                    >
                        View Drafts
                    </button>

                    <button
                        onClick={() => navigate("/items?status=reviewed")}
                        className="px-5 py-2.5 bg-gray-100 rounded-2xl hover:bg-gray-200 transition"
                    >
                        Pending Confirmation
                    </button>

                    <button
                        onClick={() => navigate("/items?risk=exposure")}
                        className="px-5 py-2.5 bg-gray-100 rounded-2xl hover:bg-gray-200 transition"
                    >
                        Exposure Risk Items
                    </button>
                </div>
            </section> */}
        </div>
    );
}
