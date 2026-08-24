// src/test/setup.js
// Global Vitest setup — runs once before each test file.

import "@testing-library/jest-dom";

// server/config/jwt.js reads process.env.JWT_SECRET at *import* time and
// throws if it's missing/too short (that's the whole point of the Phase 1
// fix — no insecure fallback). Backend test files import that module
// (directly or transitively via authMiddleware.js/usersRoutes.js), so a
// safe test value has to exist before those imports run. Vitest loads
// setupFiles as their own module graph and fully evaluates them before it
// imports the actual test file, so setting these here — rather than at the
// top of each test file — is what makes the timing work.
process.env.JWT_SECRET ||=
  "test-only-secret-do-not-use-outside-automated-tests-please-thanks";
process.env.TOKEN_EXPIRES_IN ||= "1h";
process.env.DB_MODE ||= "json";
