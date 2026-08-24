// ModelTypeBadge.jsx
// 🧠 Enterprise ECD — Model Type Badge
// ------------------------------------
// Displays a color-coded badge identifying the
// statistical model type used in the evidence model.

import React from "react";

export default function ModelTypeBadge({ type }) {

    /* =====================================================
       Model Metadata
    ===================================================== */

    const MODEL_META = {

        rasch: {
            label: "Rasch",
            style: "bg-blue-100 text-blue-700"
        },

        irt: {
            label: "IRT",
            style: "bg-slate-100 text-slate-600"
        },

        bayesian_network: {
            label: "Bayesian",
            style: "bg-red-100 text-red-700"
        },

        sum: {
            label: "Sum",
            style: "bg-emerald-100 text-emerald-700"
        },

        threshold: {
            label: "Threshold",
            style: "bg-amber-100 text-amber-700"
        }

    };

    const meta = MODEL_META[type] || {
        label: "Unknown",
        style: "bg-slate-100 text-slate-600"
    };

    /* =====================================================
       UI
    ===================================================== */

    return (

        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${meta.style}`}
        >

            {meta.label}

        </span>

    );

}
