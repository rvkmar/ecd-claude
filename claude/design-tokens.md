# Design tokens reference

Companion to Build Reference Part 5.4 (Foundation block). Read this before adding a new
hardcoded colour, font size, or reused layout dimension anywhere in `src/`.

## What already existed (pre-Day-1, confirmed Day 2)

Tailwind + shadcn/ui was initialized before this build plan started. Two of Part 5.4's three
token categories were already in place and are unchanged by Day 41:

- **Colour** — `src/index.css`'s `:root`/`.dark` CSS variables (`--background`, `--foreground`,
  `--primary`, `--card`, `--destructive`, `--chart-1..5`, etc.), mapped into Tailwind's `colors`
  theme in `tailwind.config.js`. Always reach for a semantic name (`bg-card`, `text-muted-foreground`)
  over a literal Tailwind neutral (`bg-white`, `text-slate-600`) in new code — literal neutrals
  don't respond to the `.dark` class at all (see the retrofit comment block in `src/index.css` for
  why that matters).
- **Light/dark** — `src/theme/ThemeProvider.jsx` + `ThemeToggle.jsx` toggle the `.dark` class on
  `<html>`; `darkMode: ["class"]` in `tailwind.config.js`.
- **Border radius** — `--radius` (0.5rem), consumed as `rounded-lg`/`rounded-md`/`rounded-sm`.

## What Day 41 added

**Type scale.** An audit (`grep -rhoE 'text-\[[0-9.]+(px|rem)\]' src/components src/pages`) found
three ad hoc pixel sizes already reinvented independently at dozens of call sites, sitting between
Tailwind's own default `text-xs` (12px) and `text-sm` (14px) steps:

| Old (arbitrary) | New named token | Value | Where it was already used |
|---|---|---|---|
| `text-[10px]` | `text-2xs` | 0.625rem / 10px | 2 sites |
| `text-[11px]` | `text-label` | 0.6875rem / 11px | 90+ sites (by far the most common non-default size in the app) |
| `text-[13px]` | `text-caption` | 0.8125rem / 13px | 4 sites |

These are declared in `tailwind.config.js`'s `theme.extend.fontSize`. **Existing call sites were
not migrated** — Part 5.3 scopes this pass against "no wholesale migration" and "backfill only
where there is a defect," and these values render correctly today. Use the named token in any
*new* code; treat migrating an existing `text-[11px]` to `text-label` as a welcome drive-by edit
the next time you're already touching that file for another reason, not a task to go do on its
own.

**Spacing.** Ordinary padding/margin/gap already consistently uses Tailwind's default 4px-grid
scale everywhere in the app — no arbitrary values turned up in the same audit, so nothing needed
adding there. The one genuinely reused arbitrary value was the wizard sidebar's width, hardcoded
identically in three separate files (`w-72` expanded / `w-[72px]` collapsed in
`CompetencyWizard/WizardSidebar.jsx`, `EvidenceWizard/WizardSidebar.jsx`,
`TaskWizard/WizardSidebar.jsx`). Named as `wizard-rail` (18rem) / `wizard-rail-collapsed` (4.5rem)
so Day 44's extracted wizard shell has one definition to import instead of a fourth copy of the
same two numbers.

## Shared components inventory (as of Day 41)

Part 5.4 calls for ten shared primitives. An audit of `src/components/ui/` found:

| Component | Status |
|---|---|
| Button, Input, Select, Tabs, Table, Badge, Card | ✅ exist (shadcn, `.tsx`, new-york style, `src/components/ui/*.tsx`) |
| Toast | ✅ **correction (Day 43):** Day 41 misidentified `src/components/ui/Toast.jsx` as the active-but-bespoke toast implementation. It was dead code — zero real importers, only a stale commented-out `import` in `App.jsx` — while `react-hot-toast`'s `<Toaster />`, mounted globally in `App.jsx`, is the actual system already driving 100+ `toast.success`/`toast.error` call sites across ~30 files. Deleted the dead file Day 43; see the Day 43 writeup for the real accessibility fix, applied to the actual system. |
| Dialog | ✅ added Day 42 (`src/components/ui/dialog.tsx`, `@radix-ui/react-dialog`) |
| Combobox | ✅ added Day 42 (`src/components/ui/combobox.tsx`, composed from new `popover.tsx` + `command.tsx`, matching shadcn's own documented pattern — there is no standalone "combobox" registry entry) |

Day 42 note: `npx shadcn add ...` couldn't be used to generate these — `ui.shadcn.com` is blocked
by this sandbox's egress allowlist (confirmed via a direct `curl`, not assumed). All three new
files (`dialog.tsx`, `popover.tsx`, `command.tsx`) were hand-written to match the exact
conventions of the existing shadcn output (`cva`/`cn`, `React.forwardRef`, the same
`data-[state=...]` animation classes, `new-york` styling) rather than approximated freehand, so a
future `shadcn add` (once network access allows it) should diff cleanly against them.

Also present, not in Part 5.4's list but already shared infrastructure: Accordion, Checkbox,
Label, Tooltip (shadcn), plus hand-built `Modal.jsx`, `Spinner.jsx`, `ErrorBoundary.jsx`,
`NavBar.jsx`, `TopBar.jsx`, `DashboardLayout.jsx`, `Footer.jsx`, `LifecycleStatusBadge.jsx`,
`InfoTooltip.jsx`, `LegacyCard.jsx`.

**Note on file extensions:** the shadcn-generated primitives are `.tsx` (from `components.json`'s
`"tsx": true`) even though the rest of this repo is plain JS/JSX with no TypeScript toolchain
otherwise configured (see root `CLAUDE.md`). They build and run fine as-is (Vite handles `.tsx`
without a separate TS project), so this is left alone rather than "fixed" — converting them to
`.jsx` is a cosmetic-consistency change, not a defect, and Part 5.3 rule 3 reserves backfills for
defects.

## The wizard shell (Day 44)

Not a token, but the largest single item in Part 5.4. The Day 41 audit assumed
`WizardSidebar.jsx`/`WizardStepContainer.jsx` were duplicated near-identically three times
(Competency/Evidence/Task). A line-by-line Day 44 diff found that was only two-thirds true:
Competency's and Evidence's pairs really were byte-identical apart from two cosmetic differences
(an adaptive Cancel/OK label, and the model name in the locked-notice text) plus prop-naming
conventions (1-based `currentStep`/`step.id` vs 0-based `currentStepIndex`/index) — a safe,
low-risk merge. Task Model's pair is not a styling variant of the same component: it reads from
`useTaskModelWizard()` context instead of props, bakes in a materially stricter/different
navigation-gating rule (forward rail-clicks are never allowed, only `Next`), renders an extra
per-step "outstanding readiness work" indicator neither other wizard has, and its
`WizardStepContainer` doubles as the step router (importing/switching `Step1..Step8` itself)
rather than just rendering externally-provided `children`.

Scope was narrowed accordingly, mirroring the same audit-before-build correction pattern as Days
41 and 43: extracted and shared `src/components/wizard/WizardSidebar.jsx` +
`WizardStepContainer.jsx` (using the Day 41 `wizard-rail`/`wizard-rail-collapsed` tokens),
re-pointed **Competency and Evidence only**, with their two cosmetic differences preserved as
`adaptiveCancelLabel`/`modelLabel` props rather than picked-a-winner-and-changed-behavior. Task
Model's (and Item's — already a known, differently-structured 4th wizard) re-pointing is
explicitly deferred: reconciling its context-driven architecture and step-routing responsibility
into this shell is a real, separately-scoped piece of work, not a Day 44 styling pass. See
`claude/day44-wizard-shell.md` for the full account.
