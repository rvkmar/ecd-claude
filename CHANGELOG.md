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

### Changed

- N/A

### Deprecated

- N/A

### Removed

- N/A

### Fixed

- Q-matrix duplicate-row check corrected from blocking to advisory, matching
  the D52 spec.
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

- No server-side strict validator for the Q-matrix's *advisory* rules
  (duplicate rows, weak identifiability, low coverage) — by design, since
  those rules are advisory-only and never meant to block. The one
  *blocking* rule (all-zero rows) is no longer a gap: it's now enforced
  client-side at save time, not just at confirm time, so it can't reach
  the server unresolved (see Fixed, above). Referential integrity
  (unknown/undeclared items and attributes, duplicate entries) was
  confirmed this session to already be enforced server-side.
- Q-matrix item scoping uses the item's evidence-model chain, not a bound
  Task Model as the original spec described; this premise is unresolved.
- A live browser walkthrough of the Q-matrix editor has now been run
  (this session) — see `claude/day52-w11-live-browser-walkthrough.md`.
  The remaining D51/D52 debt is: no binary-SMV filter on the Competency
  Model picker, no virtualization, no keyboard interaction, and the item-
  scoping premise above.

## [1.0.0] - 2026-09-10

### Added

- Initial project release with core features.
- Initial setup, configuration files, and documentation.
