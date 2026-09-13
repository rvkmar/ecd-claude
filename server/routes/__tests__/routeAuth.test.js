// @vitest-environment node
// server/routes/__tests__/routeAuth.test.js
//
// This is the single most important test file from the Phase 1 security
// pass: it asserts that every route file which previously had ZERO
// authentication now rejects a request with no token. If a future change
// (Phase 2's data-layer consolidation, or anything else) accidentally
// removes or reorders the `router.use(authenticateToken)` line added to
// each of these files, this test fails immediately instead of the gap
// being rediscovered by re-auditing the whole codebase again.
//
// Each router's own business logic (schema validation, lifecycle rules,
// etc.) is NOT exercised here — only the auth boundary. That's deliberate:
// this file's only job is "does a request with no token get rejected
// before it reaches any route handler."

import { beforeAll, describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";

// Heavy routers (reportsRoutes especially) pay a cold dynamic-import cost
// that already approached 12.5s under a WSL full-suite run that creates
// jsdom 61 times. Each describe used to import twice (GET + garbage-token),
// so the second cold path could push past 15s. Import once per describe
// and share a 30s budget so contention still has headroom. This is a
// slow-import timing issue, not a behavioral flake — do not retry or
// weaken the 401/403 assertions.
const COLD_IMPORT_TIMEOUT_MS = 30000;

// One router per previously-unauthenticated route file, plus the base path
// it's normally mounted at in server/index.js (used only for a readable
// test name — supertest hits the router directly, mount path doesn't
// matter for the assertion itself).
const PROTECTED_ROUTERS = [
  { name: "sessionRoutes", path: "/api/sessions", importer: () => import("../sessionRoutes.js") },
  { name: "itemsRoutes", path: "/api/items", importer: () => import("../itemsRoutes.js") },
  { name: "itemAnalyticsRoutes", path: "/api/itemAnalytics", importer: () => import("../itemAnalyticsRoutes.js") },
  { name: "competencyModels", path: "/api/competencies", importer: () => import("../competencyModels.js") },
  { name: "evidenceModels", path: "/api/evidenceModels", importer: () => import("../evidenceModels.js") },
  { name: "tasksRoutes", path: "/api/tasks", importer: () => import("../tasksRoutes.js") },
  { name: "taskModelsRoutes", path: "/api/taskModels", importer: () => import("../taskModelsRoutes.js") },
  { name: "reportsRoutes", path: "/api/reports", importer: () => import("../reportsRoutes.js") },
  { name: "studentsRoutes", path: "/api/students", importer: () => import("../studentsRoutes.js") },
  { name: "policiesRoutes", path: "/api/policies", importer: () => import("../policiesRoutes.js") },
  { name: "calibrationRoutes", path: "/api/calibrate", importer: () => import("../calibrationRoutes.js") },
  // D48: the three collections that had schema and lifecycle validation
  // but no HTTP surface at all. They join this list on the day their
  // routers are created, so the gate can never be removed silently.
  { name: "qMatrixModelsRoutes", path: "/api/qMatrixModels", importer: () => import("../qMatrixModelsRoutes.js") },
  { name: "assemblyModelsRoutes", path: "/api/assemblyModels", importer: () => import("../assemblyModelsRoutes.js") },
  { name: "compositeLibraryRoutes", path: "/api/compositeLibrary", importer: () => import("../compositeLibraryRoutes.js") },
];

describe.each(PROTECTED_ROUTERS)(
  "$name requires authentication",
  ({ path, importer }) => {
    let router;

    beforeAll(async () => {
      ({ default: router } = await importer());
    }, COLD_IMPORT_TIMEOUT_MS);

    it(
      "rejects GET / with no Authorization header (401)",
      async () => {
        const app = express();
        app.use(express.json());
        app.use(path, router);

        const res = await request(app).get(path + "/");
        expect(res.status).toBe(401);
      },
      COLD_IMPORT_TIMEOUT_MS
    );

    it("rejects a request with a garbage Authorization header (403)", async () => {
      const app = express();
      app.use(express.json());
      app.use(path, router);

      const res = await request(app)
        .get(path + "/")
        .set("Authorization", "Bearer this-is-not-a-real-token");
      expect(res.status).toBe(403);
    });
  }
);
