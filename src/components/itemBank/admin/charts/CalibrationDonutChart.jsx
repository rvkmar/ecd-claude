// src/components/itemBank/admin/charts/CalibrationDonutChart.jsx
// ------------------------------------------------------------
// 🧠 CalibrationDonutChart — Psychometric Calibration Overview
// ------------------------------------------------------------
// ✔ Uses Recharts
// ✔ Donut-style visualization
// ✔ No hardcoded colors
// ✔ Responsive container
// ✔ Shows calibrated vs uncalibrated distribution
// ✔ Governance & IRT readiness monitoring
// ------------------------------------------------------------

import React, { useMemo } from "react";
import {
    PieChart,
    Pie,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

export default function CalibrationDonutChart({ calibrationStats = {} }) {
    /* =====================================================
       🔹 Transform Data
    ===================================================== */

    const data = useMemo(() => {
        return [
            {
                name: "Calibrated",
                value: calibrationStats.calibrated || 0,
            },
            {
                name: "Uncalibrated",
                value: calibrationStats.uncalibrated || 0,
            },
        ];
    }, [calibrationStats]);

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
                No calibration data available.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow p-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold">
                    Calibration Status
                </h3>
                <p className="text-sm text-gray-500">
                    Psychometric readiness distribution.
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
