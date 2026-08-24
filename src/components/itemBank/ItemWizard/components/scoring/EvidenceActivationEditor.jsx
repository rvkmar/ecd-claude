// src/components/itemBank/ItemWizard/components/scoring/EvidenceActivationEditor.jsx
// ------------------------------------------------------------
// Evidence Activation Editor
//
// THE FIELD NAMES WERE WRONG, AND IT WAS FATAL.
//
// src/utils/schema.js declares each activation entry as
//     { responsePattern, activatesObservable, strengthOverride, rationale }
// This editor wrote
//     { id, condition, score, activateObservable, strengthOverride }
//
// Three of five keys differed, including both keys the validator
// requires. The consequences compounded:
//
//   * `activatesObservable` was always undefined, so every save failed
//     "Each evidenceActivationMap entry must define activatesObservable".
//   * "At least one scoring rule must activate the observable" therefore
//     also failed, always.
//   * `rationale` had NO FIELD IN THE UI AT ALL, so "Each
//     evidenceActivationMap entry must define rationale" could not be
//     satisfied by any sequence of clicks.
//
// An item with activation rules could not be saved; an item without them
// failed "Explicit evidenceActivationMap is required". There was no third
// option. The Item Bank could not accept a single item in either
// direction.
//
// The stored shape is now the declared shape, `rationale` is a first-class
// field (it is what a reviewer reads to judge whether a pattern really is
// evidence), and each rule reports its own problems inline instead of
// failing anonymously on save. Legacy records written with the old keys
// are upgraded on read by normalizeActivationMap().
// ------------------------------------------------------------

import React from "react";
import { Plus, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  newActivationRule,
  activationRuleIssues,
  responsePatternFields,
} from "../../../itemConstants";

/* Strips a trailing sentence terminator so a stored sentence can be
   embedded inside another one without doubling the punctuation. */
function sentenceFragment(text) {
  return String(text ?? "").trim().replace(/[.!?]+$/, "");
}

const inputClasses =
  "rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400";

/* A number input that keeps an empty field empty.

   `Number(e.target.value)` and `parseInt(...)` both turn a cleared field
   into 0 / NaN, so backspacing out of a score silently stored a real
   value the author never typed. */
function NumberField({ value, onChange, disabled, placeholder, className = "" }) {
  return (
    <input
      type="number"
      disabled={disabled}
      placeholder={placeholder}
      value={value ?? ""}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === "") return onChange(null);
        const parsed = Number(raw);
        onChange(Number.isFinite(parsed) ? parsed : null);
      }}
      className={`${inputClasses} ${className}`}
    />
  );
}

export default function EvidenceActivationEditor({
  observable,
  activeStatisticalModel,
  scoring,
  onChange,
  canEdit,
}) {
  const method = scoring?.method || "";
  const rules = scoring?.evidenceActivationMap || [];
  const patternFields = responsePatternFields(method);

  const updateMap = (updated) => {
    if (!canEdit) return;
    onChange({ ...scoring, evidenceActivationMap: updated });
  };

  const addRule = () => updateMap([...rules, newActivationRule()]);

  const removeRule = (id) => updateMap(rules.filter((r) => r.id !== id));

  const patchRule = (id, patch) =>
    updateMap(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const patchPattern = (id, key, value) =>
    updateMap(
      rules.map((r) =>
        r.id === id
          ? { ...r, responsePattern: { ...(r.responsePattern || {}), [key]: value } }
          : r
      )
    );

  const activatingCount = rules.filter((r) => r.activatesObservable).length;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Evidence activation rules
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Which response patterns count as evidence that the examinee
            displayed{" "}
            <span className="italic">
              {/* Observable statements are authored as sentences and
                  usually end in a full stop, so appending one produced
                  "...in the problem.." Trim before the template adds its
                  own terminator. */}
              {sentenceFragment(observable?.statement) || "this observable"}
            </span>
            .
          </p>
        </div>

        <div className="shrink-0 text-right text-xs">
          <div className="text-slate-500">
            {rules.length} rule{rules.length === 1 ? "" : "s"}
          </div>
          <div
            className={
              activatingCount > 0 ? "text-emerald-600" : "text-red-600"
            }
          >
            {activatingCount} activating
          </div>
        </div>
      </div>

      {!method && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Choose a scoring method first — the shape of a response pattern
          depends on it.
        </div>
      )}

      {method && rules.length === 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle size={16} strokeWidth={2.25} className="mt-0.5 shrink-0" />
          No rules yet. Without one, nothing a student does can ever count as
          evidence of this observable.
        </div>
      )}

      {method &&
        rules.map((rule, index) => {
          const issues = activationRuleIssues(rule, method);

          return (
            <div
              key={rule.id}
              className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Rule {index + 1}
                </span>

                {issues.length === 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <CheckCircle2 size={13} strokeWidth={2.25} />
                    Complete
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                    <AlertCircle size={13} strokeWidth={2.25} />
                    {issues.length} to fix
                  </span>
                )}
              </div>

              {/* Response pattern */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Response pattern
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  {patternFields.map((field) => {
                    const value = rule.responsePattern?.[field.key];

                    if (field.type === "boolean") {
                      return (
                        <label
                          key={field.key}
                          className="flex items-center gap-2 text-sm text-slate-700"
                        >
                          <input
                            type="checkbox"
                            disabled={!canEdit}
                            checked={value === true}
                            onChange={(e) =>
                              patchPattern(rule.id, field.key, e.target.checked)
                            }
                            className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                          />
                          {field.label}
                        </label>
                      );
                    }

                    if (field.type === "number") {
                      return (
                        <div key={field.key}>
                          <div className="mb-1 text-xs text-slate-500">
                            {field.label}
                          </div>
                          <NumberField
                            value={value}
                            disabled={!canEdit}
                            onChange={(v) => patchPattern(rule.id, field.key, v)}
                            className="w-28"
                          />
                        </div>
                      );
                    }

                    return (
                      <div key={field.key}>
                        <div className="mb-1 text-xs text-slate-500">
                          {field.label}
                        </div>
                        <input
                          type="text"
                          disabled={!canEdit}
                          value={value ?? ""}
                          onChange={(e) =>
                            patchPattern(rule.id, field.key, e.target.value)
                          }
                          className={`${inputClasses} w-48`}
                        />
                      </div>
                    );
                  })}

                  {patternFields.length === 0 && (
                    <span className="text-sm text-slate-500">
                      This scoring method declares no pattern fields.
                    </span>
                  )}
                </div>
              </div>

              {/* Score + activation */}
              <div className="flex flex-wrap items-end gap-6">
                <div>
                  <div className="mb-1 text-xs text-slate-500">Score awarded</div>
                  <NumberField
                    value={rule.score}
                    disabled={!canEdit}
                    onChange={(v) => patchRule(rule.id, { score: v ?? 0 })}
                    className="w-24"
                  />
                </div>

                <label className="flex items-center gap-2 pb-1.5 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={rule.activatesObservable === true}
                    onChange={(e) =>
                      patchRule(rule.id, { activatesObservable: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                  />
                  Counts as evidence of the observable
                </label>

                <div>
                  <div className="mb-1 text-xs text-slate-500">
                    Strength override (1–5, optional)
                  </div>
                  <NumberField
                    value={rule.strengthOverride}
                    disabled={!canEdit}
                    onChange={(v) => patchRule(rule.id, { strengthOverride: v })}
                    placeholder={
                      observable?.evidenceRule?.strengthLevel
                        ? `default ${observable.evidenceRule.strengthLevel}`
                        : "default"
                    }
                    className="w-32"
                  />
                </div>
              </div>

              {/* Rationale -- a required schema field that had no UI at all */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Rationale
                </label>
                <textarea
                  rows={2}
                  disabled={!canEdit}
                  value={rule.rationale || ""}
                  onChange={(e) => patchRule(rule.id, { rationale: e.target.value })}
                  placeholder="Why does this response pattern evidence the observable? A reviewer reads this to judge the inference."
                  className={`${inputClasses} w-full`}
                />
              </div>

              {issues.length > 0 && (
                <ul className="list-disc space-y-1 rounded-md bg-amber-50 px-5 py-3 text-xs text-amber-800">
                  {issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              )}

              {canEdit && (
                <button
                  type="button"
                  onClick={() => removeRule(rule.id)}
                  className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 size={14} strokeWidth={2} />
                  Remove rule
                </button>
              )}
            </div>
          );
        })}

      {canEdit && method && (
        <button
          type="button"
          onClick={addRule}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <Plus size={14} strokeWidth={2} />
          Add activation rule
        </button>
      )}

      {activeStatisticalModel?.type === "bayesian_network" && rules.length === 1 && (
        <p className="text-xs text-slate-500">
          A Bayesian network distinguishes states, so a single rule leaves the
          other states unmapped.
        </p>
      )}
    </div>
  );
}
