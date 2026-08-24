// src/utils/generatePassword.js
//
// Generates a strong random temporary password for admin-created accounts.
// This replaces the previous pattern (in StudentsManager.jsx / TeachersManager.jsx)
// of defaulting the initial password to the user's EMIS ID — often not a
// secret — or, if none was entered, the literal string "password123". Both
// were guessable by anyone who knew (or could guess) the ID scheme.
//
// This is a stop-gap, not a complete fix: the account should still be moved
// to a real "must change password on first login" flow once the users API
// supports it (tracked as a follow-up — see AUTH_SECURITY_FIXES.md). For now,
// this at least makes the initial credential unguessable, and the caller is
// expected to surface it once to the admin so it can be shared with the new
// user out of band.

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

export function generateTempPassword(length = 14) {
  const values = new Uint32Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(values);
  } else {
    // Extremely unlikely fallback (no Web Crypto API available) — still
    // better than a fixed/guessable string.
    for (let i = 0; i < length; i++) {
      values[i] = Math.floor(Math.random() * 4294967296);
    }
  }

  let out = "";
  for (let i = 0; i < length; i++) {
    out += CHARS[values[i] % CHARS.length];
  }
  return out;
}
