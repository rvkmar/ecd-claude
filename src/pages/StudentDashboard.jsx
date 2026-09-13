import React, { useEffect } from "react";
import { useAuth } from "../auth/AuthProvider";
import { apiFetch } from "../api/apiClient";
import toast from "react-hot-toast";

import DashboardLayout from "../components/ui/DashboardLayout";
import StudentSessionList from "../components/sessions/StudentSessionList";
import AnalyticsReports from "../components/reports/AnalyticsReports";

export default function StudentDashboard() {
  const { auth, logout } = useAuth();

  useEffect(() => {
    apiFetch("/api/student/data", {}, auth)
      .catch((err) => {
        console.error(err);
        toast.error("Session expired or unauthorized. Please log in again.");
        logout();
      });
  }, [auth]);

  return (
      <DashboardLayout
        title="Student Dashboard"
        tabs={[
          { id: "mysessions", label: "My Sessions", content: <StudentSessionList /> },
          { id: "analytics", label: "Analytics", content: <AnalyticsReports />, entity: "reports" }
        ]}
      />
  );
}
