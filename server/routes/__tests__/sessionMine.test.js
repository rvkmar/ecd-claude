import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

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
});
