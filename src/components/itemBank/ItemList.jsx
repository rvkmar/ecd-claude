// src/components/itemBank/ItemList.jsx
// ------------------------------------------------------------
// Item Bank structure — the read-oriented view of the bank.
//
// FIXES
//
//  * Every row was `onClick={() => navigate('/items/' + item.id)}`, and
//    NO SUCH ROUTE EXISTS — src/App.jsx has no item route at all, and the
//    Item Bank is reached through AdminPage's <ItemBankAdmin /> tab. Every
//    click on every row went to a 404 (or a blank outlet). Rows open the
//    item in the wizard now, through the callback this component is
//    given, rather than routing somewhere that was never wired.
//
//  * The Competency column read `item.metadata.competencyId`, a field
//    nothing has ever written, so it rendered an em dash on every row and
//    the search box's "search by competency" promise matched nothing. It
//    is derived through the chain now.
//
//  * The exposure risk filter counted drafts, whose exposure is
//    meaningless, and the status filter came from a query string this
//    component's own host never sets.
// ------------------------------------------------------------

import React, { useMemo, useState } from "react";
import { ArrowUpDown, Search } from "lucide-react";
import useItemListData from "./ItemWizard/hooks/useItemListData";
import LifecycleStatusBadge from "../ui/LifecycleStatusBadge";
import { exposureBand, versionLabel } from "./itemConstants";
import { STATUS } from "../../../server/utils/lifecycleMatrix.js";

const RISK_FILTERS = [
  { value: "", label: "All items" },
  { value: "nearing", label: "Nearing retirement (≥80%)" },
  { value: "exhausted", label: "Over-exposed" },
  { value: "unbounded", label: "In service, no ceiling" },
  { value: "uncalibrated", label: "In service, uncalibrated" },
];

export default function ItemList({ onOpenItem }) {
  const { items, loading, error, competencyByItem } = useItemListData();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [sortKey, setSortKey] = useState("updatedAt");
  const [sortDir, setSortDir] = useState("desc");

  const filtered = useMemo(() => {
    let result = [...items];

    if (statusFilter) {
      result = result.filter((item) => item.status === statusFilter);
    }

    if (riskFilter) {
      // Exposure and calibration risk are properties of items IN SERVICE.
      // A draft with no ceiling is not a risk, it is unfinished.
      const inService = (i) => ["operational", "suspended"].includes(i.status);

      if (riskFilter === "uncalibrated") {
        result = result.filter(
          (i) =>
            inService(i) &&
            (i.psychometrics?.calibrationStatus || "uncalibrated") !== "calibrated"
        );
      } else {
        result = result.filter(
          (i) => inService(i) && exposureBand(i) === riskFilter
        );
      }
    }

    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter((item) =>
        [
          item.id,
          competencyByItem.get(item.id),
          item.metadata?.subject,
          item.metadata?.topic,
          item.metadata?.grade,
          ...(item.metadata?.tags || []),
        ]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(lower))
      );
    }

    return result;
  }, [items, statusFilter, riskFilter, search, competencyByItem]);

  const sorted = useMemo(() => {
    const copy = [...filtered];

    copy.sort((a, b) => {
      const av = sortKey === "competency" ? competencyByItem.get(a.id) : a[sortKey];
      const bv = sortKey === "competency" ? competencyByItem.get(b.id) : b[sortKey];

      const as = av ?? "";
      const bs = bv ?? "";

      if (as < bs) return sortDir === "asc" ? -1 : 1;
      if (as > bs) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return copy;
  }, [filtered, sortKey, sortDir, competencyByItem]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortHeader = ({ label, sortAs }) => (
    <th className="px-4 py-3">
      <button
        type="button"
        onClick={() => toggleSort(sortAs)}
        className="inline-flex items-center gap-1 font-medium text-slate-600 transition hover:text-slate-900"
      >
        {label}
        <ArrowUpDown size={12} strokeWidth={2.25} className="text-slate-400" />
      </button>
    </th>
  );

  if (loading) {
    return <div className="p-6 text-sm text-slate-600">Loading items…</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Item Bank structure
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {sorted.length} of {items.length} item
            {items.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search id, construct, subject, tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-72 rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm shadow-sm transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          >
            <option value="">All statuses</option>
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          >
            {RISK_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <SortHeader label="ID" sortAs="id" />
              <SortHeader label="Construct" sortAs="competency" />
              <th className="px-4 py-3 font-medium text-slate-600">Subject</th>
              <SortHeader label="Status" sortAs="status" />
              <th className="px-4 py-3 font-medium text-slate-600">Version</th>
              <th className="px-4 py-3 font-medium text-slate-600">Calibration</th>
              <th className="px-4 py-3 font-medium text-slate-600">Exposure</th>
              <SortHeader label="Updated" sortAs="updatedAt" />
            </tr>
          </thead>

          <tbody>
            {sorted.map((item) => {
              const band = exposureBand(item);
              const inService = ["operational", "suspended"].includes(item.status);

              return (
                <tr
                  key={item.id}
                  onClick={() => onOpenItem?.(item)}
                  className={`border-t border-slate-100 ${
                    onOpenItem ? "cursor-pointer hover:bg-slate-50" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-[13px] font-medium">
                    {item.id}
                  </td>
                  <td className="px-4 py-3">
                    {competencyByItem.get(item.id) || "—"}
                  </td>
                  <td className="px-4 py-3">{item.metadata?.subject || "—"}</td>
                  <td className="px-4 py-3">
                    <LifecycleStatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3">{versionLabel(item.versionNumber)}</td>
                  <td className="px-4 py-3 capitalize">
                    {item.psychometrics?.calibrationStatus || "uncalibrated"}
                  </td>
                  <td className="px-4 py-3">
                    {!inService ? (
                      <span className="text-slate-400">not in service</span>
                    ) : band === "unbounded" ? (
                      <span className="text-amber-600">no ceiling</span>
                    ) : (
                      <span
                        className={
                          band === "exhausted"
                            ? "text-red-600"
                            : band === "nearing"
                            ? "text-amber-600"
                            : "text-slate-600"
                        }
                      >
                        {item.exposureControl.usageCount || 0}/
                        {item.exposureControl.maxUsageBeforeRetire}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {item.updatedAt
                      ? new Date(item.updatedAt).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              );
            })}

            {sorted.length === 0 && (
              <tr>
                <td colSpan="8" className="px-4 py-10 text-center text-slate-500">
                  No items match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
