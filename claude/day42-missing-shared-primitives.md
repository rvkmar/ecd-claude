# Day 42 — Missing shared primitives: Dialog and Combobox

**Exit check:** Dialog and Combobox exist under `src/components/ui`, keyboard-navigable and
focus-trapped (Radix defaults), styled from the existing token set (no new hardcoded colours); a
smoke test renders each; full suite + build green.

**Status: DONE.**

## What was built

Of Part 5.4's ten shared components, Day 41's audit found two genuinely missing: **Dialog** and
**Combobox**. Both added today as standard Radix-based primitives, matching the existing
`components.json` configuration (new-york style, neutral base colour, CSS variables, `.tsx`):

- `src/components/ui/dialog.tsx` — `@radix-ui/react-dialog`, wrapping Root/Trigger/Portal/
  Overlay/Content/Header/Footer/Title/Description, with the standard built-in close button.
- `src/components/ui/popover.tsx` — `@radix-ui/react-popover`. Not one of Part 5.4's ten named
  components, but shadcn has no standalone "combobox" registry entry — their own docs compose it
  from Popover + Command + Button, so this is a prerequisite, not scope creep.
- `src/components/ui/command.tsx` — the `cmdk` command-palette primitive, same composition.
- `src/components/ui/combobox.tsx` — the actual Combobox: a generalised, reusable component
  (`options`/`value`/`onValueChange`/`placeholder` props) built on the three above, rather than a
  copy-pasted example per call site — this is a *shared component* per Part 5.4, not a one-off
  pattern to be reinvented at each future use.

New dependencies: `@radix-ui/react-dialog`, `@radix-ui/react-popover`, `cmdk`.

## A network gap, confirmed rather than assumed

`npx shadcn add dialog popover command` was tried first — it's how the other seven primitives in
this repo were originally generated, and using it would guarantee byte-for-byte consistency. It
failed; a direct `curl` to `ui.shadcn.com` confirmed a 403 from this sandbox's egress proxy, not a
transient failure. All three new primitive files were hand-written instead, matching the existing
files' conventions exactly (same `cva`/`cn` usage, same `React.forwardRef` + `displayName`
pattern, same `data-[state=...]` Radix animation classes) so they should diff cleanly against a
real `shadcn add` output whenever network access allows one, rather than drifting from the
established style.

## Two jsdom gaps discovered by testing, not assumed away

Writing a smoke test for the new Combobox surfaced two jsdom limitations neither `cmdk` nor Radix
work around themselves: no `ResizeObserver` at all, and `scrollIntoView` throwing rather than
being a harmless no-op. Both are exactly the class of gap `src/test/setup.js` already exists to
patch (it already sets `JWT_SECRET` for a similar "the real environment has this, jsdom doesn't"
reason) — added two minimal stubs there rather than working around them per-test-file, since any
future cmdk-based test would hit the identical failure otherwise.

## Tests

New: `src/components/ui/__tests__/dialogAndCombobox.test.jsx` — 4 tests. Deliberately minimal,
matching this repo's existing convention (none of the seven pre-existing shadcn primitives carry
component tests either): Dialog opens on trigger click and closes on its built-in close button;
Combobox shows a placeholder vs. the selected option's label, opens its list on click, and reports
the chosen value back to the caller via `onValueChange`. Full accessibility semantics (focus trap,
keyboard nav, ARIA) are Radix's own responsibility and covered by Radix's own test suite — using
the primitive rather than reimplementing it is what buys that for free.

Full suite: **842/842 passing** (up from 838). Production build clean.

## Next

Day 43: bring `Toast.jsx` up to the same accessibility standard as the other primitives, and set
up Storybook or a lighter equivalent covering all ten Part 5.4 primitives.
