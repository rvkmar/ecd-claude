// src/auth/__tests__/RequirePermission.test.jsx
//
// Regression test for the dead-localStorage-key bug: RequirePermission used
// to read localStorage.getItem("role"), a key nothing in the app ever
// wrote, so it always evaluated permissions against a null role — silently
// hiding/disabling things it shouldn't for every logged-in user. It now
// reads the real role from the auth context.

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import RequirePermission from "../RequirePermission.jsx";
import { useAuth } from "../AuthProvider.jsx";

vi.mock("../AuthProvider.jsx", () => ({
  useAuth: vi.fn(),
}));

function setAuth(role) {
  useAuth.mockReturnValue({ auth: role ? { role } : null });
}

describe("RequirePermission", () => {
  it("renders children when the real logged-in role has permission", () => {
    setAuth("admin");
    render(
      <RequirePermission entity="questions" action="edit">
        <button>Edit</button>
      </RequirePermission>
    );
    expect(screen.getByText("Edit")).toBeInTheDocument();
  });

  it("hides children when the logged-in role lacks permission", () => {
    setAuth("student");
    render(
      <RequirePermission entity="questions" action="edit">
        <button>Edit</button>
      </RequirePermission>
    );
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  });

  it("hides children when there is no logged-in user at all", () => {
    setAuth(null);
    render(
      <RequirePermission entity="questions" action="edit">
        <button>Edit</button>
      </RequirePermission>
    );
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  });

  it("renders a fallback when provided and the action isn't allowed", () => {
    setAuth("student");
    render(
      <RequirePermission entity="questions" action="edit" fallback={<span>No access</span>}>
        <button>Edit</button>
      </RequirePermission>
    );
    expect(screen.getByText("No access")).toBeInTheDocument();
  });

  it("disables (rather than hides) the child when disabledOnly is set", () => {
    setAuth("student");
    render(
      <RequirePermission entity="questions" action="edit" disabledOnly>
        <button>Edit</button>
      </RequirePermission>
    );
    expect(screen.getByText("Edit")).toBeDisabled();
  });
});
