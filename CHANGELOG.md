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

### Security

- N/A

### Known gaps (carried forward, see progress ledger)

- No server-side strict validator for Q-matrix rows yet, so the client-side
  checks above can be bypassed via a direct API call.
- Q-matrix item scoping uses the item's evidence-model chain, not a bound
  Task Model as the original spec described; this premise is unresolved.
- No live browser walkthrough of the Q-matrix editor has been run yet.

## [1.0.0] - 2026-09-10

### Added

- Initial project release with core features.
- Initial setup, configuration files, and documentation.
