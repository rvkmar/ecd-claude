// Step6WorkspaceLayout.jsx
// 🧠 Enterprise ECD — Statistical Model Workspace Layout

import React from "react";

export default function Step6WorkspaceLayout({

    left,
    right

}) {

    return (

        <div className="grid grid-cols-4 gap-6">

            {/* Authoring Workspace */}

            <div className="col-span-4 space-y-6">

                {left}

            </div>

            {/* Diagnostics Panel */}

            <div className="space-y-6">

                {right}

            </div>

        </div>

    );

}