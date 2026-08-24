// src/components/itemBank/admin/blueprint/CompetencyBarChart.jsx
// ------------------------------------------------------------
// 🧠 CompetencyBarChart — Blueprint Competency Coverage
// ------------------------------------------------------------
// ✔ Uses Recharts
// ✔ Horizontal bar chart for readability
// ✔ No hardcoded colors
// ✔ Responsive container
// ✔ Sorts by highest coverage
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

export default function CompetencyBarChart({ competencyCoverage = {} }) {
    /* =====================================================
       🔹 Transform + Sort Data
    ===================================================== */

    const data = useMemo(() => {
        return Object.entries(competencyCoverage)
            .map(([competencyId, count]) => ({
                competencyId,
                count,
            }))
            .sort((a, b) => b.count - a.count);
    }, [competencyCoverage]);

    /* =====================================================
       🔹 UI
    ===================================================== */

    if (!data.length) {
        return (
            <div className="bg-white rounded-2xl shadow p-6 text-sm text-gray-500">
                No competency coverage data available.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow p-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold">
                    Competency Coverage
                </h3>
                <p className="text-sm text-gray-500">
                    Item distribution across competencies.
                </p>
            </div>

            <div className="w-full h-96">
                {/* minWidth/minHeight give Recharts a usable size to render
                    with on the very first paint, before its ResizeObserver
                    has measured the real container -- without them it logs
                    "The width(-1) and height(-1) of chart should be greater
                    than 0" and skips that first frame. */}
                <ResponsiveContainer minWidth={280} minHeight={280}>
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis
                            type="category"
                            dataKey="competencyId"
                            width={150}
                        />
                        <Tooltip />
                        <Bar dataKey="count" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
