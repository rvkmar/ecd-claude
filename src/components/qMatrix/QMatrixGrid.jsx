// src/components/qMatrix/QMatrixGrid.jsx
// ------------------------------------------------------------
// D51 — the Q-matrix editor's core: an attributes (columns) x items
// (rows) checkbox grid. Deliberately dumb/presentational -- all state
// (which items are included, which cells are checked, D52 validity) lives
// in QMatrixEditor, so this component is trivial to unit-test and to
// exercise in Storybook in isolation.
//
// Uses only named design tokens (text-caption, text-2xs) and semantic
// Tailwind colors -- no arbitrary `text-[Npx]` values, per the Day 41
// design-tokens rule.
// ------------------------------------------------------------

import React from "react";
import { X } from "lucide-react";

export default function QMatrixGrid({
  attributes = [],
  items = [],
  entries = [],
  onToggleCell,
  onRemoveItem,
  readOnly = false,
  rowErrors = [],
  columnAdvisories = [],
}) {
  const isChecked = (itemId, attributeId) =>
    entries.some((e) => e.itemId === itemId && e.attributeId === attributeId);

  const rowErrorItemIds = new Set(
    rowErrors.flatMap((e) => (e.itemId ? [e.itemId] : e.itemIds || []))
  );
  const advisoryAttrIds = new Set(
    columnAdvisories.map((a) => a.attributeId).filter(Boolean)
  );

  if (items.length === 0) {
    return <p className="mt-2 text-caption text-slate-500">No items added yet.</p>;
  }

  return (
    <div className="mt-2 overflow-x-auto rounded-md border border-slate-200">
      <table className="min-w-full border-collapse text-caption">
        <thead>
          <tr>
            <th className="sticky left-0 bg-slate-50 px-3 py-2 text-left font-medium text-slate-600">
              Item
            </th>
            {attributes.map((attr) => (
              <th
                key={attr.id}
                className={`px-3 py-2 text-center font-medium ${
                  advisoryAttrIds.has(attr.id)
                    ? "bg-amber-50 text-amber-700"
                    : "bg-slate-50 text-slate-600"
                }`}
                title={attr.label}
              >
                {attr.label}
              </th>
            ))}
            {!readOnly && <th className="bg-slate-50 px-2 py-2" />}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className={rowErrorItemIds.has(item.id) ? "bg-red-50" : ""}>
              <td className="sticky left-0 whitespace-nowrap border-t border-slate-100 bg-white px-3 py-2 font-medium text-slate-700">
                {item.id}
                {item.metadata?.subject && (
                  <span className="ml-1.5 text-2xs text-slate-400">
                    {item.metadata.subject}
                  </span>
                )}
              </td>
              {attributes.map((attr) => (
                <td key={attr.id} className="border-t border-slate-100 px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={isChecked(item.id, attr.id)}
                    disabled={readOnly}
                    onChange={() => onToggleCell?.(item.id, attr.id)}
                    aria-label={`${item.id} requires ${attr.label}`}
                  />
                </td>
              ))}
              {!readOnly && (
                <td className="border-t border-slate-100 px-2 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => onRemoveItem?.(item.id)}
                    className="text-slate-400 hover:text-red-600"
                    aria-label={`Remove ${item.id} from Q-matrix`}
                  >
                    <X size={14} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
