// EvidenceWizard/components/ObservableCoverageDiagnostics.jsx
// 📊 Observable Coverage Diagnostics (Enhanced)
// ---------------------------------------------------
// Evaluates evidence coverage for each warrant
// Helps detect evidence gaps before Step5

import { useMemo } from "react";
import { Info } from "lucide-react";

export default function ObservableCoverageDiagnostics({
    warrants = [],
    observables = []
}) {


    /* =====================================================
       Coverage Analysis
    ===================================================== */

    const coverage = useMemo(() => {

        return warrants.map(w => {

            const linked = observables.filter(
                o => o.warrantId === w.id
            );

            let status = "good";

            if (linked.length === 0) status = "missing";
            else if (linked.length === 1) status = "weak";

            return {
                warrantId: w.id,
                statement: w.reasoningStatement,
                observableCount: linked.length,
                status,
                observables: linked
            };

        });

    }, [warrants, observables]);


    /* =====================================================
       Global Statistics
    ===================================================== */

    const stats = useMemo(() => {

        const total = coverage.length;

        const missing = coverage.filter(c => c.status === "missing").length;

        const weak = coverage.filter(c => c.status === "weak").length;

        const good = coverage.filter(c => c.status === "good").length;

        const coverageScore = total === 0
            ? 0
            : Math.round(((good + weak * 0.5) / total) * 100);

        return { total, missing, weak, good, coverageScore };

    }, [coverage]);


    /* =====================================================
       Badge Colors
    ===================================================== */

    function badgeColor(status) {

        switch (status) {

            case "good":
                return "bg-emerald-100 text-emerald-700";

            case "weak":
                return "bg-amber-100 text-amber-700";

            case "missing":
                return "bg-red-100 text-red-700";

            default:
                return "bg-slate-100 text-slate-600";

        }

    }


    /* =====================================================
       Coverage Progress Color
    ===================================================== */

    function progressColor(score) {

        if (score > 75) return "bg-emerald-500";
        if (score > 45) return "bg-amber-500";

        return "bg-red-500";

    }


    /* =====================================================
       Render
    ===================================================== */

    return (

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">


            {/* Header */}

            <div className="flex items-center justify-between gap-3">

                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                    <Info size={15} strokeWidth={2} className="text-slate-400" />
                    Observable Coverage Diagnostics
                </h3>

                <div className="text-xs text-slate-500">
                    Each warrant should produce measurable evidence
                </div>

            </div>


            {/* Coverage Score */}

            <div className="space-y-1.5">

                <div className="flex justify-between text-xs text-slate-500">

                    <span>Evidence Coverage Strength</span>

                    <span>{stats.coverageScore}%</span>

                </div>


                <div className="w-full bg-slate-200 rounded h-2">

                    <div
                        className={`h-2 rounded ${progressColor(stats.coverageScore)}`}
                        style={{ width: `${stats.coverageScore}%` }}
                    />

                </div>

            </div>


            {/* Summary Stats */}

            <div className="flex flex-wrap gap-2 text-[11px]">

                <span className="inline-flex items-center rounded-full px-2.5 py-1 font-semibold uppercase tracking-wide bg-slate-100 text-slate-600">
                    Warrants: {stats.total}
                </span>

                <span className="inline-flex items-center rounded-full px-2.5 py-1 font-semibold uppercase tracking-wide bg-emerald-100 text-emerald-700">
                    Good: {stats.good}
                </span>

                <span className="inline-flex items-center rounded-full px-2.5 py-1 font-semibold uppercase tracking-wide bg-amber-100 text-amber-700">
                    Weak: {stats.weak}
                </span>

                <span className="inline-flex items-center rounded-full px-2.5 py-1 font-semibold uppercase tracking-wide bg-red-100 text-red-700">
                    Missing: {stats.missing}
                </span>

            </div>


            {/* Coverage List */}

            <div className="space-y-2">

                {coverage.map(c => (

                    <div
                        key={c.warrantId}
                        className="flex items-center gap-3 rounded-md border border-slate-200 p-3"
                    >

                        <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${badgeColor(c.status)}`}
                        >
                            {c.status}
                        </span>


                        <div className="text-sm text-slate-700 flex-1">
                            {c.statement.slice(0, 120)}
                        </div>


                        <div className="text-xs text-slate-500">
                            {c.observableCount} observables
                        </div>

                    </div>

                ))}

            </div>

        </div>

    );

}
