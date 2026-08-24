// src/components/itemBank/ItemWizard/components/ResponseComponentEditor.jsx
// ------------------------------------------------------------
// 🧠 Response Component Editor (Strict Registry-Based)
// ------------------------------------------------------------
// ✔ Strict observable-type enforcement
// ✔ Registry-driven architecture
// ✔ Default interaction factory
// ✔ Immutable interaction instantiation
// ✔ Blueprint-compatible filtering
// ✔ Auto-reset if incompatible
// ✔ Governance-safe
// ------------------------------------------------------------

import React, { useEffect, useMemo } from "react";
import {
    interactionTypesForObservable,
    isInteractionCompatible,
    interactionCompatibilityMessage,
} from "@/utils/ecdVocabulary";
import MCQEditor from "./interaction/MCQEditor";
import NumericInputEditor from "./interaction/NumericInputEditor";
import ConstructedResponseEditor from "./interaction/ConstructedResponseEditor";
import MultiSelectEditor from "./interaction/MultiSelectEditor";
import LikertEditor from "./interaction/LikertEditor";

/* =====================================================
   🔹 Interaction Registry
   -----------------------------------------------------
   Each entry used to carry `observableType: "<same string as the key>"`,
   and the filter below tested `registryEntry.observableType ===
   observableType`. Since observables are typed selected_response /
   constructed_response / ... and these keys are mcq / multiselect / ...,
   that test excluded EVERY entry: availableTypes was always empty, the
   picker always rendered "-- Select Interaction --" and nothing else, and
   the auto-reset effect below wiped any type that somehow got set.
   The interaction editor has never been usable.

   Compatibility is a relation between two different vocabularies, and it
   lives in src/utils/ecdVocabulary.js -- imported here and by
   src/utils/schema.js, so the picker and the validator cannot disagree.
   The dead `observableType` keys are gone.
===================================================== */

const INTERACTION_REGISTRY = {
    mcq: {
        label: "Multiple Choice",
        create: () => ({
            type: "mcq",
            responseComponents: [],
            config: {},
        }),
        component: MCQEditor,
    },

    multiselect: {
        label: "Multi Select",
        create: () => ({
            type: "multiselect",
            responseComponents: [],
            config: {},
        }),
        component: MultiSelectEditor,
    },

    numeric: {
        label: "Numeric Input",
        create: () => ({
            type: "numeric",
            responseComponents: [],
            config: {},
        }),
        component: NumericInputEditor,
    },

    constructed: {
        label: "Constructed Response",
        create: () => ({
            type: "constructed",
            responseComponents: [],
            config: {},
        }),
        component: ConstructedResponseEditor,
    },

    likert: {
        label: "Likert Scale",
        create: () => ({
            type: "likert",
            responseComponents: [],
            config: {},
        }),
        component: LikertEditor,
    },
};

/* =====================================================
   🔹 Component
===================================================== */

export default function ResponseComponentEditor({
    interaction,
    onChange,
    canEdit,
    allowedTypes = null,
    observableType = null,
}) {
    const currentType = interaction?.type || "";

    /* =====================================================
       🔹 Strict Type Filtering
    ===================================================== */

    const availableTypes = useMemo(() => {
        const registryTypes = Object.keys(INTERACTION_REGISTRY);

        // What the observable permits. `null` observableType means the
        // caller has not resolved one yet -- offer everything the
        // registry can render rather than nothing, so the picker is not
        // mysteriously empty while the chain loads.
        const byObservable = observableType
            ? interactionTypesForObservable(observableType)
            : registryTypes;

        // The blueprint whitelist NARROWS. An explicitly empty array
        // means "nothing is permitted" and is honoured; `null` means the
        // caller is not constraining.
        const byBlueprint = Array.isArray(allowedTypes)
            ? allowedTypes
            : registryTypes;

        return registryTypes.filter(
            (type) => byObservable.includes(type) && byBlueprint.includes(type)
        );
    }, [allowedTypes, observableType]);

    /* =====================================================
       🔹 Auto-Reset If Incompatible
       -----------------------------------------------------
       Only fires on a genuine incompatibility. Guarded on
       `observableType` being resolved: without the guard, the reset ran
       during the moment the evidence model was still loading and silently
       cleared a perfectly good interaction the author had already built.
    ===================================================== */

    useEffect(() => {
        if (!currentType || !canEdit) return;
        if (!observableType) return;

        const known = !!INTERACTION_REGISTRY[currentType];
        const compatible = isInteractionCompatible(observableType, currentType);

        if (!known || !compatible) {
            onChange({ type: "", responseComponents: [], config: {} });
        }
    }, [currentType, observableType, canEdit, onChange]);

    /* =====================================================
       🔹 Type Change Handler
    ===================================================== */

    const handleTypeChange = (type) => {
        if (!canEdit) return;

        const registryEntry =
            INTERACTION_REGISTRY[type];

        if (!registryEntry) return;

        const newInteraction =
            registryEntry.create();

        onChange(newInteraction);
    };

    const ActiveEditor =
        INTERACTION_REGISTRY[currentType]
            ?.component;

    /* =====================================================
       🔹 UI
    ===================================================== */

    return (
        <div className="space-y-6">
            {/* Interaction Type Selector */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Interaction Type
                </label>

                <select
                    value={currentType}
                    disabled={!canEdit}
                    onChange={(e) =>
                        handleTypeChange(e.target.value)
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                    <option value="">
                        -- Select Interaction --
                    </option>

                    {availableTypes.map((type) => (
                        <option
                            key={type}
                            value={type}
                        >
                            {
                                INTERACTION_REGISTRY[type]
                                    .label
                            }
                        </option>
                    ))}
                </select>

                {observableType && availableTypes.length === 0 && (
                    <p className="mt-1.5 text-xs text-red-600">
                        {interactionCompatibilityMessage(observableType, currentType)}
                    </p>
                )}

                {observableType && availableTypes.length > 0 && (
                    <p className="mt-1.5 text-xs text-slate-400">
                        Compatible with a{" "}
                        <strong className="text-slate-600">{observableType}</strong>{" "}
                        observable.
                    </p>
                )}
            </div>

            {/* Interaction Editor */}
            {currentType && ActiveEditor ? (
                <ActiveEditor
                    interaction={interaction}
                    onChange={onChange}
                    canEdit={canEdit}
                />
            ) : (
                <div className="text-sm text-slate-500">
                    Select an interaction type to
                    configure response structure.
                </div>
            )}
        </div>
    );
}