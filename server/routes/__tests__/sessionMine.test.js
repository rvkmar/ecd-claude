import { describe, it, expect, vi, beforeEach } from "vitest";
import { execFileSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import request from "supertest";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

vi.mock("../../utils/authMiddleware.js", () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { username: "stud1", role: "student" };
    next();
  },
  authorizeRole: (roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return res.sendStatus(403);
    next();
  },
}));

vi.mock("../../../src/utils/db-server.js", () => ({
  loadDB: vi.fn(),
  saveDB: vi.fn(),
  finishSession: vi.fn(),
}));

const { loadDB } = await import("../../../src/utils/db-server.js");
const { default: router } = await import("../sessionRoutes.js");

const app = express();
app.use(express.json());
app.use("/api/sessions", router);

describe("GET /api/sessions/mine", () => {
  beforeEach(() => {
    loadDB.mockReturnValue({
      students: [{ id: "stu99", name: "stud1" }],
      sessions: [
        { id: "s-mine", studentId: "stu99", status: "in_progress", taskIds: ["t1"] },
        { id: "s-other", studentId: "stu-other", status: "in_progress", taskIds: ["t2"] },
        { id: "s-done", studentId: "stu99", status: "completed", taskIds: ["t1"] },
      ],
    });
  });

  it("returns live sessions assigned to the logged-in student, not everyone else's", async () => {
    const res = await request(app).get("/api/sessions/mine");
    expect(res.status).toBe(200);
    expect(res.body.map((s) => s.id)).toEqual(["s-mine"]);
  });

  it("returns an empty list, not 404 Session not found, when nothing is assigned", async () => {
    loadDB.mockReturnValue({ students: [], sessions: [] });
    const res = await request(app).get("/api/sessions/mine");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(res.body).not.toEqual(expect.objectContaining({ error: "Session not found" }));
  });
});

describe("GET /api/sessions/mine is loadable by native Node ESM", () => {
  it("sessionPlay.js resolves under node, not only Vite/Vitest", () => {
    // The D60 leftover: sessionPlay.js imported ./sessionStatus without .js.
    // Vitest still loaded GET /mine; `node server/index.js` did not, so the
    // student list hit GET /:id and returned 404 Session not found.
    execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        "import { attendableSessionsForStudent } from './src/utils/sessionPlay.js'; if (typeof attendableSessionsForStudent !== 'function') process.exit(2);",
      ],
      { cwd: REPO_ROOT, encoding: "utf8", env: process.env }
    );
  });

  it("sessionRoutes.js loads under node so /mine can register before /:id", () => {
    execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        "import r from './server/routes/sessionRoutes.js'; if (!r) process.exit(2);",
      ],
      {
        cwd: REPO_ROOT,
        encoding: "utf8",
        env: {
          ...process.env,
          JWT_SECRET:
            process.env.JWT_SECRET ||
            "test-only-secret-do-not-use-outside-automated-tests-please-thanks",
        },
      }
    );
  });
});
