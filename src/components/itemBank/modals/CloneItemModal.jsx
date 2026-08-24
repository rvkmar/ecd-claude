// src/components/itemBank/modals/CloneItemModal.jsx
// ------------------------------------------------------------
// Clone an item onto a new version.
//
// `canClone` used to be `item.locked && item.status === "confirmed"`,
// which closed a dead end: PUT refuses a locked record and tells the
// author to clone, and this dialog then refused to clone anything that
// was operational or suspended. Between them the two guards made a live
// item permanently unmaintainable. Cloning is the maintenance path — it
// has to be available wherever editing is not. Archived is the one
// exception, and it says so rather than showing a disabled button.
// ------------------------------------------------------------

import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useCloneItem } from "@/api/queries/items";
import { apiErrorMessage } from "@/api/apiClient";

export default function CloneItemModal({ item, onClose, onSuccess }) {
  const cloneMutation = useCloneItem();
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!item) return null;

  const blockedReason = !item.locked
    ? "This item is still editable — edit it directly rather than cloning."
    : item.status === "archived"
    ? "An archived item cannot be cloned. Author a new item against the Task Model instead."
    : null;

  const nextVersion = (item.versionNumber || 1) + 1;

  const handleClone = async () => {
    if (!acknowledged || blockedReason) return;

    setBusy(true);
    setError(null);

    try {
      const result = await cloneMutation.mutateAsync(item.id);
      onSuccess?.(result);
      onClose?.();
    } catch (err) {
      setError(apiErrorMessage(err, err.message || "Clone failed."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="text-base font-semibold text-slate-900">Clone this item?</h2>

        <p className="mt-2 font-mono text-xs text-slate-500">
          {item.id} · v{item.versionNumber} · {item.status}
        </p>

        {blockedReason ? (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle size={16} strokeWidth={2.25} className="mt-0.5 shrink-0" />
            {blockedReason}
          </div>
        ) : (
          <>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-600">
              <li>
                The clone starts as a draft at{" "}
                <strong className="text-slate-900">v{nextVersion}</strong>, with
                this item as its parent.
              </li>
              <li>
                Calibration resets to uncalibrated — the parameters belong to
                the responses <em>this</em> item collected.
              </li>
              <li>
                Exposure counters reset to zero. The clone usually exists
                because the original was used up.
              </li>
              <li>
                The structural binding is copied, so the clone instantiates the
                same Task Model version.
              </li>
            </ul>

            <label className="mt-4 flex items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-slate-900"
              />
              I understand the clone starts a new, uncalibrated version.
            </label>
          </>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            {blockedReason ? "Close" : "Cancel"}
          </button>
          {!blockedReason && (
            <button
              type="button"
              onClick={handleClone}
              disabled={busy || !acknowledged}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              {busy ? "Cloning…" : `Clone as v${nextVersion}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
