// WarrantList.jsx
// 🧠 Enterprise Warrant List Manager
// Handles rendering, ordering, and interaction of warrant cards

import React, { useState } from "react";
import { Info } from "lucide-react";
import WarrantCard from "./WarrantCard";

import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors
} from "@dnd-kit/core";

import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    arrayMove
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";


/* =========================================================
   Sortable Wrapper
========================================================= */

function SortableWarrant({
    warrant,
    index,
    errors,
    collapseAll,
    onUpdate,
    onRemove,
    disableRemove
}) {

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition
    } = useSortable({ id: warrant.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    };

    return (

        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
        >

            <WarrantCard
                warrant={warrant}
                index={index}
                errors={errors}
                collapseAll={collapseAll}
                onChange={(updated) =>
                    onUpdate(warrant.id, updated)
                }
                onRemove={() =>
                    onRemove(warrant.id)
                }
                disableRemove={disableRemove}
            />

        </div>

    );

}


/* =========================================================
   Main Component
========================================================= */

export default function WarrantList({
    warrants = [],
    errors = {},
    onUpdate,
    onRemove,
    onReorder
}) {

    /* =====================================================
       Drag Sensors
    ===================================================== */

    const sensors = useSensors(
        useSensor(PointerSensor)
    );


    /* =====================================================
       Collapse Control
    ===================================================== */

    const [collapseAll, setCollapseAll] = useState(false);


    /* =====================================================
       Empty State
    ===================================================== */

    if (!warrants || warrants.length === 0) {

        return (
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3.5 text-sm text-blue-800">
                <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
                No warrants defined yet. Use the Warrant Builder above to add one.
            </div>
        );

    }


    /* =====================================================
       Drag End Handler
    ===================================================== */

    function handleDragEnd(event) {

        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const oldIndex = warrants.findIndex(w => w.id === active.id);
        const newIndex = warrants.findIndex(w => w.id === over.id);

        const reordered = arrayMove(warrants, oldIndex, newIndex);

        if (onReorder) {
            onReorder(reordered);
        }

    }


    /* =====================================================
       UI
    ===================================================== */

    return (

        <div className="space-y-4">

            {/* Controls */}

            <div className="flex justify-between items-center">

                <div className="text-sm text-slate-500">
                    {warrants.length} warrant{warrants.length !== 1 ? "s" : ""}
                </div>

                <div className="flex gap-4 text-sm">

                    <button
                        type="button"
                        className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
                        onClick={() => setCollapseAll(true)}
                    >
                        Collapse All
                    </button>

                    <button
                        type="button"
                        className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
                        onClick={() => setCollapseAll(false)}
                    >
                        Expand All
                    </button>

                </div>

            </div>


            {/* Sortable List */}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >

                <SortableContext
                    items={warrants.map(w => w.id)}
                    strategy={verticalListSortingStrategy}
                >

                    <div className="space-y-4">

                        {warrants.map((warrant, index) => (

                            <SortableWarrant
                                key={warrant.id}
                                warrant={warrant}
                                index={index}
                                errors={errors}
                                collapseAll={collapseAll}
                                onUpdate={onUpdate}
                                onRemove={onRemove}
                                disableRemove={warrants.length === 1}
                            />

                        ))}

                    </div>

                </SortableContext>

            </DndContext>

        </div>

    );

}