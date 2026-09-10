// src/components/qMatrix/QMatrixEditor.jsx
// ------------------------------------------------------------
// D51/D52 -- the Q-matrix editor. A single screen, not a multi-step
// wizard: a Q-matrix is one artifact (metadata + a grid), not a sequence
// of independent decisions, so it reuses the shared WizardStepContainer
// as a ONE-step shell purely for its already-tested Save/Review/Return-
// to-draft/Lock&Confirm button set and discard-changes modal, rather than
// reinventing that logic.
//
// Rows (items) are scoped to the selected competency model via the same
// chain useItemListData already derives elsewhere in this codebase:
// item.evidenceModelId -> evidenceModel.competencyId -> competency.modelId
// -- not the whole item bank, which would be both meaningless (most items
// have nothing to do with this construct) and unusable at scale.
//
// Only items the author explicitly adds become rows. This makes D52's
// "no all-zero rows" rule meaningful: a row that exists is a real
// authoring decision, so a row with nothing checked is genuinely a
// mistake, not just an unaddressed item sitting in a large bank.
// ------------------------------------------------------------

import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import WizardStepContainer from "@/components/wizard/WizardStepContainer";
import QMatrixGrid from "./QMatrixGrid";
import { computeQMatrixValidity } from "./QMatrixValidity";

import { apiErrorMessage } from "@/api/apiClient";
import { useCompetencyModels, useCompetencies } from "@/api/queries/competencies";
import { useEvidenceModels } from "@/api/queries/evidenceModels";
import { useItems } from "@/api/queries/items";
import {
  useQMatrixModel,
  useCreateQMatrixModel,
  useUpdateQMatrixModel,
  useTransitionQMatrixModel,
} from "@/api/queries/qMatrixModels";

const emptyDraft = () => ({
  id: undefined,
  name: "",
  description: "",
  competencyModelId: "",
  competencyModelVersion: undefined,
  attributeIds: [],
  entries: [],
  status: "draft",
  locked: false,
});

export default function QMatrixEditor({ qMatrixId, onCancel, onSaved }) {
  const isEditing = Boolean(qMatrixId);
  const { data: existing, isLoading: loadingExisting } = useQMatrixModel(qMatrixId, {
    enabled: isEditing,
  });

  const { data: competencyModels = [] } = useCompetencyModels();
  const { data: items = [] } = useItems();
  const { data: evidenceModels = [] } = useEvidenceModels();
  const { data: competencies = [] } = useCompetencies();

  const [draft, setDraft] = useState(emptyDraft());
  const [includedItemIds, setIncludedItemIds] = useState([]);
  const [isDirty, setIsDirty] = useState(false);

  // `draft.id` is also mirrored into this ref, updated synchronously
  // wherever `draft` changes. `transitionTo()` reads the ref rather than
  // `draft.id` so it never sees a stale value: `handleSave()` in
  // WizardStepContainer awaits onSaveDraft() then calls onSaveAndReview()
  // using the SAME closures captured at the render that created them --
  // React hasn't necessarily re-rendered (and hasn't necessarily even run
  // the commit's effects) by the time the second call happens, so a plain
  // `draft.id` read here can still be `undefined` for a brand-new record
  // even though persist() already saved it and got a real id back.
  const draftIdRef = useRef(draft.id);

  useEffect(() => {
    if (isEditing && existing) {
      setDraft(existing);
      draftIdRef.current = existing.id;
      setIncludedItemIds(Array.from(new Set((existing.entries || []).map((e) => e.itemId))));
      setIsDirty(false);
    }
  }, [isEditing, existing]);

  const createMutation = useCreateQMatrixModel();
  const updateMutation = useUpdateQMatrixModel();
  const transitionMutation = useTransitionQMatrixModel();

  const competencyModel = competencyModels.find((m) => m.id === draft.competencyModelId);
  const availableAttributes = (competencyModel?.smVariables || []).filter(
    (v) => v.type === "binary"
  );

  const scopedItems = useMemo(() => {
    if (!draft.competencyModelId) return [];
    const emById = new Map(evidenceModels.map((e) => [e.id, e]));
    const compById = new Map(competencies.map((c) => [c.id, c]));
    return items.filter((item) => {
      const em = emById.get(item.evidenceModelId);
      const comp = em ? compById.get(em.competencyId) : undefined;
      return comp?.modelId === draft.competencyModelId;
    });
  }, [items, evidenceModels, competencies, draft.competencyModelId]);

  const includedItems = includedItemIds
    .map((id) => items.find((it) => it.id === id))
    .filter(Boolean);

  const availableToAdd = scopedItems.filter((it) => !includedItemIds.includes(it.id));

  const validity = useMemo(
    () =>
      computeQMatrixValidity({
        attributeIds: draft.attributeIds,
        includedItems,
        entries: draft.entries,
      }),
    [draft.attributeIds, includedItems, draft.entries]
  );

  const locked = draft.locked === true;

  function patchDraft(patch) {
    setDraft((d) => ({ ...d, ...patch }));
    setIsDirty(true);
  }

  function toggleAttribute(attrId) {
    if (locked) return;
    const has = draft.attributeIds.includes(attrId);
    patchDraft({
      attributeIds: has
        ? draft.attributeIds.filter((a) => a !== attrId)
        : [...draft.attributeIds, attrId],
      // Dropping an attribute also drops any entries that pointed at it --
      // otherwise a re-added attribute would resurrect stale cells.
      entries: has ? draft.entries.filter((e) => e.attributeId !== attrId) : draft.entries,
    });
  }

  function addItem(itemId) {
    if (locked || !itemId || includedItemIds.includes(itemId)) return;
    setIncludedItemIds((ids) => [...ids, itemId]);
    setIsDirty(true);
  }

  function removeItem(itemId) {
    if (locked) return;
    setIncludedItemIds((ids) => ids.filter((id) => id !== itemId));
    patchDraft({ entries: draft.entries.filter((e) => e.itemId !== itemId) });
  }

  function toggleCell(itemId, attributeId) {
    if (locked) return;
    const exists = draft.entries.some(
      (e) => e.itemId === itemId && e.attributeId === attributeId
    );
    patchDraft({
      entries: exists
        ? draft.entries.filter((e) => !(e.itemId === itemId && e.attributeId === attributeId))
        : [...draft.entries, { itemId, attributeId }],
    });
  }

  // Save (draft -> reviewed) requires reviewed-level completeness, AND zero
  // D52 blocking errors (currently just "empty-row"). This second part
  // isn't optional: an item included with no checked attribute cells
  // produces zero `entries[]` rows, so the server has nothing to persist
  // for it -- `includedItemIds` on reload is derived purely from
  // `entries[].itemId` (see the load effect above). If a draft/reviewed
  // save were allowed to go through with an empty row still on the grid,
  // that item would silently disappear from the matrix (taking its
  // still-unresolved "requires no attributes" error with it) the next
  // time this record is reopened, with no warning it ever happened. Since
  // the data model has no way to represent "item included, zero
  // attributes" at rest, the only honest fix is to block the save itself
  // until the author resolves or removes the row -- matching rule 1's own
  // BLOCKING severity (see QMatrixValidity.js) rather than only enforcing
  // it at confirm time.
  // Lock & Confirm additionally requires at least one entry -- matching
  // the server's own confirmed-level lifecycle check.
  const meetsReviewed = Boolean(
    draft.name &&
      draft.competencyModelId &&
      draft.attributeIds.length > 0 &&
      validity.errors.length === 0
  );
  const meetsConfirmed = meetsReviewed && draft.entries.length > 0;
  const canProceed = draft.status === "reviewed" ? meetsConfirmed : meetsReviewed;

  async function persist() {
    const payload = {
      name: draft.name,
      description: draft.description,
      competencyModelId: draft.competencyModelId,
      competencyModelVersion: competencyModel?.versionNumber,
      attributeIds: draft.attributeIds,
      entries: draft.entries,
    };

    try {
      const saved = draft.id
        ? await updateMutation.mutateAsync({ id: draft.id, payload })
        : await createMutation.mutateAsync(payload);
      setDraft(saved);
      draftIdRef.current = saved.id;
      setIsDirty(false);
      return saved;
    } catch (err) {
      toast.error(apiErrorMessage(err, "Save failed."));
      return null;
    }
  }

  async function saveDraft() {
    const saved = await persist();
    return Boolean(saved);
  }

  async function transitionTo(status, successMessage, failureMessage) {
    const id = draftIdRef.current;
    if (!id) return;
    try {
      const saved = await transitionMutation.mutateAsync({ id, status });
      setDraft(saved);
      draftIdRef.current = saved.id;
      setIsDirty(false);
      toast.success(successMessage);
      return saved;
    } catch (err) {
      toast.error(apiErrorMessage(err, failureMessage));
      return null;
    }
  }

  async function saveAndReview() {
    const saved = await transitionTo(
      "reviewed",
      "Q-matrix saved for review.",
      "Could not save for review."
    );
    if (saved) onSaved?.(saved);
  }

  async function confirmMatrix() {
    const saved = await transitionTo(
      "confirmed",
      "Q-matrix confirmed and locked.",
      "Confirmation failed."
    );
    if (saved) onSaved?.(saved);
  }

  async function returnToDraft() {
    await transitionTo("draft", "Q-matrix returned to draft.", "Could not return to draft.");
  }

  if (isEditing && loadingExisting) {
    return <div className="p-8 text-sm text-slate-500">Loading Q-matrix…</div>;
  }

  return (
    <WizardStepContainer
      step={1}
      totalSteps={1}
      isLast
      onCancel={onCancel}
      canProceed={canProceed}
      locked={locked}
      status={draft.status}
      isDirty={isDirty}
      onSaveDraft={saveDraft}
      onSaveAndReview={saveAndReview}
      onConfirm={confirmMatrix}
      onReturnToDraft={returnToDraft}
      modelLabel="Q-Matrix"
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-label font-medium text-slate-600">Name</label>
            <Input
              value={draft.name}
              disabled={locked}
              onChange={(e) => patchDraft({ name: e.target.value })}
              placeholder="e.g. Fractions Diagnostic Q-Matrix"
            />
          </div>
          <div>
            <label className="text-label font-medium text-slate-600">Competency Model</label>
            <Combobox
              options={competencyModels.map((m) => ({ value: m.id, label: m.name }))}
              value={draft.competencyModelId}
              onValueChange={(value) => {
                if (locked) return;
                const model = competencyModels.find((m) => m.id === value);
                setIncludedItemIds([]);
                patchDraft({
                  competencyModelId: value,
                  competencyModelVersion: model?.versionNumber,
                  attributeIds: [],
                  entries: [],
                });
              }}
              placeholder="Select a competency model…"
              disabled={locked || Boolean(draft.id)}
            />
          </div>
        </div>

        <div>
          <label className="text-label font-medium text-slate-600">Description</label>
          <Input
            value={draft.description || ""}
            disabled={locked}
            onChange={(e) => patchDraft({ description: e.target.value })}
          />
        </div>

        {draft.competencyModelId && (
          <>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Attributes (binary Student Model Variables)
              </h3>
              {availableAttributes.length === 0 ? (
                <p className="mt-1 text-caption text-slate-500">
                  This competency model declares no binary Student Model Variables yet.
                </p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {availableAttributes.map((attr) => (
                    <label
                      key={attr.id}
                      className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-caption ${
                        draft.attributeIds.includes(attr.id)
                          ? "border-blue-400 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={draft.attributeIds.includes(attr.id)}
                        disabled={locked}
                        onChange={() => toggleAttribute(attr.id)}
                      />
                      {attr.label}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {draft.attributeIds.length > 0 && (
              <div>
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-semibold text-slate-800">Items</h3>
                  {!locked && availableToAdd.length > 0 && (
                    <Combobox
                      options={availableToAdd.map((it) => ({ value: it.id, label: it.id }))}
                      value=""
                      onValueChange={addItem}
                      placeholder="+ Add item…"
                      className="w-56"
                    />
                  )}
                </div>

                <QMatrixGrid
                  attributes={draft.attributeIds
                    .map((id) => availableAttributes.find((a) => a.id === id))
                    .filter(Boolean)}
                  items={includedItems}
                  entries={draft.entries}
                  onToggleCell={toggleCell}
                  onRemoveItem={removeItem}
                  readOnly={locked}
                  rowErrors={validity.errors}
                  columnAdvisories={validity.advisories}
                />
              </div>
            )}

            {(validity.errors.length > 0 || validity.advisories.length > 0) && (
              <div className="space-y-1.5">
                {validity.errors.map((e, i) => (
                  <p key={`err-${i}`} className="text-caption text-red-700">
                    ⚠ {e.message}
                  </p>
                ))}
                {validity.advisories.map((a, i) => (
                  <p key={`adv-${i}`} className="text-caption text-amber-700">
                    ⓘ {a.message}
                  </p>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </WizardStepContainer>
  );
}
