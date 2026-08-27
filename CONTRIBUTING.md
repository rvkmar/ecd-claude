# Contributing

## Branching convention: branch-per-phase

Work is organized by build phase, not by ticket. One branch per phase of the
active build plan (see the `ecd-claude` Google Calendar / `ecd-build-reference.md`
for the phase list), named `phase/<short-name>` (e.g. `phase/evidence-identification`,
`phase/rbac-sweep`). Land a phase's work as one or more PRs into `main`, then
delete the branch. Avoid long-lived feature branches that span multiple phases —
they drift from `main` and make the seven-artefact contract (below) harder to
verify in one sitting.

`main` is the deployable branch. Do not commit directly to it for anything but
trivial fixes (docs, config) — open a PR from a phase branch instead.

## The seven-artefact contract

Every ECD entity (competency model, evidence model, task model, item, and any
new core entity such as `assemblyModels`) is not "done" until all seven of these
exist. Each item on this list exists because its absence has already caused a
specific, documented failure in this codebase — skipping one is not a shortcut,
it's a deferred bug.

1. **Schema block** — the entity's field shape lives in `src/utils/schema.js`,
   documented inline. This is the single source of truth for entity shape.
2. **Two-mode validation** — `validateEntity(collection, obj, db, options)` must
   support a lenient mode for drafts and a strict mode for promotion. Bulk
   imports use `allowDraftParents`; single-entity wizards never do.
3. **Lifecycle matrix entry + promotion validator** — add the entity's legal
   transitions to `server/utils/lifecycleMatrix.js` (`STATUS`, `TRANSITIONS`,
   `canTransition`) and a corresponding `validate<Entity>Lifecycle()` in
   `server/utils/lifecycleValidation.js`. Reuse the existing five-status model;
   never hardcode a second copy of status transitions elsewhere.
4. **Routes with a declared role gate, mirrored in `rolePermissions.js`** —
   every route file mounts its own `authenticateToken` plus per-route
   `authorizeRole([...])` (`server/utils/authMiddleware.js`). There is no global
   auth gate, so a new route file with no gate is open to any caller. The
   equivalent frontend gate must be added to `src/config/rolePermissions.js`
   (`can(role, action, entity)`) — the two are not derived from each other and
   have drifted before (`items` and the `student` role were each missing from
   one side at different points).
5. **Constants in the shared vocabulary module** — enums and compatibility
   rules (e.g. which `interaction.type` values are valid for which
   `scoring.method`) go in `src/utils/ecdVocabulary.js`, imported by both
   `schema.js` and any server code that needs them. Don't re-derive
   compatibility with a direct string-equality check against a second enum.
6. **Readiness function plus advisory mirror, with a test asserting they
   agree** — if a client-side "is this ready to promote" advisory exists
   alongside a server-side promotion validator, write a test that fails if the
   two diverge. A mirror without a drift test is a mirror that will silently
   drift.
7. **Structure and HTTP tests** — Vitest coverage for the entity's shape
   (`src/**/*.test.{js,jsx}` or `server/**/*.test.{js,jsx}`) and its routes
   (`supertest` against the Express app). See `server/routes/__tests__/` and
   `src/components/itemBank/__tests__/` for the existing pattern.

## Three invariants

- Derived fields are recomputed server-side on every write, never trusted from
  a client.
- One pointer validated on both sides beats the same fact stored twice.
- Gating is per-step, never global.

## Verification

Static checks (build, tests) prove the code is coherent with itself. Only a
browser pass against real seed data proves it's coherent with the data —
budget one per entity, and don't let the session that wrote a module be the
only one that verifies it.

Psychometric code (IRT, DINA/G-DINA) is verified against published benchmarks,
not its own unit tests — e.g. `mirt`'s `LSAT7` for IRT, `GDINA`'s `sim10GDINA`
for diagnostics.

Migrations always ship with a dry-run mode and a recorded version.

## Styling stack

This app uses **Tailwind CSS + shadcn/ui**, not a CSS-in-JS or CSS-modules
approach. Evidence:

- `tailwind.config.js` defines the design tokens (colors, radii, keyframes)
  consumed via CSS variables in `src/index.css`.
- `components.json` is a shadcn/ui config (`ui.shadcn.com` schema) pointing at
  `src/components/ui` — that directory mixes generated shadcn primitives
  (`button.tsx`, `card.tsx`, `select.tsx`, ...) with hand-written app
  components (`NavBar.jsx`, `Modal.jsx`, ...).
- `class-variance-authority`, `clsx`, `tailwind-merge`, and `tailwindcss-animate`
  are all present — the standard shadcn/ui dependency set.
- No CSS modules (`*.module.css`) and no `styled-components` usage exist
  anywhere in `src/`.

New components should use Tailwind utility classes and, where a primitive is
needed, generate it through shadcn (`src/components/ui`) rather than hand-rolling
CSS or introducing a second styling approach.

Note: `src/style.css`, `src/main.ts`, and `src/counter.ts` are unused Vite
scaffold leftovers — `index.html` only loads `src/main.jsx`. They are not part
of the real app and are tracked for removal separately (see the "clear the
decks" pass).
