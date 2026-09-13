// steps/Step3StoppingRules.jsx -- D54 Step 3: minItems / maxItems /
// targetsMet. Mirrors schema.js's assemblyModels stoppingRules validation
// (src/utils/schema.js ~line 4352): at least one of the three must be
// declared, maxItems/minItems must be positive, and minItems must not
// exceed maxItems.

import React from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAssemblyModelWizard } from "../AssemblyModelWizardContext";

export default function Step3StoppingRules() {
  const { draft, patchStoppingRules } = useAssemblyModelWizard();
  const locked = draft.locked;
  const sr = draft.stoppingRules || {};

  const minExceedsMax =
    typeof sr.minItems === "number" && typeof sr.maxItems === "number" && sr.minItems > sr.maxItems;

  function toNumberOrUndefined(value) {
    return value === "" ? undefined : Number(value);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Stopping Rules</h2>
        <p className="mt-1 text-sm text-slate-500">
          Declare at least one rule governing when a session built on this
          Assembly Model may stop. Required before confirmation.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-600">Minimum items</label>
          <Input
            type="number"
            min="1"
            disabled={locked}
            value={sr.minItems ?? ""}
            onChange={(e) => patchStoppingRules({ minItems: toNumberOrUndefined(e.target.value) })}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600">Maximum items</label>
          <Input
            type="number"
            min="1"
            disabled={locked}
            value={sr.maxItems ?? ""}
            onChange={(e) => patchStoppingRules({ maxItems: toNumberOrUndefined(e.target.value) })}
          />
        </div>
      </div>

      {minExceedsMax && (
        <p className="text-sm text-red-600">
          Minimum items cannot exceed maximum items.
        </p>
      )}

      <label className="flex items-center gap-2">
        <Checkbox
          checked={Boolean(sr.targetsMet)}
          disabled={locked}
          onCheckedChange={(v) => patchStoppingRules({ targetsMet: Boolean(v) })}
        />
        <span className="text-sm text-slate-700">
          Stop once every declared SMV target (Step 2) has been scored and met
        </span>
      </label>

      {sr.maxItems === undefined && sr.minItems === undefined && sr.targetsMet === undefined && (
        <p className="text-sm text-amber-600">
          At least one stopping rule is required before this model can be
          confirmed.
        </p>
      )}
    </div>
  );
}
