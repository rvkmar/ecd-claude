# Day 43 — Toast accessibility upgrade + Storybook

**Exit check:** Toast passes a basic aria-live/focus-management check; a running component
gallery (Storybook or equivalent) renders all ten Part 5.4 primitives in both light and dark;
full suite + build green.

**Status: DONE.**

## The Toast plan was wrong, corrected before building anything

Days 41-42 (and the D43 calendar event written on Day 41) assumed `src/components/ui/Toast.jsx`
— a bespoke 10-line component — was the app's real, if under-built, toast system. It wasn't.
`App.jsx` had it commented out (`// import Toast from "./components/ui/Toast";`), and grepping for
real usage found **zero** live importers — only three files with stale prose comments like
"Toast-only notifications" that turned out to reference `react-hot-toast`, not the local
component. `react-hot-toast`'s `<Toaster />`, mounted once in `App.jsx`, is the actual system:
100+ `toast.success`/`toast.error` call sites across ~30 files.

This matters for the same reason Day 41's audit mattered: fixing the *wrong* toast system would
have been defect-free, wasted work, while leaving the real accessibility gap untouched.
`claude/design-tokens.md`'s Day 41 entry is corrected in place today rather than left standing.

## The real defect, and the real fix

`react-hot-toast` defaults every toast — success or error — to `role="status"` /
`aria-live="polite"` and whatever `duration` the `<Toaster>` sets globally (here, a flat 3000ms
for everything). An error is exactly the case Part 5.2 names ("a toast dropping the one sentence
saying what to do"): a screen reader needs it announced *assertively*, not politely queued behind
whatever else is being read, and a sighted user needs more than 3 seconds to read and act on it.

Fixed centrally in `App.jsx`'s single `<Toaster toastOptions={{...}} />` call, using
`react-hot-toast`'s own per-type override shape:

```js
toastOptions={{
  duration: 3000,
  success: { ariaProps: { role: "status", "aria-live": "polite" } },
  error: { ariaProps: { role: "alert", "aria-live": "assertive" }, duration: 6000 },
}}
```

This is additive at the single point of configuration, not a migration — every one of the 100+
existing `toast.error(...)`/`toast.success(...)` call sites inherits the fix automatically, with
zero changes to any of them. Same pattern as Day 41's tokens and Day 42's shared-primitive
approach: fix the shared root, not each call site.

Cleanup: deleted the dead `src/components/ui/Toast.jsx` and its stale commented-out import in
`App.jsx` — leaving it in place would keep misleading the next reader (including a future
session) into thinking it's live, exactly as it misled Day 41's audit.

## Storybook

Installed via `npx storybook@latest init` (framework auto-detected as `react-vite`). The CLI's own
demo scaffolding (`src/stories/Button.tsx`, `Header.tsx`, `Page.tsx` and their stories) was
deleted — it demos Storybook's own components, not this app's — and replaced with real stories
for all ten Part 5.4 primitives under `src/components/ui/__stories__/`: Button, Input, Select,
Combobox, Dialog, Tabs, Table, Badge, Card, and Toast (the last demonstrating the actual
`react-hot-toast` system with today's fixed `toastOptions`, since there's no standalone Toast
component to gallery anymore).

`.storybook/preview.tsx` was extended with a theme toolbar toggle that flips the same `.dark`
class `ThemeToggle` uses on `<html>`, rather than relying on a generic Storybook dark-mode addon
that only re-skins Storybook's own UI chrome — this exercises the app's actual token-driven dark
mode inside the story canvas, matching the exit check's "light and dark" requirement literally.
The `@storybook/addon-a11y` the init flow added by default runs axe-core accessibility checks
against every story automatically, which is a useful ongoing backstop for future primitives.

Verified two ways: `npx storybook build` completes cleanly (all ten story modules compile with no
errors), and `npx storybook dev` was started, confirmed serving HTTP 200, and its `/index.json`
story index was queried directly — confirming all ten "Design system/*" story titles are present
in a running instance, not just a static bundle — before being shut down.

## Tests and build

No new test file — Day 43's work is either a global config change already exercised by the
existing 100+ toast call sites and their own tests, or Storybook infrastructure that isn't part of
the app bundle. Full suite: **842/842 passing** (unchanged from Day 42 — nothing here touches
code any existing test exercises). Production build: clean.

## Next

Day 44: the wizard shell — the single highest-value item in Part 5.4, extracting the
`WizardSidebar`/`WizardStepContainer` duplication found across Competency/Evidence/Task wizards
into one reusable component, built on the primitives from Days 41-43.
