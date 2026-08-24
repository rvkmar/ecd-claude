// src/components/itemBank/admin/blueprint/DOKBarChart.jsx
// ------------------------------------------------------------
// 🧠 SOLO level coverage
//
// This chart used to count `cognitiveDemand.depthOfKnowledge`, a field no
// schema declares. The wizard wrote it too, so the two agreed with each
// other about a key the store did not know, and every other consumer saw
// nothing. The schema-declared field is `cognitiveDemand.soloLevel`, which
// is what useBlueprintAnalytics now aggregates and this chart renders.
// The `dokCoverage` prop name is kept so the call site is unchanged.
// ------------------------------------------------------------
// ✔ Uses Recharts
// ✔ Vertical bar chart
// ✔ Ordered by DOK level (1–4) if numeric
// ✔ No hardcoded colors
// ✔ Responsive container
// ✔ Blueprint analytics ready
// ------------------------------------------------------------

import React, { useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

export default function DOKBarChart({ dokCoverage = {} }) {
    /* =====================================================
       🔹 Transform + Smart Sort Data
    ===================================================== */

    const data = useMemo(() => {
        const entries = Object.entries(dokCoverage).map(
            ([level, count]) => ({
                level,
                count,
            })
        );

        // Try numeric sort if DOK levels are numeric (1–4)
        const allNumeric = entries.every((e) =>
            !isNaN(Number(e.level))
        );

        if (allNumeric) {
            return entries.sort(
                (a, b) => Number(a.level) - Number(b.level)
            );
        }

        // Fallback: sort descending by count
        return entries.sort((a, b) => b.count - a.count);
    }, [dokCoverage]);

    /* =====================================================
       🔹 UI
    ===================================================== */

    if (!data.length) {
        return (
            <div className="bg-white rounded-2xl shadow p-6 text-sm text-gray-500">
                No SOLO level recorded on any item yet.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow p-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold">
                    SOLO Level
                </h3>
                <p className="text-sm text-gray-500">
                    Structure of the observed learning outcome.
                </p>
            </div>

            <div className="w-full h-80">
                {/* minWidth/minHeight give Recharts a usable size to render
                    with on the very first paint, before its ResizeObserver
                    has measured the real container -- without them it logs
                    "The width(-1) and height(-1) of chart should be greater
                    than 0" and skips that first frame. */}
                <ResponsiveContainer minWidth={280} minHeight={280}>
                    <BarChart
                        data={data}
                        margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="level" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
