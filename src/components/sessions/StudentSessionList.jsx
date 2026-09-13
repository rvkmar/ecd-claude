// Student-facing list of attendable sessions. Replaces the My Sessions
// placeholder ("Upcoming/Active Sessions here") left after D50 F7 — a
// student could be routed to a known player URL but could not discover one.
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { apiFetch, apiErrorMessage } from "@/api/apiClient";
import { sessionPlayerPath, canPauseSession, isAttendableStatus } from "@/utils/sessionPlay";
import { SESSION_STATUS } from "@/utils/sessionStatus";

export default function StudentSessionList() {
  const { auth } = useAuth() || {};
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!auth) return;
    let cancelled = false;
    setLoading(true);
    apiFetch("/api/sessions/mine", {}, auth)
      .then((data) => {
        if (cancelled) return;
        // /mine must be an array. A reserved-id fallback or a mistaken
        // GET /:id object is not a list — treat as empty, never as a
        // "Session not found" alert.
        if (Array.isArray(data)) {
          setSessions(data);
          setError(null);
          return;
        }
        setSessions([]);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        const msg = apiErrorMessage(err, err.message || "Failed to load sessions");
        // GET /:id ("mine") used to 404 with this exact string. Empty
        // list + empty-state is the honest product; that error is not.
        if (err.status === 404 || /session not found/i.test(String(msg))) {
          setSessions([]);
          setError(null);
          return;
        }
        setError(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [auth]);

  const openPlayer = (session) => {
    const path = sessionPlayerPath(auth?.role || "student", session.id);
    if (path) navigate(path);
  };

  if (loading) {
    return <div className="p-2 text-sm text-gray-600">Loading your sessions…</div>;
  }

  if (error) {
    return (
      <div className="p-2 text-sm text-red-700" role="alert">
        Could not load sessions: {error}
      </div>
    );
  }

  if (!sessions.length) {
    return (
      <div className="p-2 text-sm text-gray-700">
        No upcoming or in-progress sessions are available for you yet
        {auth?.username ? ` (${auth.username})` : ""}. Ask your teacher to
        assign a session to your account.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((s) => {
        const playable = canPauseSession(s);
        const paused = s.status === SESSION_STATUS.PAUSED;
        const upcoming = s.status === SESSION_STATUS.READY;
        return (
          <div
            key={s.id}
            className="p-4 border rounded-md bg-white shadow-sm flex justify-between items-start"
          >
            <div>
              <h3 className="text-lg font-semibold">{s.id}</h3>
              <div className="text-sm text-gray-600 mt-1">
                Status: <strong>{s.status || "unknown"}</strong>
                {isAttendableStatus(s.status) ? " (you can attend)" : ""}
              </div>
              <div className="text-sm text-gray-600">
                Tasks: <strong>{(s.taskIds || []).length}</strong>
                {" "}|&nbsp; Responses: <strong>{(s.responses || []).length}</strong>
              </div>
            </div>
            <div className="flex flex-col space-y-2 items-end">
              {upcoming && (
                <span className="text-xs text-gray-600">Not open yet</span>
              )}
              {playable && (
                <button
                  type="button"
                  onClick={() => openPlayer(s)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Play
                </button>
              )}
              {paused && (
                <button
                  type="button"
                  onClick={() => openPlayer(s)}
                  className="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600"
                >
                  Open
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
