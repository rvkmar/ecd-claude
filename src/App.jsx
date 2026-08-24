// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "./auth/AuthProvider";
import ProtectedRoute from "./auth/ProtectedRoute";
import TopBar from "./components/ui/TopBar";
import LoginPage from "./pages/LoginPage";

// New imports for dashboards
import AdminPage from "./pages/AdminPage";
import SettingsPage from "./pages/SettingsPage";
import DistrictDashboard from "./pages/DistrictDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";

// Existing feature pages
// import QuestionBank from "./components/questions/QuestionBank";
import QuestionBankTabs from "./components/questions/QuestionBankTabs";
import CompetencyModelBuilder from "./components/competencies/CompetencyModelBuilder";
import EvidenceModelBuilder from "./components/evidences/EvidenceModelBuilder";
import TaskModelBuilder from "./components/taskModels/TaskModelBuilder";
import TasksManager from "./components/tasks/TasksManager";
import SessionBuilder from "./components/sessions/SessionBuilder";
import SessionPlayer from "./components/sessions/SessionPlayer";

import Footer from "./components/ui/Footer";
// import Toast from "./components/ui/Toast";
// import NavBar from "./components/ui/NavBar";

export default function App() {
  function EvidenceRoutes() {
    return (
      <Routes>
        {/* List */}
        <Route index element={<EvidenceModelBuilder />} />

        {/* New Wizard */}
        <Route path="new" element={<EvidenceModelBuilder />} />

        {/* Edit/View Wizard */}
        <Route path=":id" element={<EvidenceModelBuilder />} />

        {/* Safety fallback */}
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    );
  }

  return (
    <Router>
      <AuthProvider>
        <TopBar />
          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 3000,
              style: {
                marginBottom: "64px",
                textAlign: "center",
              },
            }}
          />

        <div className="app-container">
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Admin */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute expectedRole="admin">
                  <Routes>
                    <Route index element={<AdminPage />} />
                    {/* Add more admin-only tools here */}

                    {/* Users, Policies, Appearance, Data, System --
                        Settings is now the single home for all of these
                        (previously split across /admin/teachers,
                        /admin/students, /admin/policies, and an AdminPage
                        "Settings" tab). */}
                    <Route path="settings" element={<SettingsPage />} />

                    <Route path="evidence/*" element={<EvidenceRoutes />} />
                  </Routes>
                </ProtectedRoute>
              }
            />

            {/* District */}
            <Route
              path="/district/*"
              element={
                <ProtectedRoute expectedRole="district">
                <Routes>
                    <Route index element={<DistrictDashboard />} />
                    {/* Add more district user tools */}
                    <Route path="competencies" element={<CompetencyModelBuilder />} />
                    {/* <Route path="evidence" element={<EvidenceModelBuilder />} /> */}
                    <Route path="evidence/*" element={<EvidenceRoutes />} />
                    <Route path="tasks" element={<TaskModelBuilder />} />
                    <Route path="questions" element={<QuestionBankTabs />} />
                    <Route path="manage-tasks" element={<TasksManager />} />
                    <Route path="sessions/build" element={<SessionBuilder />} />
                    <Route path="sessions/play" element={<SessionPlayer />} />

                    {/* ✅ District review route (same player in teacher mode) */}
                    <Route
                      path="sessions/:sessionId/review"
                      element={
                        <ProtectedRoute expectedRole="district">
                          <SessionPlayer mode="teacher" />
                        </ProtectedRoute>
                      }
                    />
                </Routes>
                </ProtectedRoute>
              }
            />

            <Route
              path="/teacher/*"
              element={
                <ProtectedRoute expectedRole="teacher">
                <Routes>
                  <Route index element={<TeacherDashboard />} />
                    {/* Add more teacher tools */}
                    <Route path="tasks" element={<TasksManager />} />
                    <Route path="sessions/build" element={<SessionBuilder />} />
                    <Route path="sessions/play" element={<SessionPlayer />} />

                    {/* Secure teacher review route (mode='teacher') */}
                    <Route
                      path="sessions/:sessionId/review"
                      element={
                        <ProtectedRoute expectedRole="teacher">
                          <SessionPlayer mode="teacher" />
                        </ProtectedRoute>
                      }
                    />
                </Routes>
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/*"
              element={
                <ProtectedRoute expectedRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            {/* Default → landing/login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
        <Footer />
      </AuthProvider>
    </Router>
  );
}
