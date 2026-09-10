// src/components/qMatrix/QMatrixModelBuilder.jsx
// ------------------------------------------------------------
// D51 -- top-level shell: List <-> Editor. No Dashboard sub-tab (unlike
// CompetencyModelBuilder/TaskModelBuilder) since nothing in D51's exit
// check calls for one; adding it now would be speculative.
// ------------------------------------------------------------

import React, { useState } from "react";

import QMatrixList from "./QMatrixList";
import QMatrixEditor from "./QMatrixEditor";

export default function QMatrixModelBuilder() {
  const [view, setView] = useState({ mode: "list" }); // { mode: "list" } | { mode: "editor", id?: string }

  if (view.mode === "editor") {
    return (
      <QMatrixEditor
        qMatrixId={view.id}
        onCancel={() => setView({ mode: "list" })}
        onSaved={() => setView({ mode: "list" })}
      />
    );
  }

  return (
    <QMatrixList
      onCreate={() => setView({ mode: "editor" })}
      onEdit={(id) => setView({ mode: "editor", id })}
    />
  );
}
