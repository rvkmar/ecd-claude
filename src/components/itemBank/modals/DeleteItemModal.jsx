// src/components/itemBank/modals/DeleteItemModal.jsx
// ------------------------------------------------------------
// Delete a draft item.
//
// Rewritten off the orphan useItemLifecycle hook. The dialog also now
// says what the server actually refuses: a locked item cannot be deleted
// at all (archive it), and an unlocked item that some session has already
// answered cannot be deleted either, because removing it would orphan
// those responses and a report that cannot resolve an item silently drops
// the evidence.
// ------------------------------------------------------------

import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useDeleteItem } from "@/api/queries/items";
import { apiErrorMessage } from "@/api/apiClient";

export default function DeleteItemModal({ item, onClose, onSuccess }) {
  const deleteMutation = useDeleteItem();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!item) return null;

  const locked = item.locked === true;

  const handleDelete = async () => {
    setBusy(true);
    setError(null);

    try {
      await deleteMutation.mutateAsync(item.id);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(apiErrorMessage(err, err.message || "Delete failed."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="text-base font-semibold text-slate-900">Delete this item?</h2>

        <p className="mt-2 font-mono text-xs text-slate-500">
          {item.id} · v{item.versionNumber} · {item.status}
        </p>

        {locked ? (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle size={16} strokeWidth={2.25} className="mt-0.5 shrink-0" />
            A confirmed item cannot be deleted — the responses it collected have
            to stay interpretable. Archive it instead.
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-600">
            This permanently removes the draft and its references from any Task
            Model's item map. If a session has already recorded a response
            against it, the server will refuse and ask you to archive instead.
          </p>
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
            {locked ? "Close" : "Cancel"}
          </button>
          {!locked && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              {busy ? "Deleting…" : "Delete"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
