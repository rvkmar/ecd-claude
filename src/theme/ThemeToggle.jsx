// src/theme/ThemeToggle.jsx
//
// Compact light/dark/system switcher. Used both in the TopBar (quick access)
// and inline on the Settings > Appearance page (with labels).

import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "./ThemeProvider";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export default function ThemeToggle({ showLabels = false, className = "" }) {
  const { mode, setMode } = useTheme();

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1 ${className}`}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = mode === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            aria-pressed={active}
            title={label}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon size={14} />
            {showLabels && <span>{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
