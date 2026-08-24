// CompetencyGraphVisualizer.jsx
// Enterprise ECD Competency Graph Visualizer (Advanced)
// ----------------------------------------------------------------------
// Interactive visualization of competency relationships and evidence
// activation within the Evidence Model.
//
// Features
// • prerequisite dependency graph
// • evidence activation highlighting
// • claim alignment diagnostics
// • topological layout engine
// • construct hierarchy labels
// • evidence coverage summary
// • scalable ReactFlow visualization

import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";

import ReactFlow, {
    Background,
    Controls,
    MiniMap
} from "reactflow";

import "reactflow/dist/style.css";

import { runEvidenceDiagnostics } from "../components/diagnostics/evidenceDiagnostics";

/* =====================================================
   Utility
===================================================== */

function constructLabel(c) {
    return [c?.domain, c?.strand, c?.facet]
        .filter(Boolean)
        .join(" → ");
}

function safeArray(v) {
    return Array.isArray(v) ? v : [];
}

/* =====================================================
   Main Component
===================================================== */

export default function CompetencyGraphVisualizer({
    competencies = [],
    warrants = [],
    claimText = "",
    claimScore = 0
}) {

    /* =====================================================
       Evidence Diagnostics
    ===================================================== */

    const diagnostics = useMemo(() => {

        return runEvidenceDiagnostics({
            claimText,
            claimScore,
            competencies,
            warrants
        });

    }, [claimText, claimScore, competencies, warrants]);


    const {
        competencyGraph = {},
        competencyEvidence = {}
    } = diagnostics || {};


    /* =====================================================
       Compute Topological Levels
    ===================================================== */

    const levelMap = useMemo(() => {

        const levels = {};


        function computeLevel(id, visited = new Set()) {

            if (levels[id] !== undefined)
                return levels[id];


            if (visited.has(id))
                return 0;


            visited.add(id);


            const prereqs = competencyGraph[id]?.prerequisites || [];


            if (!prereqs.length) {

                levels[id] = 0;

                return 0;

            }


            const level = Math.max(

                ...prereqs.map(p => computeLevel(p, visited))

            ) + 1;


            levels[id] = level;


            return level;


        }


        Object.keys(competencyGraph).forEach(id => computeLevel(id));


        return levels;


    }, [competencyGraph]);


    /* =====================================================
       Node Builder
    ===================================================== */

    const nodes = useMemo(() => {

        const nodeList = [];


        safeArray(competencies).forEach((c, index) => {

            const level = levelMap[c.id] || 0;

            const hasEvidence = competencyEvidence[c.id];


            const borderColor = hasEvidence
                ? "#16a34a"
                : "#dc2626";


            const background = hasEvidence
                ? "#ecfdf5"
                : "#fef2f2";


            const label = constructLabel(c);


            nodeList.push({

                id: c.id,

                position: {
                    x: level * 320,
                    y: index * 120
                },

                data: {
                    label
                },

                style: {
                    padding: 12,
                    borderRadius: 8,
                    border: `2px solid ${borderColor}`,
                    background,
                    width: 240,
                    fontSize: 12
                }

            });


        });


        return nodeList;


    }, [competencies, competencyEvidence, levelMap]);


    /* =====================================================
       Edge Builder
    ===================================================== */

    const edges = useMemo(() => {

        const edgeList = [];


        safeArray(competencies).forEach(c => {

            safeArray(c.relationships).forEach(rel => {

                if (rel.type !== "prerequisite") return;


                const sourceEvidence = competencyEvidence[rel.targetCompetencyId];

                const targetEvidence = competencyEvidence[c.id];


                const edgeColor =
                    sourceEvidence && targetEvidence
                        ? "#16a34a"
                        : "#9ca3af";


                edgeList.push({

                    id: `${rel.targetCompetencyId}-${c.id}`,

                    source: rel.targetCompetencyId,

                    target: c.id,

                    animated: false,

                    style: {
                        stroke: edgeColor,
                        strokeWidth: 2
                    }

                });


            });


        });


        return edgeList;


    }, [competencies, competencyEvidence]);


    /* =====================================================
       Evidence Coverage Summary
    ===================================================== */

    const evidenceSummary = useMemo(() => {

        let supported = 0;


        competencies.forEach(c => {

            if (competencyEvidence[c.id]) supported++;

        });


        return {
            supported,
            total: competencies.length
        };


    }, [competencies, competencyEvidence]);


    /* =====================================================
       Missing Evidence Diagnostics
    ===================================================== */

    const missingDiagnostics = useMemo(() => {

        const warnings = [];


        competencies.forEach(c => {

            if (!competencyEvidence[c.id]) {

                warnings.push(`No evidence supports competency "${constructLabel(c)}".`);

            }


        });


        return warnings;


    }, [competencies, competencyEvidence]);


    /* =====================================================
       UI
    ===================================================== */

    return (

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 space-y-4">


            {/* Header */}

            <div className="flex justify-between items-center">

                <h3 className="text-sm font-semibold text-slate-900">
                    Competency Dependency Graph
                </h3>


                <span className="text-xs text-slate-500">
                    Evidence Coverage: {evidenceSummary.supported}/{evidenceSummary.total}
                </span>

            </div>


            {/* Legend */}

            <div className="flex gap-4 text-xs text-slate-600">

                <Legend color="#16a34a" label="Evidence Supported" />

                <Legend color="#dc2626" label="Missing Evidence" />

                <Legend color="#9ca3af" label="Unverified Dependency" />

            </div>


            {/* Graph */}

            {/* fitView was already on, but with no padding option it defaults
                to a tight 0.1 -- fine for a graph with several nodes spread
                out, but for a single node (the common case here: most
                evidence models bind one competency) that zooms in close
                enough to clip the node against the pane edge and let the
                fixed-position MiniMap visually overlap it. maxZoom keeps a
                small graph from being blown up that far; the extra padding
                keeps every node clear of the edges and the minimap. */}

            <div className="rounded-lg border border-slate-200 overflow-hidden w-full" style={{ height: 420 }}>

                <ReactFlow

                    nodes={nodes}

                    edges={edges}

                    fitView

                    fitViewOptions={{ padding: 0.3, maxZoom: 1 }}

                    minZoom={0.1}

                >

                    <MiniMap />

                    <Controls />

                    <Background />

                </ReactFlow>

            </div>


            {/* Diagnostics */}

            {missingDiagnostics.length > 0 && (

                <div className="space-y-1.5">

                    {missingDiagnostics.map((d, i) => (

                        <div
                            key={i}
                            className="flex items-start gap-2 text-sm text-amber-700"
                        >
                            <AlertTriangle size={14} strokeWidth={2} className="mt-0.5 shrink-0" />
                            <span>{d}</span>
                        </div>

                    ))}

                </div>

            )}


        </div>

    );

}

/* =====================================================
   Legend
===================================================== */

function Legend({ color, label }) {

    return (

        <div className="flex items-center gap-2">

            <div
                style={{ background: color }}
                className="w-3 h-3 rounded-full shrink-0"
            />

            <span>{label}</span>

        </div>

    );

}
