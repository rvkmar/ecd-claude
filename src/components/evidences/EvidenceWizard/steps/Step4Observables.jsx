// EvidenceWizard/steps/Step4Observables.jsx
// 🧠 Enterprise ECD Step 4 — Observables (Final Refactor)
// -----------------------------------------------------
// Converts warrant reasoning into measurable observable behaviors
// Integrates ObservableCard + Coverage Diagnostics
// Implements strict ECD evidence-chain validation

import React, { useState, useEffect, useMemo } from "react";

import { useEvidenceWizardContext } from "../EvidenceWizardContext";

import ObservableCard from "../components/ObservableCard";
import ObservableCoverageDiagnostics from "../components/ObservableCoverageDiagnostics";

import { motion, AnimatePresence } from "framer-motion";

import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors
} from "@dnd-kit/core";

import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import { Plus, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";


/* =====================================================
   Sortable Wrapper
===================================================== */

function SortableObservableCard(props) {

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition
    } = useSortable({ id: props.observable.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    };

    return (

        <motion.div
            ref={setNodeRef}
            style={style}
            layout
        >

            <ObservableCard
                {...props}
                dragAttributes={attributes}
                dragListeners={listeners}
            />

        </motion.div>

    );

}

function observableCoverageColor(count) {

    if (count === 0)
        return "bg-red-100 text-red-700";

    if (count === 1)
        return "bg-amber-100 text-amber-700";

    return "bg-emerald-100 text-emerald-700";

}

/* =====================================================
   Step4 Main Component
===================================================== */

export default function Step4Observables({ onValidityChange, locked }) {

    const {
        draftModel,
        addObservable,
        updateObservable,
        removeObservable,
        competencies,
        competencyModels
    } = useEvidenceWizardContext();


    /* =====================================================
       Model Data
    ===================================================== */

    const observables = draftModel?.observables || [];
    const warrants = draftModel?.warrants || [];

    const safeCompetencies = competencies || [];
    const safeModels = competencyModels || [];


    /* =====================================================
       Active Competency
    ===================================================== */

    const targetCompetencyId =
        draftModel?.competencyId || draftModel?.claimCompetencyId;


    const activeCompetency = useMemo(() => {

        return safeCompetencies.find(
            c => c.id === targetCompetencyId
        );

    }, [safeCompetencies, targetCompetencyId]);


    const activeModel = useMemo(() => {

        if (!activeCompetency) return null;

        return safeModels.find(
            m => m.id === activeCompetency.modelId
        );

    }, [activeCompetency, safeModels]);


    const constructLabel = activeCompetency

        ? `${activeCompetency.domain} → ${activeCompetency.strand} → ${activeCompetency.facet}`

        : "Unassigned Construct";


    /* =====================================================
       Competency Lookup Map
    ===================================================== */

    const competencyMap = useMemo(() => {

        const map = {};

        safeCompetencies.forEach(c => {
            map[c.id] = c;
        });

        return map;

    }, [safeCompetencies]);


    /* =====================================================
       Drag Sensors
    ===================================================== */

    const sensors = useSensors(
        useSensor(PointerSensor)
    );


    /* =====================================================
       UI State
    ===================================================== */

    const [errors, setErrors] = useState({});
    const [collapseAll, setCollapseAll] = useState(true);


    /* =====================================================
       Group Observables By Warrant
    ===================================================== */

    const groupedObservables = useMemo(() => {

        const groups = {};

        warrants.forEach(w => {
            groups[w.id] = [];
        });

        observables.forEach(o => {

            if (!groups[o.warrantId])
                groups[o.warrantId] = [];

            groups[o.warrantId].push(o);

        });

        return groups;

    }, [observables, warrants]);


    /* =====================================================
       Validation Logic (Strict ECD)
    ===================================================== */

    useEffect(() => {

        const newErrors = {};


        if (!observables.length) {

            newErrors.general =
                "At least one observable must be defined.";

        }


        observables.forEach((o, index) => {

            if (!o.statement || o.statement.length < 20)
                newErrors[`statement-${index}`] =
                    "Observable statement must be meaningful.";

            if (!o.type)
                newErrors[`type-${index}`] =
                    "Observable type is required.";

            if (!o.warrantId)
                newErrors[`warrant-${index}`] =
                    "Observable must reference exactly one warrant.";

        });


        warrants.forEach(w => {

            const linked = observables.some(
                o => o.warrantId === w.id
            );

            if (!linked)

                newErrors[`warrant-gap-${w.id}`] =
                    "This warrant has no observable evidence.";

        });


        setErrors(newErrors);


        if (onValidityChange)
            onValidityChange(
                Object.keys(newErrors).length === 0
            );

    }, [observables, warrants, onValidityChange]);


    /* =====================================================
       Drag Sorting
    ===================================================== */

    function handleDragEnd(event) {

        const { active, over } = event;

        if (!over || active.id === over.id) return;


        const oldIndex =
            observables.findIndex(o => o.id === active.id);


        const newIndex =
            observables.findIndex(o => o.id === over.id);


        const reordered =
            arrayMove(observables, oldIndex, newIndex);


        reordered.forEach((o, i) => {

            updateObservable(o.id, {
                ...o,
                orderIndex: i
            });

        });

    }


    /* =====================================================
       Add Observable
    ===================================================== */

    function handleAddObservable(warrantId) {

        addObservable({

            id: `o${Date.now()}`,
            statement: "",
            type: "",
            warrantId,
            boundaryNote: "",
            evidenceRule: null,
            orderIndex: observables.length

        });

    }


    /* =====================================================
       Render
    ===================================================== */

    return (

        <div className="space-y-8 max-w-6xl">


            {/* =================================================
         Header
      ================================================= */}

            <div>

                <h2 className="text-lg font-semibold text-slate-900">
                    Observables
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    Define measurable student behaviors implied by the warrants.
                </p>

            </div>


            {/* =================================================
         Competency Context Panel
      ================================================= */}

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">

                <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Target Competency
                    </div>

                    <div className="mt-1 text-sm font-semibold text-slate-900">
                        {activeCompetency?.name}
                    </div>
                </div>


                <div className="flex flex-wrap items-center gap-2 text-xs">

                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide bg-blue-100 text-blue-700">
                        {activeModel?.name}
                    </span>


                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-600">
                        {activeCompetency?.variableType}
                    </span>


                    {activeCompetency?.states?.length > 0 && (

                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-600">
                            {activeCompetency.states.length} states
                        </span>

                    )}


                    {activeCompetency?.variableType === "continuous"
                        && activeCompetency?.scale && (

                            <div className="text-xs text-slate-500">
                                Scale:
                                {activeCompetency.scale.min}
                                to
                                {activeCompetency.scale.max}
                            </div>

                        )}

                </div>


                {/* Claim */}

                <div className="rounded-md border border-slate-200 bg-slate-50 p-3.5">

                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Articulated Claim
                    </div>

                    <div className="mt-1 text-sm text-slate-700">
                        {draftModel?.claimStatement || "No claim articulated."}
                    </div>

                </div>


                {/* Relationships */}

                {activeCompetency?.relationships?.length > 0 && (

                    <div className="text-sm text-slate-700 border-t border-slate-100 pt-3">

                        <strong className="text-slate-800">Relationships:</strong>

                        <ul className="list-disc ml-6 mt-1 space-y-0.5">

                            {activeCompetency.relationships.map((r, i) => {

                                const target = competencyMap[r.targetCompetencyId];

                                return (
                                    <li key={i}>
                                        {r.type} → {target ? target.name : r.targetCompetencyId}
                                    </li>
                                );

                            })}

                        </ul>

                    </div>

                )}


                <div className="text-sm text-slate-700 border-t border-slate-100 pt-3">

                    <strong className="text-slate-800">Construct:</strong>

                    <div className="mt-1 text-sm text-slate-900">
                        {constructLabel}
                    </div>

                </div>

            </div>

            {/* =================================================
         Coverage Diagnostics
      ================================================= */}

            <ObservableCoverageDiagnostics
                warrants={warrants}
                observables={observables}
            />

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-4">
                    <h3 className="text-sm font-semibold text-slate-800">
                        Observable List
                    </h3>

                    {/* =================================================
                        Collapse Controls
                    ================================================= */}

                    {!collapseAll ?
                        <button
                            type="button"
                            className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                            onClick={() => setCollapseAll(true)}
                        >
                            <ChevronUp size={14} strokeWidth={2} />
                            Collapse All
                        </button>

                        :

                        <button
                            type="button"
                            className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                            onClick={() => setCollapseAll(false)}
                        >
                            <ChevronDown size={14} strokeWidth={2} />
                            Expand All
                        </button>
                    }
                </div>


                {/* =================================================
                        Warrant Sections
                    ================================================= */}

                <DndContext
                    sensors={locked ? [] : sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={locked ? undefined : handleDragEnd}
                >

                    <SortableContext
                        items={observables.map(o => o.id)}
                        strategy={verticalListSortingStrategy}
                    >

                        <AnimatePresence>

                            {warrants.map(warrant => {

                                const list = groupedObservables[warrant.id] || [];


                                return (

                                    <div
                                        key={warrant.id}
                                        className="space-y-4 bg-white border border-slate-200 rounded-lg shadow-sm p-5 mb-4"
                                    >


                                        {/* Warrant Header */}

                                        <div className="flex items-center gap-2">

                                            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-600">
                                                Warrant
                                            </span>

                                            {/* Observable Count Badge */}

                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${observableCoverageColor(list.length)}`}
                                            >
                                                {list.length} observables
                                            </span>

                                            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide bg-blue-100 text-blue-700">
                                                {constructLabel}
                                            </span>

                                        </div>


                                        <div className="text-sm text-slate-700">
                                            {warrant.reasoningStatement}
                                        </div>

                                        {!locked && (
                                            <button
                                                type="button"
                                                className="flex ml-auto items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 mt-3"
                                                onClick={() => handleAddObservable(warrant.id)}
                                            >
                                                <Plus size={16} strokeWidth={2.25} />
                                                Add Observable
                                            </button>
                                        )}

                                        {/* Observable Cards */}

                                        {list.map((observable, index) => (

                                            <SortableObservableCard

                                                key={observable.id}

                                                observable={observable}

                                                warrants={warrants}

                                                competency={activeCompetency}

                                                index={index}

                                                errors={errors}

                                                collapseAll={collapseAll}

                                                locked={locked}

                                                onChange={(updated) =>
                                                    updateObservable(
                                                        observable.id,
                                                        updated
                                                    )
                                                }

                                                onRemove={() =>
                                                    removeObservable(
                                                        observable.id
                                                    )
                                                }

                                            />

                                        ))}

                                    </div>

                                );

                            })}

                        </AnimatePresence>

                    </SortableContext>

                </DndContext>

            </div>
            {/* =================================================
         Global Validation Error
      ================================================= */}

            {errors.general && (

                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
                    <AlertCircle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
                    <p>{errors.general}</p>
                </div>

            )}

        </div>

    );

}
