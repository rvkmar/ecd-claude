// Forwards the unprefixed Play URL (`/sessions/:id/player`) to the
// role-gated player. The old SessionBuilder handlePlay used that path;
// App.jsx's catch-all treated it as unknown and sent the user to /login
// without clearing sessionStorage — which looks exactly like a logout.
import React from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { sessionPlayerPath } from "../../utils/sessionPlay";

export default function SessionPlayRedirect() {
  const { sessionId } = useParams();
  const { auth } = useAuth() || {};
  if (!auth) return <Navigate to="/login" replace />;
  const path = sessionPlayerPath(auth.role, sessionId);
  if (!path) return <Navigate to={`/${auth.role || "login"}`} replace />;
  return <Navigate to={path} replace />;
}
