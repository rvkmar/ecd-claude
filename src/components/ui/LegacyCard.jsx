// src/components/ui/LegacyCard.jsx
//
// Renamed from Card.jsx. That name collided with src/components/ui/card.tsx
// (the real shadcn/ui Card with named Card/CardHeader/CardTitle/CardContent/
// CardFooter exports, used by ~7 other components) on case-insensitive
// filesystems (Windows, default macOS). "@/components/ui/card" would
// resolve to whichever of the two files the bundler's extension-resolution
// order picked first — on Windows that was this file, which only has a
// default export, so every named import of Card/CardHeader/etc. failed
// with "No matching export" as soon as Vite had to re-scan dependencies.
// It never surfaced in Linux-based testing because Linux filesystems are
// case-sensitive, so "card" + ".jsx" (this file, capitalized) and
// "card" + ".tsx" (the real one) never collided there.
//
// Only src/components/tasks/TaskDetails.jsx used this simple
// title/children/actions default-export version; it's kept under this
// new name rather than merged into card.tsx since its API shape
// (title/actions props) is different from the shadcn compound-component
// pattern the rest of the app uses.
import React from "react";

export default function LegacyCard({ title, children, actions }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex justify-between items-center mb-2">
        {title && <h2 className="text-2xl font-bold">{title}</h2>}
        {actions}
      </div>
      {children}
    </div>
  );
}
