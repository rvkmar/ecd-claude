// src/components/shared/charts/TwoCategoryDonutChart.jsx
// ------------------------------------------------------------
// 🧠 TwoCategoryDonutChart — Generic Binary Distribution Donut
// ------------------------------------------------------------
// ✔ Uses Recharts
// ✔ Pure presentational component
// ✔ Parameterized labels (Locked/Unlocked, Calibrated/Uncalibrated,
//   Valid/Invalid, etc.) so a single component can back every
//   governance donut across Item Bank, Competencies, Evidences, and
//   Task Models -- same visual language as
//   itemBank/admin/charts/LockDonutChart.jsx and CalibrationDonutChart.jsx.
// ✔ No hardcoded colors
// ✔ Responsive container
// ------------------------------------------------------------

import React, { useMemo } from "react";
import {
    PieChart,
    Pie,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

export default function TwoCategoryDonutChart({
    title,
    subtitle,
    labelA = "A",
    labelB = "B",
    valueA = 0,
    valueB = 0,
    countLabel = "Total Counted",
}) {
    const data = useMemo(
        () => [
            { name: labelA, value: valueA || 0 },
            { name: labelB, value: valueB || 0 },
        ],
        [labelA, labelB, valueA, valueB]
    );

    const total = useMemo(
        () => data.reduce((sum, item) => sum + item.value, 0),
        [data]
    );

    const renderLabel = ({ percent }) => {
        if (!percent || percent < 0.05) return "";
        return `${(percent * 100).toFixed(0)}%`;
    };

    if (!total) {
        return (
            <div className="bg-white rounded-2xl shadow p-6 text-sm text-gray-500">
                No data available.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow p-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold">{title}</h3>
                {subtitle && (
                    <p className="text-sm text-gray-500">{subtitle}</p>
                )}
            </div>

            <div className="w-full h-80">
                {/* minWidth/minHeight give Recharts a usable size to render
                    with on the very first paint, before its ResizeObserver
                    has measured the real container -- without them it logs
                    "The width(-1) and height(-1) of chart should be greater
                    than 0" and skips that first frame. */}
                <ResponsiveContainer minWidth={280} minHeight={280}>
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            label={renderLabel}
                        />
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 text-sm text-gray-600">
                {countLabel}: {total}
            </div>
        </div>
    );
}
