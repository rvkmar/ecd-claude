# D49 session — calibration, D49 split, and the verification surface

**Status: NO UNIT COMPLETED.** This was a calibration session under cadence contract §6. No code changed. Recorded as a handoff because what it established — a working browser verification surface, and a unit split — is what the next session needs.

**Exit check:** none. No unit was started, so none was passed. D49a is briefed and blocked on one decision (below).

---

## Verification

| | |
|---|---|
| Repo (device + container) | `5f39494`, clean, 0/0 against `main/master` |
| Tests | **902 passed / 902, 47 files** — on **vitest 5.0.0**, re-run after the dependency bump |
| Build | clean · `dist/assets/index-C52lS2nL.js` (2,124 kB) |
| Running stack | Docker on the user's machine, `http://localhost:6060`, **fingerprinted as this source** |

The container was realigned from `48cece5` onto `origin/master` mid-session after the device turned out to have moved (see "Dependency bump" below), and everything above was re-run at `5f39494`, not inherited.

---

## 1. The verification surface — the most useful thing established today

**Browser verification does not need a dev server.** The user runs the full stack in Docker: nginx on `6060` (also `8081`), node internal on `3000`, mongo internal, and `r-backend` published on `4000`. The **built-in browser pane reaches `http://localhost:6060`.**

`Dockerfile.nginx` runs `npm ci && npm run build` *inside the image build*, so a running stack is frozen at whatever the source was when it was last built. **It must be fingerprinted before it is trusted as evidence.** Three checks, all cheap:

1. **Server** — `GET /api/qMatrixModels` unauthenticated. **401** = D48 routers mounted; **404** = image predates D48. *(Result: 401.)*
2. **Client** — fetch the `assets/index-*.js` the page loads and test for **string literals**, never identifiers. Minification renames identifiers: `ItemPresenter` and `deliveredItem` both returned false while the component was demonstrably present. `"cannot present yet"` is unique to `ItemPresenter.jsx` and survives minification. *(Result: present.)*
3. **Strongest** — the asset filename is a **content hash**. `npx vite build` at the commit under test and compare. *(Result: `index-C52lS2nL.js` at both `48cece5` and `5f39494`, matching the served bundle. The dependency bump is server-side only, so the frontend output is unchanged across it.)*

*Windows note:* the user's shell is Git Bash, which rewrote `/usr/share/nginx/html/...` into `C:/Program Files/Git/usr/share/...` and failed a `docker exec grep`. Prefix with `MSYS_NO_PATHCONV=1`, or do the check over HTTP from the pane, which is what worked.

### The mistake, recorded

**D50 was escalated in the work order as unstartable — "no runnable dev server, and no browser can reach one" — and withdrawn the same session.** The first navigation to `localhost:6060` failed because the containers had not been started yet; that timing accident was read as a capability limit, and the device's missing `node_modules/.bin/vite` was taken as corroboration. The Docker stack had been the answer the whole time.

This is finding F2's error in a different costume: asserting a capability is absent without checking whether the environment already provides it. Lesson 6 in the ledger.

---

## 2. D49 split three ways

The unit's fourth clause — *"point Evidence Identification at the library rather than the authoring graph"* — reads like re-pointing an import. It is not.

`identifyEvidence(workProduct, item, db)` resolves the Evidence Model **live** from `db`. The compiled package **bakes in** `scoring.evidenceActivationMap` and the resolved `evidenceRule` (`compositeLibrary/builder.js`, the per-item projection). Redirecting scoring at the package therefore changes *what a response is scored against* whenever the package is stale — a plausible-looking wrong score, which is the quiet failure class the cadence contract exists for. That is Tier 3 material sitting inside a clause tiered as service logic.

| | | Tier |
|---|---|---|
| **D49a** | Activation wiring at Task Model promotion + empty-package refusal | 2 |
| **D49b** | Dead-export guard in `repoGuards.test.js` | 1 |
| **D49c** | Library as the delivery source — own unit, sequenced with **D56**, needs a written snapshot-vs-live decision first | TBD, not 1 |

**F4 is not closed by D49a.** D49a closes the "no caller" half. F4's own text also says *"delivery still re-walks the authoring graph at request time, which is exactly what the library was built to prevent"* — that half moves to D49c. Recorded so it is not quietly marked done.

### What D49a actually touches

One wiring point: the **locked, status-only branch** of `PUT /api/taskModels/:id` (`taskModelsRoutes.js`). It is the only route that performs `confirmed → operational`. Two things to settle inside it:

- It also fires on **`suspended → operational`**. Reactivation probably should not recompile — decide.
- D48's `POST /api/compositeLibrary/rebuild/:taskModelId` already contains the empty-package 409 refusal and the deactivate-previous logic. **The activation path must make the same refusal**, or promotion silently produces an active package resolving to nothing.

---

## 3. OPEN DECISION — blocks D49a

The plan's exit check says an Evidence Model version bump should **"trigger a rebuild"**. That makes writing an Evidence Model silently recompile a different entity's package — a cross-entity side effect on someone else's write.

The alternative, and the house style everywhere else in this codebase: **mark stale, surface the advisory** (`GET /api/compositeLibrary/:id/staleness`, built on D48), **require an explicit rebuild** (the D48 endpoint).

Not picked unilaterally. **D49a does not start until this is answered.**

---

## 4. Dependency bump — verified, not assumed

The device had moved two commits ahead during the session, neither of them mine:

- `a41985f` — `Dockerfile.nginx`: `npm ci && npm cache clean --force`, then `rm -rf node_modules/.vite node_modules/esbuild`.
- `5f39494` — `package.json` / `package-lock.json`: **`vitest` and `@vitest/coverage-v8` `^2.1.4 → ^5.0.0`** (three majors), **`mathjs` `^14.8.1 → ^15.2.0`**, Storybook devDeps reordered, and a new `allowScripts` field.

Re-verified rather than inherited: **902/902 on vitest 5.0.0**, clean build, identical asset hash. `esbuild` resolves fine despite the `rm -rf` in the Dockerfile, because the platform packages remain — but that line is fragile and should be revisited if an image build ever fails.

`allowScripts` is a pnpm-shaped field; **npm ignores it.** Inert, not harmful.

### Finding — `mathjs` is a dead dependency

`server/routes/sessionRoutes.js:16` does `import { log2 } from "mathjs"`, and **`log2` is never called.** Line 30 uses the native `Math.log2`. That single unused import is mathjs's only reference in `src/` or `server/`.

Consequences:
- The `mathjs` major bump has **zero** effect on this codebase. Validity risk from it: nil.
- Two test files carry workarounds *for the cost of that import* — `sessionRoutes.test.js:12` and `routeAuth.test.js:58` both note that sessionRoutes' cold import "pulls in mathjs" and is slow enough to occasionally time out. **An unused import is buying real test flakiness.**

This is D49b's problem one level up: a dead *dependency*, not a dead export. Fold it in — removing the import is a one-line change with a measurable payoff.

---

## 5. D61's premise moved

The plan says the R service "is commented out in `docker-compose.yml` and unwired". **Half false.** `r-backend` (`rvkmar/r-backend:latest`) is **running and published on `:4000`** in the user's stack. It answers HTTP, but `GET /health` returns a plumber exception, and `R_BACKEND_URL` is still commented out in the node service — so node genuinely does not talk to it.

D61 is likely **smaller** than planned: repair `/health` and wire the node side, rather than build the service. **This was a single probe, not an investigation — re-check properly at W13.**

---

## What remains in W10

- **D49a** — blocked on the decision in §3.
- **D49b** — dead-export guard. Must be **mutation-tested** (D48's lesson: a guard observed only to pass proves nothing). Expect it to find other dead exports; that is work it discovers, not work it avoids. Fold in the `mathjs` import.
- **D49c** — deferred, sequenced with D56.
- **D50** — Tier 3, never-compress, **now unblocked**. Discharges D47's compression debt.
  **Its likely obstacle is not the browser:** there is still no authoring UI to bind an item to a task (`TasksManager` offers only a question, a deliberate D47 scope choice). The walkthrough will probably need a task seeded with `itemId` — plan for that rather than discovering it mid-unit.
- **D46** — Phase-2 `apiFetch` consolidation. Blocks nothing.

## Next

Answer §3, then D49a + D49b as a Tier 2 + Tier 1 pair. D50 alone after that, against the Docker stack, fingerprinted first.
