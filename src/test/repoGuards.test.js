// src/test/repoGuards.test.js
// ------------------------------------------------------------
// Cross-cutting static checks that don't belong to any one entity's test
// file -- these guard against a class of bug re-appearing anywhere in the
// tree, not just in the module that first had it. There's no ESLint setup
// in this repo (see CONTRIBUTING.md), so these run as ordinary Vitest
// checks instead of a custom lint rule.
// ------------------------------------------------------------

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");
const SCAN_DIRS = ["src", "server"];
// "migrations" is exempt: a migration's whole job is to name the legacy
// spelling it's rewriting away from.
const SKIP_DIRS = new Set(["node_modules", "dist", "__tests__", "test", "migrations"]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (/\.(js|jsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

// A line only counts as a violation if the literal appears in live code,
// not inside a // comment (this file and sessionStatus.js both mention the
// legacy spelling in prose to explain why it's banned).
function isCodeOccurrence(line, needle) {
  const idx = line.indexOf(needle);
  if (idx === -1) return false;
  const commentIdx = line.indexOf("//");
  return commentIdx === -1 || commentIdx > idx;
}

describe("session status spelling", () => {
  it("never re-introduces the legacy hyphenated \"in-progress\" status", () => {
    const files = SCAN_DIRS.flatMap((d) => walk(path.join(ROOT, d)));
    const offenders = [];

    for (const file of files) {
      const lines = fs.readFileSync(file, "utf-8").split("\n");
      lines.forEach((line, i) => {
        if (isCodeOccurrence(line, '"in-progress"') || isCodeOccurrence(line, "'in-progress'")) {
          offenders.push(`${path.relative(ROOT, file)}:${i + 1}`);
        }
      });
    }

    expect(
      offenders,
      `Found the legacy "in-progress" (hyphen) session status literal. ` +
        `Use SESSION_STATUS.IN_PROGRESS from src/utils/sessionStatus.js instead:\n` +
        offenders.join("\n")
    ).toEqual([]);
  });
});

describe("every write route declares a role gate", () => {
  // itemsRoutes.js once shipped with no role gating at all while
  // rolePermissions.js had no `items` entry either -- any authenticated
  // caller, including a student, could author or delete bank items. This
  // is the mechanical guard against that happening again anywhere else:
  // every POST/PUT/PATCH/DELETE route must have `authorizeRole(...)` (or
  // a local alias/`requireAdmin` built on it) in its own registration,
  // or be named in OPEN_BY_DESIGN below with a reason.
  //
  // A route belongs in OPEN_BY_DESIGN only when openness is a deliberate
  // product decision (self-service, or pre-authentication), not when a
  // gate was simply never written -- that's exactly the failure mode
  // this test exists to catch.
  const ROUTES_DIR = path.join(ROOT, "server", "routes");

  // links.js is dead code: not mounted anywhere (server/index.js keeps
  // both its import and its app.use() commented out), and it manages an
  // in-memory array disconnected from the real DB. Auditing it is the
  // AIG/autoFinish treatment -- gate it before it's ever mounted, not
  // busy-work now. Excluded here rather than gated because, unlike
  // aigRoutes.js/autoFinishRoutes.js, its handlers don't even do anything
  // real yet.
  const SKIP_FILES = new Set(["links.js"]);

  const OPEN_BY_DESIGN = new Set([
    // Login is how you get a token in the first place.
    "usersRoutes.js:POST:/login",
    // A session's own lifecycle (create, submit, pause, resume, finish,
    // review, archive) is the student's self-service flow, not a
    // privileged action -- gating it by role would block the exact
    // people it exists for. Ownership-scoping this (a student may only
    // touch their own session) is a real gap, but a scope-based one, not
    // a role-list one; see sessionRoutes.js's header comment.
    "sessionRoutes.js:POST:/",
    "sessionRoutes.js:POST:/:id/submit",
    "sessionRoutes.js:POST:/:id/pause",
    "sessionRoutes.js:POST:/:id/resume",
    "sessionRoutes.js:POST:/:id/finish",
    "sessionRoutes.js:POST:/:id/review",
    "sessionRoutes.js:POST:/:id/archive",
  ]);

  const WRITE_METHODS = ["post", "put", "patch", "delete"];

  function findGateAliases(content) {
    const aliases = new Set(["authorizeRole", "requireAdmin"]);
    const aliasRe = /const\s+(\w+)\s*=\s*authorizeRole\(/g;
    let m;
    while ((m = aliasRe.exec(content))) aliases.add(m[1]);
    return aliases;
  }

  function isGated(chunk, aliases) {
    return [...aliases].some((name) => new RegExp(`\\b${name}\\b`).test(chunk));
  }

  const files = fs
    .readdirSync(ROUTES_DIR)
    .filter((f) => f.endsWith(".js") && !SKIP_FILES.has(f));

  it.each(files)("%s", (file) => {
    const content = fs.readFileSync(path.join(ROUTES_DIR, file), "utf-8");
    const lines = content.split("\n");
    const aliases = findGateAliases(content);
    const offenders = [];

    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("//")) return;

      const match = trimmed.match(
        /^router\.(post|put|patch|delete)\(\s*["'`]([^"'`]+)["'`]/
      );
      if (!match) return;

      const [, method, routePath] = match;
      if (!WRITE_METHODS.includes(method)) return;

      // The gate (if any) is written somewhere between this line and the
      // handler function opening -- collect a generous window rather
      // than parse real JS, matching this file's existing static-check
      // style (see the spelling guard above).
      const chunk = lines.slice(i, i + 8).join("\n");
      const key = `${file}:${method.toUpperCase()}:${routePath}`;

      if (!isGated(chunk, aliases) && !OPEN_BY_DESIGN.has(key)) {
        offenders.push(`${file}:${i + 1} ${method.toUpperCase()} ${routePath}`);
      }
    });

    expect(
      offenders,
      `Ungated write route(s) -- add authorizeRole(...) or add to OPEN_BY_DESIGN with a reason:\n` +
        offenders.join("\n")
    ).toEqual([]);
  });
});
