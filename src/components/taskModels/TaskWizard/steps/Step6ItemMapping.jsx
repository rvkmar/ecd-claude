// Step6ItemMapping.jsx
// ------------------------------------------------------------
// Task Model Wizard — Step 6: Item ↔ Observable Mapping
// ------------------------------------------------------------
// Records which existing Items are expected to elicit which of this
// task's declared observables. Read by SessionPlayer (to resolve a
// question to its observable), TasksManager and TaskDetails.
//
// This step is advisory: coverage gaps are surfaced but never block
// saving or lifecycle promotion, because items are usually authored
// *after* the Task Model they instantiate.
//
// Fixes over the previous StepItemMapping.jsx:
//  • Observables were labelled `obs.statement || obs.text || obs.label`,
//    with the wizard's lookup keyed off models the panel had already
//    filtered down; an observable whose owning model was not in the
//    narrowed list rendered as a bare id. The lookup is now built from
//    the bound models directly.
//  • The reconciliation effect that pruned stale mappings on every render
//    is gone: Steps 2 and 3 now prune mappings at the moment an evidence
//    model is unbound or an observable is dropped, which is where the
//    information actually is.
//  • Item labels fall back through stem → name → id and are truncated
//    rather than blowing out the matrix header.
// ------------------------------------------------------------

import { useMemo, useState } from "react";
import { Check, Info, Search } from "lucide-react";
import InfoTooltip from "../../../ui/InfoTooltip";

export default function Step6ItemMapping({
    draft,
    setDraft,
    disabled,
    availableItems = [],
    observationLookup = {},
}) {
    const [search, setSearch] = useState("");

    const expectedObservations = draft.expectedObservations || [];
    const itemMappings = draft.itemMappings || [];
    const selectedItemIds = draft.selectedItemIds || [];

    const observables = useMemo(
        () =>
            expectedObservations.map((o) => ({
                observationId: o.observationId,
                evidenceModelId: o.evidenceModelId,
                required: o.required,
                label:
                    observationLookup[o.observationId]?.statement || o.observationId,
            })),
        [expectedObservations, observationLookup]
    );

    const itemLabel = (item) => item.stem || item.name || item.id;

    const filteredItems = useMemo(() => {
        const needle = search.trim().toLowerCase();
        if (!needle) return availableItems;
        return availableItems.filter((item) =>
            itemLabel(item).toLowerCase().includes(needle)
        );
    }, [availableItems, search]);

    // Selected items float to the top of the picker so a long bank does
    // not hide what is already in scope.
    const visibleItems = useMemo(() => {
        const selected = filteredItems.filter((i) => selectedItemIds.includes(i.id));
        const rest = filteredItems.filter((i) => !selectedItemIds.includes(i.id));
        return [...selected, ...rest];
    }, [filteredItems, selectedItemIds]);

    const mappingItems = useMemo(
        () => availableItems.filter((i) => selectedItemIds.includes(i.id)),
        [availableItems, selectedItemIds]
    );

    /* ---------------- Mutations ---------------- */

    const toggleItem = (itemId) => {
        if (disabled) return;

        setDraft((prev) => {
            const current = prev.selectedItemIds || [];
            const selected = current.includes(itemId);

            return {
                ...prev,
                selectedItemIds: selected
                    ? current.filter((id) => id !== itemId)
                    : [...current, itemId],
                // Deselecting an item removes its mappings; leaving them
                // behind produced mappings referencing items the matrix no
                // longer showed, which nothing could then clear.
                itemMappings: selected
                    ? (prev.itemMappings || []).filter((m) => m.itemId !== itemId)
                    : prev.itemMappings || [],
            };
        });
    };

    const toggleMapping = (itemId, observationId) => {
        if (disabled) return;

        setDraft((prev) => {
            const observable = (prev.expectedObservations || []).find(
                (o) => o.observationId === observationId
            );
            if (!observable) return prev;

            const current = prev.itemMappings || [];
            const exists = current.some(
                (m) => m.itemId === itemId && m.observationId === observationId
            );

            return {
                ...prev,
                itemMappings: exists
                    ? current.filter(
                        (m) =>
                            !(m.itemId === itemId && m.observationId === observationId)
                    )
                    : [
                        ...current,
                        {
                            itemId,
                            observationId,
                            evidenceModelId: observable.evidenceModelId,
                        },
                    ],
            };
        });
    };

    /* ---------------- Coverage ---------------- */

    const coverage = useMemo(
        () =>
            observables.map((obs) => ({
                ...obs,
                count: itemMappings.filter(
                    (m) => m.observationId === obs.observationId
                ).length,
            })),
        [observables, itemMappings]
    );

    const uncovered = coverage.filter((c) => c.count === 0);

    if (observables.length === 0) {
        return (
            <div className="space-y-6">
                <Header />
                <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-600">
                    <Info size={16} strokeWidth={2.25} className="mt-0.5 shrink-0 text-slate-400" />
                    <span>
                        Target at least one observable in Step 3 before mapping items to
                        it.
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Header />

            {/* Item picker */}
            <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                    <h3 className="text-sm font-semibold text-slate-800">
                        Items in scope
                    </h3>
                    <span className="text-xs text-slate-400">
                        {selectedItemIds.length} selected of {availableItems.length}{" "}
                        available
                    </span>
                </div>

                <div className="relative">
                    <Search
                        size={16}
                        strokeWidth={2}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        type="text"
                        placeholder="Search items…"
                        value={search}
                        disabled={disabled}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-9 pr-3.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                </div>

                <div className="max-h-64 space-y-1 overflow-y-auto pt-1">
                    {visibleItems.map((item) => (
                        <label
                            key={item.id}
                            className="flex cursor-pointer items-start gap-2.5 rounded-md px-1 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                        >
                            <input
                                type="checkbox"
                                checked={selectedItemIds.includes(item.id)}
                                disabled={disabled}
                                onChange={() => toggleItem(item.id)}
                                className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-slate-900 disabled:cursor-not-allowed"
                            />
                            <span className="min-w-0">
                                <span className="block truncate">{itemLabel(item)}</span>
                                <span className="text-xs capitalize text-slate-400">
                                    {item.status || "unknown status"}
                                </span>
                            </span>
                        </label>
                    ))}

                    {visibleItems.length === 0 && (
                        <p className="py-2 text-sm text-slate-400">
                            {/* "No items match that search" is wrong when there
                                is no search and no bank -- it blames the query
                                for an empty Item Bank. */}
                            {availableItems.length === 0
                                ? "No items in the Item Bank yet. Items are normally authored after the Task Model they instantiate — you can come back and map them later."
                                : "No items match that search."}
                        </p>
                    )}
                </div>
            </section>

            {/* Matrix */}
            {mappingItems.length === 0 ? (
                /* This read as a blocking requirement ("Select at least
                   one item...") directly above a panel saying coverage does
                   not block promotion, with Next enabled anyway. Three
                   different signals, two of them wrong. */
                <p className="text-sm text-slate-500">
                    <span className="font-medium text-slate-600">Optional.</span> Map
                    items now, or leave this until after promotion — this step never
                    blocks saving or confirming.
                </p>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                    <table className="w-full border-collapse text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="sticky left-0 z-20 min-w-[260px] border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Observable
                                </th>
                                {mappingItems.map((item) => (
                                    <th
                                        key={item.id}
                                        className="border-b border-slate-200 px-4 py-3 text-center"
                                        title={itemLabel(item)}
                                    >
                                        <span className="mx-auto block max-w-[160px] truncate text-xs font-medium text-slate-700">
                                            {itemLabel(item)}
                                        </span>
                                        <span className="text-[11px] capitalize text-slate-400">
                                            {item.status}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 bg-white">
                            {observables.map((obs) => (
                                <tr key={obs.observationId} className="hover:bg-slate-50">
                                    <td className="sticky left-0 z-10 min-w-[260px] bg-white px-4 py-3 text-slate-700">
                                        <span className="block">{obs.label}</span>
                                        {obs.required && (
                                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                                Required
                                            </span>
                                        )}
                                    </td>

                                    {mappingItems.map((item) => {
                                        const checked = itemMappings.some(
                                            (m) =>
                                                m.observationId === obs.observationId &&
                                                m.itemId === item.id
                                        );

                                        return (
                                            <td key={item.id} className="px-4 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    disabled={disabled}
                                                    onChange={() =>
                                                        toggleMapping(item.id, obs.observationId)
                                                    }
                                                    aria-label={`Map ${itemLabel(item)} to ${obs.label}`}
                                                    className="h-4 w-4 rounded border-slate-300 accent-slate-900 disabled:cursor-not-allowed"
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Coverage */}
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800">
                    Observable Coverage
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                    {uncovered.length === 0
                        ? "Every declared observable has at least one mapped item."
                        : `${uncovered.length} of ${coverage.length} observables have no mapped item yet. This does not block promotion.`}
                </p>

                <ul className="mt-4 space-y-2 text-sm">
                    {coverage.map((c) => (
                        <li
                            key={c.observationId}
                            className="flex items-start justify-between gap-4"
                        >
                            <span className="min-w-0 text-slate-700">{c.label}</span>
                            {c.count > 0 ? (
                                <span className="inline-flex shrink-0 items-center gap-1 text-emerald-700">
                                    <Check size={14} strokeWidth={2.25} />
                                    {c.count} item{c.count === 1 ? "" : "s"}
                                </span>
                            ) : (
                                <span className="shrink-0 text-amber-700">Not covered</span>
                            )}
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}

function Header() {
    return (
        <div>
            <h2 className="inline-flex items-center gap-1.5 text-lg font-semibold text-slate-900">
                Item – Observable Mapping
                <InfoTooltip content="Advisory. Coverage gaps are reported but never block saving or lifecycle promotion — items are normally authored after the Task Model." />
            </h2>
            <p className="mt-1 text-sm text-slate-500">
                Bring existing items into this task's scope and record which
                observables each one elicits.
            </p>
        </div>
    );
}
