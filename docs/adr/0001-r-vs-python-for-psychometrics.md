# ADR 0001 — R (not Python) for psychometric calibration

**Status:** Accepted
**Date:** 2026-08-28 (Day 20, Week 4)
**Deciders:** ecd-claude build

## Context

The build reference (Part 4) establishes that calibration — estimating item/model
parameters from a response matrix via MML-EM, Bayesian estimation, etc. — needs a
real statistical package; writing 2PL/3PL/Rasch or DINA/G-DINA estimation from
scratch is a research project with a silent failure mode (plausible-looking wrong
parameters). Scoring (applying already-calibrated parameters to one response) stays
in JS regardless of this decision — it never needs R (see Part 4.1).

DINA/G-DINA diagnostic classification models were confirmed a near-term
requirement as of Day 1 of this build (they are why the Student Model supports
binary attribute vectors as of Day 16, and why `qMatrixModels` exists as of Day 18).
That requirement is the deciding fact here, not a generic "R vs Python for stats"
preference.

Two credible options:

| | R | Python |
|---|---|---|
| 2PL/3PL/Rasch | `mirt` — mature, published-benchmark datasets (`LSAT7`) | `girth`, `py-irt` — workable |
| **DINA/G-DINA** | **`GDINA`, `CDM` — the reference implementations** | **No credible peer** |
| MIRT (multivariate SMVs) | `mirt` | partial |
| DIF analysis | `difR` | partial |
| Linking/equating | `equate`, `plink` | partial |
| Team fit | Depends on team | Depends on team |

## Decision

**R**, via a Plumber HTTP service in its own Docker container (`services/r-psychometrics/`,
already stubbed as the commented-out `r-backend` service in `docker-compose.yml`),
called by Express through a job queue — never inline in a request path (Part 4.3).

The deciding factor is narrow and specific: `GDINA` has no Python peer, and DINA/G-DINA
is not a hypothetical future feature — it is why six days of this week's schema work
(`smVariables[]` binary type, `qMatrixModels`, `dina`/`gdina` statistical model types)
exist at all. Python remains a legitimate general-purpose choice for a team stronger
there, but it does not clear this specific, already-committed requirement.

## Consequences

- `services/r-psychometrics/` will run `mirt`, `GDINA`, `TAM`, `difR` (W12 per the
  build reference's weekly deliverables).
- The job queue's response contract must be R/Plumber-shaped (JSON in/out over
  HTTP) — see ADR 0002.
- Benchmark verification is mandatory before any calibration ships: `mirt`'s bundled
  `LSAT7` for IRT, `GDINA`'s `sim10GDINA` for diagnostics (Part 4.5). A passing unit
  test proves near-nothing here; a reproduced published benchmark proves nearly
  everything. This is a W12/W13 exit check, not implemented yet.
- If R/Plumber operational cost (container, cold starts, R's own quirks) proves
  unworkable in production, the fallback is NOT "switch to Python for everything" —
  it is "keep Python as an option for the non-DINA models and accept `GDINA`/`CDM`
  as the one hard R dependency," since that is the actual constraint driving this
  decision. Revisit only if `GDINA`'s Python ecosystem changes materially.
