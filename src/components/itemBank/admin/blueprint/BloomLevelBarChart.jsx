// src/components/itemBank/admin/blueprint/BloomLevelBarChart.jsx
// ------------------------------------------------------------
// 🧠 BloomLevelBarChart — Bloom Taxonomy Coverage
// ------------------------------------------------------------
// ✔ Uses Recharts
// ✔ Vertical bar chart
// ✔ No hardcoded colors
// ✔ Responsive container
// ✔ Sorts by cognitive hierarchy if recognizable
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

// Optional Bloom hierarchy ordering
const BLOOM_ORDER = [
    "remember",
    "understand",
    "apply",
    "analyze",
    "evaluate",
    "create",
];

export default function BloomLevelBarChart({ bloomCoverage = {} }) {
    /* =====================================================
       🔹 Transform + Smart Sort Data
    ===================================================== */

    const data = useMemo(() => {
        const entries = Object.entries(bloomCoverage).map(
            ([level, count]) => ({
                level,
                count,
            })
        );

        // If levels match Bloom hierarchy, sort by known order
        const allRecognized = entries.every((e) =>
            BLOOM_ORDER.includes(e.level?.toLowerCase())
        );

        if (allRecognized) {
            return entries.sort(
                (a, b) =>
                    BLOOM_ORDER.indexOf(a.level.toLowerCase()) -
                    BLOOM_ORDER.indexOf(b.level.toLowerCase())
            );
        }

        // Otherwise sort by count descending
        return entries.sort((a, b) => b.count - a.count);
    }, [bloomCoverage]);

    /* =====================================================
       🔹 UI
    ===================================================== */

    if (!data.length) {
        return (
            <div className="bg-white rounded-2xl shadow p-6 text-sm text-gray-500">
                No Bloom level data available.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow p-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold">
                    Bloom Level Distribution
                </h3>
                <p className="text-sm text-gray-500">
                    Cognitive demand distribution across Bloom taxonomy levels.
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
