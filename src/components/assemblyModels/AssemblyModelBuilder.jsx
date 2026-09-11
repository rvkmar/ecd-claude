// src/components/assemblyModels/AssemblyModelBuilder.jsx
// D54 -- top-level shell: List <-> Wizard. Mirrors QMatrixModelBuilder.jsx
// (no Dashboard sub-tab -- nothing in D54's scope calls for one).
// Mounted at /admin/assembly-models (see App.jsx).

import React, { useState } from "react";

import AssemblyModelList from "./AssemblyModelList";
import AssemblyModelWizard from "./AssemblyModelWizard/AssemblyModelWizard";
import { AssemblyModelWizardProvider } from "./AssemblyModelWizard/AssemblyModelWizardContext";

export default function AssemblyModelBuilder() {
  const [view, setView] = useState({ mode: "list" }); // { mode: "list" } | { mode: "wizard", id?: string }

  if (view.mode === "wizard") {
    return (
      <AssemblyModelWizardProvider
        assemblyModelId={view.id}
        onSaved={() => setView({ mode: "list" })}
      >
        <AssemblyModelWizard onCancel={() => setView({ mode: "list" })} />
      </AssemblyModelWizardProvider>
    );
  }

  return (
    <AssemblyModelList
      onCreate={() => setView({ mode: "wizard" })}
      onEdit={(id) => setView({ mode: "wizard", id })}
    />
  );
}
