// src/components/itemBank/admin/charts/LockDonutChart.jsx
// ------------------------------------------------------------
// 🧠 LockDonutChart — Structural Lock Distribution
// ------------------------------------------------------------
// ✔ Uses Recharts
// ✔ Donut-style visualization
// ✔ No hardcoded colors
// ✔ Responsive container
// ✔ Shows locked vs unlocked ratio
// ✔ Governance monitoring ready
// ------------------------------------------------------------

import React, { useMemo } from "react";
import {
    PieChart,
    Pie,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

export default function LockDonutChart({ lockStats = {} }) {
    /* =====================================================
       🔹 Transform Data
    ===================================================== */

    const data = useMemo(() => {
        return [
            {
                name: "Locked",
                value: lockStats.locked || 0,
            },
            {
                name: "Unlocked",
                value: lockStats.unlocked || 0,
            },
        ];
    }, [lockStats]);

    const total = useMemo(() => {
        return data.reduce((sum, item) => sum + item.value, 0);
    }, [data]);

    /* =====================================================
       🔹 Label Logic
    ===================================================== */

    const renderLabel = ({ percent }) => {
        if (!percent || percent < 0.05) return "";
        return `${(percent * 100).toFixed(0)}%`;
    };

    /* =====================================================
       🔹 UI
    ===================================================== */

    if (!total) {
        return (
            <div className="bg-white rounded-2xl shadow p-6 text-sm text-gray-500">
                No lock data available.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow p-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold">
                    Structural Lock Distribution
                </h3>
                <p className="text-sm text-gray-500">
                    Ratio of locked vs unlocked items.
                </p>
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
                Total Items Counted: {total}
            </div>
        </div>
    );
}
