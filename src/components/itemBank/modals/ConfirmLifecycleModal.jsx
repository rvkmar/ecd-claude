// src/components/itemBank/modals/ConfirmLifecycleModal.jsx
// ------------------------------------------------------------
// One dialog for every item lifecycle transition.
//
// Rewritten off useItemLifecycle.js, an orphan hook that duplicated the
// react-query mutations. It also only ever explained `confirmed` and
// `operational`; the four transitions with real consequences that nobody
// could reach from the UI — reviewer rejection, suspension, reactivation
// and archival — had no copy at all, because no control offered them.
//
// Suspension and archival now ask the server what they would break BEFORE
// offering to force past it, so the warning names live sessions instead
// of describing the possibility of some.
// ------------------------------------------------------------

import React, { useState } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import {
  useTransitionItemLifecycle,
  useItemDependents,
} from "@/api/queries/items";
import { apiErrorMessage } from "@/api/apiClient";
import { useAuth } from "@/auth/AuthProvider";

// `reviewed` and `confirmed` are deliberately absent: ItemBuilder.jsx no
// longer offers those two as one-click list actions (see its header
// comment) -- they're only reachable via the Item Wizard's own Review
// step, which gates them on completeness. Keeping dead copy for
// statuses this modal is never opened with would misdescribe what this
// call site still does.
const COPY = {
  draft: {
    title: "Return this item to draft?",
    body: "The author regains editing rights and the review has to be repeated.",
    ack: false,
    tone: "bg-slate-900 hover:bg-slate-800",
    verb: "Return to draft",
  },
  operational: {
    title: "Put this item into service?",
    body: "The item becomes deliverable and starts accruing exposure against its ceiling. Its Evidence Model must already be operational — responses to an item whose scoring model is paused cannot be scored.",
    ack: true,
    tone: "bg-emerald-600 hover:bg-emerald-700",
    verb: "Activate",
  },
  suspended: {
    title: "Suspend this item?",
    body: "The item is withdrawn from delivery. It can be reactivated later, subject to its reactivation ceiling.",
    ack: false,
    tone: "bg-orange-600 hover:bg-orange-700",
    verb: "Suspend",
    checksDependents: true,
  },
  archived: {
    title: "Archive this item?",
    body: "Archival is terminal. The item can never be returned to service or cloned, and the responses it already collected stay interpretable only through it.",
    ack: true,
    tone: "bg-slate-900 hover:bg-slate-800",
    verb: "Archive",
    checksDependents: true,
  },
};

export default function ConfirmLifecycleModal({
  item,
  nextStatus,
  onClose,
  onSuccess,
}) {
  const { auth } = useAuth() || {};
  const transitionMutation = useTransitionItemLifecycle();

  const copy = COPY[nextStatus];

  const { data: dependents } = useItemDependents(
    copy?.checksDependents ? item?.id : null
  );

  const [acknowledged, setAcknowledged] = useState(false);
  const [force, setForce] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!item || !copy) return null;

  const liveCount = dependents?.liveSessionCount || 0;
  const isAdmin = auth?.role === "admin";

  const handleConfirm = async () => {
    if (copy.ack && !acknowledged) return;

    setBusy(true);
    setError(null);

    try {
      const result = await transitionMutation.mutateAsync({
        id: item.id,
        nextStatus,
        force,
      });
      onSuccess?.(result);
      onClose?.();
    } catch (err) {
      setError(apiErrorMessage(err, err.message || "Transition failed."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="text-base font-semibold text-slate-900">{copy.title}</h2>

        <p className="mt-2 text-sm text-slate-600">{copy.body}</p>

        <p className="mt-3 font-mono text-xs text-slate-500">
          {item.id} · v{item.versionNumber} · {item.status}
        </p>

        {copy.checksDependents && liveCount > 0 && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <ShieldAlert size={16} strokeWidth={2.25} className="mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold">
                {liveCount} live session{liveCount === 1 ? "" : "s"} depend on this item.
              </div>
              <p className="mt-1">
                The server will refuse this transition. Forcing it closes those
                sessions — the responses already collected are locked, not
                deleted.
              </p>

              {isAdmin ? (
                <label className="mt-2 flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={force}
                    onChange={(e) => setForce(e.target.checked)}
                    className="h-4 w-4 rounded border-red-300 accent-red-600"
                  />
                  Force, closing those sessions
                </label>
              ) : (
                <p className="mt-2 text-xs">
                  Only an admin can force past this.
                </p>
              )}
            </div>
          </div>
        )}

        {copy.ack && (
          <label className="mt-4 flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-slate-900"
            />
            I understand the consequences described above.
          </label>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle size={16} strokeWidth={2.25} className="mt-0.5 shrink-0" />
            <span className="break-words">{error}</span>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy || (copy.ack && !acknowledged)}
            className={`rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none ${copy.tone}`}
          >
            {busy ? "Working…" : copy.verb}
          </button>
        </div>
      </div>
    </div>
  );
}
