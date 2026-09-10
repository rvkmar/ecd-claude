# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Q-matrix editor (D51, partial): attributes×items grid for authoring DINA/G-DINA
  Q-matrices, scoped to a competency model's binary Student Model Variables, wired
  into the Admin page as a new "Q-Matrix" tab. See `claude/day51-w11-calibration-and-qmatrix-editor.md`
  for what shipped vs. what the spec called for.
- Q-matrix validity rules (D52, partial): client-side checks for all-zero rows
  (blocking), duplicate rows, weak identifiability, and low attribute-item
  coverage (all advisory), shown live in the editor grid.
- Q-matrix confirmation now checks, on the server, that every item a bound
  diagnostic model will actually score has been given at least one attribute.
  An item that requires no attribute contributes nothing to a diagnosis, and
  the scoring engine already discards such responses — this catches it while
  the matrix is being authored instead.

### Changed

- Q-matrix editor: the Competency Model picker now only lists models that
  declare at least one binary Student Model Variable, since a Q-matrix has
  nothing to bind to otherwise. Previously any competency model could be
  selected, including ones a Q-matrix could never actually be built from.

### Deprecated

- N/A

### Removed

- N/A

### Fixed

- Q-matrix duplicate-row check corrected from blocking to advisory, matching
  the D52 spec.
- A Q-matrix used by a diagnostic (DINA/G-DINA) evidence model can no longer
  be deleted. The check that was meant to prevent this had been looking in
  the wrong place since it was written, so it never actually blocked
  anything, and deleting such a Q-matrix left the evidence model pointing at
  a record that no longer existed.
- A confirmed Q-matrix can no longer be deleted at all. It defines what every
  attribute-mastery result ever scored against it means, so it is archived
  rather than destroyed — the same rule confirmed items already follow.
- Q-matrix editor: "Save for Review" no longer silently does nothing on a
  brand-new Q-matrix. It previously required two clicks to actually save
  the record for review, with no error shown on the first attempt.
- Q-matrix editor: an item added to the grid with no attributes checked can
  no longer be saved as a draft or sent for review. Previously it could be
  saved and would then silently disappear the next time the record was
  reopened, along with its own validation error.

### Security

- N/A

### Known gaps (carried forward, see progress ledger)

- The Q-matrix's *advisory* rules (duplicate rows, weak identifiability,
  low coverage) have no server-side equivalent — by design, since they are
  advisory and were never meant to block. The one *blocking* rule is now
  enforced on both sides, with a test asserting the two agree.
- Q-matrix item scoping uses the item's evidence-model chain rather than a
  "bound Task Model." **Resolved:** the original spec sentence was a layer
  confusion — in ECD the Task Model is the task *environment*, while which
  items belong together is the Assembly Model's role and the matrix itself
  belongs to the Evidence Model's measurement model. The existing scoping
  matches what the scoring engine already enforces. See
  `claude/day52c-qmatrix-item-row-premise.md`.
- A live browser walkthrough of the Q-matrix editor has now been run —
  see `claude/day52-w11-live-browser-walkthrough.md`.
- The Q-matrix editor stays a tab on the Admin page rather than a
  dedicated route — a deliberate decision, not an oversight; see
  `claude/day52b-qmatrix-route-decision.md`.
- There is no district-facing read-only Q-matrix view, though the UI
  specification calls for one. Newly recorded, not previously tracked.
- Remaining D51/D52 debt: no virtualization and no keyboard interaction in
  the grid.

## [1.0.0] - 2026-09-10

### Added

- Initial project release with core features.
- Initial setup, configuration files, and documentation.
