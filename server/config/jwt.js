// server/config/jwt.js
// Single source of truth for JWT configuration. Previously this constant was
// hardcoded independently in three places (authMiddleware.js, usersRoutes.js's
// fallback, and docker-compose.yml), which meant a real secret could silently
// diverge from the fallback string "super_secret_key" that shipped in source
// control. There is now no insecure fallback: the process refuses to start
// without a real JWT_SECRET set in the environment.
//
// Set JWT_SECRET via your .env file (see .env.example) for local/dev use, or
// via your deployment's secret manager in production. Generate a strong
// value with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim().length < 32) {
  throw new Error(
    "JWT_SECRET environment variable is missing or too short (need >= 32 chars). " +
      "Refusing to start with an insecure/default signing key — set JWT_SECRET in " +
      "your .env file (copy .env.example) or deployment secrets."
  );
}

export const JWT_SECRET = process.env.JWT_SECRET;
export const TOKEN_EXPIRES_IN = process.env.TOKEN_EXPIRES_IN || "8h";
