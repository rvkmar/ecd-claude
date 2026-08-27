// src/components/itemBank/ItemBuilder.jsx
// ------------------------------------------------------------
// Item Bank — authoring and governance surface.
//
// FIXES
//
//  * Task Models were filtered to `status === "confirmed" && locked`, so
//    the moment one was activated it vanished and "No confirmed Task
//    Models found" appeared even with a bank full of live blueprints.
//    isInstantiableTaskModel() is the predicate the server enforces.
//
//  * The card view offered Send-to-Review / Confirm / Activate and the
//    table view offered neither, so which governance actions existed
//    depended on which toggle the user had last clicked. Both views now
//    render one shared action set, derived from the lifecycle matrix, so
//    suspend / reactivate / archive — which had no control anywhere in
//    the product — are reachable too.
//
//  * That shared action set deliberately excludes `reviewed` and
//    `confirmed`: those two are the only transitions the Item Wizard
//    itself gates on completeness (Step8Review's preflight, blocking
//    checks, the acknowledgment step for Confirm). A one-click list
//    action for either bypassed all of that — the server would still
//    reject a structurally invalid item, but an author could otherwise
//    confirm something the wizard's own review step would have flagged
//    as incomplete or ill-advised, just by never opening it. One gate
//    per irreversible transition: reach both only via Open -> the
//    wizard's Review step.
//
//  * `noConfirmedTasks` hid the search box and the table but not the card
//    grid, so the empty state was half-applied.
//
//  * Search read only subject / topic / id. Tags and grade are searchable
//    now, and the filtering happens server-side.
// ------------------------------------------------------------

import React, { useMemo, useState } from "react";
import {
  Plus,
  RefreshCw,
  LayoutGrid,
  List,
  Search,
  AlertTriangle,
} from "lucide-react";

import ItemWizard from "./ItemWizard/ItemWizard";
import DeleteItemModal from "./modals/DeleteItemModal";
import CloneItemModal from "./modals/CloneItemModal";
import ConfirmLifecycleModal from "./modals/ConfirmLifecycleModal";
import LifecycleStatusBadge from "../ui/LifecycleStatusBadge";

import { useItems } from "@/api/queries/items";
import { useTaskModels } from "@/api/queries/taskModels";
import { apiErrorMessage } from "@/api/apiClient";
import { isInstantiableTaskModel } from "@/utils/schema";
import { TRANSITIONS } from "../../../server/utils/lifecycleMatrix.js";
import { openActionLabel } from "@/utils/modelActionLabel";
import { exposureBand, versionLabel } from "./itemConstants";

/* The actions offered for a given status, derived from the lifecycle
   matrix rather than restated. A transition added to the matrix appears
   here automatically; one removed from it disappears.

   `reviewed` and `confirmed` are intentionally absent -- see the FIXES
   note above. Every other transition here has no wizard-side
   completeness gate to bypass, so a direct one-click action is safe. */
const TRANSITION_LABELS = {
  draft: { label: "Return to draft", tone: "bg-slate-100 text-slate-700 hover:bg-slate-200" },
  operational: { label: "Activate", tone: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" },
  suspended: { label: "Suspend", tone: "bg-orange-100 text-orange-800 hover:bg-orange-200" },
  archived: { label: "Archive", tone: "bg-slate-200 text-slate-700 hover:bg-slate-300" },
};

function transitionsFor(item) {
  const from = item.status || "draft";
  const allowed = TRANSITIONS[from] || [];

  return allowed
    .filter((to) => TRANSITION_LABELS[to])
    .map((to) => ({ to, ...TRANSITION_LABELS[to] }));
}

function ExposurePill({ item }) {
  const band = exposureBand(item);
  if (band === "unbounded") return null;

  const tone = {
    healthy: "bg-emerald-50 text-emerald-700",
    nearing: "bg-amber-50 text-amber-700",
    exhausted: "bg-red-50 text-red-700",
  }[band];

  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}>
      {item.exposureControl.usageCount || 0}/
      {item.exposureControl.maxUsageBeforeRetire}
    </span>
  );
}

function LifecycleActions({ item, onTransition, size = "sm" }) {
  const actions = transitionsFor(item);
  if (actions.length === 0) return null;

  const cls =
    size === "sm"
      ? "rounded px-2.5 py-1 text-xs font-medium transition"
      : "rounded px-3 py-1 text-sm font-medium transition";

  return (
    <>
      {actions.map((a) => (
        <button
          key={a.to}
          type="button"
          onClick={() => onTransition({ item, nextStatus: a.to })}
          className={`${cls} ${a.tone}`}
        >
          {a.label}
        </button>
      ))}
    </>
  );
}

export default function ItemBuilder() {
  const [mode, setMode] = useState("list"); // list | create | edit
  const [selectedItem, setSelectedItem] = useState(null);
  const [view, setView] = useState("card");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [cloneTarget, setCloneTarget] = useState(null);
  const [lifecycleTarget, setLifecycleTarget] = useState(null);

  const filters = useMemo(
    () => ({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(search.trim() ? { q: search.trim() } : {}),
    }),
    [statusFilter, search]
  );

  const {
    data,
    isLoading,
    isFetching,
    error: queryError,
    refetch,
  } = useItems(filters);

  const items = data || [];
  const error = queryError
    ? apiErrorMessage(queryError, queryError.message || "Failed to load items.")
    : null;

  const { data: allTaskModels = [], isLoading: taskLoading } = useTaskModels();

  const instantiableTaskModels = useMemo(
    () => (allTaskModels || []).filter(isInstantiableTaskModel),
    [allTaskModels]
  );

  const noTaskModels = !taskLoading && instantiableTaskModels.length === 0;

  if (mode === "create" || mode === "edit") {
    return (
      <ItemWizard
        item={mode === "edit" ? selectedItem : null}
        onClose={() => {
          setMode("list");
          setSelectedItem(null);
          refetch();
        }}
      />
    );
  }

  const openItem = (item) => {
    setSelectedItem(item);
    setMode("edit");
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Item Bank</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {items.length} item{items.length === 1 ? "" : "s"}
            {filters.status || filters.q ? " matching" : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-slate-300">
            <button
              type="button"
              onClick={() => setView("card")}
              className={`p-2 transition ${
                view === "card" ? "bg-slate-900 text-white" : "bg-white text-slate-500"
              }`}
              aria-label="Card view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setView("table")}
              className={`p-2 transition ${
                view === "table" ? "bg-slate-900 text-white" : "bg-white text-slate-500"
              }`}
              aria-label="Table view"
            >
              <List size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-md border border-slate-300 bg-white p-2 text-slate-500 transition hover:bg-slate-50"
            aria-label="Refresh"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedItem(null);
              setMode("create");
            }}
            disabled={noTaskModels}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            <Plus size={16} />
            New item
          </button>
        </div>
      </div>

      {noTaskModels && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-800">
          <AlertTriangle size={16} strokeWidth={2.25} className="mt-0.5 shrink-0" />
          <div>
            <strong className="font-semibold">No Task Model is ready to instantiate.</strong>
            <p className="mt-1">
              Items can be authored against confirmed, operational or suspended
              Task Models. Confirm one first — an item has no meaning without
              the blueprint it instantiates.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[16rem] flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search id, subject, topic, grade or tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        >
          <option value="">All statuses</option>
          {["draft", "reviewed", "confirmed", "operational", "suspended", "archived"].map(
            (s) => (
              <option key={s} value={s}>
                {s}
              </option>
            )
          )}
        </select>
      </div>

      {isLoading && <div className="text-sm text-slate-500">Loading…</div>}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Card view */}
      {!isLoading && view === "card" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="min-w-0 truncate font-mono text-sm font-semibold text-slate-900">
                  {item.id}
                </h3>
                <div className="flex shrink-0 items-center gap-1.5">
                  <ExposurePill item={item} />
                  <LifecycleStatusBadge status={item.status} />
                </div>
              </div>

              <div className="mt-2 space-y-0.5 text-sm text-slate-600">
                <p className="truncate">
                  {[item.metadata?.subject, item.metadata?.topic]
                    .filter(Boolean)
                    .join(" · ") || "No subject recorded"}
                </p>
                <p className="text-xs text-slate-500">
                  {versionLabel(item.versionNumber)}
                  {item.parentItemId ? " · cloned" : ""}
                  {item.psychometrics?.calibrationStatus === "calibrated"
                    ? " · calibrated"
                    : ""}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openItem(item)}
                  className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  {item.locked ? "View" : openActionLabel(item)}
                </button>

                {!item.locked && (
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="rounded border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                  >
                    Delete
                  </button>
                )}

                {item.locked && item.status !== "archived" && (
                  <button
                    type="button"
                    onClick={() => setCloneTarget(item)}
                    className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Clone
                  </button>
                )}

                <LifecycleActions item={item} onTransition={setLifecycleTarget} />
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="col-span-full rounded-lg border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500">
              No items match.
            </div>
          )}
        </div>
      )}

      {/* Table view */}
      {!isLoading && view === "table" && (
        <div className="overflow-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="p-3 font-medium text-slate-600">ID</th>
                <th className="p-3 font-medium text-slate-600">Subject</th>
                <th className="p-3 font-medium text-slate-600">Topic</th>
                <th className="p-3 font-medium text-slate-600">Version</th>
                <th className="p-3 font-medium text-slate-600">Exposure</th>
                <th className="p-3 font-medium text-slate-600">Status</th>
                <th className="p-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="p-3 font-mono text-[13px]">{item.id}</td>
                  <td className="p-3">{item.metadata?.subject || "—"}</td>
                  <td className="p-3">{item.metadata?.topic || "—"}</td>
                  <td className="p-3">{versionLabel(item.versionNumber)}</td>
                  <td className="p-3">
                    <ExposurePill item={item} /> {exposureBand(item) === "unbounded" && "—"}
                  </td>
                  <td className="p-3">
                    <LifecycleStatusBadge status={item.status} />
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openItem(item)}
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        {item.locked ? "View" : openActionLabel(item)}
                      </button>

                      {!item.locked && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      )}

                      {item.locked && item.status !== "archived" && (
                        <button
                          type="button"
                          onClick={() => setCloneTarget(item)}
                          className="text-xs font-medium text-slate-600 hover:underline"
                        >
                          Clone
                        </button>
                      )}

                      <LifecycleActions item={item} onTransition={setLifecycleTarget} />
                    </div>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  {/* Seven columns, seven-column span. */}
                  <td colSpan="7" className="p-8 text-center text-slate-500">
                    No items match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <DeleteItemModal
          item={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onSuccess={() => {
            setDeleteTarget(null);
            refetch();
          }}
        />
      )}

      {cloneTarget && (
        <CloneItemModal
          item={cloneTarget}
          onClose={() => setCloneTarget(null)}
          onSuccess={(clone) => {
            setCloneTarget(null);
            refetch();
            if (clone) openItem(clone);
          }}
        />
      )}

      {lifecycleTarget && (
        <ConfirmLifecycleModal
          item={lifecycleTarget.item}
          nextStatus={lifecycleTarget.nextStatus}
          onClose={() => setLifecycleTarget(null)}
          onSuccess={() => {
            setLifecycleTarget(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
