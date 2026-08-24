// src/components/itemBank/ItemWizard/steps/Step3Stimulus.jsx
// ------------------------------------------------------------
// Step 3 — Stimulus
//
// Thin orchestration over StimulusBlockEditor. The only substantive
// change from the step it replaces is that the layout is now authored
// (schema declares stimulus.layout with three values and nothing ever
// set it away from "single") and the emptiness of the block list is
// surfaced here rather than only as a warning eight steps later.
// ------------------------------------------------------------

import React from "react";
import { Lock, AlertTriangle } from "lucide-react";
import { useItemWizard } from "../ItemWizardContext";
import StimulusBlockEditor from "../components/StimulusBlockEditor";

export default function Step3Stimulus() {
  const { item, replaceObject, canEdit } = useItemWizard();

  const stimulus = item.stimulus || { layout: "single", blocks: [] };
  const blocks = stimulus.blocks || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Stimulus</h2>
        <p className="mt-1 text-sm text-slate-500">
          What the examinee is presented with. The stimulus has to be able to
          provoke the observable this item elicits — a passage cannot evidence
          a computation.
        </p>
      </div>

      {!canEdit && (
        <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-600">
          <Lock size={16} strokeWidth={2.25} className="mt-0.5 shrink-0" />
          The stimulus is frozen. Clone the item to change it.
        </div>
      )}

      {/* The layout selector lives in StimulusBlockEditor, which owns the
          stimulus object. This step briefly carried a second one -- two
          independent controls writing `stimulus.layout` with different
          labels ("Layout" / "Layout Type") and different option wording
          ("Single block" / "Single"), with no synchronisation shown to the
          author. One field, one control. */}

      {blocks.length === 0 && canEdit && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-800">
          <AlertTriangle size={16} strokeWidth={2.25} className="mt-0.5 shrink-0" />
          No stimulus blocks yet. An item can be saved as a draft without one,
          but not confirmed — there would be nothing to present.
        </div>
      )}

      <StimulusBlockEditor
        stimulus={stimulus}
        onChange={(updated) => canEdit && replaceObject("stimulus", updated)}
        canEdit={canEdit}
      />
    </div>
  );
}
