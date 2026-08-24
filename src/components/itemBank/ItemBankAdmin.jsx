// src/components/itemBank/ItemBankAdmin.jsx
// ------------------------------------------------------------
// Item Bank admin shell.
//
// The three tabs were "Dashboard", "Item Bank Structure" and "Operate
// Item" — the last two being two overlapping list views of the same
// collection, with different columns, different filters and a different
// (in one case empty) set of governance actions, so which actions a user
// had depended on which tab they happened to open. They are kept as two
// deliberately different lenses now — Structure reads, Authoring acts —
// and Structure hands off to the authoring surface instead of navigating
// to a route that does not exist.
// ------------------------------------------------------------

import React, { useState } from "react";
import AdminDashboard from "./AdminDashboard";
import ItemList from "./ItemList";
import ItemBuilder from "./ItemBuilder";
import ItemWizard from "./ItemWizard/ItemWizard";
import { Button } from "@/components/ui/button";

const TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "structure", label: "Bank structure" },
  { key: "authoring", label: "Authoring" },
];

export default function ItemBankAdmin() {
  const [view, setView] = useState("dashboard");
  const [inspecting, setInspecting] = useState(null);

  // Opening an item from the structure table mounts the wizard directly
  // rather than routing. A locked item opens read-only; the wizard
  // handles that itself.
  if (inspecting) {
    return (
      <ItemWizard item={inspecting} onClose={() => setInspecting(null)} />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex gap-3 border-b pb-4">
        {TABS.map((tab) => (
          <Button
            key={tab.key}
            variant={view === tab.key ? "default" : "outline"}
            onClick={() => setView(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div>
        {view === "dashboard" && <AdminDashboard />}
        {view === "structure" && <ItemList onOpenItem={setInspecting} />}
        {view === "authoring" && <ItemBuilder />}
      </div>
    </div>
  );
}
