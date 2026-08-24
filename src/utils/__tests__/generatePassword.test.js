// src/utils/__tests__/generatePassword.test.js

import { describe, it, expect } from "vitest";
import { generateTempPassword } from "../generatePassword.js";

const ALLOWED_CHARS = /^[A-HJ-NP-Za-km-z2-9!@#$%]+$/;

describe("generateTempPassword", () => {
  it("defaults to a 14-character password", () => {
    expect(generateTempPassword()).toHaveLength(14);
  });

  it("respects a custom length", () => {
    expect(generateTempPassword(20)).toHaveLength(20);
    expect(generateTempPassword(6)).toHaveLength(6);
  });

  it("only uses characters from the allowed set (no ambiguous 0/O/1/I/l)", () => {
    const pw = generateTempPassword(64);
    expect(pw).toMatch(ALLOWED_CHARS);
  });

  it("is not a fixed/guessable value — two calls differ", () => {
    // Astronomically unlikely to collide at length 14; this is the direct
    // regression test for replacing the old "password123" / EMIS-ID default.
    const a = generateTempPassword();
    const b = generateTempPassword();
    expect(a).not.toBe(b);
  });

  it("is never the literal previous default", () => {
    const pw = generateTempPassword();
    expect(pw).not.toBe("password123");
  });
});
