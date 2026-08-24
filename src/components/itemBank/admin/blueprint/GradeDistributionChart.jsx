// src/components/itemBank/admin/blueprint/GradeDistributionChart.jsx
// ------------------------------------------------------------
// 🧠 GradeDistributionChart — Grade Level Coverage
// ------------------------------------------------------------
// ✔ Uses Recharts
// ✔ Vertical bar chart
// ✔ Numeric grade sorting when possible
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

export default function GradeDistributionChart({ gradeCoverage = {} }) {
    /* =====================================================
       🔹 Transform + Smart Sort Data
    ===================================================== */

    const data = useMemo(() => {
        const entries = Object.entries(gradeCoverage).map(
            ([grade, count]) => ({
                grade,
                count,
            })
        );

        // Try numeric sort if grade values are numeric
        const allNumeric = entries.every((e) =>
            !isNaN(Number(e.grade))
        );

        if (allNumeric) {
            return entries.sort(
                (a, b) => Number(a.grade) - Number(b.grade)
            );
        }

        // Otherwise sort by count descending
        return entries.sort((a, b) => b.count - a.count);
    }, [gradeCoverage]);

    /* =====================================================
       🔹 UI
    ===================================================== */

    if (!data.length) {
        return (
            <div className="bg-white rounded-2xl shadow p-6 text-sm text-gray-500">
                No grade distribution data available.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow p-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold">
                    Grade Level Distribution
                </h3>
                <p className="text-sm text-gray-500">
                    Item distribution across grade levels.
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
                        <XAxis dataKey="grade" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
