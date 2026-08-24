// src/theme/ThemeProvider.jsx
// ------------------------------------------------------------
// Activates the light/dark CSS-variable scaffold that already exists in
// src/index.css (:root and .dark) and tailwind.config.js (darkMode:
// ["class"]) but was never wired up to anything -- nothing ever toggled
// the .dark class, so the whole app has only ever rendered in light mode.
// ------------------------------------------------------------

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const ThemeContext = createContext(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside a ThemeProvider");
  }
  return ctx;
}

const STORAGE_KEY = "ecd_theme_v1";
const MODES = ["light", "dark", "system"];

function systemPrefersDark() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function resolveMode(mode) {
  return mode === "system" ? (systemPrefersDark() ? "dark" : "light") : mode;
}

function applyResolvedMode(resolved) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return MODES.includes(stored) ? stored : "system";
    } catch {
      return "system";
    }
  });

  const [resolved, setResolved] = useState(() => resolveMode(mode));

  const setMode = useCallback((next) => {
    if (!MODES.includes(next)) return;
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private-browsing/storage-disabled -- theme just won't persist across
      // reloads, not worth surfacing an error for.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(resolveMode(mode) === "dark" ? "light" : "dark");
  }, [mode, setMode]);

  // Apply whenever the chosen mode changes, and re-resolve if it's "system"
  // and the OS-level preference changes while the app is open.
  useEffect(() => {
    const apply = () => {
      const r = resolveMode(mode);
      setResolved(r);
      applyResolvedMode(r);
    };
    apply();

    if (mode !== "system" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => apply();
    mql.addEventListener?.("change", handler);
    return () => mql.removeEventListener?.("change", handler);
  }, [mode]);

  const value = {
    mode, // "light" | "dark" | "system" -- the user's stored preference
    resolvedTheme: resolved, // "light" | "dark" -- what's actually applied
    setMode,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
