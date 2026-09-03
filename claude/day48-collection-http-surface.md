# Day 48 — HTTP surface for the three headless collections

**Exit check (build reference / D48):** All three collections satisfy artefacts 4 and 6 of the
seven-artefact contract; the new collection guard is verified to fail when a route file is removed.

**Status: DONE.**

## Verification

- `NODE_OPTIONS=--max-old-space-size=3072 npx vitest run` — **880/880 passing, 44 test files**, no
  skips (852/852 across 42 files before this day).
- `npm run build` — clean. The >500kB single-chunk warning is pre-existing and unchanged; it is
  D74's item, not a regression introduced here.
- `git push main master` — pushed by the user; remote `refs/heads/master` = `d1b29b0`, matching
  local HEAD. Working tree clean apart from the untracked `.claude/settings.local.json`.
- The guard was **mutation-tested**, not merely run. See "The guard's own near-miss" below.

## What this day was, and what it turned out to be

D48 was scheduled to close finding F5: `assemblyModels` (D17), `qMatrixModels` (D18) and
`compositeLibrary` (D19) each shipped with a schema block, referential-integrity checks and — for
two of them — a lifecycle validator, then sat for weeks with **no route file, no
`rolePermissions` entry and no query hooks**. They could be validated but not reached. The
Q-matrix editor (D51) had nothing to save to.

That premise held exactly, verified against the code before any work started.

### Delivered

- **`qMatrixModelsRoutes.js`, `assemblyModelsRoutes.js`** — full CRUD on the house pattern:
  router-level `authenticateToken`, admin-gated writes, `status`/`locked`/`versionNumber`
  server-authoritative on create, transitions through `canTransition()` plus each entity's own
  lifecycle validator, and locked records accepting a status-only change (a content key alongside
  `status` is a 409). Q-matrix delete refuses while any evidence model's `statisticalModels[]`
  still names it — a dangling `qMatrixId` would make a dina/gdina model unvalidatable and
  unscoreable, which is a quiet failure rather than a loud one.

- **`compositeLibraryRoutes.js` — deliberately READ-ONLY.** This is a design decision with two
  independent reasons, both recorded in the file header. `schema.js` declares the collection as a
  build artifact with no lifecycle ("not an authored entity a human drafts/reviews/revises"), and
  ADR 0003 puts the compile boundary at structural facts. A generic POST/PUT would let a human
  hand-author a delivery package that no Task Model compiles to. The single mutation is an
  admin-only `POST /rebuild/:taskModelId` that delegates to the Day 24 builder and **takes no
  body** — the caller names what to compile, never what the package contains.

  One correction found while writing it: `buildCompositeLibrary()` returns `{record, warnings}`
  and **degrades rather than throwing** — a Task Model that is not yet instantiable compiles to an
  *empty* package plus a warning. The first draft of the endpoint assumed a throw and would have
  stored that empty package as `active`, making a Task Model look delivery-ready while resolving
  to nothing at request time. The endpoint now refuses with a 409 and returns the builder's
  warnings.

- **`rolePermissions.js`** — all three declared for the first time. `compositeLibrary` is
  deliberately absent from `canEdit` (it has no authored write); district gets read-only on the
  two authored collections, since a Q-matrix and an assembly model are system-level measurement
  decisions rather than local authoring.

- **Query hooks** for all three under `src/api/queries/`, every call through `apiFetch`.

- **`src/test/collectionSurfaceGuard.test.js`** — the load-bearing artefact. Every collection in
  `schema.js` must have a mounted router and a declared role permission, and every mounted route
  must be gated. Documented `PATH_ALIASES` / `PERMISSION_ALIASES` / `UNAUTHENTICATED_BY_DESIGN`
  maps carry the genuine exceptions (`competencies` is served by `competencyModels.js`;
  `usersRoutes.js::/login` legitimately takes no token) — an unexplained exemption is how a guard
  rots into a rubber stamp.

- **`routeAuth.test.js`** extended with the three new routers, and
  **`d48CollectionSurface.test.js`** added for behavioural cover: the role gates admit and refuse
  the right roles, and `compositeLibrary`'s read-only posture is real (POST `/` and PUT `/:id`
  are 404s, not handlers).

## The guard's own near-miss

The guard passed on its first run and would have shipped broken.

Five mutations were applied to check it actually bites: unmount the router, drop the
`rolePermissions` entry, comment out the auth gate, add a generic write to `compositeLibrary`,
delete the route file. **Four failed the guard as intended. The commented-out auth gate did
not** — because `/router\.use\(\s*authenticateToken\s*\)/` still matches
`// router.use(authenticateToken);`. A *disabled* gate read as present.

This is the same problem `repoGuards.test.js` already solved with its `isCodeOccurrence()`
helper. The guard now strips `//` lines before testing, and all five mutations fail it. Two
further mutants (removing `canAuthor` from a POST; removing the empty-package refusal) confirmed
the behavioural tests bite too.

Worth recording plainly: a guard that has only been observed to pass proves nothing about the
thing it guards.

## Calibration findings — two units revised, one finding withdrawn

The session began with a premise check against the real code, per the cadence contract. It found
the plan wrong in two places.

**F2 is WITHDRAWN. The error was in the plan, not the code.** The enterprise action plan asserted
that the student submit path could not authenticate — `SessionPlayer` uses a raw `fetch` with no
`Authorization` header against a route that applies `router.use(authenticateToken)`. That is
false. `src/api/authFetchInterceptor.js` wraps `window.fetch` once at `src/main.jsx:16` and
attaches `Authorization: Bearer <token>` to every same-origin `/api/*` request. It has six tests
locking its behaviour and a header comment describing itself as a deliberate Phase-1 bridge,
naming its own deletion condition.

The mistake was reading `SessionPlayer` in isolation and never grepping for a global provider of
the concern it appeared to be missing. This is the third instance of that class in this project
(D43's dead toast component, D44's non-duplicate wizard, now this) and the reason the premise
check exists.

**D46 is rewritten** as Phase-2 data-layer consolidation rather than an auth fix. Its real scope
is **12 files and ~50 raw call sites**, not the 8 the plan claimed. The order of work is: migrate
to `apiFetch`, add the guard, and **delete the bridge last** — the risk direction inverts, because
this removes a working safety net and a missed call site 401s a live screen. Severity drops from
P0 to housekeeping, and it blocks nothing: the dependency that put it ahead of D47 does not exist.

**D47 is larger than written.** It is not "submit `itemId` instead of `questionId`". The player
has no item path at all: `/api/sessions/:id/next-task` returns a `questionId`, the player fetches
`/api/questions/:id`, and `findItemMapping` matches `m.itemId === questionId`, conflating two id
spaces through the Task Model's own best-effort coverage map (which D154 is scheduled to make
authoritative). D47 needs a server-side `/next-task` change plus item-based rendering. It does
**not** depend on D49 — items resolve via `task.taskModelId`, a binding `sessionRoutes.js` already
validates.

## Environment findings — these will recur

- **The device cannot run the test suite.** Its `node_modules` was damaged (`setprototypeof` and
  `util-deprecate` both missing entry files) and npm could not self-repair, because the bridge
  blocks deletion and npm must remove stale packages to reinstall. It also held **Windows**
  esbuild binaries from the original desktop install.
- **A device shell cannot outlive its call.** Backgrounded work is killed with the sandbox, and
  each call caps at ~180s — far too short for a full `npm install` over the mount (~86 KB/s).
- **A stale zero-byte `.git/index.lock`** blocked `git am` with "unable to write index file".
  This is the Day 1 failure mode recurring; clear it and retry.
- **The arrangement that worked, and should be reused:** clone in the cloud container, install and
  verify there, transfer with `git format-patch` → device → `git am`, and compare tree hashes to
  prove the copies identical (`b24cbfe…` on both). This matches the repo's existing
  `d39–d43.patch` convention.

## What remains

1. **F4 is only partly closed.** The rebuild endpoint gives `buildCompositeLibrary()` a caller for
   the first time, but the **activation-path wiring is still open** — nothing builds a package when
   a Task Model is promoted to `operational`. That is D49 and it is unchanged.
2. **D46 not started.** Deliberately: the session went to environment repair plus completing D48 to
   its exit check. Cadence contract rule 6 — when budget is short, do fewer units, never shallower
   ones. No compression debt was taken.
3. **The device's `node_modules` is still partial** and must be reinstalled locally before
   `npm run dev` or a local test run will work there.
4. Everything on the D45 handoff's remaining list is unchanged — this day touched none of
   `delivery/`, `activitySelection.js`, the stopping rule, or the R service.

## Next

**D47 — server-authoritative item delivery.** Tier 3 on the cadence contract's never-compress
list: it stands alone, Opus/max, with its own verification. It closes the two genuine P0s (F1, the
measurement core being unreachable from the UI; F3, the client computing its own score) and it is
the unit that makes fifteen dev-days of already-built, already-verified accumulation code
reachable by a real user for the first time.
