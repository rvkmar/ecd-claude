// src/auth/__tests__/ProtectedRoute.test.jsx

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoute.jsx";
import { useAuth } from "../AuthProvider.jsx";

vi.mock("../AuthProvider.jsx", () => ({
  useAuth: vi.fn(),
}));

function renderProtected({ auth, expectedRole }) {
  useAuth.mockReturnValue({ auth });
  return render(
    <MemoryRouter initialEntries={["/protected"]}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute expectedRole={expectedRole}>
              <div>Secret content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/unauthorized" element={<div>Unauthorized page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  it("redirects to /login when not authenticated", () => {
    renderProtected({ auth: null, expectedRole: "admin" });
    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Secret content")).not.toBeInTheDocument();
  });

  it("redirects to /login when the logged-in role doesn't match", () => {
    renderProtected({ auth: { role: "student", username: "stud1" }, expectedRole: "admin" });
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("renders children when the role matches", () => {
    renderProtected({ auth: { role: "admin", username: "admin1" }, expectedRole: "admin" });
    expect(screen.getByText("Secret content")).toBeInTheDocument();
  });

  it("accepts an array of expected roles", () => {
    renderProtected({
      auth: { role: "district", username: "dist1" },
      expectedRole: ["admin", "district"],
    });
    expect(screen.getByText("Secret content")).toBeInTheDocument();
  });
});
