// CompetencyWizard/components/RelationshipGraphEditor.jsx
// 🧠 Relationship Graph Editor (Enterprise Production — React Flow Powered)
// ✔ Uses React Flow for professional graph rendering
// ✔ Directional edges with arrow markers
// ✔ Automatic layout (DAG-friendly via dagre)
// ✔ Zoom / pan / fitView
// ✔ Clean Tailwind container
// ✔ Read-only structural visualization
// ✔ Legend + governance note

import React, { useMemo } from "react";
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";

const EDGE_COLORS = {
    "part-of": "#64748b",
    prerequisite: "#dc2626",
    "correlates-with": "#2563eb",
};

const NODE_WIDTH = 180;
const NODE_HEIGHT = 60;

/* =====================================================
   🔹 DAGRE LAYOUT (AUTOMATIC HIERARCHY)
===================================================== */

function layoutGraph(nodes, edges) {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: "TB" }); // Top → Bottom hierarchy

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    return nodes.map((node) => {
        const position = dagreGraph.node(node.id);
        return {
            ...node,
            position: {
                x: position.x - NODE_WIDTH / 2,
                y: position.y - NODE_HEIGHT / 2,
            },
        };
    });
}

export default function RelationshipGraphEditor({
    competencies = [],
    height = 500,
}) {
    /* =====================================================
       🔹 TRANSFORM TO REACT FLOW STRUCTURE
    ===================================================== */

    const { nodes, edges } = useMemo(() => {
        const rfNodes = competencies.map((comp) => ({
            id: comp.id,
            data: { label: comp.name || "Unnamed" },
            position: { x: 0, y: 0 },
            style: {
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 500,
                color: "#1e293b",
            },
        }));

        const rfEdges = [];

        competencies.forEach((comp) => {
            (comp.relationships || []).forEach((rel) => {
                rfEdges.push({
                    id: `${comp.id}-${rel.type}-${rel.targetCompetencyId}`,
                    source: comp.id,
                    target: rel.targetCompetencyId,
                    type: "smoothstep",
                    markerEnd:
                        rel.type === "prerequisite"
                            ? {
                                type: MarkerType.ArrowClosed,
                                color: EDGE_COLORS[rel.type],
                            }
                            : undefined,
                    style: {
                        stroke: EDGE_COLORS[rel.type] || "#94a3b8",
                        strokeWidth: 2,
                    },
                });
            });
        });

        const laidOutNodes = layoutGraph(rfNodes, rfEdges);

        return {
            nodes: laidOutNodes,
            edges: rfEdges,
        };
    }, [competencies]);

    /* =====================================================
       🔹 RENDER
    ===================================================== */

    return (
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            {/* Header */}
            <div>
                <h3 className="text-lg font-semibold text-slate-900">Structural Graph View</h3>
                <p className="mt-1 text-sm text-slate-500">
                    Interactive visualization of latent variable relationships.
                </p>
            </div>

            {/* Graph */}
            <div className="overflow-hidden rounded-lg border border-slate-200" style={{ height }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    fitView
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={false}
                    zoomOnScroll
                    panOnDrag
                >
                    <MiniMap />
                    <Controls />
                    <Background gap={20} size={1} />
                </ReactFlow>
            </div>

            {/* Legend */}
            <div className="space-y-2 text-sm">
                <div className="text-sm font-semibold text-slate-800">Legend</div>
                <div className="flex flex-wrap gap-6 text-slate-700">
                    {Object.entries(EDGE_COLORS).map(([type, color]) => (
                        <div key={type} className="flex items-center gap-2">
                            <span
                                className="inline-block h-1 w-4 rounded-full"
                                style={{ backgroundColor: color }}
                            />
                            <span className="capitalize">{type}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Governance Note */}
            <div className="border-t border-slate-100 pt-4 text-xs text-slate-500">
                <strong className="text-slate-600">Note:</strong> Prerequisite relationships are directional (arrowed).
                Cyclic prerequisite structures are rejected during confirmation.
            </div>
        </div>
    );
}
