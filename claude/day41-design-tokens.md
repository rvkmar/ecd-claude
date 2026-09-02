# Day 41 — Design tokens (colour, spacing, type scale, light/dark)

**Exit check (this session's Week 9 plan, authored today from Build Reference Part 5.4):**
`tailwind.config.js` declares fontSize and spacing tokens (not just colour/radius); a short
design-tokens reference doc exists; full suite + build still green; nothing visually regresses
(additive only, no existing utility classes changed).

**Status: DONE.**

## Context: Week 9 didn't have a day-by-day plan yet

Day 40's handoff confirmed W9 (design system) scope was unchanged from Build Reference Part 5.4,
but no Days 41-45 breakdown existed yet in the build reference or on the calendar — only the
5.4 paragraph describing the ~4-6 dev-day "Foundation block" in general terms. Before starting
Day 41's actual work, I authored and scheduled Days 41-45 (calendar events created on the
`ecd-claude` calendar, matching the existing event format), informed by an audit of the repo's
actual state rather than assuming a blank slate. See each day's calendar event for its own
tasks/model/exit-check; summary:

- **D41** (today): design tokens
- **D42**: missing shared primitives (Dialog, Combobox)
- **D43**: Toast accessibility upgrade + Storybook or equivalent
- **D44**: the wizard shell as a reusable component (Opus/high, per Part 5.4)
- **D45**: W9 walkthrough + handoff, closing the week

## The audit that changed the plan

The naive assumption — "Week 9 builds a design system from scratch" — turned out to be wrong.
Tailwind + shadcn/ui was initialized before this build plan started (confirmed Day 2), so:

- Colour tokens (CSS variables in `src/index.css`, mapped in `tailwind.config.js`) already exist.
- A light/dark toggle (`src/theme/ThemeProvider.jsx`/`ThemeToggle.jsx`, `darkMode: ["class"]`)
  already exists, including a retrofit layer remapping literal Tailwind neutrals onto the
  semantic tokens for older screens.
- 7 of Part 5.4's 10 shared primitives already exist as shadcn components.

This is exactly the situation Part 5.3's scoping rules exist for: "no wholesale migration,"
"backfill only where there is a defect." Redoing already-working, already-token-based colour and
theming infrastructure would have been wasted, defect-free work. The real gaps, found by grepping
the codebase rather than assuming:

1. No declared type scale or spacing scale in `tailwind.config.js` — only colour and radius were
   ever formalized as tokens.
2. Dialog and Combobox don't exist anywhere in the repo (Day 42).
3. `Toast.jsx` is a bespoke 10-line component, not the shadcn/Radix pattern (Day 43).
4. No Storybook or component gallery (Day 43).
5. `WizardSidebar.jsx`/`WizardStepContainer.jsx` are duplicated near-identically three times
   across Competency/Evidence/Task wizards — exactly the "you have built this four times"
   duplication Part 5.4 names explicitly, and the single highest-value item in the whole
   Foundation block (Day 44).

## What was built today

- `tailwind.config.js`: added `theme.extend.fontSize` (`2xs`/`label`/`caption`, matching three
  ad hoc pixel sizes — 10px/11px/13px — already reinvented at 90+ call sites across the app) and
  `theme.extend.spacing` (`wizard-rail`/`wizard-rail-collapsed`, matching the wizard sidebar's
  `w-72`/`w-[72px]` width, duplicated identically in three files and about to be consumed by
  Day 44's extracted shell).
- `claude/design-tokens.md`: the token reference — what already existed, what was added today and
  why, the full primitives inventory, and a named pointer to the Day 44 wizard-shell work.
- Deliberately **not** migrated: the 90+ existing `text-[11px]` call sites (and similar). These
  aren't defects — they render correctly — so migrating them today would have been exactly the
  "wholesale migration" Part 5.3 warns against. Left as a documented, welcome drive-by edit for
  whenever those files are next touched for another reason.

Verification: full suite **838/838 passing**; production build clean, output CSS byte-identical
to before (confirms the change is additive-only — Tailwind only compiles a token into real CSS
once something actually references it, and nothing does yet).

## Next

Day 42: add the two missing shared primitives, Dialog and Combobox, as standard shadcn components
matching the existing `components.json` configuration.
