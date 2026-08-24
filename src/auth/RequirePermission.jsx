// src/auth/RequirePermission.jsx
import React from "react";
import { can } from "@/config/rolePermissions";
import { useAuth } from "./AuthProvider";

/**
 * RequirePermission
 * -----------------
 * Conditionally renders or disables children based on role-based permissions.
 *
 * Props:
 * - entity: the data entity (e.g., "tasks", "questions")
 * - action: "view" | "edit" | "create" | "delete" | "approve"
 * - fallback: optional ReactNode shown when not allowed (default: null)
 * - disabledOnly: if true, renders the child but disables it instead of hiding
 * - tooltip: optional message when disabled
 */
export default function RequirePermission({
  entity,
  action = "view",
  fallback = null,
  disabledOnly = false,
  tooltip = "",
  children,
}) {
  // Previously read from localStorage.getItem("role"), a key nothing in the
  // app ever wrote (the real session lives in sessionStorage via
  // AuthProvider). That meant `role` was always null here and every
  // permission check silently evaluated as "not allowed" — this now reads
  // the real, live role from the auth context.
  const { auth } = useAuth() || {};
  const role = auth?.role;

  const allowed = can(role, action, entity);

  if (allowed) return children;

  if (disabledOnly && React.isValidElement(children)) {
    // Clone the child and disable it
    return React.cloneElement(children, {
      disabled: true,
      title: tooltip || "You do not have permission for this action",
      className:
        (children.props.className || "") +
        " opacity-50 cursor-not-allowed pointer-events-none",
    });
  }

  // Hidden or fallback mode
  return fallback;
}
