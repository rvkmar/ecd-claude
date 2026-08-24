// src/components/evidences/EvidenceDashboard.jsx
// ------------------------------------------------------------
// 🧠 Evidence Model Dashboard — Governance Overview
// ------------------------------------------------------------
// Same layout/visual language as itemBank/AdminDashboard.jsx:
// executive summary stat cards + lifecycle/lock/calibration donuts.
// ------------------------------------------------------------

import React, { useMemo } from "react";
import { useEvidenceModels } from "@/api/queries/evidenceModels";
import { apiErrorMessage } from "@/api/apiClient";

import LifecyclePieChart from "../itemBank/admin/charts/LifecyclePieChart";
import TwoCategoryDonutChart from "../shared/charts/TwoCategoryDonutChart";

export default function EvidenceDashboard() {
    const { data: models = [], isLoading: loading, error: queryError } =
        useEvidenceModels();

    const error = queryError
        ? apiErrorMessage(queryError, "Failed to fetch evidence models.")
        : null;

    /* =====================================================
       🔹 Lifecycle Distribution
    ===================================================== */
    const lifecycleStats = useMemo(() => {
        const base = {
            draft: 0,
            reviewed: 0,
            confirmed: 0,
            operational: 0,
            suspended: 0,
            archived: 0,
        };

        models.forEach((m) => {
            const status = m.status || "draft";
            if (base[status] === undefined) base[status] = 0;
            base[status] += 1;
        });

        return base;
    }, [models]);

    /* =====================================================
       🔒 Lock Distribution
    ===================================================== */
    const lockStats = useMemo(() => {
        let locked = 0;
        let unlocked = 0;

        models.forEach((m) => {
            if (m.locked) locked += 1;
            else unlocked += 1;
        });

        return { locked, unlocked };
    }, [models]);

    /* =====================================================
       📊 Calibration Distribution
       Mirrors EvidenceModelList's getCalibrationStatus: a model counts
       as calibrated once its active statistical model has at least one
       parameter set.
    ===================================================== */
    const calibrationStats = useMemo(() => {
        let calibrated = 0;
        let uncalibrated = 0;

        models.forEach((m) => {
            const activeModel = m.statisticalModels?.find((sm) => sm.active);
            if (activeModel?.parameterSets?.length > 0) {
                calibrated += 1;
            } else {
                uncalibrated += 1;
            }
        });

        return { calibrated, uncalibrated };
    }, [models]);

    const totalModels = models.length;

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
                    Evidence Model Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                    Governance overview, psychometric readiness, and lifecycle monitoring.
                </p>
            </div>

            {/* Executive Summary */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl shadow p-6">
                    <div className="text-xs uppercase text-gray-500">
                        Total Evidence Models
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
                        Suspended
                    </div>
                    <div className="text-3xl font-bold mt-2">
                        {lifecycleStats.suspended || 0}
                    </div>
                </div>
            </section>

            {/* Governance Charts */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <LifecyclePieChart lifecycleStats={lifecycleStats} />
                <TwoCategoryDonutChart
                    title="Structural Lock Distribution"
                    subtitle="Ratio of locked vs unlocked evidence models."
                    labelA="Locked"
                    labelB="Unlocked"
                    valueA={lockStats.locked}
                    valueB={lockStats.unlocked}
                    countLabel="Total Models Counted"
                />
                <TwoCategoryDonutChart
                    title="Calibration Status"
                    subtitle="Psychometric readiness distribution."
                    labelA="Calibrated"
                    labelB="Uncalibrated"
                    valueA={calibrationStats.calibrated}
                    valueB={calibrationStats.uncalibrated}
                    countLabel="Total Models Counted"
                />
            </section>
        </div>
    );
}
